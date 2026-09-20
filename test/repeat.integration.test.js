const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const manifest = require("../machine.json");
const { run } = require("../src");

const corePath = process.env.MORPHTILE_CORE;
const runtimeCommit = process.env.MORPHTILE_COMMIT;

function assertPinnedRuntime() {
  assert.equal(runtimeCommit, manifest.tested_against.commit, "CI runtime must match machine.json tested_against.commit");
}

test("generated repeat follows canonical MorphTile state and remains bounded", { skip: !corePath }, () => {
  assertPinnedRuntime();
  const MT = require(path.resolve(corePath));
  const ws = MT.createWorkspace(MT.seedWorld());
  const before = MT.structHash(ws.live);

  const out = run({
    envelope_version: "0.1",
    request_id: "repeat-runtime",
    goal: "Repeat a bounded interface marker from the canonical beacon value",
    intent: {
      tile_path: "mt_tower",
      title: "Tower repeat",
      elements: [{
        kind: "repeat",
        binding: "beacon",
        step: 1,
        max: 4,
        children: [{ kind: "text", text: "Beacon pulse" }]
      }],
      bindings: { readouts: ["beacon"] }
    },
    provenance: { caller: "pinned-repeat-integration-test" }
  });

  assert.equal(out.status, "CANDIDATE");
  assert.deepEqual(out.dependencies[0].requires.readout_logic_vars, ["beacon"]);
  assert.deepEqual(out.candidate.operation.view.body, [{
    repeat: ["max", 0, ["min", 4, ["floor", ["/", ["var", "beacon"], 1]]]],
    as: "i",
    body: [{ text: "Beacon pulse" }]
  }]);

  const candidate = MT.cloneBody(ws, "ai", "ai:interface-repeat-test");
  const edited = MT.editCandidate(ws, candidate, out.candidate.operation);
  assert.ok(edited.ok, edited.error);
  const plan = MT.planMerge(ws, [candidate]);
  assert.equal(plan.status, "READY");
  const committed = MT.commitPlan(ws, plan.id);
  assert.ok(committed.ok);

  const committedHash = MT.structHash(ws.live);
  assert.equal(MT.readVars(ws.live, "mt_tower", 0).beacon, 0);
  const offHtml = MT.vnodeToHTML(MT.compilePanel(ws.live).root);
  assert.equal((offHtml.match(/Beacon pulse/g) || []).length, 0);
  assert.equal(MT.structHash(ws.live), committedHash, "repeat rendering must not mutate canonical matter");

  MT.act(ws, { do: "signal", tile: "mt_tower", name: "toggle" });
  assert.equal(MT.readVars(ws.live, "mt_tower", 0).beacon, 1);
  const onHtml = MT.vnodeToHTML(MT.compilePanel(ws.live).root);
  assert.equal((onHtml.match(/Beacon pulse/g) || []).length, 1);
  assert.equal(MT.structHash(ws.live), committedHash, "repeat rendering live state must remain read-only");

  MT.act(ws, { do: "signal", tile: "mt_tower", name: "toggle" });
  assert.equal(MT.readVars(ws.live, "mt_tower", 0).beacon, 0, "restore runtime state before structural rollback");

  const rollback = MT.rollback(ws, committed.receipt.rollback_token);
  assert.ok(rollback.ok && rollback.exact);
  assert.equal(MT.structHash(ws.live), before);
});

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

test("generated meter reads canonical MorphTile state through the real view compiler", { skip: !corePath }, () => {
  assertPinnedRuntime();
  const MT = require(path.resolve(corePath));
  const ws = MT.createWorkspace(MT.seedWorld());
  const before = MT.structHash(ws.live);

  const out = run({
    envelope_version: "0.1",
    request_id: "meter-runtime",
    goal: "Bind a meter to canonical state without copying the value",
    intent: {
      tile_path: "mt_tower",
      title: "Tower meter",
      elements: [{ kind: "meter", binding: "beacon", min: 0, max: 1, label: "Brightness" }],
      bindings: { readouts: ["beacon"] }
    },
    provenance: { caller: "pinned-meter-integration-test" }
  });

  assert.equal(out.status, "CANDIDATE");
  assert.deepEqual(out.dependencies[0].requires.readout_logic_vars, ["beacon"]);
  assert.deepEqual(out.candidate.operation.view.body, [
    { meter: ["var", "beacon"], min: 0, max: 1, label: "Brightness" }
  ]);

  const candidate = MT.cloneBody(ws, "ai", "ai:interface-meter-test");
  const edited = MT.editCandidate(ws, candidate, out.candidate.operation);
  assert.ok(edited.ok, edited.error);
  const plan = MT.planMerge(ws, [candidate]);
  assert.equal(plan.status, "READY");
  const committed = MT.commitPlan(ws, plan.id);
  assert.ok(committed.ok);

  const committedHash = MT.structHash(ws.live);
  const offHtml = MT.vnodeToHTML(MT.compilePanel(ws.live).root);
  assert.match(offHtml, /v-meter/);
  assert.match(offHtml, /Brightness/);
  assert.match(offHtml, /width:0\.0%/);
  assert.equal(MT.structHash(ws.live), committedHash, "compiling a meter must not mutate canonical matter");

  MT.act(ws, { do: "signal", tile: "mt_tower", name: "toggle" });
  assert.equal(MT.readVars(ws.live, "mt_tower", 0).beacon, 1);
  const onHtml = MT.vnodeToHTML(MT.compilePanel(ws.live).root);
  assert.match(onHtml, /width:100\.0%/, "meter presentation follows the canonical variable at render time");

  MT.act(ws, { do: "signal", tile: "mt_tower", name: "toggle" });
  assert.equal(MT.readVars(ws.live, "mt_tower", 0).beacon, 0, "restore runtime state before structural rollback");

  const rollback = MT.rollback(ws, committed.receipt.rollback_token);
  assert.ok(rollback.ok && rollback.exact);
  assert.equal(MT.structHash(ws.live), before);
});

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

test("repeat-local selectors follow nearest lexical index/count and remain read-only", { skip: !corePath }, () => {
  assertPinnedRuntime();
  const MT = require(path.resolve(corePath));
  const ws = MT.createWorkspace(MT.seedWorld());
  const before = MT.structHash(ws.live);

  const out = run({
    envelope_version: "0.1",
    request_id: "repeat-local-condition-runtime",
    goal: "Select repeated matter from lexical repeat scope without turning locals into canonical state",
    intent: {
      tile_path: "mt_tower",
      title: "Tower repeat selectors",
      elements: [{
        kind: "repeat",
        binding: "beacon",
        step: 0.25,
        max: 3,
        children: [
          { kind: "text", text: "slot" },
          { kind: "repeat_when", source: "index", equals: 0, children: [{ kind: "text", text: "first" }] },
          { kind: "repeat_when", source: "count", equals: 3, children: [{ kind: "text", text: "full" }] }
        ]
      }],
      bindings: { readouts: ["beacon"] }
    },
    provenance: { caller: "pinned-repeat-local-condition-integration-test" }
  });

  assert.equal(out.status, "CANDIDATE");
  assert.deepEqual(out.dependencies[0].requires.readout_logic_vars, ["beacon"]);

  const candidate = MT.cloneBody(ws, "ai", "ai:interface-repeat-local-condition-test");
  const edited = MT.editCandidate(ws, candidate, out.candidate.operation);
  assert.ok(edited.ok, edited.error);
  const plan = MT.planMerge(ws, [candidate]);
  assert.equal(plan.status, "READY");
  const committed = MT.commitPlan(ws, plan.id);
  assert.ok(committed.ok);

  const committedHash = MT.structHash(ws.live);
  assert.equal(MT.readVars(ws.live, "mt_tower", 0).beacon, 0);
  const offHtml = MT.vnodeToHTML(MT.compilePanel(ws.live).root);
  assert.equal((offHtml.match(/slot/g) || []).length, 0);
  assert.equal((offHtml.match(/first/g) || []).length, 0);
  assert.equal((offHtml.match(/full/g) || []).length, 0);
  assert.equal(MT.structHash(ws.live), committedHash, "repeat-local rendering must not mutate canonical matter");

  MT.act(ws, { do: "signal", tile: "mt_tower", name: "toggle" });
  assert.equal(MT.readVars(ws.live, "mt_tower", 0).beacon, 1);
  const onHtml = MT.vnodeToHTML(MT.compilePanel(ws.live).root);
  assert.equal((onHtml.match(/slot/g) || []).length, 3);
  assert.equal((onHtml.match(/first/g) || []).length, 1, "index selector should match only lexical index zero");
  assert.equal((onHtml.match(/full/g) || []).length, 3, "count selector should match all three bodies when lexical count is three");
  assert.equal(MT.structHash(ws.live), committedHash, "repeat-local selector evaluation must remain read-only");

  MT.act(ws, { do: "signal", tile: "mt_tower", name: "toggle" });
  assert.equal(MT.readVars(ws.live, "mt_tower", 0).beacon, 0);

  const rollback = MT.rollback(ws, committed.receipt.rollback_token);
  assert.ok(rollback.ok && rollback.exact);
  assert.equal(MT.structHash(ws.live), before);
});

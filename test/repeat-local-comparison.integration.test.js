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

test("repeat-local relational predicates run in MorphTile lexical scope without state pollution", { skip: !corePath }, () => {
  assertPinnedRuntime();
  const MT = require(path.resolve(corePath));
  const ws = MT.createWorkspace(MT.seedWorld());
  const before = MT.structHash(ws.live);

  const out = run({
    envelope_version: "0.1",
    request_id: "repeat-local-comparison-runtime",
    goal: "Render bounded relative repeat positions without copying lexical locals into canonical state",
    intent: {
      tile_path: "mt_tower",
      title: "Tower repeat comparisons",
      elements: [{
        kind: "repeat",
        binding: "beacon",
        step: 0.25,
        max: 4,
        children: [
          { kind: "text", text: "slot" },
          { kind: "repeat_when", source: "index", comparison: "at_least", value: 1, children: [{ kind: "text", text: "after-first" }] },
          { kind: "repeat_when", source: "index", comparison: "below", value: 2, children: [{ kind: "text", text: "first-two" }] },
          { kind: "repeat_when", source: "count", comparison: "at_least", value: 3, children: [{ kind: "text", text: "crowded" }] }
        ]
      }],
      bindings: { readouts: ["beacon"] }
    },
    provenance: { caller: "pinned-repeat-local-comparison-integration-test" }
  });

  assert.equal(out.status, "CANDIDATE");
  assert.deepEqual(out.dependencies[0].requires.readout_logic_vars, ["beacon"]);

  const candidate = MT.cloneBody(ws, "ai", "ai:interface-repeat-local-comparison-test");
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
  assert.equal(MT.structHash(ws.live), committedHash, "rendering must not mutate canonical matter");

  MT.act(ws, { do: "signal", tile: "mt_tower", name: "toggle" });
  assert.equal(MT.readVars(ws.live, "mt_tower", 0).beacon, 1);
  const onHtml = MT.vnodeToHTML(MT.compilePanel(ws.live).root);
  assert.equal((onHtml.match(/slot/g) || []).length, 4);
  assert.equal((onHtml.match(/after-first/g) || []).length, 3, "index >= 1 should match lexical indices 1,2,3");
  assert.equal((onHtml.match(/first-two/g) || []).length, 2, "index < 2 should match lexical indices 0,1");
  assert.equal((onHtml.match(/crowded/g) || []).length, 4, "count >= 3 should match every repeated body when count is four");
  assert.equal(MT.structHash(ws.live), committedHash, "lexical predicate evaluation must remain read-only");

  MT.act(ws, { do: "signal", tile: "mt_tower", name: "toggle" });
  assert.equal(MT.readVars(ws.live, "mt_tower", 0).beacon, 0);
  const rollback = MT.rollback(ws, committed.receipt.rollback_token);
  assert.ok(rollback.ok && rollback.exact);
  assert.equal(MT.structHash(ws.live), before);
});

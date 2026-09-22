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

function occurrences(text, needle) {
  return text.split(needle).length - 1;
}

test("multiple controls remain views over one canonical MorphTile parameter", { skip: !corePath }, () => {
  assertPinnedRuntime();
  const MT = require(path.resolve(corePath));
  const ws = MT.createWorkspace(MT.seedWorld());
  const before = MT.structHash(ws.live);
  const tower = ws.live.tiles.mt_tower;
  const beforeParam = tower.params.find((param) => param.id === "levels");
  const beforeValue = MT.paramValue(tower, beforeParam);

  const out = run({
    envelope_version: "0.1",
    request_id: "shared-canonical-control",
    goal: "Render two interface controls over one canonical parameter without duplicating state",
    canonical_state: { forbidden_snapshot: beforeValue },
    intent: {
      tile_path: "mt_tower",
      title: "Tower controls",
      elements: [
        { kind: "control", binding: "levels", label: "Quick levels" },
        { kind: "control", binding: "levels", label: "Detailed levels" }
      ],
      bindings: { controls: ["levels"] }
    },
    provenance: { caller: "shared-canonical-control-proof" }
  });

  assert.equal(out.status, "CANDIDATE");
  assert.deepEqual(out.candidate.operation.view.body, [
    { control: "levels", label: "Quick levels" },
    { control: "levels", label: "Detailed levels" }
  ]);
  assert.deepEqual(out.dependencies[0].requires.control_param_ids, ["levels"]);
  assert.ok(!JSON.stringify(out.candidate).includes("forbidden_snapshot"));

  const candidate = MT.cloneBody(ws, "ai", "ai:interface-machine");
  const edited = MT.editCandidate(ws, candidate, out.candidate.operation);
  assert.ok(edited.ok, edited.error);
  const plan = MT.planMerge(ws, [candidate]);
  assert.equal(plan.status, "READY");
  const committed = MT.commitPlan(ws, plan.id);
  assert.ok(committed.ok);

  const afterTower = ws.live.tiles.mt_tower;
  assert.equal(afterTower.params.filter((param) => param.id === "levels").length, 1);
  assert.equal(MT.paramValue(afterTower, afterTower.params.find((param) => param.id === "levels")), beforeValue);

  const html = MT.vnodeToHTML(MT.compilePanel(ws.live).root);
  assert.equal(occurrences(html, 'data-param="mt_tower:levels"'), 2);
  assert.match(html, /Quick levels/);
  assert.match(html, /Detailed levels/);

  const rollback = MT.rollback(ws, committed.receipt.rollback_token);
  assert.ok(rollback.ok && rollback.exact);
  assert.equal(MT.structHash(ws.live), before);
});

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

test("placement candidate commits and rolls back through the pinned MorphTile transaction path", { skip: !corePath }, () => {
  assertPinnedRuntime();
  const MT = require(path.resolve(corePath));
  const ws = MT.createWorkspace(MT.seedWorld());
  const before = MT.structHash(ws.live);
  const out = run({
    envelope_version: "0.1",
    request_id: "pinned-presentation-contract",
    goal: "Present the tower through the pinned MorphTile contract",
    canonical_state: { secret_counter_snapshot: 424242 },
    session_state: { secret_session_marker: "SESSION_ONLY_SENTINEL" },
    intent: {
      tile_path: "mt_tower",
      title: "Tower",
      text: "Pinned contract proof",
      placement: {
        mode: "docked",
        dock: "right",
        preferred_size: [360, 480],
        preferred_position: [0, 0],
        user_adjustable: true
      }
    },
    provenance: { caller: "pinned-integration-test" }
  });

  assert.equal(out.status, "CANDIDATE");
  assert.deepEqual(out.candidate.operations.map((op) => op.op), ["view.set", "presentation.set"]);
  const serialized = JSON.stringify(out.candidate);
  assert.ok(!serialized.includes("424242"));
  assert.ok(!serialized.includes("SESSION_ONLY_SENTINEL"));

  const candidate = MT.cloneBody(ws, "ai", "ai:interface-machine");
  for (const op of out.candidate.operations) {
    const edited = MT.editCandidate(ws, candidate, op);
    assert.ok(edited.ok, edited.error);
  }

  const plan = MT.planMerge(ws, [candidate]);
  assert.equal(plan.status, "READY");
  const committed = MT.commitPlan(ws, plan.id);
  assert.ok(committed.ok);
  assert.deepEqual(ws.live.tiles.mt_tower.presentation, {
    mode: "docked",
    dock: "right",
    preferred_size: [360, 480],
    preferred_position: [0, 0],
    user_adjustable: true
  });
  assert.deepEqual(ws.live.tiles.mt_tower.view, {
    title: "Tower",
    body: [{ text: "Pinned contract proof" }]
  });
  assert.deepEqual(committed.receipt.units.map((unit) => unit.key).sort(), [
    "tile:mt_tower#presentation",
    "tile:mt_tower#view"
  ]);

  const canonicalHash = MT.hashOf(ws.live);
  const resolved = MT.resolvePresentation(ws.live, "mt_tower", {
    session_presentations: {
      mt_tower: { dock: "left", preferred_position: [24, 12], secret_session_marker: "SESSION_ONLY_SENTINEL" }
    }
  });
  assert.equal(resolved.status, "READY");
  assert.equal(resolved.session_applied, true);
  assert.equal(resolved.resolved.dock, "left");
  assert.equal(ws.live.tiles.mt_tower.presentation.dock, "right");
  assert.ok(!JSON.stringify(ws.live.tiles.mt_tower.presentation).includes("SESSION_ONLY_SENTINEL"));
  assert.equal(MT.hashOf(ws.live), canonicalHash);

  const rollback = MT.rollback(ws, committed.receipt.rollback_token);
  assert.ok(rollback.ok && rollback.exact);
  assert.equal(MT.structHash(ws.live), before);
});

test("declared parameter control binds to the real pinned MorphTile parameter without copying its value", { skip: !corePath }, () => {
  assertPinnedRuntime();
  const MT = require(path.resolve(corePath));
  const ws = MT.createWorkspace(MT.seedWorld());
  const before = MT.structHash(ws.live);
  const tower = ws.live.tiles.mt_tower;
  const param = tower.params.find((p) => p.id === "levels");
  const beforeValue = MT.paramValue(tower, param);

  const out = run({
    envelope_version: "0.1",
    request_id: "pinned-parameter-control",
    goal: "Expose the tower levels parameter through tile-owned interface matter",
    intent: {
      tile_path: "mt_tower",
      title: "Tower tuning",
      control: "levels",
      control_label: "Tower levels",
      bindings: { controls: ["levels"] }
    },
    provenance: { caller: "pinned-integration-test" }
  });

  assert.equal(out.status, "CANDIDATE");
  assert.deepEqual(out.candidate.operation, {
    op: "view.set",
    id: "mt_tower",
    view: { title: "Tower tuning", body: [{ control: "levels", label: "Tower levels" }] }
  });
  assert.ok(!JSON.stringify(out.candidate).includes(String(beforeValue)));

  const candidate = MT.cloneBody(ws, "ai", "ai:interface-machine");
  const edited = MT.editCandidate(ws, candidate, out.candidate.operation);
  assert.ok(edited.ok, edited.error);
  const plan = MT.planMerge(ws, [candidate]);
  assert.equal(plan.status, "READY");
  const committed = MT.commitPlan(ws, plan.id);
  assert.ok(committed.ok);

  const afterTile = ws.live.tiles.mt_tower;
  const afterParam = afterTile.params.find((p) => p.id === "levels");
  assert.equal(MT.paramValue(afterTile, afterParam), beforeValue);
  const html = MT.vnodeToHTML(MT.compilePanel(ws.live).root);
  assert.match(html, /data-param="mt_tower:levels"/);
  assert.match(html, /type="range"/);

  const rollback = MT.rollback(ws, committed.receipt.rollback_token);
  assert.ok(rollback.ok && rollback.exact);
  assert.equal(MT.structHash(ws.live), before);
});

test("authored explanatory text survives beside a canonical control in the pinned runtime", { skip: !corePath }, () => {
  assertPinnedRuntime();
  const MT = require(path.resolve(corePath));
  const ws = MT.createWorkspace(MT.seedWorld());
  const before = MT.structHash(ws.live);
  const tower = ws.live.tiles.mt_tower;
  const param = tower.params.find((p) => p.id === "levels");
  const beforeValue = MT.paramValue(tower, param);

  const out = run({
    envelope_version: "0.1",
    request_id: "pinned-text-and-control",
    goal: "Keep authored explanation beside a real canonical control",
    intent: {
      tile_path: "mt_tower",
      title: "Tower tuning",
      text: "Adjust the existing tower parameter.",
      control: "levels",
      control_label: "Tower levels",
      bindings: { controls: ["levels"] }
    },
    provenance: { caller: "pinned-integration-test" }
  });

  assert.equal(out.status, "CANDIDATE");
  assert.deepEqual(out.candidate.operation.view.body, [
    { text: "Adjust the existing tower parameter." },
    { control: "levels", label: "Tower levels" }
  ]);

  const candidate = MT.cloneBody(ws, "ai", "ai:interface-machine");
  const edited = MT.editCandidate(ws, candidate, out.candidate.operation);
  assert.ok(edited.ok, edited.error);
  const plan = MT.planMerge(ws, [candidate]);
  assert.equal(plan.status, "READY");
  const committed = MT.commitPlan(ws, plan.id);
  assert.ok(committed.ok);

  const html = MT.vnodeToHTML(MT.compilePanel(ws.live).root);
  assert.match(html, /Adjust the existing tower parameter\./);
  assert.match(html, /data-param="mt_tower:levels"/);
  assert.equal(MT.paramValue(ws.live.tiles.mt_tower, ws.live.tiles.mt_tower.params.find((p) => p.id === "levels")), beforeValue);

  const rollback = MT.rollback(ws, committed.receipt.rollback_token);
  assert.ok(rollback.ok && rollback.exact);
  assert.equal(MT.structHash(ws.live), before);
});

test("ordered elements commit as one view and preserve authored order in the pinned MorphTile runtime", { skip: !corePath }, () => {
  assertPinnedRuntime();
  const MT = require(path.resolve(corePath));
  const ws = MT.createWorkspace(MT.seedWorld());
  const before = MT.structHash(ws.live);
  const tower = ws.live.tiles.mt_tower;
  const param = tower.params.find((p) => p.id === "levels");
  const beforeValue = MT.paramValue(tower, param);

  const out = run({
    envelope_version: "0.1",
    request_id: "pinned-ordered-elements",
    goal: "Build one ordered tile-owned interface atomically",
    canonical_state: { forbidden_copy: beforeValue },
    intent: {
      tile_path: "mt_tower",
      title: "Ordered tower",
      elements: [
        { kind: "control", binding: "levels", label: "Tower levels" },
        { kind: "text", text: "Control first, explanation second." }
      ],
      bindings: { controls: ["levels"] }
    },
    provenance: { caller: "pinned-integration-test" }
  });

  assert.equal(out.status, "CANDIDATE");
  assert.deepEqual(out.candidate.operation.view.body, [
    { control: "levels", label: "Tower levels" },
    { text: "Control first, explanation second." }
  ]);
  assert.ok(!JSON.stringify(out.candidate).includes("forbidden_copy"));

  const candidate = MT.cloneBody(ws, "ai", "ai:interface-machine");
  const edited = MT.editCandidate(ws, candidate, out.candidate.operation);
  assert.ok(edited.ok, edited.error);
  const plan = MT.planMerge(ws, [candidate]);
  assert.equal(plan.status, "READY");
  const committed = MT.commitPlan(ws, plan.id);
  assert.ok(committed.ok);
  assert.deepEqual(ws.live.tiles.mt_tower.view.body, out.candidate.operation.view.body);
  assert.equal(MT.paramValue(ws.live.tiles.mt_tower, ws.live.tiles.mt_tower.params.find((p) => p.id === "levels")), beforeValue);

  const html = MT.vnodeToHTML(MT.compilePanel(ws.live).root);
  const controlAt = html.indexOf('data-param="mt_tower:levels"');
  const textAt = html.indexOf("Control first, explanation second.");
  assert.ok(controlAt >= 0 && textAt > controlAt, "compiled panel must preserve authored control-before-text order");

  const rollback = MT.rollback(ws, committed.receipt.rollback_token);
  assert.ok(rollback.ok && rollback.exact);
  assert.equal(MT.structHash(ws.live), before);
});

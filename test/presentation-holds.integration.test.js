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

function commitCandidate(MT, ws, out) {
  const candidate = MT.cloneBody(ws, "ai", "ai:interface-machine");
  for (const operation of out.candidate.operations) {
    const edited = MT.editCandidate(ws, candidate, operation);
    assert.ok(edited.ok, edited.error);
  }
  const plan = MT.planMerge(ws, [candidate]);
  assert.equal(plan.status, "READY");
  const committed = MT.commitPlan(ws, plan.id);
  assert.ok(committed.ok);
  return committed.receipt;
}

function placementRequest(requestId, placement) {
  return {
    envelope_version: "0.1",
    request_id: requestId,
    goal: "Prove authored presentation matter stays canonical while runtime host limits remain bounded",
    intent: {
      tile_path: "mt_tower",
      title: "Presentation proof",
      text: "Portable interface matter",
      placement
    },
    provenance: { caller: "pinned-presentation-integration-test" }
  };
}

test("missing tile presentation anchors HOLD visibly without mutating canonical matter", { skip: !corePath }, () => {
  assertPinnedRuntime();
  const MT = require(path.resolve(corePath));
  const ws = MT.createWorkspace(MT.seedWorld());
  const before = MT.structHash(ws.live);
  const out = run(placementRequest("missing-anchor", {
    mode: "tile",
    anchor: "mt_missing",
    preferred_size: [320, 240],
    user_adjustable: false
  }));

  assert.equal(out.status, "CANDIDATE");
  assert.deepEqual(out.dependencies.map((dependency) => dependency.id), [
    "morphtile.interface-target-proof:mt_tower",
    "morphtile.presentation-anchor-proof:mt_missing"
  ]);
  const receipt = commitCandidate(MT, ws, out);

  const committedHash = MT.structHash(ws.live);
  const resolved = MT.resolvePresentation(ws.live, "mt_tower");
  assert.equal(resolved.status, "HOLD_MISSING_PRESENTATION_ANCHOR");
  assert.equal(MT.structHash(ws.live), committedHash, "presentation resolution must not mutate canonical matter");
  const html = MT.vnodeToHTML(MT.compilePanel(ws.live).root);
  assert.match(html, /HOLD_MISSING_PRESENTATION_ANCHOR/);

  const rollback = MT.rollback(ws, receipt.rollback_token);
  assert.ok(rollback.ok && rollback.exact);
  assert.equal(MT.structHash(ws.live), before);
});

test("unsupported host presentation modes HOLD without rewriting portable presentation matter", { skip: !corePath }, () => {
  assertPinnedRuntime();
  const MT = require(path.resolve(corePath));
  const ws = MT.createWorkspace(MT.seedWorld());
  const before = MT.structHash(ws.live);
  const out = run(placementRequest("unsupported-host-mode", {
    mode: "world",
    preferred_position: [1, 2, 3],
    user_adjustable: false
  }));

  assert.equal(out.status, "CANDIDATE");
  assert.deepEqual(out.dependencies.map((dependency) => dependency.id), [
    "morphtile.interface-target-proof:mt_tower"
  ]);
  const receipt = commitCandidate(MT, ws, out);

  const committedHash = MT.structHash(ws.live);
  const host = { presentation_modes: ["screen", "docked"] };
  const resolved = MT.resolvePresentation(ws.live, "mt_tower", host);
  assert.equal(resolved.status, "HOLD_UNSUPPORTED_PRESENTATION");
  assert.equal(MT.structHash(ws.live), committedHash, "host capability checks must not mutate canonical matter");
  const html = MT.vnodeToHTML(MT.compilePanel(ws.live, host).root);
  assert.match(html, /HOLD_UNSUPPORTED_PRESENTATION/);

  const rollback = MT.rollback(ws, receipt.rollback_token);
  assert.ok(rollback.ok && rollback.exact);
  assert.equal(MT.structHash(ws.live), before);
});

test("session placement cannot override a machine-authored non-adjustable descriptor", { skip: !corePath }, () => {
  assertPinnedRuntime();
  const MT = require(path.resolve(corePath));
  const ws = MT.createWorkspace(MT.seedWorld());
  const before = MT.structHash(ws.live);
  const out = run(placementRequest("non-adjustable-dock", {
    mode: "docked",
    dock: "right",
    preferred_size: [360, 480],
    preferred_position: [0, 0],
    user_adjustable: false
  }));

  assert.equal(out.status, "CANDIDATE");
  const receipt = commitCandidate(MT, ws, out);
  const committedHash = MT.structHash(ws.live);
  const host = {
    session_presentations: {
      mt_tower: { dock: "left", preferred_position: [24, 12] }
    }
  };
  const resolved = MT.resolvePresentation(ws.live, "mt_tower", host);
  assert.equal(resolved.status, "READY");
  assert.equal(resolved.session_applied, false);
  assert.equal(resolved.resolved.dock, "right");
  assert.deepEqual(resolved.resolved.preferred_position, [0, 0]);
  assert.equal(MT.structHash(ws.live), committedHash, "ignored session placement must not mutate canonical matter");
  const html = MT.vnodeToHTML(MT.compilePanel(ws.live, host).root);
  assert.match(html, /mt-p-docked mt-dock-right/);
  assert.doesNotMatch(html, /session adjusted/);

  const rollback = MT.rollback(ws, receipt.rollback_token);
  assert.ok(rollback.ok && rollback.exact);
  assert.equal(MT.structHash(ws.live), before);
});

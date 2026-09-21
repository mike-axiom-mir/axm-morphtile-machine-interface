"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const manifest = require("../machine.json");
const { run, PRESENTATION_MODES } = require("../src");

const corePath = process.env.MORPHTILE_CORE;
const runtimeCommit = process.env.MORPHTILE_COMMIT;

function assertPinnedRuntime() {
  assert.equal(runtimeCommit, manifest.tested_against.commit, "CI runtime must match machine.json tested_against.commit");
}

function request(requestId, placement) {
  return {
    envelope_version: "0.1",
    request_id: requestId,
    goal: "Prove portable Interface presentation matter reaches the pinned MorphTile host renderer without becoming host/session authority",
    intent: {
      tile_path: "mt_tower",
      title: "Host presentation proof",
      text: `mode ${placement.mode}`,
      placement
    },
    provenance: { caller: "pinned-host-presentation-test" }
  };
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

test("every Interface-supported presentation mode resolves and renders through the pinned MorphTile host", { skip: !corePath }, () => {
  assertPinnedRuntime();
  const MT = require(path.resolve(corePath));
  const modes = [...PRESENTATION_MODES].sort();
  assert.deepEqual(modes, ["docked", "embedded", "floating", "fullscreen", "screen", "tile", "world"]);

  for (const mode of modes) {
    const ws = MT.createWorkspace(MT.seedWorld());
    const before = MT.structHash(ws.live);
    const placement = {
      mode,
      preferred_size: [320, 240],
      preferred_position: mode === "world" ? [0, 0, 0] : [0, 0],
      user_adjustable: false
    };
    const out = run(request(`host-mode-${mode}`, placement));

    assert.equal(out.status, "CANDIDATE", `${mode} should remain portable Interface presentation matter`);
    const receipt = commitCandidate(MT, ws, out);
    const canonicalHash = MT.structHash(ws.live);
    const resolved = MT.resolvePresentation(ws.live, "mt_tower");

    assert.equal(resolved.status, "READY", `${mode} should be supported by the pinned host`);
    assert.equal(resolved.resolved.mode, mode);
    assert.equal(resolved.session_applied, false);
    assert.equal(MT.structHash(ws.live), canonicalHash, `${mode} host resolution must be read-only`);

    if (mode === "docked") {
      assert.equal(Object.prototype.hasOwnProperty.call(ws.live.tiles.mt_tower.presentation, "dock"), false, "Interface omission must preserve MorphTile's dock-edge default");
    }
    if (mode === "tile") assert.equal(resolved.anchor_frame.anchor, "mt_tower", "omitted tile anchor must resolve to the target tile without producer-authored authority");
    if (mode === "world") assert.equal(resolved.anchor_frame.anchor, "world-root");

    const html = MT.vnodeToHTML(MT.compilePanel(ws.live).root);
    assert.match(html, new RegExp(`data-presentation-mode="${mode}"`), `${mode} must reach host-rendered presentation metadata`);
    assert.match(html, new RegExp(`mt-p-${mode}`), `${mode} must reach the host presentation class`);
    assert.match(html, /--p-width:320px/);
    assert.match(html, /--p-height:240px/);
    assert.match(html, /--p-x:0px/);
    assert.match(html, /--p-y:0px/);
    if (mode === "docked") assert.match(html, /docked right/, "receiver-owned dock default must remain visible at render time");

    const rollback = MT.rollback(ws, receipt.rollback_token);
    assert.ok(rollback.ok && rollback.exact);
    assert.equal(MT.structHash(ws.live), before);
  }
});

test("adjustable host session placement renders without rewriting canonical Interface matter", { skip: !corePath }, () => {
  assertPinnedRuntime();
  const MT = require(path.resolve(corePath));
  const ws = MT.createWorkspace(MT.seedWorld());
  const before = MT.structHash(ws.live);
  const out = run(request("host-session-adjustment", {
    mode: "docked",
    dock: "right",
    preferred_size: [360, 480],
    preferred_position: [0, 0],
    user_adjustable: true
  }));

  assert.equal(out.status, "CANDIDATE");
  const receipt = commitCandidate(MT, ws, out);
  const canonicalHash = MT.structHash(ws.live);
  const host = {
    session_presentations: {
      mt_tower: { dock: "left", preferred_position: [24, 12] }
    }
  };
  const resolved = MT.resolvePresentation(ws.live, "mt_tower", host);

  assert.equal(resolved.status, "READY");
  assert.equal(resolved.session_applied, true);
  assert.equal(resolved.resolved.dock, "left");
  assert.deepEqual(resolved.resolved.preferred_position, [24, 12]);
  assert.equal(ws.live.tiles.mt_tower.presentation.dock, "right");
  assert.deepEqual(ws.live.tiles.mt_tower.presentation.preferred_position, [0, 0]);
  assert.equal(MT.structHash(ws.live), canonicalHash, "host session adjustment must not enter canonical matter");

  const html = MT.vnodeToHTML(MT.compilePanel(ws.live, host).root);
  assert.match(html, /mt-p-docked mt-dock-left/);
  assert.match(html, /--p-x:24px/);
  assert.match(html, /--p-y:12px/);
  assert.match(html, /session adjusted/);

  const rollback = MT.rollback(ws, receipt.rollback_token);
  assert.ok(rollback.ok && rollback.exact);
  assert.equal(MT.structHash(ws.live), before);
});

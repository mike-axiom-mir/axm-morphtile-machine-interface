"use strict";

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

function commitInterface(MT, ws, out) {
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

function controlRequest(requestId, userAdjustable) {
  return {
    envelope_version: "0.1",
    request_id: requestId,
    goal: "Prove host presentation choices never fork canonical Interface control state or authority",
    intent: {
      tile_path: "mt_tower",
      title: "Portable tower control",
      elements: [
        { kind: "control", binding: "levels", label: "Tower levels" }
      ],
      bindings: { controls: ["levels"] },
      placement: {
        mode: "screen",
        preferred_size: [360, 240],
        preferred_position: [0, 0],
        user_adjustable: userAdjustable
      }
    },
    provenance: { caller: "presentation-mode-shared-control-proof" }
  };
}

function floatingHost() {
  return {
    session_presentations: {
      mt_tower: {
        mode: "floating",
        preferred_size: [420, 260],
        preferred_position: [32, 18]
      }
    }
  };
}

test("one canonical control remains the same authority when an allowed host session changes presentation mode", { skip: !corePath }, () => {
  assertPinnedRuntime();
  const MT = require(path.resolve(corePath));
  const ws = MT.createWorkspace(MT.seedWorld());
  const beforeHash = MT.structHash(ws.live);
  const beforeTower = ws.live.tiles.mt_tower;
  const beforeParams = JSON.stringify(beforeTower.params);
  const beforeLevels = MT.paramValue(beforeTower, beforeTower.params.find((param) => param.id === "levels"));

  const out = run(controlRequest("presentation-mode-shared-canonical-control", true));

  assert.equal(out.status, "CANDIDATE", JSON.stringify(out.holds));
  assert.deepEqual(out.dependencies[0].requires, {
    tile_exists: true,
    form_hints_include: ["ui_panel"],
    readout_logic_vars: [],
    control_param_ids: ["levels"],
    action_input_signal_socket_ids: []
  });
  assert.equal(out.candidate.operations.length, 2);
  assert.deepEqual(out.candidate.operations[1], {
    op: "presentation.set",
    id: "mt_tower",
    presentation: {
      mode: "screen",
      preferred_size: [360, 240],
      preferred_position: [0, 0],
      user_adjustable: true
    }
  });

  const receipt = commitInterface(MT, ws, out);
  const canonicalHash = MT.structHash(ws.live);
  const afterTower = ws.live.tiles.mt_tower;
  assert.equal(JSON.stringify(afterTower.params), beforeParams, "interface presentation must not rewrite target parameter definitions");
  assert.equal(MT.paramValue(afterTower, afterTower.params.find((param) => param.id === "levels")), beforeLevels);
  assert.equal(afterTower.presentation.mode, "screen");

  const canonicalResolved = MT.resolvePresentation(ws.live, "mt_tower");
  assert.equal(canonicalResolved.status, "READY");
  assert.equal(canonicalResolved.resolved.mode, "screen");
  assert.equal(canonicalResolved.session_applied, false);

  const canonicalHtml = MT.vnodeToHTML(MT.compilePanel(ws.live).root);
  assert.match(canonicalHtml, /data-presentation-mode="screen"/);
  assert.match(canonicalHtml, /mt-p-screen/);
  assert.equal(occurrences(canonicalHtml, 'data-param="mt_tower:levels"'), 1);
  assert.match(canonicalHtml, /Tower levels/);

  const host = floatingHost();
  const sessionResolved = MT.resolvePresentation(ws.live, "mt_tower", host);
  assert.equal(sessionResolved.status, "READY");
  assert.equal(sessionResolved.resolved.mode, "floating");
  assert.equal(sessionResolved.session_applied, true);
  assert.deepEqual(sessionResolved.resolved.preferred_size, [420, 260]);
  assert.deepEqual(sessionResolved.resolved.preferred_position, [32, 18]);

  assert.equal(MT.structHash(ws.live), canonicalHash, "host mode selection must remain session-only");
  assert.equal(ws.live.tiles.mt_tower.presentation.mode, "screen", "session mode must not rewrite canonical presentation matter");
  assert.equal(JSON.stringify(ws.live.tiles.mt_tower.params), beforeParams, "host mode selection must not fork parameter authority");
  assert.equal(MT.paramValue(ws.live.tiles.mt_tower, ws.live.tiles.mt_tower.params.find((param) => param.id === "levels")), beforeLevels);

  const floatingHtml = MT.vnodeToHTML(MT.compilePanel(ws.live, host).root);
  assert.match(floatingHtml, /data-presentation-mode="floating"/);
  assert.match(floatingHtml, /mt-p-floating/);
  assert.equal(occurrences(floatingHtml, 'data-param="mt_tower:levels"'), 1, "the alternate presentation must address the same canonical parameter exactly once");
  assert.match(floatingHtml, /Tower levels/);

  const rollback = MT.rollback(ws, receipt.rollback_token);
  assert.ok(rollback.ok && rollback.exact);
  assert.equal(MT.structHash(ws.live), beforeHash);
});

test("host mode changes are ignored when canonical Interface matter does not grant user adjustment", { skip: !corePath }, () => {
  assertPinnedRuntime();
  const MT = require(path.resolve(corePath));
  const ws = MT.createWorkspace(MT.seedWorld());
  const beforeHash = MT.structHash(ws.live);
  const beforeTower = ws.live.tiles.mt_tower;
  const beforeParams = JSON.stringify(beforeTower.params);
  const beforeLevels = MT.paramValue(beforeTower, beforeTower.params.find((param) => param.id === "levels"));

  const out = run(controlRequest("presentation-mode-adjustment-denied", false));
  assert.equal(out.status, "CANDIDATE", JSON.stringify(out.holds));
  const receipt = commitInterface(MT, ws, out);
  const canonicalHash = MT.structHash(ws.live);

  const host = floatingHost();
  const resolved = MT.resolvePresentation(ws.live, "mt_tower", host);
  assert.equal(resolved.status, "READY");
  assert.equal(resolved.session_applied, false, "session presentation must not apply without explicit canonical adjustment permission");
  assert.equal(resolved.resolved.mode, "screen");
  assert.deepEqual(resolved.resolved.preferred_size, [360, 240]);
  assert.deepEqual(resolved.resolved.preferred_position, [0, 0]);

  const html = MT.vnodeToHTML(MT.compilePanel(ws.live, host).root);
  assert.match(html, /data-presentation-mode="screen"/);
  assert.match(html, /mt-p-screen/);
  assert.doesNotMatch(html, /data-presentation-mode="floating"/);
  assert.equal(occurrences(html, 'data-param="mt_tower:levels"'), 1);

  assert.equal(MT.structHash(ws.live), canonicalHash, "rejected host adjustment must be read-only");
  assert.equal(ws.live.tiles.mt_tower.presentation.mode, "screen");
  assert.equal(ws.live.tiles.mt_tower.presentation.user_adjustable, false);
  assert.equal(JSON.stringify(ws.live.tiles.mt_tower.params), beforeParams);
  assert.equal(MT.paramValue(ws.live.tiles.mt_tower, ws.live.tiles.mt_tower.params.find((param) => param.id === "levels")), beforeLevels);

  const rollback = MT.rollback(ws, receipt.rollback_token);
  assert.ok(rollback.ok && rollback.exact);
  assert.equal(MT.structHash(ws.live), beforeHash);
});

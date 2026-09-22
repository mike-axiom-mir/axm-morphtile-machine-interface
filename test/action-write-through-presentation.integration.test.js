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

function commitOperations(MT, ws, operations, label) {
  const candidate = MT.cloneBody(ws, label || "ai", "ai:interface-machine");
  for (const operation of operations) {
    const edited = MT.editCandidate(ws, candidate, operation);
    assert.ok(edited.ok, edited.error);
  }
  const plan = MT.planMerge(ws, [candidate]);
  assert.equal(plan.status, "READY");
  const committed = MT.commitPlan(ws, plan.id);
  assert.ok(committed.ok);
  return committed.receipt;
}

function collect(root, predicate) {
  const found = [];
  const visit = (node) => {
    if (!node || typeof node !== "object") return;
    if (predicate(node)) found.push(node);
    for (const child of node.children || []) visit(child);
  };
  visit(root);
  return found;
}

function compileActionView(MT, ws, host) {
  const compiled = MT.compilePanel(ws.live, host);
  const actions = collect(compiled.root, (node) => node.on && node.on.type === "signal" && node.on.tile === "mt_tower" && node.on.name === "toggle");
  const readouts = collect(compiled.root, (node) => node.bind && node.bind.tile === "mt_tower" && node.bind.name === "beacon");
  assert.equal(actions.length, 1, "each presentation must expose exactly one view onto the canonical toggle input action");
  assert.equal(readouts.length, 1, "each presentation must expose exactly one beacon readout");
  return {
    action: { ...actions[0].on },
    beacon: readouts[0].text,
    html: MT.vnodeToHTML(compiled.root)
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

test("the same exposed action contract mutates canonical runtime state through canonical and session presentations", { skip: !corePath }, () => {
  assertPinnedRuntime();
  const MT = require(path.resolve(corePath));
  const ws = MT.createWorkspace(MT.seedWorld());
  const initialHash = MT.structHash(ws.live);
  assert.equal(MT.readVars(ws.live, "mt_tower", 0).beacon, 0);

  const out = run({
    envelope_version: "0.1",
    request_id: "canonical-action-write-through-presentations",
    goal: "Prove one Interface action stays one exposed target authority while alternate presentations dispatch the same bounded signal contract",
    intent: {
      tile_path: "mt_tower",
      title: "Portable tower action",
      elements: [
        { kind: "readout", binding: "beacon", label: "Beacon" },
        { kind: "action", binding: "toggle", label: "Toggle beacon" }
      ],
      bindings: {
        readouts: ["beacon"],
        actions: ["toggle"]
      },
      placement: {
        mode: "screen",
        preferred_size: [360, 240],
        preferred_position: [0, 0],
        user_adjustable: true
      }
    },
    provenance: { caller: "canonical-action-write-through-proof" }
  });

  assert.equal(out.status, "CANDIDATE", JSON.stringify(out.holds));
  assert.deepEqual(out.dependencies[0].requires, {
    tile_exists: true,
    form_hints_include: ["ui_panel"],
    readout_logic_vars: ["beacon"],
    control_param_ids: [],
    action_input_signal_socket_ids: ["toggle"]
  });
  assert.equal(out.candidate.operations.length, 2);

  const receipt = commitOperations(MT, ws, out.candidate.operations, "interface-action-source");
  assert.ok(receipt.rollback_token, "the Interface structural edit must retain an ordinary rollback receipt before runtime interaction begins");
  const interfaceHash = MT.structHash(ws.live);
  assert.notEqual(interfaceHash, initialHash);
  const authoredView = JSON.stringify(ws.live.tiles.mt_tower.view);
  const authoredPresentation = JSON.stringify(ws.live.tiles.mt_tower.presentation);
  const targetLogic = JSON.stringify(ws.live.tiles.mt_tower.facets.logic);
  const host = floatingHost();

  const canonicalBefore = compileActionView(MT, ws, undefined);
  const sessionBefore = compileActionView(MT, ws, host);
  assert.deepEqual(canonicalBefore.action, { type: "signal", tile: "mt_tower", name: "toggle" });
  assert.deepEqual(sessionBefore.action, canonicalBefore.action, "presentation changes must not fork action identity");
  assert.equal(canonicalBefore.beacon, "0");
  assert.equal(sessionBefore.beacon, "0");
  assert.match(canonicalBefore.html, /data-presentation-mode="screen"/);
  assert.match(sessionBefore.html, /data-presentation-mode="floating"/);
  assert.equal(MT.structHash(ws.live), interfaceHash, "rendering either action presentation must be read-only");

  MT.act(ws, { do: canonicalBefore.action.type, tile: canonicalBefore.action.tile, name: canonicalBefore.action.name });
  assert.equal(MT.readVars(ws.live, "mt_tower", 0).beacon, 1, "the exposed action contract must reach canonical runtime state");
  assert.equal(JSON.stringify(ws.live.tiles.mt_tower.view), authoredView, "the action must not rewrite Interface-authored view matter");
  assert.equal(JSON.stringify(ws.live.tiles.mt_tower.presentation), authoredPresentation, "the action must not rewrite canonical presentation matter");
  assert.equal(JSON.stringify(ws.live.tiles.mt_tower.facets.logic), targetLogic, "dispatch must use existing target logic rather than inventing action authority");

  const canonicalAfter = compileActionView(MT, ws, undefined);
  const sessionAfter = compileActionView(MT, ws, host);
  assert.deepEqual(canonicalAfter.action, canonicalBefore.action);
  assert.deepEqual(sessionAfter.action, canonicalBefore.action);
  assert.equal(canonicalAfter.beacon, "1");
  assert.equal(sessionAfter.beacon, "1");

  MT.act(ws, { do: sessionAfter.action.type, tile: sessionAfter.action.tile, name: sessionAfter.action.name });
  assert.equal(MT.readVars(ws.live, "mt_tower", 0).beacon, 0, "the session presentation must dispatch the same action contract back onto the same runtime state");
  assert.equal(compileActionView(MT, ws, undefined).beacon, "0");
  assert.equal(compileActionView(MT, ws, host).beacon, "0");

  assert.equal(JSON.stringify(ws.live.tiles.mt_tower.view), authoredView);
  assert.equal(JSON.stringify(ws.live.tiles.mt_tower.presentation), authoredPresentation);
  assert.equal(JSON.stringify(ws.live.tiles.mt_tower.facets.logic), targetLogic);
});
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

function commitOperation(MT, ws, operation, label) {
  const candidate = MT.cloneBody(ws, label || "ai", "ai:interface-machine");
  const edited = MT.editCandidate(ws, candidate, operation);
  assert.ok(edited.ok, edited.error);
  const plan = MT.planMerge(ws, [candidate]);
  assert.equal(plan.status, "READY", JSON.stringify(plan));
  const committed = MT.commitPlan(ws, plan.id);
  assert.ok(committed.ok, JSON.stringify(committed));
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

function composedNodes(MT, ws) {
  const compiled = MT.compilePanel(ws.live);
  const parentSections = collect(compiled.root, (node) => node.tile === "mt_core" && typeof node.cls === "string" && node.cls.includes("mt-panel"));
  assert.equal(parentSections.length, 1, "the parent target must render one canonical panel");

  const embeds = collect(parentSections[0], (node) => node.tile === "mt_tower" && node.cls === "v-embed");
  assert.equal(embeds.length, 1, "the parent must contain exactly one embedded tower view");

  const childActions = collect(embeds[0], (node) => node.on && node.on.type === "signal");
  const childControls = collect(embeds[0], (node) => node.param);
  const childReadouts = collect(embeds[0], (node) => node.bind && node.bind.name === "beacon");
  const parentActions = collect(parentSections[0], (node) => node.on && node.on.tile === "mt_core");

  return {
    parent: parentSections[0],
    embed: embeds[0],
    childActions,
    childControls,
    childReadouts,
    parentActions,
    html: MT.vnodeToHTML(parentSections[0])
  };
}

test("composed Interface views keep action and control authority on the tile that owns them", { skip: !corePath }, () => {
  assertPinnedRuntime();
  const MT = require(path.resolve(corePath));
  const ws = MT.createWorkspace(MT.seedWorld());

  const child = run({
    envelope_version: "0.1",
    request_id: "tile-owned-child-interactions",
    goal: "Author ordinary controls and actions on the tile that owns their canonical state",
    intent: {
      tile_path: "mt_tower",
      title: "Tower controls",
      elements: [
        { kind: "readout", binding: "beacon", label: "Beacon" },
        { kind: "control", binding: "levels", label: "Tower levels" },
        { kind: "action", binding: "toggle", label: "Toggle beacon" }
      ],
      bindings: {
        readouts: ["beacon"],
        controls: ["levels"],
        actions: ["toggle"]
      }
    },
    provenance: { caller: "tile-owned-composition-proof" }
  });

  assert.equal(child.status, "CANDIDATE", JSON.stringify(child.holds));
  assert.deepEqual(child.dependencies[0].requires, {
    tile_exists: true,
    form_hints_include: ["ui_panel"],
    readout_logic_vars: ["beacon"],
    control_param_ids: ["levels"],
    action_input_signal_socket_ids: ["toggle"]
  });
  commitOperation(MT, ws, child.candidate.operation, "interface-child-view");

  const parent = run({
    envelope_version: "0.1",
    request_id: "tile-owned-parent-composition",
    goal: "Compose child Interface matter without rebinding the child tile's controls or actions to the parent",
    intent: {
      tile_path: "mt_core",
      title: "Core with tower",
      elements: [
        { kind: "action", binding: "surge", label: "Harvest core" },
        { kind: "tile", tile_id: "mt_tower" }
      ],
      bindings: { actions: ["surge"] }
    },
    provenance: { caller: "tile-owned-composition-proof" }
  });

  assert.equal(parent.status, "CANDIDATE", JSON.stringify(parent.holds));
  assert.deepEqual(parent.dependencies[0].requires, {
    tile_exists: true,
    form_hints_include: ["ui_panel"],
    readout_logic_vars: [],
    control_param_ids: [],
    action_input_signal_socket_ids: ["surge"]
  });
  commitOperation(MT, ws, parent.candidate.operation, "interface-parent-composition");

  const composedHash = MT.structHash(ws.live);
  const parentView = JSON.stringify(ws.live.tiles.mt_core.view);
  const childView = JSON.stringify(ws.live.tiles.mt_tower.view);
  const childLogic = JSON.stringify(ws.live.tiles.mt_tower.facets.logic);
  const before = composedNodes(MT, ws);

  assert.deepEqual(before.parentActions.map((node) => node.on), [{ type: "signal", tile: "mt_core", name: "surge" }]);
  assert.deepEqual(before.childActions.map((node) => node.on), [{ type: "signal", tile: "mt_tower", name: "toggle" }]);
  assert.deepEqual(before.childControls.map((node) => node.param), [{ tile: "mt_tower", id: "levels" }]);
  assert.equal(before.childReadouts.length, 1);
  assert.equal(before.childReadouts[0].bind.tile, "mt_tower");
  assert.equal(before.childReadouts[0].text, "0");
  assert.doesNotMatch(before.html, /data-signal="mt_core:toggle"/);
  assert.doesNotMatch(before.html, /data-param="mt_core:levels"/);
  assert.equal(MT.structHash(ws.live), composedHash, "rendering composed tile-owned views must be read-only");

  const control = before.childControls[0].param;
  const levelReceipt = commitOperation(MT, ws, [{ op: "param.set", id: control.tile, param: control.id, value: 5 }][0], "embedded-child-control-write");
  assert.equal(MT.paramValue(ws.live.tiles.mt_tower, ws.live.tiles.mt_tower.params.find((param) => param.id === "levels")), 5);
  assert.equal(ws.live.tiles.mt_tower.facets.mesh.data.levels, 5);
  assert.equal((ws.live.tiles.mt_core.params || []).some((param) => param.id === "levels"), false, "the parent must not gain the child's parameter authority");
  assert.equal(JSON.stringify(ws.live.tiles.mt_core.view), parentView);
  assert.equal(JSON.stringify(ws.live.tiles.mt_tower.view), childView);
  assert.equal(composedNodes(MT, ws).childControls[0].attrs.value, 5, "the embedded control must observe the child tile's canonical parameter write");

  const levelRollback = MT.rollback(ws, levelReceipt.rollback_token);
  assert.ok(levelRollback.ok && levelRollback.exact);
  assert.equal(MT.structHash(ws.live), composedHash, "rolling back the child parameter write must preserve both Interface-authored views");
  assert.equal(composedNodes(MT, ws).childControls[0].attrs.value, 3);

  const action = composedNodes(MT, ws).childActions[0].on;
  MT.act(ws, { do: action.type, tile: action.tile, name: action.name });
  assert.equal(MT.readVars(ws.live, "mt_tower", 0).beacon, 1, "the embedded child action must reach the child tile's runtime state");
  assert.equal(Object.prototype.hasOwnProperty.call(MT.readVars(ws.live, "mt_core", 0), "beacon"), false, "the parent must not gain the child's runtime variable");
  assert.equal(composedNodes(MT, ws).childReadouts[0].text, "1", "the embedded readout must observe the child tile's runtime state");
  assert.equal(JSON.stringify(ws.live.tiles.mt_core.view), parentView, "child interaction must not rewrite the parent view");
  assert.equal(JSON.stringify(ws.live.tiles.mt_tower.view), childView, "child interaction must not rewrite the child view");
  assert.equal(JSON.stringify(ws.live.tiles.mt_tower.facets.logic), childLogic, "dispatch must use the child's existing logic authority rather than inventing a composed-view authority");
});

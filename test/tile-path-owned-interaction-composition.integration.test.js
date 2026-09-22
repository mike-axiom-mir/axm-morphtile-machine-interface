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

function portableClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function nestedInteractiveWorld(MT) {
  const world = MT.seedWorld();
  const tower = world.tiles.mt_tower;
  const panel = MT.createTile({ id: "mt_panel", name: "Owner panel", form_hints: ["ui_panel"] });
  const inner = MT.createTile({
    id: "mt_inner",
    name: "Nested tower",
    form_hints: ["ui_panel"],
    params: portableClone(tower.params),
    facets: portableClone(tower.facets)
  });
  const shell = MT.createTile({ id: "mt_shell", name: "Path shell", form_hints: ["ui_panel"] });
  shell.facets.mesh = { type: "interior", source: null, data: {} };
  shell.interior = { tiles: { mt_panel: panel, mt_inner: inner }, edges: {}, ports: [] };
  shell.provenance.sha256 = MT.contentHash(shell);
  world.tiles.mt_shell = shell;
  const valid = MT.validateWorld(world);
  assert.equal(valid.ok, true, valid.errors.join("; "));
  return world;
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

function nestedNodes(MT, ws) {
  const compiled = MT.compilePanel(ws.live, { open: { mt_shell: true } });
  const parents = collect(compiled.root, (node) => node.tile === "mt_shell/mt_panel" && typeof node.cls === "string" && node.cls.includes("mt-panel"));
  assert.equal(parents.length, 1, "the nested parent must render one canonical panel");
  const embeds = collect(parents[0], (node) => node.tile === "mt_shell/mt_inner" && node.cls === "v-embed");
  assert.equal(embeds.length, 1, "the exact same-root child path must render once inside its owner panel");
  return {
    parent: parents[0],
    embed: embeds[0],
    childActions: collect(embeds[0], (node) => node.on && node.on.type === "signal"),
    childControls: collect(embeds[0], (node) => node.param),
    childReadouts: collect(embeds[0], (node) => node.bind && node.bind.name === "beacon"),
    html: MT.vnodeToHTML(parents[0])
  };
}

test("explicit same-root path composition preserves the nested tile's action and control authority", { skip: !corePath }, () => {
  assertPinnedRuntime();
  const MT = require(path.resolve(corePath));
  const ws = MT.createWorkspace(nestedInteractiveWorld(MT));

  const child = run({
    envelope_version: "0.1",
    request_id: "same-root-path-child-interactions",
    goal: "Author ordinary interaction matter on an exact nested tile path",
    intent: {
      tile_path: "mt_shell/mt_inner",
      title: "Nested tower controls",
      elements: [
        { kind: "readout", binding: "beacon", label: "Beacon" },
        { kind: "control", binding: "levels", label: "Tower levels" },
        { kind: "action", binding: "toggle", label: "Toggle beacon" }
      ],
      bindings: { readouts: ["beacon"], controls: ["levels"], actions: ["toggle"] }
    },
    provenance: { caller: "same-root-path-owned-interaction-proof" }
  });
  assert.equal(child.status, "CANDIDATE", JSON.stringify(child.holds));
  commitOperation(MT, ws, child.candidate.operation, "nested-child-view");

  const parent = run({
    envelope_version: "0.1",
    request_id: "same-root-path-parent-composition",
    goal: "Compose an exact nested child path without rebinding its interaction authority",
    intent: {
      tile_path: "mt_shell/mt_panel",
      title: "Nested owner",
      elements: [{ kind: "tile", tile_path: "mt_shell/mt_inner" }]
    },
    provenance: { caller: "same-root-path-owned-interaction-proof" }
  });
  assert.equal(parent.status, "CANDIDATE", JSON.stringify(parent.holds));
  assert.deepEqual(parent.candidate.operation.view.body, [{ tile: "/mt_shell/mt_inner" }]);
  commitOperation(MT, ws, parent.candidate.operation, "nested-parent-view");

  const composedHash = MT.structHash(ws.live);
  const parentView = JSON.stringify(MT.resolveTile(ws.live, "mt_shell/mt_panel").view);
  const childView = JSON.stringify(MT.resolveTile(ws.live, "mt_shell/mt_inner").view);
  const childLogic = JSON.stringify(MT.resolveTile(ws.live, "mt_shell/mt_inner").facets.logic);
  const before = nestedNodes(MT, ws);

  assert.deepEqual(before.childActions.map((node) => node.on), [{ type: "signal", tile: "mt_shell/mt_inner", name: "toggle" }]);
  assert.deepEqual(before.childControls.map((node) => node.param), [{ tile: "mt_shell/mt_inner", id: "levels" }]);
  assert.equal(before.childReadouts.length, 1);
  assert.equal(before.childReadouts[0].bind.tile, "mt_shell/mt_inner");
  assert.doesNotMatch(before.html, /data-signal="mt_shell\/mt_panel:toggle"/);
  assert.doesNotMatch(before.html, /data-param="mt_shell\/mt_panel:levels"/);
  assert.equal(MT.structHash(ws.live), composedHash, "exact-path composed rendering must remain read-only");

  const control = before.childControls[0].param;
  const levelReceipt = commitOperation(MT, ws, { op: "param.set", id: control.tile, param: control.id, value: 5 }, "nested-child-control-write");
  const changedChild = MT.resolveTile(ws.live, "mt_shell/mt_inner");
  assert.equal(MT.paramValue(changedChild, changedChild.params.find((param) => param.id === "levels")), 5);
  assert.equal(changedChild.facets.mesh.data.levels, 5);
  assert.equal((MT.resolveTile(ws.live, "mt_shell/mt_panel").params || []).some((param) => param.id === "levels"), false, "the nested parent must not gain the child's parameter authority");
  assert.equal(nestedNodes(MT, ws).childControls[0].attrs.value, 5);

  const levelRollback = MT.rollback(ws, levelReceipt.rollback_token);
  assert.ok(levelRollback.ok && levelRollback.exact);
  assert.equal(MT.structHash(ws.live), composedHash);
  assert.equal(nestedNodes(MT, ws).childControls[0].attrs.value, 3);

  const action = nestedNodes(MT, ws).childActions[0].on;
  MT.act(ws, { do: action.type, tile: action.tile, name: action.name });
  assert.equal(MT.readVars(ws.live, "mt_shell/mt_inner", 0).beacon, 1, "the exact-path embedded action must reach only the nested child runtime state");
  assert.equal(Object.prototype.hasOwnProperty.call(MT.readVars(ws.live, "mt_shell/mt_panel", 0), "beacon"), false);
  assert.equal(nestedNodes(MT, ws).childReadouts[0].text, "1");
  assert.equal(JSON.stringify(MT.resolveTile(ws.live, "mt_shell/mt_panel").view), parentView);
  assert.equal(JSON.stringify(MT.resolveTile(ws.live, "mt_shell/mt_inner").view), childView);
  assert.equal(JSON.stringify(MT.resolveTile(ws.live, "mt_shell/mt_inner").facets.logic), childLogic, "composition must not create an alternate nested action authority");
});

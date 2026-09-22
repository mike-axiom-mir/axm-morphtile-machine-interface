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

function commitView(MT, ws, out, by) {
  const candidate = MT.cloneBody(ws, "ai", by);
  const edited = MT.editCandidate(ws, candidate, out.candidate.operation);
  assert.ok(edited.ok, edited.error);
  const plan = MT.planMerge(ws, [candidate]);
  assert.equal(plan.status, "READY", JSON.stringify(plan));
  const committed = MT.commitPlan(ws, plan.id);
  assert.ok(committed.ok, JSON.stringify(committed));
  return committed;
}

function nestedWorld(MT) {
  const world = MT.seedWorld();
  const panel = MT.createTile({ id: "mt_panel", name: "Owner panel", form_hints: ["ui_panel"] });
  const shell = MT.createTile({ id: "mt_shell", name: "Path shell", form_hints: ["ui_panel"] });
  shell.facets.mesh = { type: "interior", source: null, data: {} };
  shell.interior = { tiles: { mt_panel: panel }, edges: {}, ports: [] };
  shell.provenance.sha256 = MT.contentHash(shell);
  world.tiles.mt_shell = shell;
  const valid = MT.validateWorld(world);
  assert.equal(valid.ok, true, valid.errors.join("; "));
  return world;
}

test("generated local self-composition becomes a visible inert view instead of recursive authority", { skip: !corePath }, () => {
  assertPinnedRuntime();
  const MT = require(path.resolve(corePath));
  const ws = MT.createWorkspace(MT.seedWorld());
  const before = MT.structHash(ws.live);

  const out = run({
    envelope_version: "0.1",
    request_id: "local-self-composition",
    goal: "Render one tile-owned view through its own local tile reference without creating another authority",
    intent: {
      tile_path: "mt_tower",
      title: "Self composition guard",
      elements: [{ kind: "tile", tile_id: "mt_tower" }]
    },
    provenance: { caller: "pinned-self-composition-integration-test" }
  });

  assert.equal(out.status, "CANDIDATE", JSON.stringify(out.holds));
  assert.deepEqual(out.candidate.operation.view.body, [{ tile: "mt_tower" }]);

  const committed = commitView(MT, ws, out, "ai:interface-local-self-composition-test");
  const committedHash = MT.structHash(ws.live);
  const html = MT.vnodeToHTML(MT.compilePanel(ws.live).root);
  assert.match(html, /class="v-embed"[^>]*data-tile="mt_tower"/);
  assert.match(html, /this view leans on itself/);
  assert.equal(MT.structHash(ws.live), committedHash, "self-composition rendering must not mutate canonical matter");
  assert.deepEqual(MT.resolveTile(ws.live, "mt_tower").view.body, [{ tile: "mt_tower" }], "core must not rewrite the authored self reference to escape the cycle");

  const rollback = MT.rollback(ws, committed.receipt.rollback_token);
  assert.ok(rollback.ok && rollback.exact);
  assert.equal(MT.structHash(ws.live), before);
});

test("generated explicit same-root self path is equally visible and inert", { skip: !corePath }, () => {
  assertPinnedRuntime();
  const MT = require(path.resolve(corePath));
  const ws = MT.createWorkspace(nestedWorld(MT));
  const before = MT.structHash(ws.live);

  const out = run({
    envelope_version: "0.1",
    request_id: "same-root-self-composition",
    goal: "Render a nested tile-owned view through its own canonical same-root path without creating another authority",
    intent: {
      tile_path: "mt_shell/mt_panel",
      title: "Nested self composition guard",
      elements: [{ kind: "tile", tile_path: "mt_shell/mt_panel" }]
    },
    provenance: { caller: "pinned-self-composition-integration-test" }
  });

  assert.equal(out.status, "CANDIDATE", JSON.stringify(out.holds));
  assert.deepEqual(out.candidate.operation.view.body, [{ tile: "/mt_shell/mt_panel" }]);

  const committed = commitView(MT, ws, out, "ai:interface-same-root-self-composition-test");
  const committedHash = MT.structHash(ws.live);
  const html = MT.vnodeToHTML(MT.compilePanel(ws.live, { open: { mt_shell: true } }).root);
  assert.match(html, /class="v-embed"[^>]*data-tile="mt_shell\/mt_panel"/);
  assert.match(html, /this view leans on itself/);
  assert.equal(MT.structHash(ws.live), committedHash, "same-root self-composition rendering must not mutate canonical matter");
  assert.deepEqual(MT.resolveTile(ws.live, "mt_shell/mt_panel").view.body, [{ tile: "/mt_shell/mt_panel" }], "core must preserve the exact canonical self path while rendering the cycle inert");

  const rollback = MT.rollback(ws, committed.receipt.rollback_token);
  assert.ok(rollback.ok && rollback.exact);
  assert.equal(MT.structHash(ws.live), before);
});

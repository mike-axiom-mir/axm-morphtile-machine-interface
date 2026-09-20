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

function nestedWorld(MT) {
  const world = MT.seedWorld();
  const panel = MT.createTile({ id: "mt_panel", name: "Owner panel", form_hints: ["ui_panel"] });
  const inner = MT.createTile({ id: "mt_inner", name: "Owned nested source", form_hints: ["ui_panel"] });
  inner.view = { title: "Nested source", body: [{ text: "Owned nested path view" }] };
  inner.provenance.sha256 = MT.contentHash(inner);

  const shell = MT.createTile({ id: "mt_shell", name: "Path shell", form_hints: ["ui_panel"] });
  shell.facets.mesh = { type: "interior", source: null, data: {} };
  shell.interior = { tiles: { mt_panel: panel, mt_inner: inner }, edges: {}, ports: [] };
  shell.provenance.sha256 = MT.contentHash(shell);
  world.tiles.mt_shell = shell;
  const valid = MT.validateWorld(world);
  assert.equal(valid.ok, true, valid.errors.join("; "));
  return world;
}

function commitView(MT, ws, out) {
  const candidate = MT.cloneBody(ws, "ai", "ai:interface-tile-path-test");
  const edited = MT.editCandidate(ws, candidate, out.candidate.operation);
  assert.ok(edited.ok, edited.error);
  const plan = MT.planMerge(ws, [candidate]);
  assert.equal(plan.status, "READY", JSON.stringify(plan));
  const committed = MT.commitPlan(ws, plan.id);
  assert.ok(committed.ok, JSON.stringify(committed));
  return committed;
}

test("generated same-root tile path resolves the exact nested target through real MorphTile without copied state", { skip: !corePath }, () => {
  assertPinnedRuntime();
  const MT = require(path.resolve(corePath));
  const ws = MT.createWorkspace(nestedWorld(MT));
  const before = MT.structHash(ws.live);

  const out = run({
    envelope_version: "0.1",
    request_id: "tile-path-runtime",
    goal: "Compose an exact nested tile-owned view inside the same top-level MorphTile root",
    intent: {
      tile_path: "mt_shell/mt_panel",
      title: "Owner with nested view",
      elements: [{ kind: "tile", tile_path: "mt_shell/mt_inner" }]
    },
    provenance: { caller: "pinned-tile-path-integration-test" }
  });

  assert.equal(out.status, "CANDIDATE", JSON.stringify(out.holds));
  assert.deepEqual(out.candidate.operation.view.body, [{ tile: "/mt_shell/mt_inner" }]);

  const committed = commitView(MT, ws, out);
  const committedHash = MT.structHash(ws.live);
  const html = MT.vnodeToHTML(MT.compilePanel(ws.live, { open: { mt_shell: true } }).root);
  assert.match(html, /class="v-embed"[^>]*data-tile="mt_shell\/mt_inner"/);
  assert.match(html, /Owned nested path view/);
  assert.equal(MT.structHash(ws.live), committedHash, "rendering an explicit path composition must remain structurally read-only");

  const target = MT.resolveTile(ws.live, "mt_shell/mt_inner");
  assert.deepEqual(target.view, { title: "Nested source", body: [{ text: "Owned nested path view" }] }, "embedded tile remains owner of its view");

  const rollback = MT.rollback(ws, committed.receipt.rollback_token);
  assert.ok(rollback.ok && rollback.exact);
  assert.equal(MT.structHash(ws.live), before);
});

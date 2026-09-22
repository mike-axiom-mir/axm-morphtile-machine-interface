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

function crossRootWorld(MT) {
  const world = MT.seedWorld();

  const owner = MT.createTile({ id: "mt_panel", name: "Owner panel", form_hints: ["ui_panel"] });
  owner.view = {
    title: "Owner with represented cross-root view",
    body: [{ tile: "/mt_shell_b/mt_inner" }]
  };
  owner.provenance.sha256 = MT.contentHash(owner);

  const shellA = MT.createTile({ id: "mt_shell_a", name: "Owner shell", form_hints: ["ui_panel"] });
  shellA.facets.mesh = { type: "interior", source: null, data: {} };
  shellA.interior = { tiles: { mt_panel: owner }, edges: {}, ports: [] };
  shellA.provenance.sha256 = MT.contentHash(shellA);

  const inner = MT.createTile({ id: "mt_inner", name: "Remote nested source", form_hints: ["ui_panel"] });
  inner.view = { title: "Remote source", body: [{ text: "Cross-root target remains independently owned" }] };
  inner.provenance.sha256 = MT.contentHash(inner);

  const shellB = MT.createTile({ id: "mt_shell_b", name: "Remote shell", form_hints: ["ui_panel"] });
  shellB.facets.mesh = { type: "interior", source: null, data: {} };
  shellB.interior = { tiles: { mt_inner: inner }, edges: {}, ports: [] };
  shellB.provenance.sha256 = MT.contentHash(shellB);

  world.tiles.mt_shell_a = shellA;
  world.tiles.mt_shell_b = shellB;
  const valid = MT.validateWorld(world);
  assert.equal(valid.ok, true, valid.errors.join("; "));
  return world;
}

test("Core representability does not grant Interface cross-root composition authority", { skip: !corePath }, () => {
  assertPinnedRuntime();
  const MT = require(path.resolve(corePath));

  const out = run({
    envelope_version: "0.1",
    request_id: "cross-root-authority-boundary",
    goal: "Keep cross-root tile composition held until a separate proof and authority contract exists",
    intent: {
      tile_path: "mt_shell_a/mt_panel",
      title: "Owner panel",
      elements: [{ kind: "tile", tile_path: "mt_shell_b/mt_inner" }]
    },
    provenance: { caller: "cross-root-composition-authority-boundary-integration-test" }
  });

  assert.equal(out.status, "HOLD");
  assert.equal(out.holds[0].code, "HOLD_INTERFACE_TILE_SCOPE");
  assert.match(out.holds[0].detail, /cross-root composition requires a separate authority contract/);
  assert.equal(out.candidate, null, "a cross-root request must not emit an installable candidate");
  assert.deepEqual(out.dependencies, [], "a held cross-root request must not synthesize target or bridge authority proofs");

  const world = crossRootWorld(MT);
  const before = MT.structHash(world);
  const html = MT.vnodeToHTML(MT.compilePanel(world, { open: { mt_shell_a: true, mt_shell_b: true } }).root);

  assert.match(html, /class="v-embed"[^>]*data-tile="mt_shell_b\/mt_inner"/,
    "the exact pinned Core can represent an explicit absolute cross-root tile view; representability alone is not creation authority");
  assert.match(html, /Cross-root target remains independently owned/);
  assert.equal(MT.structHash(world), before, "rendering represented cross-root composition must remain structurally read-only");
  assert.deepEqual(MT.resolveTile(world, "mt_shell_b/mt_inner").view,
    { title: "Remote source", body: [{ text: "Cross-root target remains independently owned" }] },
    "the remote tile remains owner of its view");
});

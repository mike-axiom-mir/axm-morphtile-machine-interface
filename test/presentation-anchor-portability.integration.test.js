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

test("explicit tile-anchor presentation travels as Interface matter without pulling anchor authority", { skip: !corePath }, () => {
  assertPinnedRuntime();
  const MT = require(path.resolve(corePath));
  const ws = MT.createWorkspace(MT.seedWorld());
  const before = MT.structHash(ws.live);

  const out = run({
    envelope_version: "0.1",
    request_id: "interface-anchor-portability",
    goal: "Prove an explicit tile anchor remains portable presentation matter while the anchor stays an external dependency",
    intent: {
      tile_path: "mt_tower",
      title: "Anchored tower controls",
      elements: [
        { kind: "readout", binding: "beacon", label: "Lit" },
        { kind: "control", binding: "levels", label: "Levels" },
        { kind: "action", binding: "toggle", label: "Toggle" }
      ],
      bindings: {
        readouts: ["beacon"],
        controls: ["levels"],
        actions: ["toggle"]
      },
      placement: {
        mode: "tile",
        anchor: "mt_island",
        preferred_size: [320, 240],
        preferred_position: [0, 0],
        user_adjustable: false
      }
    },
    provenance: { caller: "pinned-anchor-portability-test" }
  });

  assert.equal(out.status, "CANDIDATE", JSON.stringify(out.holds));
  assert.deepEqual(out.dependencies.map((dependency) => dependency.id), [
    "morphtile.interface-target-proof:mt_tower",
    "morphtile.presentation-anchor-proof:mt_island"
  ]);

  const expectedView = out.candidate.operations[0].view;
  const expectedPresentation = out.candidate.operations[1].presentation;
  const receipt = commitOperations(MT, ws, out.candidate.operations, "interface-anchor-source");
  const committedHash = MT.structHash(ws.live);

  assert.deepEqual(ws.live.tiles.mt_tower.view, expectedView);
  assert.deepEqual(ws.live.tiles.mt_tower.presentation, expectedPresentation);
  const sourceResolved = MT.resolvePresentation(ws.live, "mt_tower");
  assert.equal(sourceResolved.status, "READY");
  assert.equal(sourceResolved.anchor_frame.anchor, "mt_island");
  assert.equal(MT.structHash(ws.live), committedHash, "presentation resolution must remain read-only");

  const sourceHtml = MT.vnodeToHTML(MT.compilePanel(ws.live).root);
  assert.match(sourceHtml, /data-param="mt_tower:levels"/);
  assert.match(sourceHtml, /data-signal="mt_tower:toggle"/);

  const portableWorkspace = JSON.parse(JSON.stringify(MT.exportWorkspace(ws)));
  const restored = MT.importWorkspace(portableWorkspace);
  assert.equal(restored.import_check.status, "VERIFIED");
  assert.deepEqual(restored.live.tiles.mt_tower.view, expectedView);
  assert.deepEqual(restored.live.tiles.mt_tower.presentation, expectedPresentation);
  const restoredResolved = MT.resolvePresentation(restored.live, "mt_tower");
  assert.equal(restoredResolved.status, "READY");
  assert.equal(restoredResolved.anchor_frame.anchor, "mt_island");

  const portableKit = JSON.parse(JSON.stringify(MT.exportKit(ws.live, "mt_tower")));
  assert.deepEqual(portableKit.tile.view, expectedView);
  assert.deepEqual(portableKit.tile.presentation, expectedPresentation);

  const destination = MT.createWorkspace(MT.createWorld("Elsewhere"));
  const imported = MT.importKit(destination.live, portableKit);
  assert.equal(imported.status, "READY");
  commitOperations(MT, destination, imported.ops, "interface-anchor-destination");

  assert.ok(destination.live.tiles.mt_tower, "the authored interface tile must arrive");
  assert.equal(destination.live.tiles.mt_island, undefined, "kit transport must not silently pull the external anchor tile");
  assert.deepEqual(destination.live.tiles.mt_tower.view, expectedView);
  assert.deepEqual(destination.live.tiles.mt_tower.presentation, expectedPresentation);

  const held = MT.resolvePresentation(destination.live, "mt_tower");
  assert.equal(held.status, "HOLD_MISSING_PRESENTATION_ANCHOR");
  assert.deepEqual(destination.live.tiles.mt_tower.presentation, expectedPresentation, "missing dependency must not rewrite canonical presentation matter");
  assert.match(MT.vnodeToHTML(MT.compilePanel(destination.live).root), /HOLD_MISSING_PRESENTATION_ANCHOR/);

  const rollback = MT.rollback(ws, receipt.rollback_token);
  assert.ok(rollback.ok && rollback.exact);
  assert.equal(MT.structHash(ws.live), before);
});

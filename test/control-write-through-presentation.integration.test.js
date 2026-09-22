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

function commitLevel(MT, ws, value) {
  return commitOperations(MT, ws, [{ op: "param.set", id: "mt_tower", param: "levels", value }], "canonical-level-edit");
}

function levelControlNodes(root) {
  const found = [];
  const visit = (node) => {
    if (!node || typeof node !== "object") return;
    if (node.param && node.param.tile === "mt_tower" && node.param.id === "levels") found.push(node);
    for (const child of node.children || []) visit(child);
  };
  visit(root);
  return found;
}

function assertRenderedLevel(MT, ws, host, expected) {
  const compiled = MT.compilePanel(ws.live, host);
  const controls = levelControlNodes(compiled.root);
  assert.equal(controls.length, 1, "each presentation must expose exactly one view onto the canonical levels parameter");
  assert.equal(controls[0].attrs.value, expected, "the rendered control must read the current canonical parameter value");
  return MT.vnodeToHTML(compiled.root);
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

test("a canonical control write is observed identically through canonical and session presentations", { skip: !corePath }, () => {
  assertPinnedRuntime();
  const MT = require(path.resolve(corePath));
  const ws = MT.createWorkspace(MT.seedWorld());
  const initialHash = MT.structHash(ws.live);
  const towerBefore = ws.live.tiles.mt_tower;
  const levelsBefore = MT.paramValue(towerBefore, towerBefore.params.find((param) => param.id === "levels"));
  assert.equal(levelsBefore, 3);

  const out = run({
    envelope_version: "0.1",
    request_id: "canonical-control-write-through-presentations",
    goal: "Prove one Interface control writes canonical matter once and every allowed presentation observes that same state",
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
        user_adjustable: true
      }
    },
    provenance: { caller: "canonical-control-write-through-proof" }
  });

  assert.equal(out.status, "CANDIDATE", JSON.stringify(out.holds));
  assert.deepEqual(out.dependencies[0].requires.control_param_ids, ["levels"]);
  assert.equal(out.candidate.operations.length, 2);

  const interfaceReceipt = commitOperations(MT, ws, out.candidate.operations, "interface-control-source");
  const interfaceHash = MT.structHash(ws.live);
  const host = floatingHost();

  const canonicalBeforeHtml = assertRenderedLevel(MT, ws, undefined, 3);
  const sessionBeforeHtml = assertRenderedLevel(MT, ws, host, 3);
  assert.match(canonicalBeforeHtml, /data-presentation-mode="screen"/);
  assert.match(sessionBeforeHtml, /data-presentation-mode="floating"/);
  assert.equal(MT.structHash(ws.live), interfaceHash, "rendering either presentation must be read-only");

  const levelReceipt = commitLevel(MT, ws, 6);
  const changedHash = MT.structHash(ws.live);
  assert.notEqual(changedHash, interfaceHash, "the parameter edit must change canonical matter rather than session state");

  const towerChanged = ws.live.tiles.mt_tower;
  const levelParam = towerChanged.params.find((param) => param.id === "levels");
  assert.equal(towerChanged.params.filter((param) => param.id === "levels").length, 1, "the write must not fork parameter authority");
  assert.equal(MT.paramValue(towerChanged, levelParam), 6);
  assert.equal(towerChanged.facets.mesh.data.levels, 6, "the control must write the bound canonical facet");
  assert.ok(Math.abs(towerChanged.facets.connect.sockets[1].pos[1] - 8.2) < 1e-12, "all existing parameter bindings must update from the one canonical write");
  assert.equal(towerChanged.presentation.mode, "screen", "the canonical presentation must stay independent of the control write");

  const canonicalAfterHtml = assertRenderedLevel(MT, ws, undefined, 6);
  const sessionAfterHtml = assertRenderedLevel(MT, ws, host, 6);
  assert.match(canonicalAfterHtml, /data-presentation-mode="screen"/);
  assert.match(sessionAfterHtml, /data-presentation-mode="floating"/);
  assert.equal(MT.structHash(ws.live), changedHash, "observing the changed value through either presentation must not add state");

  const levelRollback = MT.rollback(ws, levelReceipt.rollback_token);
  assert.ok(levelRollback.ok && levelRollback.exact);
  assert.equal(MT.structHash(ws.live), interfaceHash, "rolling back the canonical write must preserve the Interface matter");
  assertRenderedLevel(MT, ws, undefined, 3);
  assertRenderedLevel(MT, ws, host, 3);

  const interfaceRollback = MT.rollback(ws, interfaceReceipt.rollback_token);
  assert.ok(interfaceRollback.ok && interfaceRollback.exact);
  assert.equal(MT.structHash(ws.live), initialHash);
});

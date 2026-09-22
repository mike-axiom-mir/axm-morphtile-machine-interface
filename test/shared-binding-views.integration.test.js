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

test("repeated readout, control and action views share one target capability per authority namespace", { skip: !corePath }, () => {
  assertPinnedRuntime();
  const MT = require(path.resolve(corePath));
  const ws = MT.createWorkspace(MT.seedWorld());
  const beforeHash = MT.structHash(ws.live);
  const beforeTower = ws.live.tiles.mt_tower;
  const beforeParams = JSON.stringify(beforeTower.params);
  const beforeLogic = JSON.stringify(beforeTower.facets.logic);
  const beforeLevels = MT.paramValue(beforeTower, beforeTower.params.find((param) => param.id === "levels"));

  const out = run({
    envelope_version: "0.1",
    request_id: "shared-binding-views",
    goal: "Render repeated views over one readout, one parameter and one input action without multiplying target authority",
    canonical_state: { forbidden_snapshot: { levels: beforeLevels, marker: "must-not-copy" } },
    intent: {
      tile_path: "mt_tower",
      title: "Shared binding views",
      elements: [
        { kind: "readout", binding: "beacon", label: "Beacon primary" },
        { kind: "readout", binding: "beacon", label: "Beacon secondary" },
        { kind: "control", binding: "levels", label: "Levels quick" },
        { kind: "control", binding: "levels", label: "Levels detailed" },
        { kind: "action", binding: "toggle", label: "Toggle primary" },
        { kind: "action", binding: "toggle", label: "Toggle secondary" }
      ],
      bindings: {
        readouts: ["beacon"],
        controls: ["levels"],
        actions: ["toggle"]
      }
    },
    provenance: { caller: "shared-binding-views-proof" }
  });

  assert.equal(out.status, "CANDIDATE", JSON.stringify(out.holds));
  assert.deepEqual(out.dependencies[0].requires, {
    tile_exists: true,
    form_hints_include: ["ui_panel"],
    readout_logic_vars: ["beacon"],
    control_param_ids: ["levels"],
    action_input_signal_socket_ids: ["toggle"]
  });
  assert.equal(out.candidate.operation.view.body.length, 6);
  assert.equal(JSON.stringify(out.candidate).includes("must-not-copy"), false);

  const candidate = MT.cloneBody(ws, "ai", "ai:interface-machine");
  const edited = MT.editCandidate(ws, candidate, out.candidate.operation);
  assert.ok(edited.ok, edited.error);
  const plan = MT.planMerge(ws, [candidate]);
  assert.equal(plan.status, "READY");
  const committed = MT.commitPlan(ws, plan.id);
  assert.ok(committed.ok);

  const afterTower = ws.live.tiles.mt_tower;
  assert.equal(JSON.stringify(afterTower.params), beforeParams, "repeated controls must not rewrite target parameter definitions");
  assert.equal(JSON.stringify(afterTower.facets.logic), beforeLogic, "repeated readout/action views must not rewrite target logic authority");
  assert.equal(MT.paramValue(afterTower, afterTower.params.find((param) => param.id === "levels")), beforeLevels);

  const html = MT.vnodeToHTML(MT.compilePanel(ws.live).root);
  assert.equal(occurrences(html, 'data-param="mt_tower:levels"'), 2, "one canonical parameter should support two authored controls");
  assert.equal(occurrences(html, 'data-signal="mt_tower:toggle"'), 2, "one exposed input action should support two authored buttons");
  for (const label of ["Beacon primary", "Beacon secondary", "Levels quick", "Levels detailed", "Toggle primary", "Toggle secondary"]) {
    assert.match(html, new RegExp(label));
  }

  const rollback = MT.rollback(ws, committed.receipt.rollback_token);
  assert.ok(rollback.ok && rollback.exact);
  assert.equal(MT.structHash(ws.live), beforeHash);
});

"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const manifest = require("../machine.json");
const integrationSources = require("../fixtures/integration-sources.json");
const { run: authorInterface } = require("../src");

const assemblyPath = process.env.MORPHTILE_ASSEMBLY;
const assemblyCommit = process.env.MORPHTILE_ASSEMBLY_COMMIT;
const corePath = process.env.MORPHTILE_CORE;
const coreCommit = process.env.MORPHTILE_COMMIT;

function request(requestId, readout, control, action) {
  return {
    envelope_version: "0.1",
    request_id: requestId,
    goal: "Prove Interface binding names receive only their declared target authority class",
    intent: {
      tile_path: "mt_tower",
      title: "Binding namespace proof",
      elements: [
        { kind: "readout", binding: readout, label: "Readout" },
        { kind: "control", binding: control, label: "Control" },
        { kind: "action", binding: action, label: "Action" }
      ],
      bindings: {
        readouts: [readout],
        controls: [control],
        actions: [action]
      }
    },
    provenance: { caller: "interface-binding-namespace-integration" }
  };
}

test("staged target proof keeps readout, control and action authority namespaces disjoint", { skip: !assemblyPath || !corePath }, () => {
  assert.equal(assemblyCommit, integrationSources.assembly.commit, "CI Assembly checkout must match fixtures/integration-sources.json");
  assert.equal(coreCommit, manifest.tested_against.commit, "CI MorphTile checkout must match machine.json tested_against.commit");

  const MT = require(path.resolve(corePath));
  const { resolveInterfaceTargetProof } = require(path.resolve(assemblyPath, "kit"));
  const world = MT.seedWorld();
  const tower = world.tiles.mt_tower;
  const targetBinding = { id: "mt_tower", path: "mt_tower" };

  const valid = authorInterface(request("binding-namespace-valid", "beacon", "levels", "toggle"));
  assert.equal(valid.status, "CANDIDATE", JSON.stringify(valid.holds));
  assert.deepEqual(valid.dependencies[0].requires, {
    tile_exists: true,
    form_hints_include: ["ui_panel"],
    readout_logic_vars: ["beacon"],
    control_param_ids: ["levels"],
    action_input_signal_socket_ids: ["toggle"]
  });

  const validReceipt = resolveInterfaceTargetProof(valid.dependencies[0], tower, targetBinding, MT, world);
  assert.equal(validReceipt.status, "SATISFIED", JSON.stringify(validReceipt));
  assert.deepEqual(validReceipt.proven.readout_logic_vars, ["beacon"]);
  assert.deepEqual(validReceipt.proven.control_param_ids, ["levels"]);
  assert.deepEqual(validReceipt.proven.action_input_signal_socket_ids, ["toggle"]);

  // Every requested name below exists on mt_tower, but in the wrong authority
  // namespace: levels is a parameter, beacon is a logic variable, and lit is an
  // output signal socket. Existence anywhere on the tile must not cross-authorize
  // it as a readout, control, or action respectively.
  const crossed = authorInterface(request("binding-namespace-crossed", "levels", "beacon", "lit"));
  assert.equal(crossed.status, "CANDIDATE", JSON.stringify(crossed.holds));
  assert.deepEqual(crossed.dependencies[0].requires, {
    tile_exists: true,
    form_hints_include: ["ui_panel"],
    readout_logic_vars: ["levels"],
    control_param_ids: ["beacon"],
    action_input_signal_socket_ids: ["lit"]
  });

  const crossedReceipt = resolveInterfaceTargetProof(crossed.dependencies[0], tower, targetBinding, MT, world);
  assert.equal(crossedReceipt.status, "UNSATISFIED", JSON.stringify(crossedReceipt));
  assert.equal(crossedReceipt.proof_scope, "staged_morphtile_world");
  assert.deepEqual(crossedReceipt.missing, {
    readout_logic_vars: ["levels"],
    control_param_ids: ["beacon"],
    action_input_signal_socket_ids: ["lit"]
  });
});

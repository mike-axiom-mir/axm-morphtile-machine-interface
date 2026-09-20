"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { run: authorInterface } = require("../src");

const assemblyPath = process.env.MORPHTILE_ASSEMBLY;
const assemblyCommit = process.env.MORPHTILE_ASSEMBLY_COMMIT;
const corePath = process.env.MORPHTILE_CORE;
const coreCommit = process.env.MORPHTILE_COMMIT;
const EXPECTED_ASSEMBLY_COMMIT = "052e1618e499102e816ee537d16c0550e6942721";
const EXPECTED_MORPHTILE_COMMIT = "d2d2df0e4ad88f1cda885e3eb1394151515e7946";

function request(id, goal, intent) {
  return {
    envelope_version: "0.1",
    request_id: id,
    goal,
    intent,
    provenance: { caller: "interface-assembly-dependency-integration" }
  };
}

function uiEligibility() {
  return {
    candidate: {
      schema: "morphtile.tile-spec/v0.4",
      form_hints: ["ui_panel"],
      facets: {}
    },
    provenance: { caller: "explicit-ui-eligibility" }
  };
}

function interfaceCandidate() {
  return authorInterface(request(
    "interface-proof-source",
    "Author a nested interface with explicit target-local proof requirements",
    {
      tile_path: "mt_shell/mt_inner",
      title: "Receiver proof",
      elements: [
        { kind: "readout", binding: "count", label: "Count" },
        { kind: "action", binding: "increment", label: "Increment" }
      ],
      bindings: {
        readouts: ["count"],
        actions: ["increment"],
        controls: []
      }
    }
  ));
}

function towerInterface(action) {
  return authorInterface(request(
    "interface-proof-tower-" + action,
    "Author canonical tower controls while keeping action authority receiver-proven",
    {
      tile_path: "mt_tower",
      title: "Tower authority proof",
      elements: [
        { kind: "control", binding: "levels", label: "Levels" },
        { kind: "action", binding: action, label: "Action" }
      ],
      bindings: { readouts: [], controls: ["levels"], actions: [action] }
    }
  ));
}

function assembleWith(assemble, inputs, id) {
  return assemble({
    envelope_version: "0.1",
    request_id: id,
    goal: "Fold nested Interface matter while retaining target-local proof obligations",
    intent: { id: "mt_inner", tile_path: "mt_shell/mt_inner", name: "Nested receiver proof" },
    inputs: [uiEligibility(), ...inputs],
    provenance: { caller: "interface-assembly-dependency-integration" }
  });
}

test("exact Assembly receiver preserves Interface target proofs and binds them into closure identity", { skip: !assemblyPath }, () => {
  assert.equal(assemblyCommit, EXPECTED_ASSEMBLY_COMMIT, "CI Assembly checkout must match the exact proven candidate head");
  const { run: assemble } = require(path.resolve(assemblyPath));
  const interfaceOut = interfaceCandidate();

  assert.equal(interfaceOut.status, "CANDIDATE", JSON.stringify(interfaceOut.holds));
  assert.deepEqual(interfaceOut.dependencies.map((dependency) => dependency.id), [
    "morphtile.interface-target-proof:mt_shell/mt_inner"
  ]);

  const combined = assembleWith(assemble, [interfaceOut], "assembly-proof-retention");
  assert.equal(combined.status, "CANDIDATE", JSON.stringify(combined.holds));
  assert.deepEqual(combined.target_binding, { id: "mt_inner", path: "mt_shell/mt_inner" });
  assert.deepEqual(combined.dependencies, interfaceOut.dependencies);
  assert.equal(combined.closure_hash.scope, "candidate+dependencies+world_requirements");
});

test("stable proof identity makes contradictory requirements HOLD instead of coexisting opaquely", { skip: !assemblyPath }, () => {
  assert.equal(assemblyCommit, EXPECTED_ASSEMBLY_COMMIT, "CI Assembly checkout must match the exact proven candidate head");
  const { run: assemble } = require(path.resolve(assemblyPath));
  const original = interfaceCandidate();
  const contradicted = JSON.parse(JSON.stringify(original));
  contradicted.request_id = "interface-proof-contradicted";
  contradicted.dependencies[0].requires.action_input_signal_socket_ids = ["different_action"];

  const combined = assembleWith(assemble, [original, contradicted], "assembly-proof-conflict");
  assert.equal(combined.status, "HOLD");
  const hold = combined.holds.find((item) => item.code === "HOLD_DEPENDENCY_CONFLICT");
  assert.ok(hold, JSON.stringify(combined.holds));
  assert.equal(hold.identity, "id:morphtile.interface-target-proof:mt_shell/mt_inner");
});

test("current staged receiver proves only canonical input-signal action authority", { skip: !assemblyPath || !corePath }, () => {
  assert.equal(assemblyCommit, EXPECTED_ASSEMBLY_COMMIT, "CI Assembly checkout must match the exact staged-proof candidate head");
  assert.equal(coreCommit, EXPECTED_MORPHTILE_COMMIT, "CI MorphTile checkout must match the exact proven runtime head");

  const MT = require(path.resolve(corePath));
  const { resolveInterfaceTargetProof } = require(path.resolve(assemblyPath, "kit"));
  const world = MT.seedWorld();
  const tower = world.tiles.mt_tower;

  const valid = towerInterface("toggle");
  assert.equal(valid.status, "CANDIDATE", JSON.stringify(valid.holds));
  assert.deepEqual(valid.dependencies[0].requires, {
    tile_exists: true,
    form_hints_include: ["ui_panel"],
    readout_logic_vars: [],
    control_param_ids: ["levels"],
    action_input_signal_socket_ids: ["toggle"]
  });

  const validReceipt = resolveInterfaceTargetProof(
    valid.dependencies[0],
    tower,
    { id: "mt_tower", path: "mt_tower" },
    MT,
    world
  );
  assert.equal(validReceipt.status, "SATISFIED", JSON.stringify(validReceipt));
  assert.equal(validReceipt.proof_scope, "staged_morphtile_world");
  assert.deepEqual(validReceipt.proven.action_input_signal_socket_ids, ["toggle"]);
  assert.deepEqual(validReceipt.proven.control_param_ids, ["levels"]);

  const outputOnly = towerInterface("lit");
  assert.equal(outputOnly.status, "CANDIDATE", JSON.stringify(outputOnly.holds));
  assert.deepEqual(outputOnly.dependencies[0].requires.action_input_signal_socket_ids, ["lit"]);

  const outputReceipt = resolveInterfaceTargetProof(
    outputOnly.dependencies[0],
    tower,
    { id: "mt_tower", path: "mt_tower" },
    MT,
    world
  );
  assert.equal(outputReceipt.status, "UNSATISFIED", JSON.stringify(outputReceipt));
  assert.equal(outputReceipt.proof_scope, "staged_morphtile_world");
  assert.deepEqual(outputReceipt.missing, { action_input_signal_socket_ids: ["lit"] });
});

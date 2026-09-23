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
const EXPECTED_ASSEMBLY_COMMIT = integrationSources.assembly.commit;
const EXPECTED_MORPHTILE_COMMIT = manifest.tested_against.commit;

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

function canonicalTitleInterfaceCandidate() {
  return authorInterface(request(
    "interface-canonical-title-proof-source",
    "Author one canonical-state title while preserving target-owned read authority",
    {
      tile_path: "mt_shell/mt_inner",
      title_binding: "count",
      elements: [{ kind: "text", text: "Receiver title proof" }],
      bindings: { readouts: ["count"] }
    }
  ));
}

function placedInterfaceCandidate() {
  return authorInterface(request(
    "interface-presentation-proof-source",
    "Author exact current presentation matter while preserving receiver-owned defaults",
    {
      tile_path: "mt_shell/mt_inner",
      title: "Receiver presentation proof",
      elements: [{ kind: "text", text: "Placement proof" }],
      placement: {
        mode: "docked",
        preferred_position: [0, 0],
        user_adjustable: false
      }
    }
  ));
}

function portablePlacedInterfaceCandidate() {
  return authorInterface(request(
    "interface-portable-presentation-proof-source",
    "Author a root-local Interface specimen that must survive receiver application",
    {
      tile_path: "mt_receiver_panel",
      title: "Portable receiver proof",
      elements: [{ kind: "text", text: "Receiver application proof" }],
      placement: {
        mode: "docked",
        preferred_position: [0, 0],
        user_adjustable: false
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

function assemblePortableWith(assemble, inputs, id) {
  return assemble({
    envelope_version: "0.1",
    request_id: id,
    goal: "Fold portable root-local Interface matter and prove receiver application",
    intent: { id: "mt_receiver_panel", tile_path: "mt_receiver_panel", name: "Portable receiver proof" },
    inputs: [uiEligibility(), ...inputs],
    provenance: { caller: "interface-assembly-receiver-application-integration" }
  });
}

test("exact Assembly receiver preserves Interface target proofs and binds them into closure identity", { skip: !assemblyPath }, () => {
  assert.equal(assemblyCommit, EXPECTED_ASSEMBLY_COMMIT, "CI Assembly checkout must match fixtures/integration-sources.json");
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

test("current Assembly receiver preserves canonical title expression and its readout proof", { skip: !assemblyPath }, () => {
  assert.equal(assemblyCommit, EXPECTED_ASSEMBLY_COMMIT, "CI Assembly checkout must match fixtures/integration-sources.json");
  const { run: assemble } = require(path.resolve(assemblyPath));
  const interfaceOut = canonicalTitleInterfaceCandidate();

  assert.equal(interfaceOut.status, "CANDIDATE", JSON.stringify(interfaceOut.holds));
  assert.deepEqual(interfaceOut.candidate.operation.view.title, ["var", "count"]);
  assert.deepEqual(interfaceOut.dependencies[0].requires.readout_logic_vars, ["count"]);

  const combined = assembleWith(assemble, [interfaceOut], "assembly-canonical-title-retention");
  assert.equal(combined.status, "CANDIDATE", JSON.stringify(combined.holds));
  assert.deepEqual(combined.candidate.view.title, ["var", "count"]);
  assert.deepEqual(combined.dependencies, interfaceOut.dependencies);
});

test("current Assembly receiver folds exact Interface v0.5 presentation omission plus false and zero values", { skip: !assemblyPath }, () => {
  assert.equal(assemblyCommit, EXPECTED_ASSEMBLY_COMMIT, "CI Assembly checkout must match fixtures/integration-sources.json");
  const { run: assemble } = require(path.resolve(assemblyPath));
  const interfaceOut = placedInterfaceCandidate();

  assert.equal(interfaceOut.status, "CANDIDATE", JSON.stringify(interfaceOut.holds));
  assert.equal(interfaceOut.candidate.schema, "morphtile.interface-operations/v0.5");
  const presentation = interfaceOut.candidate.operations[1].presentation;
  assert.deepEqual(presentation, {
    mode: "docked",
    preferred_position: [0, 0],
    user_adjustable: false
  });
  assert.equal(Object.prototype.hasOwnProperty.call(presentation, "dock"), false, "omitted dock must remain receiver-owned omission");

  const combined = assembleWith(assemble, [interfaceOut], "assembly-presentation-contract");
  assert.equal(combined.status, "CANDIDATE", JSON.stringify(combined.holds));
  assert.deepEqual(combined.candidate.presentation, presentation);
  assert.deepEqual(combined.dependencies, interfaceOut.dependencies);
});

test("exact Assembly receiver applies a real Interface kit through the pinned MorphTile runtime", { skip: !assemblyPath || !corePath }, () => {
  assert.equal(assemblyCommit, EXPECTED_ASSEMBLY_COMMIT, "CI Assembly checkout must match fixtures/integration-sources.json");
  assert.equal(coreCommit, EXPECTED_MORPHTILE_COMMIT, "CI MorphTile checkout must match machine.json tested_against.commit");

  const MT = require(path.resolve(corePath));
  const { run: assemble } = require(path.resolve(assemblyPath));
  const { materializeKit } = require(path.resolve(assemblyPath, "kit"));
  const interfaceOut = portablePlacedInterfaceCandidate();

  assert.equal(interfaceOut.status, "CANDIDATE", JSON.stringify(interfaceOut.holds));
  const expectedPresentation = interfaceOut.candidate.operations[1].presentation;
  assert.deepEqual(expectedPresentation, {
    mode: "docked",
    preferred_position: [0, 0],
    user_adjustable: false
  });
  assert.equal(Object.prototype.hasOwnProperty.call(expectedPresentation, "dock"), false);

  const combined = assemblePortableWith(assemble, [interfaceOut], "assembly-interface-kit-application");
  assert.equal(combined.status, "CANDIDATE", JSON.stringify(combined.holds));
  assert.deepEqual(combined.candidate.presentation, expectedPresentation);

  const materialized = materializeKit(combined, MT, { name: "Interface receiver application proof" });
  assert.equal(materialized.status, "CANDIDATE", JSON.stringify(materialized.holds));
  assert.deepEqual(materialized.kit.tile.presentation, expectedPresentation);
  assert.deepEqual(materialized.kit.tile.view, combined.candidate.view);
  assert.deepEqual(materialized.dependency_resolution.map((receipt) => receipt.status), ["SATISFIED"]);
  const applyEvidence = materialized.evidence.find((item) => item.kind === "KIT_APPLY");
  assert.ok(applyEvidence, JSON.stringify(materialized.evidence));
  assert.equal(applyEvidence.status, "PASS");
  assert.match(applyEvidence.check, /^all \d+ READY import operations executed in order against the isolated fresh receiver$/);
  const closureEvidence = materialized.evidence.find((item) => item.kind === "KIT_RECEIVER_CLOSURE");
  assert.ok(closureEvidence, JSON.stringify(materialized.evidence));
  assert.equal(closureEvidence.status, "PASS");
  assert.match(closureEvidence.check, /^all \d+ READY operation postconditions are present exactly in the isolated fresh receiver; plan [0-9a-f]{64}$/);
  assert.deepEqual(materialized.holds, []);
});

test("stable proof identity makes contradictory requirements HOLD instead of coexisting opaquely", { skip: !assemblyPath }, () => {
  assert.equal(assemblyCommit, EXPECTED_ASSEMBLY_COMMIT, "CI Assembly checkout must match fixtures/integration-sources.json");
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
  assert.equal(assemblyCommit, EXPECTED_ASSEMBLY_COMMIT, "CI Assembly checkout must match fixtures/integration-sources.json");
  assert.equal(coreCommit, EXPECTED_MORPHTILE_COMMIT, "CI MorphTile checkout must match machine.json tested_against.commit");

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
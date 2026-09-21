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

function request(id, intent) {
  return {
    envelope_version: "0.1",
    request_id: id,
    goal: "Prove current Assembly import-plan coverage with real Interface matter",
    intent,
    provenance: { caller: "interface-assembly-plan-coverage-integration" }
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

function isPlainMap(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

test("current Assembly proves READY plan coverage for a real Interface-authored view and presentation", { skip: !assemblyPath || !corePath }, () => {
  assert.equal(assemblyCommit, integrationSources.assembly.commit, "CI Assembly checkout must match fixtures/integration-sources.json");
  assert.equal(coreCommit, manifest.tested_against.commit, "CI MorphTile checkout must match machine.json tested_against.commit");

  const MT = require(path.resolve(corePath));
  const { run: assemble } = require(path.resolve(assemblyPath));
  const { materializeKit } = require(path.resolve(assemblyPath, "kit"));

  const interfaceOut = authorInterface(request("interface-plan-coverage-source", {
    tile_path: "mt_receiver_panel",
    title: "Import plan coverage proof",
    elements: [{ kind: "text", text: "Plan coverage" }],
    placement: {
      mode: "docked",
      preferred_position: [0, 0],
      user_adjustable: false
    }
  }));

  assert.equal(interfaceOut.status, "CANDIDATE", JSON.stringify(interfaceOut.holds));
  const expectedPresentation = interfaceOut.candidate.operations[1].presentation;
  assert.deepEqual(expectedPresentation, {
    mode: "docked",
    preferred_position: [0, 0],
    user_adjustable: false
  });
  assert.equal(Object.prototype.hasOwnProperty.call(expectedPresentation, "dock"), false);

  const combined = assemble({
    envelope_version: "0.1",
    request_id: "interface-plan-coverage-assembly",
    goal: "Fold root-local Interface matter without changing structured containers",
    intent: {
      id: "mt_receiver_panel",
      tile_path: "mt_receiver_panel",
      name: "Import plan coverage proof"
    },
    inputs: [uiEligibility(), interfaceOut],
    provenance: { caller: "interface-assembly-plan-coverage-integration" }
  });

  assert.equal(combined.status, "CANDIDATE", JSON.stringify(combined.holds));
  assert.equal(isPlainMap(combined.candidate.view), true, "Interface-authored view must remain a plain structured container");
  assert.equal(isPlainMap(combined.candidate.presentation), true, "Interface-authored presentation must remain a plain structured container");
  assert.deepEqual(combined.candidate.presentation, expectedPresentation);

  const materialized = materializeKit(combined, MT, { name: "Interface import plan coverage proof" });
  assert.equal(materialized.status, "CANDIDATE", JSON.stringify(materialized.holds));
  assert.deepEqual(materialized.kit.tile.view, combined.candidate.view);
  assert.deepEqual(materialized.kit.tile.presentation, expectedPresentation);

  const coverageEvidence = materialized.evidence.find((item) => item.kind === "KIT_IMPORT_PLAN_COVERAGE");
  assert.ok(coverageEvidence, JSON.stringify(materialized.evidence));
  assert.equal(coverageEvidence.status, "PASS");
  assert.match(
    coverageEvidence.check,
    /^READY plan [0-9a-f]{64} covers every declared kit word, definition, and root tile exactly once unless the runtime proved the named word\/definition already existed compatibly before planning$/
  );

  const applyEvidence = materialized.evidence.find((item) => item.kind === "KIT_APPLY");
  const closureEvidence = materialized.evidence.find((item) => item.kind === "KIT_RECEIVER_CLOSURE");
  assert.equal(applyEvidence && applyEvidence.status, "PASS");
  assert.equal(closureEvidence && closureEvidence.status, "PASS");
  assert.deepEqual(materialized.holds, []);
});

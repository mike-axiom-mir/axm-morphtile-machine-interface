const test = require("node:test");
const assert = require("node:assert/strict");
const { run } = require("../src");

const base = {
  envelope_version: "0.1",
  request_id: "equality-conditional",
  goal: "Show interface matter when canonical state exactly matches an authored scalar",
  provenance: { caller: "equality-conditional-test" }
};

function intent(comparison = "equals", expected = "ready") {
  return {
    tile_path: "mt_tower",
    title: "Phase state",
    elements: [{
      kind: "when",
      binding: "phase",
      comparison,
      expected,
      children: [{ kind: "text", text: "Matching state" }]
    }],
    bindings: { readouts: ["phase"] }
  };
}

test("bounded equality visibility compiles scalar matches to native MorphTile equality expressions", () => {
  const cases = [
    ["equals", "==", "ready"],
    ["not_equals", "!=", false],
    ["equals", "==", 3],
    ["equals", "==", null]
  ];
  for (const [comparison, op, expected] of cases) {
    const out = run({ ...base, request_id: "equality-" + comparison + "-" + String(expected), intent: intent(comparison, expected) });
    assert.equal(out.status, "CANDIDATE");
    assert.deepEqual(out.candidate.operation.view.body, [{
      group: [{ text: "Matching state" }],
      when: [op, ["var", "phase"], expected]
    }]);
    assert.deepEqual(out.dependencies[0].requires.readout_logic_vars, ["phase"]);
  }
});

test("equality comparison is an all-or-nothing bounded scalar contract", () => {
  const invalid = [
    { comparison: "equals" },
    { expected: "ready" },
    { comparison: "equals", threshold: 1, expected: "ready" },
    { comparison: "above", expected: 1 },
    { comparison: "equals", expected: { phase: "ready" } },
    { comparison: "equals", expected: ["ready"] }
  ];
  for (const patch of invalid) {
    const element = { kind: "when", binding: "phase", children: [{ kind: "text", text: "No" }], ...patch };
    const out = run({
      ...base,
      request_id: "equality-invalid-" + JSON.stringify(patch),
      intent: { tile_path: "mt_tower", elements: [element], bindings: { readouts: ["phase"] } }
    });
    assert.equal(out.status, "HOLD");
    assert.equal(out.holds[0].code, "HOLD_INTERFACE_ELEMENT_INVALID");
    assert.equal(out.candidate, null);
  }
});

test("numeric threshold and truthy conditions remain separate backward-compatible contracts", () => {
  const threshold = run({
    ...base,
    request_id: "equality-threshold-compatible",
    intent: {
      tile_path: "mt_tower",
      elements: [{ kind: "when", binding: "beacon", comparison: "at_least", threshold: 1, children: [{ kind: "text", text: "On" }] }],
      bindings: { readouts: ["beacon"] }
    }
  });
  assert.equal(threshold.status, "CANDIDATE");
  assert.deepEqual(threshold.candidate.operation.view.body[0].when, [">=", ["var", "beacon"], 1]);

  const truthy = run({
    ...base,
    request_id: "equality-truthy-compatible",
    intent: {
      tile_path: "mt_tower",
      elements: [{ kind: "when", binding: "beacon", children: [{ kind: "text", text: "On" }] }],
      bindings: { readouts: ["beacon"] }
    }
  });
  assert.equal(truthy.status, "CANDIDATE");
  assert.deepEqual(truthy.candidate.operation.view.body[0].when, ["var", "beacon"]);
});

const test = require("node:test");
const assert = require("node:assert/strict");
const { run } = require("../src");

const base = {
  envelope_version: "0.1",
  request_id: "threshold-conditional",
  goal: "Show interface matter only when canonical numeric state crosses an authored threshold",
  provenance: { caller: "threshold-conditional-test" }
};

function intent(comparison = "at_least", threshold = 0.5) {
  return {
    tile_path: "mt_tower",
    title: "Beacon threshold",
    elements: [{
      kind: "when",
      binding: "beacon",
      comparison,
      threshold,
      children: [{ kind: "text", text: "Threshold reached" }]
    }],
    bindings: { readouts: ["beacon"] }
  };
}

test("bounded threshold visibility compiles to native MorphTile comparison expressions", () => {
  const cases = [
    ["above", ">"],
    ["at_least", ">="],
    ["below", "<"],
    ["at_most", "<="]
  ];
  for (const [comparison, op] of cases) {
    const out = run({ ...base, request_id: "threshold-" + comparison, intent: intent(comparison, 0.5) });
    assert.equal(out.status, "CANDIDATE");
    assert.deepEqual(out.candidate.operation.view.body, [{
      group: [{ text: "Threshold reached" }],
      when: [op, ["var", "beacon"], 0.5]
    }]);
    assert.deepEqual(out.dependencies[0].requires.readout_logic_vars, ["beacon"]);
  }
});

test("truthy when remains backward compatible when no threshold contract is authored", () => {
  const out = run({
    ...base,
    request_id: "truthy-still-valid",
    intent: {
      tile_path: "mt_tower",
      elements: [{ kind: "when", binding: "beacon", children: [{ kind: "text", text: "On" }] }],
      bindings: { readouts: ["beacon"] }
    }
  });
  assert.equal(out.status, "CANDIDATE");
  assert.deepEqual(out.candidate.operation.view.body[0].when, ["var", "beacon"]);
});

test("threshold comparison is an all-or-nothing bounded contract", () => {
  const invalid = [
    { comparison: "at_least" },
    { threshold: 0.5 },
    { comparison: "equal", threshold: 0.5 },
    { comparison: "above", threshold: "0.5" }
  ];
  for (const patch of invalid) {
    const element = { kind: "when", binding: "beacon", children: [{ kind: "text", text: "No" }], ...patch };
    const out = run({
      ...base,
      request_id: "threshold-invalid-" + JSON.stringify(patch),
      intent: { tile_path: "mt_tower", elements: [element], bindings: { readouts: ["beacon"] } }
    });
    assert.equal(out.status, "HOLD");
    assert.equal(out.holds[0].code, "HOLD_INTERFACE_ELEMENT_INVALID");
    assert.equal(out.candidate, null);
  }
});

test("threshold comparison keeps state authority symbolic and rejects snapshot-shaped extras", () => {
  const out = run({
    ...base,
    request_id: "threshold-no-state-copy",
    intent: {
      ...intent(),
      elements: [{
        kind: "when",
        binding: "beacon",
        comparison: "at_least",
        threshold: 0.5,
        state_value: 1,
        children: [{ kind: "text", text: "No snapshot" }]
      }]
    }
  });
  assert.equal(out.status, "HOLD");
  assert.equal(out.holds[0].code, "HOLD_INTERFACE_ELEMENT_FIELD_UNKNOWN");
  assert.match(out.holds[0].detail, /state_value/);
  assert.equal(out.candidate, null);
});

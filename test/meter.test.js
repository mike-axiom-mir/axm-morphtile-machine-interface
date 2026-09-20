const test = require("node:test");
const assert = require("node:assert/strict");
const { run } = require("../src");

const base = {
  envelope_version: "0.1",
  request_id: "meter",
  goal: "Create a canonical-state meter without copying state",
  provenance: { caller: "meter-test" }
};

function meterIntent(overrides = {}) {
  return {
    tile_path: "mt_tower",
    title: "Tower meter",
    elements: [{
      kind: "group",
      children: [{ kind: "meter", binding: "beacon", min: 0, max: 1, label: "Brightness" }]
    }],
    bindings: { readouts: ["beacon"] },
    ...overrides
  };
}

test("meter compiles to MorphTile native expression while binding proof stays symbolic", () => {
  const out = run({ ...base, intent: meterIntent() });

  assert.equal(out.status, "CANDIDATE");
  assert.deepEqual(out.candidate.operation.view.body, [{
    group: [{ meter: ["var", "beacon"], min: 0, max: 1, label: "Brightness" }]
  }]);
  assert.deepEqual(out.dependencies[0].requires.readout_logic_vars, ["beacon"]);
  assert.equal(out.dependencies[0].requires.control_param_ids.length, 0);
  assert.equal(out.dependencies[0].requires.action_input_signal_socket_ids.length, 0);
});

test("meter binding must be declared as a readout dependency", () => {
  const out = run({
    ...base,
    request_id: "meter-undeclared",
    intent: meterIntent({ bindings: { readouts: [] } })
  });

  assert.equal(out.status, "HOLD");
  assert.equal(out.holds[0].code, "HOLD_INVALID_INTERFACE_BINDING");
  assert.match(out.holds[0].detail, /beacon/);
  assert.equal(out.candidate, null);
});

test("meter range is explicit and bounded instead of inventing defaults", () => {
  for (const element of [
    { kind: "meter", binding: "beacon", max: 1 },
    { kind: "meter", binding: "beacon", min: 0 },
    { kind: "meter", binding: "beacon", min: 1, max: 1 },
    { kind: "meter", binding: "beacon", min: 2, max: 1 }
  ]) {
    const out = run({
      ...base,
      request_id: "meter-invalid-range",
      intent: {
        tile_path: "mt_tower",
        elements: [element],
        bindings: { readouts: ["beacon"] }
      }
    });
    assert.equal(out.status, "HOLD");
    assert.equal(out.holds[0].code, "HOLD_INTERFACE_ELEMENT_INVALID");
    assert.equal(out.candidate, null);
  }
});

test("meter rejects authority-shaped extras instead of smuggling state", () => {
  const out = run({
    ...base,
    request_id: "meter-state-smuggle",
    intent: {
      tile_path: "mt_tower",
      elements: [{ kind: "meter", binding: "beacon", min: 0, max: 1, state_value: 1 }],
      bindings: { readouts: ["beacon"] }
    }
  });

  assert.equal(out.status, "HOLD");
  assert.equal(out.holds[0].code, "HOLD_INTERFACE_ELEMENT_FIELD_UNKNOWN");
  assert.match(out.holds[0].detail, /state_value/);
  assert.equal(out.candidate, null);
});

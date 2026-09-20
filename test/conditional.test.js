const test = require("node:test");
const assert = require("node:assert/strict");
const { run } = require("../src");

const base = {
  envelope_version: "0.1",
  request_id: "conditional",
  goal: "Show interface matter only while canonical state is truthy",
  provenance: { caller: "conditional-test" }
};

function conditionalIntent(overrides = {}) {
  return {
    tile_path: "mt_tower",
    title: "Tower state",
    elements: [{
      kind: "when",
      binding: "beacon",
      children: [
        { kind: "text", text: "Beacon active" },
        { kind: "action", binding: "toggle", label: "Turn off" }
      ]
    }],
    bindings: { readouts: ["beacon"], actions: ["toggle"] },
    ...overrides
  };
}

test("when compiles to native MorphTile conditional group and preserves target proof obligations", () => {
  const out = run({ ...base, intent: conditionalIntent() });

  assert.equal(out.status, "CANDIDATE");
  assert.deepEqual(out.candidate.operation.view.body, [{
    group: [
      { text: "Beacon active" },
      { button: "toggle", label: "Turn off" }
    ],
    when: ["var", "beacon"]
  }]);
  assert.deepEqual(out.dependencies[0].requires.readout_logic_vars, ["beacon"]);
  assert.deepEqual(out.dependencies[0].requires.action_input_signal_socket_ids, ["toggle"]);
  assert.equal(out.dependencies[0].requires.control_param_ids.length, 0);
});

test("when binding must be declared through the existing symbolic state-read proof lane", () => {
  const out = run({
    ...base,
    request_id: "conditional-undeclared",
    intent: conditionalIntent({ bindings: { readouts: [], actions: ["toggle"] } })
  });

  assert.equal(out.status, "HOLD");
  assert.equal(out.holds[0].code, "HOLD_INVALID_INTERFACE_BINDING");
  assert.match(out.holds[0].detail, /beacon/);
  assert.equal(out.candidate, null);
});

test("when requires non-empty children and a string binding", () => {
  for (const element of [
    { kind: "when", binding: "beacon", children: [] },
    { kind: "when", binding: 1, children: [{ kind: "text", text: "bad" }] }
  ]) {
    const out = run({
      ...base,
      request_id: "conditional-invalid",
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

test("when rejects authority-shaped extras instead of smuggling a copied condition value", () => {
  const out = run({
    ...base,
    request_id: "conditional-state-smuggle",
    intent: {
      tile_path: "mt_tower",
      elements: [{
        kind: "when",
        binding: "beacon",
        state_value: 1,
        children: [{ kind: "text", text: "Beacon active" }]
      }],
      bindings: { readouts: ["beacon"] }
    }
  });

  assert.equal(out.status, "HOLD");
  assert.equal(out.holds[0].code, "HOLD_INTERFACE_ELEMENT_FIELD_UNKNOWN");
  assert.match(out.holds[0].detail, /state_value/);
  assert.equal(out.candidate, null);
});

test("when participates in the same recursive depth and node budgets as row/group", () => {
  let node = { kind: "text", text: "deep" };
  for (let i = 0; i < 7; i += 1) node = { kind: "when", binding: "beacon", children: [node] };
  const out = run({
    ...base,
    request_id: "conditional-too-deep",
    intent: {
      tile_path: "mt_tower",
      elements: [node],
      bindings: { readouts: ["beacon"] }
    }
  });

  assert.equal(out.status, "HOLD");
  assert.equal(out.holds[0].code, "HOLD_INTERFACE_LAYOUT_TOO_DEEP");
  assert.equal(out.candidate, null);
});

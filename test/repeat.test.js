const test = require("node:test");
const assert = require("node:assert/strict");
const { run } = require("../src");

const base = {
  envelope_version: "0.1",
  request_id: "repeat",
  goal: "Repeat bounded interface matter from canonical state without copying it",
  provenance: { caller: "repeat-test" }
};

function repeatIntent(overrides = {}) {
  return {
    tile_path: "mt_tower",
    title: "Tower repeat",
    elements: [{
      kind: "repeat",
      binding: "beacon",
      step: 1,
      max: 4,
      children: [{ kind: "text", text: "Beacon pulse" }]
    }],
    bindings: { readouts: ["beacon"] },
    ...overrides
  };
}

test("repeat compiles one bounded canonical-state count into native MorphTile repeat", () => {
  const out = run({ ...base, intent: repeatIntent() });

  assert.equal(out.status, "CANDIDATE");
  assert.deepEqual(out.candidate.operation.view.body, [{
    repeat: ["max", 0, ["min", 4, ["floor", ["/", ["var", "beacon"], 1]]]],
    as: "i",
    body: [{ text: "Beacon pulse" }]
  }]);
  assert.deepEqual(out.dependencies[0].requires.readout_logic_vars, ["beacon"]);
  assert.equal(JSON.stringify(out.candidate).includes("state_value"), false);
});

test("repeat binding must be declared through the existing symbolic state-read proof lane", () => {
  const out = run({
    ...base,
    request_id: "repeat-undeclared",
    intent: repeatIntent({ bindings: { readouts: [] } })
  });

  assert.equal(out.status, "HOLD");
  assert.equal(out.holds[0].code, "HOLD_INVALID_INTERFACE_BINDING");
  assert.match(out.holds[0].detail, /beacon/);
  assert.equal(out.candidate, null);
});

test("repeat requires positive finite step, bounded integer max and non-empty children", () => {
  for (const element of [
    { kind: "repeat", binding: "beacon", step: 0, max: 4, children: [{ kind: "text", text: "bad" }] },
    { kind: "repeat", binding: "beacon", step: -1, max: 4, children: [{ kind: "text", text: "bad" }] },
    { kind: "repeat", binding: "beacon", step: 1, max: 0, children: [{ kind: "text", text: "bad" }] },
    { kind: "repeat", binding: "beacon", step: 1, max: 17, children: [{ kind: "text", text: "bad" }] },
    { kind: "repeat", binding: "beacon", step: 1, max: 1.5, children: [{ kind: "text", text: "bad" }] },
    { kind: "repeat", binding: "beacon", step: 1, max: 4, children: [] }
  ]) {
    const out = run({
      ...base,
      request_id: "repeat-invalid",
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

test("repeat rejects authority-shaped extras instead of carrying copied state", () => {
  const out = run({
    ...base,
    request_id: "repeat-state-smuggle",
    intent: {
      tile_path: "mt_tower",
      elements: [{
        kind: "repeat",
        binding: "beacon",
        step: 1,
        max: 4,
        state_value: 4,
        children: [{ kind: "text", text: "Beacon pulse" }]
      }],
      bindings: { readouts: ["beacon"] }
    }
  });

  assert.equal(out.status, "HOLD");
  assert.equal(out.holds[0].code, "HOLD_INTERFACE_ELEMENT_FIELD_UNKNOWN");
  assert.match(out.holds[0].detail, /state_value/);
  assert.equal(out.candidate, null);
});

test("nested repeat worst-case expansion is bounded before emission", () => {
  const out = run({
    ...base,
    request_id: "repeat-expansion-budget",
    intent: {
      tile_path: "mt_tower",
      elements: [{
        kind: "repeat",
        binding: "beacon",
        step: 1,
        max: 8,
        children: [{
          kind: "repeat",
          binding: "beacon",
          step: 1,
          max: 8,
          children: [{ kind: "text", text: "bounded" }]
        }]
      }],
      bindings: { readouts: ["beacon"] }
    }
  });

  assert.equal(out.status, "HOLD");
  assert.equal(out.holds[0].code, "HOLD_INTERFACE_REPEAT_EXPANSION_TOO_LARGE");
  assert.equal(out.candidate, null);
});

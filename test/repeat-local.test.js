const test = require("node:test");
const assert = require("node:assert/strict");
const { run } = require("../src");

const base = {
  envelope_version: "0.1",
  request_id: "repeat-local",
  goal: "Render bounded repeat-local index/count values without turning them into canonical state",
  provenance: { caller: "repeat-local-test" }
};

function localIntent(children) {
  return {
    tile_path: "mt_tower",
    title: "Tower repeat locals",
    elements: [{
      kind: "repeat",
      binding: "beacon",
      step: 0.25,
      max: 3,
      children
    }],
    bindings: { readouts: ["beacon"] }
  };
}

test("repeat-local index/count compile to native lexical repeat variables only", () => {
  const out = run({
    ...base,
    intent: localIntent([
      { kind: "text", text: "slot" },
      { kind: "repeat_value", value: "index" },
      { kind: "repeat_value", value: "count" }
    ])
  });

  assert.equal(out.status, "CANDIDATE");
  assert.deepEqual(out.candidate.operation.view.body, [{
    repeat: ["max", 0, ["min", 3, ["floor", ["/", ["var", "beacon"], 0.25]]]],
    as: "i",
    body: [
      { text: "slot" },
      { text: ["var", "i"] },
      { text: ["var", "i_of"] }
    ]
  }]);
  assert.deepEqual(out.dependencies[0].requires.readout_logic_vars, ["beacon"], "repeat locals must not become target readout proof obligations");
  assert.equal(JSON.stringify(out.candidate).includes("state_value"), false);
});

test("repeat-local values HOLD outside a repeat lexical scope", () => {
  for (const value of ["index", "count"]) {
    const out = run({
      ...base,
      request_id: "repeat-local-outside-" + value,
      intent: {
        tile_path: "mt_tower",
        elements: [{ kind: "repeat_value", value }]
      }
    });
    assert.equal(out.status, "HOLD");
    assert.equal(out.holds[0].code, "HOLD_INTERFACE_REPEAT_SCOPE");
    assert.equal(out.candidate, null);
  }
});

test("repeat-local values reject unsupported values and authority-shaped extras", () => {
  for (const element of [
    { kind: "repeat_value", value: "position" },
    { kind: "repeat_value", value: 1 },
    { kind: "repeat_value", value: "index", binding: "beacon" },
    { kind: "repeat_value", value: "count", state_value: 3 }
  ]) {
    const out = run({ ...base, request_id: "repeat-local-invalid", intent: localIntent([element]) });
    assert.equal(out.status, "HOLD");
    assert.equal(out.candidate, null);
  }
});

test("nested repeat-local values bind to the nearest native repeat scope", () => {
  const out = run({
    ...base,
    request_id: "repeat-local-nested",
    intent: localIntent([{
      kind: "repeat",
      binding: "beacon",
      step: 0.5,
      max: 2,
      children: [{ kind: "repeat_value", value: "index" }, { kind: "repeat_value", value: "count" }]
    }])
  });

  assert.equal(out.status, "CANDIDATE");
  const inner = out.candidate.operation.view.body[0].body[0];
  assert.equal(inner.as, "i");
  assert.deepEqual(inner.body, [{ text: ["var", "i"] }, { text: ["var", "i_of"] }]);
  assert.deepEqual(out.dependencies[0].requires.readout_logic_vars, ["beacon"]);
});

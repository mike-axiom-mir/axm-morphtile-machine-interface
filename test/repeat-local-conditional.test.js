const test = require("node:test");
const assert = require("node:assert/strict");
const { run } = require("../src");

const base = {
  envelope_version: "0.1",
  request_id: "repeat-local-condition",
  goal: "Select bounded repeated interface matter from the nearest lexical repeat scope",
  provenance: { caller: "repeat-local-condition-test" }
};

function intent(children, max = 3) {
  return {
    tile_path: "mt_tower",
    elements: [{
      kind: "repeat",
      binding: "beacon",
      step: 0.25,
      max,
      children
    }],
    bindings: { readouts: ["beacon"] }
  };
}

test("repeat-local equality compiles to native lexical when without target state proof", () => {
  const out = run({
    ...base,
    intent: intent([
      { kind: "repeat_when", source: "index", equals: 0, children: [{ kind: "text", text: "first" }] },
      { kind: "repeat_when", source: "count", equals: 3, children: [{ kind: "text", text: "full" }] }
    ])
  });

  assert.equal(out.status, "CANDIDATE");
  assert.deepEqual(out.candidate.operation.view.body[0].body, [
    { group: [{ text: "first" }], when: ["==", ["var", "i"], 0] },
    { group: [{ text: "full" }], when: ["==", ["var", "i_of"], 3] }
  ]);
  assert.deepEqual(out.dependencies[0].requires.readout_logic_vars, ["beacon"], "repeat locals must not become canonical target-proof obligations");
});

test("repeat-local equality HOLDs outside a lexical repeat scope", () => {
  const out = run({
    ...base,
    request_id: "repeat-local-condition-outside",
    intent: {
      tile_path: "mt_tower",
      elements: [{ kind: "repeat_when", source: "index", equals: 0, children: [{ kind: "text", text: "bad" }] }]
    }
  });

  assert.equal(out.status, "HOLD");
  assert.equal(out.holds[0].code, "HOLD_INTERFACE_REPEAT_SCOPE");
  assert.equal(out.candidate, null);
});

test("repeat-local equality validates nearest repeat bounds and closed fields", () => {
  for (const element of [
    { kind: "repeat_when", source: "index", equals: -1, children: [{ kind: "text", text: "bad" }] },
    { kind: "repeat_when", source: "index", equals: 3, children: [{ kind: "text", text: "bad" }] },
    { kind: "repeat_when", source: "count", equals: 0, children: [{ kind: "text", text: "bad" }] },
    { kind: "repeat_when", source: "count", equals: 4, children: [{ kind: "text", text: "bad" }] },
    { kind: "repeat_when", source: "position", equals: 0, children: [{ kind: "text", text: "bad" }] },
    { kind: "repeat_when", source: "index", equals: 0.5, children: [{ kind: "text", text: "bad" }] },
    { kind: "repeat_when", source: "index", equals: 0, binding: "beacon", children: [{ kind: "text", text: "bad" }] }
  ]) {
    const out = run({ ...base, request_id: "repeat-local-condition-invalid", intent: intent([element]) });
    assert.equal(out.status, "HOLD");
    assert.equal(out.candidate, null);
  }
});

test("nested repeat-local equality uses the nearest repeat bound", () => {
  const out = run({
    ...base,
    request_id: "repeat-local-condition-nested",
    intent: intent([{
      kind: "repeat",
      binding: "beacon",
      step: 0.5,
      max: 2,
      children: [
        { kind: "repeat_when", source: "index", equals: 1, children: [{ kind: "text", text: "inner second" }] },
        { kind: "repeat_when", source: "count", equals: 2, children: [{ kind: "text", text: "inner full" }] }
      ]
    }])
  });

  assert.equal(out.status, "CANDIDATE");
  const inner = out.candidate.operation.view.body[0].body[0];
  assert.deepEqual(inner.body, [
    { group: [{ text: "inner second" }], when: ["==", ["var", "i"], 1] },
    { group: [{ text: "inner full" }], when: ["==", ["var", "i_of"], 2] }
  ]);
});

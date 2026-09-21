const test = require("node:test");
const assert = require("node:assert/strict");
const { run } = require("../src");

const base = {
  envelope_version: "0.1",
  request_id: "repeat-local-comparison",
  goal: "Select bounded repeated interface matter with relational lexical repeat predicates",
  provenance: { caller: "repeat-local-comparison-test" }
};

function intent(children, max = 4) {
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

test("every bounded repeat-local comparison compiles to the matching native scoped predicate without canonical-state proof", () => {
  const specs = [
    ["above", ">", 1],
    ["at_least", ">=", 1],
    ["below", "<", 2],
    ["at_most", "<=", 2],
    ["equals", "==", 1],
    ["not_equals", "!=", 1]
  ];
  const out = run({
    ...base,
    intent: intent(specs.map(([comparison, , value]) => ({
      kind: "repeat_when",
      source: "index",
      comparison,
      value,
      children: [{ kind: "text", text: comparison }]
    })))
  });

  assert.equal(out.status, "CANDIDATE");
  assert.deepEqual(
    out.candidate.operation.view.body[0].body,
    specs.map(([comparison, op, value]) => ({
      group: [{ text: comparison }],
      when: [op, ["var", "i"], value]
    }))
  );
  assert.deepEqual(out.dependencies[0].requires.readout_logic_vars, ["beacon"], "lexical comparison operands must not become canonical target-proof obligations");
});

test("repeat-local count comparison uses lexical i_of rather than canonical state", () => {
  const out = run({
    ...base,
    request_id: "repeat-local-count-comparison",
    intent: intent([{ kind: "repeat_when", source: "count", comparison: "at_least", value: 3, children: [{ kind: "text", text: "crowded" }] }])
  });

  assert.equal(out.status, "CANDIDATE");
  assert.deepEqual(out.candidate.operation.view.body[0].body[0], {
    group: [{ text: "crowded" }],
    when: [">=", ["var", "i_of"], 3]
  });
  assert.deepEqual(out.dependencies[0].requires.readout_logic_vars, ["beacon"]);
});

test("repeat-local equality shorthand stays backward compatible", () => {
  const out = run({
    ...base,
    request_id: "repeat-local-comparison-compat",
    intent: intent([{ kind: "repeat_when", source: "index", equals: 0, children: [{ kind: "text", text: "first" }] }])
  });

  assert.equal(out.status, "CANDIDATE");
  assert.deepEqual(out.candidate.operation.view.body[0].body[0].when, ["==", ["var", "i"], 0]);
});

test("repeat-local comparisons are closed, integer bounded, and cannot mix old/new operand forms", () => {
  const invalid = [
    { kind: "repeat_when", source: "index", comparison: "at_least", children: [{ kind: "text", text: "bad" }] },
    { kind: "repeat_when", source: "index", value: 1, children: [{ kind: "text", text: "bad" }] },
    { kind: "repeat_when", source: "index", comparison: "contains", value: 1, children: [{ kind: "text", text: "bad" }] },
    { kind: "repeat_when", source: "index", comparison: "below", value: 0.5, children: [{ kind: "text", text: "bad" }] },
    { kind: "repeat_when", source: "index", comparison: "below", value: 4, children: [{ kind: "text", text: "bad" }] },
    { kind: "repeat_when", source: "count", comparison: "at_least", value: 0, children: [{ kind: "text", text: "bad" }] },
    { kind: "repeat_when", source: "count", comparison: "at_least", value: 5, children: [{ kind: "text", text: "bad" }] },
    { kind: "repeat_when", source: "index", equals: 0, comparison: "equals", value: 0, children: [{ kind: "text", text: "bad" }] }
  ];

  for (const element of invalid) {
    const out = run({ ...base, request_id: "repeat-local-comparison-invalid", intent: intent([element]) });
    assert.equal(out.status, "HOLD");
    assert.equal(out.candidate, null);
  }
});

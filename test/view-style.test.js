const test = require("node:test");
const assert = require("node:assert/strict");
const { run } = require("../src");

const base = {
  envelope_version: "0.1",
  request_id: "view-style",
  goal: "Author bounded native MorphTile view styling",
  provenance: { caller: "view-style-test" }
};

function styledIntent(overrides = {}) {
  return {
    tile_path: "mt_tower",
    title: "Styled tower",
    accent: [0.2, 0.4, 0.6],
    width: 3,
    elements: [{ kind: "text", text: "Important", strong: true }],
    ...overrides
  };
}

test("bounded view styling compiles directly to native MorphTile view fields", () => {
  const out = run({ ...base, intent: styledIntent() });
  assert.equal(out.status, "CANDIDATE");
  assert.deepEqual(out.candidate.operation.view, {
    title: "Styled tower",
    accent: [0.2, 0.4, 0.6],
    width: 3,
    body: [{ text: "Important", strong: true }]
  });
  assert.deepEqual(out.dependencies[0].requires.readout_logic_vars, []);
  assert.deepEqual(out.dependencies[0].requires.control_param_ids, []);
  assert.deepEqual(out.dependencies[0].requires.action_input_signal_socket_ids, []);
});

test("accent must be a finite normalized RGB triple", () => {
  for (const accent of ["red", [0, 1], [0, 0.5, 1.1], [-0.1, 0.5, 1]]) {
    const out = run({ ...base, request_id: "bad-accent", intent: styledIntent({ accent }) });
    assert.equal(out.status, "HOLD");
    assert.equal(out.holds[0].code, "HOLD_INTERFACE_VIEW_STYLE_INVALID");
    assert.equal(out.candidate, null);
  }
});

test("width must be finite and at least one because MorphTile clamps smaller widths", () => {
  for (const width of [0, 0.5, -1, "3"]) {
    const out = run({ ...base, request_id: "bad-width", intent: styledIntent({ width }) });
    assert.equal(out.status, "HOLD");
    assert.equal(out.holds[0].code, "HOLD_INTERFACE_VIEW_STYLE_INVALID");
    assert.equal(out.candidate, null);
  }
});

test("strong is boolean-only and false remains explicit authored matter", () => {
  const falseOut = run({
    ...base,
    request_id: "strong-false",
    intent: styledIntent({ elements: [{ kind: "text", text: "Plain", strong: false }] })
  });
  assert.equal(falseOut.status, "CANDIDATE");
  assert.deepEqual(falseOut.candidate.operation.view.body, [{ text: "Plain", strong: false }]);

  const invalid = run({
    ...base,
    request_id: "strong-invalid",
    intent: styledIntent({ elements: [{ kind: "text", text: "No coercion", strong: 1 }] })
  });
  assert.equal(invalid.status, "HOLD");
  assert.equal(invalid.holds[0].code, "HOLD_INTERFACE_ELEMENT_INVALID");
  assert.equal(invalid.candidate, null);
});

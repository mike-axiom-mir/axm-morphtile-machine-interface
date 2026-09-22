"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { run } = require("../src");

const base = {
  envelope_version: "0.1",
  request_id: "repeat-local-presentation",
  goal: "Render bounded nearest-repeat values without copying lexical locals into canonical state",
  provenance: { caller: "repeat-local-presentation-test" }
};

function repeat(children, max = 4) {
  return {
    tile_path: "mt_tower",
    elements: [{
      kind: "repeat",
      binding: "beacon",
      step: 0.25,
      max,
      children
    }],
    bindings: { readouts: ["beacon"], actions: ["toggle"], controls: ["levels"] }
  };
}

test("repeat-local text and interactive labels compile only to nearest lexical i/i_of expressions", () => {
  const out = run({
    ...base,
    intent: repeat([
      { kind: "repeat_text", source: "index", prefix: "slot ", strong: true },
      { kind: "meter", binding: "beacon", min: 0, max: 1, repeat_label: { source: "count", prefix: "meter of " } },
      { kind: "action", binding: "toggle", repeat_label: { source: "index", prefix: "toggle ", suffix: "!" } },
      { kind: "control", binding: "levels", repeat_label: { source: "index", prefix: "level " } }
    ])
  });

  assert.equal(out.status, "CANDIDATE");
  const body = out.candidate.operation.view.body[0].body;
  assert.deepEqual(body, [
    { text: ["+", "slot ", ["var", "i"]], strong: true },
    { meter: ["var", "beacon"], min: 0, max: 1, label: ["+", "meter of ", ["var", "i_of"]] },
    { button: "toggle", label: ["+", ["+", "toggle ", ["var", "i"]], "!"] },
    { control: "levels", label: ["+", "level ", ["var", "i"]] }
  ]);
  assert.deepEqual(out.dependencies[0].requires, {
    tile_exists: true,
    form_hints_include: ["ui_panel"],
    readout_logic_vars: ["beacon"],
    control_param_ids: ["levels"],
    action_input_signal_socket_ids: ["toggle"]
  }, "repeat-local presentation must not add canonical-state proof obligations");
});

test("repeat-local presentation HOLDs outside a lexical repeat", () => {
  for (const element of [
    { kind: "repeat_text", source: "index", prefix: "slot " },
    { kind: "action", binding: "toggle", repeat_label: { source: "index", prefix: "toggle " } }
  ]) {
    const out = run({
      ...base,
      request_id: "repeat-local-presentation-outside",
      intent: {
        tile_path: "mt_tower",
        elements: [element],
        bindings: element.kind === "action" ? { actions: ["toggle"] } : undefined
      }
    });
    assert.equal(out.status, "HOLD");
    assert.equal(out.holds[0].code, "HOLD_INTERFACE_REPEAT_SCOPE");
    assert.equal(out.candidate, null);
  }
});

test("repeat-local descriptors are closed and static labels cannot be mixed with lexical labels", () => {
  for (const child of [
    { kind: "repeat_text", source: "position" },
    { kind: "repeat_text", source: "index", prefix: 1 },
    { kind: "action", binding: "toggle", label: "static", repeat_label: { source: "index" } },
    { kind: "action", binding: "toggle", repeat_label: { source: "index", expression: ["var", "i"] } }
  ]) {
    const out = run({ ...base, request_id: "repeat-local-presentation-invalid", intent: repeat([child]) });
    assert.equal(out.status, "HOLD");
    assert.equal(out.candidate, null);
  }
});

test("nested repeat-local rendering follows the nearest repeat scope", () => {
  const out = run({
    ...base,
    request_id: "repeat-local-presentation-nested",
    intent: repeat([{
      kind: "repeat",
      binding: "beacon",
      step: 0.5,
      max: 2,
      children: [
        { kind: "repeat_text", source: "index", prefix: "inner " },
        { kind: "control", binding: "levels", repeat_label: { source: "count", prefix: "inner count " } }
      ]
    }])
  });

  assert.equal(out.status, "CANDIDATE");
  const inner = out.candidate.operation.view.body[0].body[0].body;
  assert.deepEqual(inner, [
    { text: ["+", "inner ", ["var", "i"]] },
    { control: "levels", label: ["+", "inner count ", ["var", "i_of"]] }
  ]);
});

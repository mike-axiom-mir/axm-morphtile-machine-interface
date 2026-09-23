"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { run } = require("../src");

function request(id, intent) {
  return {
    envelope_version: "0.1",
    request_id: id,
    goal: "Bind interface body text to canonical target state without copying that state",
    intent,
    provenance: { caller: "canonical-body-text-test" }
  };
}

test("legacy canonical body text compiles to one native var expression and one ordinary readout proof", () => {
  const out = run(request("canonical-body-legacy", {
    tile_path: "mt_tower",
    text_binding: "beacon",
    bindings: { readouts: ["beacon"] }
  }));

  assert.equal(out.status, "CANDIDATE", JSON.stringify(out.holds));
  assert.deepEqual(out.candidate.operation.view.body, [{ text: ["var", "beacon"] }]);
  assert.deepEqual(out.dependencies[0].requires.readout_logic_vars, ["beacon"]);
  assert.equal(JSON.stringify(out.candidate).includes("canonical_state"), false);
});

test("ordered text matter may read one declared canonical binding without becoming a readout widget", () => {
  const out = run(request("canonical-body-element", {
    tile_path: "mt_tower",
    elements: [
      { kind: "text", text: "Static" },
      { kind: "text", text_binding: "beacon", strong: true }
    ],
    bindings: { readouts: ["beacon"] }
  }));

  assert.equal(out.status, "CANDIDATE", JSON.stringify(out.holds));
  assert.deepEqual(out.candidate.operation.view.body, [
    { text: "Static" },
    { text: ["var", "beacon"], strong: true }
  ]);
  assert.deepEqual(out.dependencies[0].requires.readout_logic_vars, ["beacon"]);
});

test("static and canonical legacy body sources are mutually exclusive", () => {
  const out = run(request("ambiguous-body", {
    tile_path: "mt_tower",
    text: "Static",
    text_binding: "beacon",
    bindings: { readouts: ["beacon"] }
  }));

  assert.equal(out.status, "HOLD");
  assert.equal(out.holds[0].code, "HOLD_INTERFACE_CONTENT_AMBIGUOUS");
  assert.equal(out.candidate, null);
});

test("ordered text matter has exactly one authored source", () => {
  const out = run(request("ambiguous-body-element", {
    tile_path: "mt_tower",
    elements: [{ kind: "text", text: "Static", text_binding: "beacon" }],
    bindings: { readouts: ["beacon"] }
  }));

  assert.equal(out.status, "HOLD");
  assert.equal(out.holds[0].code, "HOLD_INTERFACE_CONTENT_AMBIGUOUS");
  assert.equal(out.candidate, null);
});

test("body text binding must be declared on the canonical readout proof lane", () => {
  const out = run(request("undeclared-body", {
    tile_path: "mt_tower",
    elements: [{ kind: "text", text_binding: "beacon" }],
    bindings: { readouts: [] }
  }));

  assert.equal(out.status, "HOLD");
  assert.equal(out.holds[0].code, "HOLD_INVALID_INTERFACE_BINDING");
  assert.match(out.holds[0].detail, /beacon/);
  assert.equal(out.candidate, null);
});

test("static body text cannot smuggle an arbitrary expression", () => {
  const out = run(request("arbitrary-body-expression", {
    tile_path: "mt_tower",
    text: ["+", "Tower ", ["var", "beacon"]]
  }));

  assert.equal(out.status, "HOLD");
  assert.equal(out.holds[0].code, "HOLD_INTERFACE_TEXT_INVALID");
  assert.equal(out.candidate, null);
});

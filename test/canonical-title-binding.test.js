"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { run } = require("../src");

function request(id, intent) {
  return {
    envelope_version: "0.1",
    request_id: id,
    goal: "Bind one interface title to canonical target state without copying that state",
    intent,
    provenance: { caller: "canonical-title-binding-test" }
  };
}

test("canonical title binding compiles to one native var expression and one ordinary readout proof", () => {
  const out = run(request("canonical-title", {
    tile_path: "mt_tower",
    title_binding: "beacon",
    elements: [{ kind: "text", text: "Tower status" }],
    bindings: { readouts: ["beacon"] }
  }));

  assert.equal(out.status, "CANDIDATE", JSON.stringify(out.holds));
  assert.deepEqual(out.candidate.operation.view, {
    title: ["var", "beacon"],
    body: [{ text: "Tower status" }]
  });
  assert.deepEqual(out.dependencies[0].requires.readout_logic_vars, ["beacon"]);
  assert.equal(JSON.stringify(out.candidate).includes("canonical_state"), false);
});

test("static and canonical title sources are mutually exclusive", () => {
  const out = run(request("ambiguous-title", {
    tile_path: "mt_tower",
    title: "Static",
    title_binding: "beacon",
    bindings: { readouts: ["beacon"] }
  }));

  assert.equal(out.status, "HOLD");
  assert.equal(out.holds[0].code, "HOLD_INTERFACE_CONTENT_AMBIGUOUS");
  assert.equal(out.candidate, null);
});

test("title binding must be declared on the canonical readout proof lane", () => {
  const out = run(request("undeclared-title", {
    tile_path: "mt_tower",
    title_binding: "beacon",
    bindings: { readouts: [] }
  }));

  assert.equal(out.status, "HOLD");
  assert.equal(out.holds[0].code, "HOLD_INVALID_INTERFACE_BINDING");
  assert.match(out.holds[0].detail, /beacon/);
  assert.equal(out.candidate, null);
});

test("title field remains static text and cannot smuggle an arbitrary expression", () => {
  const out = run(request("arbitrary-title-expression", {
    tile_path: "mt_tower",
    title: ["+", "Tower ", ["var", "beacon"]]
  }));

  assert.equal(out.status, "HOLD");
  assert.equal(out.holds[0].code, "HOLD_INTERFACE_TEXT_INVALID");
  assert.equal(out.candidate, null);
});

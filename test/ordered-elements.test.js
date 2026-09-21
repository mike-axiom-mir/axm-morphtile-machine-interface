const test = require("node:test");
const assert = require("node:assert/strict");
const { run } = require("../src");

const base = {
  envelope_version: "0.1",
  request_id: "ordered-elements",
  goal: "Create one complete ordered tile-owned interface",
  provenance: { caller: "ordered-elements-test" }
};

test("ordered elements compile into one atomic view.set without copied state", () => {
  const out = run({
    ...base,
    intent: {
      tile_path: "mt_tower",
      title: "Tower controls",
      elements: [
        { kind: "text", text: "Tune the tower." },
        { kind: "control", binding: "levels", label: "Tower levels" },
        { kind: "readout", binding: "energy" },
        { kind: "action", binding: "surge", label: "Harvest" }
      ],
      bindings: { controls: ["levels"], readouts: ["energy"], actions: ["surge"] }
    }
  });

  assert.equal(out.status, "CANDIDATE");
  assert.equal(out.machine.version, "0.5.14");
  assert.deepEqual(out.candidate.operation, {
    op: "view.set",
    id: "mt_tower",
    view: {
      title: "Tower controls",
      body: [
        { text: "Tune the tower." },
        { control: "levels", label: "Tower levels" },
        { value: "energy", label: "energy" },
        { button: "surge", label: "Harvest" }
      ]
    }
  });
  assert.ok(!JSON.stringify(out.candidate).includes("state_value"));
});

test("ordered element bindings must be explicitly declared", () => {
  const out = run({
    ...base,
    request_id: "ordered-elements-undeclared",
    intent: {
      tile_path: "mt_tower",
      elements: [{ kind: "control", binding: "levels" }],
      bindings: { controls: ["height"] }
    }
  });

  assert.equal(out.status, "HOLD");
  assert.equal(out.holds[0].code, "HOLD_INVALID_INTERFACE_BINDING");
  assert.match(out.holds[0].detail, /levels/);
  assert.equal(out.candidate, null);
});

test("unknown ordered-element fields HOLD instead of smuggling authority-shaped data", () => {
  const out = run({
    ...base,
    request_id: "ordered-elements-state-smuggle",
    intent: {
      tile_path: "mt_tower",
      elements: [{ kind: "control", binding: "levels", state_value: 12 }],
      bindings: { controls: ["levels"] }
    }
  });

  assert.equal(out.status, "HOLD");
  assert.equal(out.holds[0].code, "HOLD_INTERFACE_ELEMENT_FIELD_UNKNOWN");
  assert.match(out.holds[0].detail, /state_value/);
  assert.equal(out.candidate, null);
});

test("legacy body fields and ordered elements cannot be mixed", () => {
  const out = run({
    ...base,
    request_id: "ordered-elements-mixed-content",
    intent: {
      tile_path: "mt_tower",
      text: "legacy",
      elements: [{ kind: "text", text: "ordered" }]
    }
  });

  assert.equal(out.status, "HOLD");
  assert.equal(out.holds[0].code, "HOLD_INTERFACE_CONTENT_AMBIGUOUS");
  assert.equal(out.candidate, null);
});

test("ordered text-only interfaces preserve authored order without requiring bindings", () => {
  const out = run({
    ...base,
    request_id: "ordered-elements-text-only",
    intent: {
      tile_path: "mt_tower",
      elements: [
        { kind: "text", text: "" },
        { kind: "text", text: "Second line" }
      ]
    }
  });

  assert.equal(out.status, "CANDIDATE");
  assert.deepEqual(out.candidate.operation.view.body, [{ text: "" }, { text: "Second line" }]);
});

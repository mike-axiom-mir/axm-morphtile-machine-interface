const test = require("node:test");
const assert = require("node:assert/strict");
const { run } = require("../src");

const base = {
  envelope_version: "0.1",
  request_id: "nested-layout",
  goal: "Create bounded relative interface layout",
  provenance: { caller: "nested-layout-test" }
};

test("row and group layouts compile recursively while preserving authored order", () => {
  const out = run({
    ...base,
    intent: {
      tile_path: "mt_tower",
      title: "Tower layout",
      elements: [
        {
          kind: "group",
          children: [
            { kind: "text", text: "Beacon controls" },
            {
              kind: "row",
              children: [
                { kind: "control", binding: "levels", label: "Levels" },
                { kind: "action", binding: "toggle", label: "Toggle" }
              ]
            }
          ]
        }
      ],
      bindings: { controls: ["levels"], actions: ["toggle"] }
    }
  });

  assert.equal(out.status, "CANDIDATE");
  assert.equal(out.machine.version, "0.5.0");
  assert.deepEqual(out.candidate.operation.view.body, [
    {
      group: [
        { text: "Beacon controls" },
        {
          row: [
            { control: "levels", label: "Levels" },
            { button: "toggle", label: "Toggle" }
          ]
        }
      ]
    }
  ]);
});

test("bindings inside nested layout must still be declared", () => {
  const out = run({
    ...base,
    request_id: "nested-undeclared",
    intent: {
      tile_path: "mt_tower",
      elements: [{ kind: "row", children: [{ kind: "action", binding: "toggle" }] }],
      bindings: { actions: ["other"] }
    }
  });

  assert.equal(out.status, "HOLD");
  assert.equal(out.holds[0].code, "HOLD_INVALID_INTERFACE_BINDING");
  assert.match(out.holds[0].detail, /toggle/);
});

test("nested layout rejects authority-shaped fields instead of retaining them", () => {
  const out = run({
    ...base,
    request_id: "nested-state-smuggle",
    intent: {
      tile_path: "mt_tower",
      elements: [{ kind: "group", children: [{ kind: "control", binding: "levels", state_value: 7 }] }],
      bindings: { controls: ["levels"] }
    }
  });

  assert.equal(out.status, "HOLD");
  assert.equal(out.holds[0].code, "HOLD_INTERFACE_ELEMENT_FIELD_UNKNOWN");
  assert.match(out.holds[0].detail, /state_value/);
});

test("layout containers require non-empty children", () => {
  const out = run({
    ...base,
    request_id: "nested-empty",
    intent: { tile_path: "mt_tower", elements: [{ kind: "row", children: [] }] }
  });

  assert.equal(out.status, "HOLD");
  assert.equal(out.holds[0].code, "HOLD_INTERFACE_ELEMENT_INVALID");
  assert.match(out.holds[0].detail, /children/);
});

test("nested layout fails closed beyond the deterministic depth bound", () => {
  let node = { kind: "text", text: "deep" };
  for (let i = 0; i < 7; i++) node = { kind: "group", children: [node] };
  const out = run({ ...base, request_id: "nested-too-deep", intent: { tile_path: "mt_tower", elements: [node] } });

  assert.equal(out.status, "HOLD");
  assert.equal(out.holds[0].code, "HOLD_INTERFACE_LAYOUT_TOO_DEEP");
});

test("the 64-node budget applies across the whole nested tree", () => {
  const children = Array.from({ length: 64 }, (_, i) => ({ kind: "text", text: String(i) }));
  const out = run({
    ...base,
    request_id: "nested-over-budget",
    intent: { tile_path: "mt_tower", elements: [{ kind: "group", children }] }
  });

  assert.equal(out.status, "HOLD");
  assert.equal(out.holds[0].code, "HOLD_INTERFACE_ELEMENTS_INVALID");
  assert.match(out.holds[0].detail, /64 total nodes/);
});

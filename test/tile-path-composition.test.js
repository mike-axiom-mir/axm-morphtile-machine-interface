"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { run } = require("../src");

function request(id, ownerPath, embeddedPath) {
  return {
    envelope_version: "0.1",
    request_id: id,
    goal: "Compose one explicit same-root tile path without copying target authority",
    intent: {
      tile_path: ownerPath,
      title: "Path composition",
      elements: [{ kind: "tile", tile_path: embeddedPath }]
    },
    provenance: { caller: "tile-path-composition-unit-test" }
  };
}

test("tile path composition compiles an explicit same-root path to unambiguous native absolute addressing", () => {
  const out = run(request("tile-path-compose", "mt_shell/mt_panel", "mt_shell/mt_inner"));
  assert.equal(out.status, "CANDIDATE", JSON.stringify(out.holds));
  assert.deepEqual(out.candidate.operation.view.body, [{ tile: "/mt_shell/mt_inner" }]);
  assert.deepEqual(out.dependencies, [{
    id: "morphtile.interface-target-proof:mt_shell/mt_panel",
    kind: "morphtile.interface-target-proof/v0.1",
    tile_path: "mt_shell/mt_panel",
    requires: {
      tile_exists: true,
      form_hints_include: ["ui_panel"],
      readout_logic_vars: [],
      control_param_ids: [],
      action_input_signal_socket_ids: []
    }
  }]);
});

test("tile path composition rejects cross-root addressing instead of widening into a bridge", () => {
  const out = run(request("tile-path-cross-root", "mt_shell/mt_panel", "mt_other/mt_inner"));
  assert.equal(out.status, "HOLD");
  assert.equal(out.holds[0].code, "HOLD_INTERFACE_TILE_SCOPE");
});

test("tile path composition requires one canonical multi-segment MorphTile path", () => {
  for (const embeddedPath of ["", "mt_shell", "/mt_shell/mt_inner", "mt_shell//mt_inner", "mt shell/mt_inner"]) {
    const out = run(request("tile-path-invalid-" + String(embeddedPath), "mt_shell/mt_panel", embeddedPath));
    assert.equal(out.status, "HOLD", embeddedPath + " should HOLD");
    assert.equal(out.holds[0].code, "HOLD_INTERFACE_ELEMENT_INVALID");
  }
});

test("tile composition requires exactly one local id or explicit path and rejects authority-shaped extras", () => {
  const both = run({
    envelope_version: "0.1",
    request_id: "tile-path-both",
    goal: "Reject ambiguous tile addressing",
    intent: {
      tile_path: "mt_shell/mt_panel",
      elements: [{ kind: "tile", tile_id: "mt_inner", tile_path: "mt_shell/mt_inner" }]
    },
    provenance: { caller: "tile-path-composition-unit-test" }
  });
  assert.equal(both.status, "HOLD");
  assert.equal(both.holds[0].code, "HOLD_INTERFACE_ELEMENT_INVALID");

  const extra = run({
    envelope_version: "0.1",
    request_id: "tile-path-extra",
    goal: "Reject copied embedded state",
    intent: {
      tile_path: "mt_shell/mt_panel",
      elements: [{ kind: "tile", tile_path: "mt_shell/mt_inner", state_value: 1 }]
    },
    provenance: { caller: "tile-path-composition-unit-test" }
  });
  assert.equal(extra.status, "HOLD");
  assert.equal(extra.holds[0].code, "HOLD_INTERFACE_ELEMENT_FIELD_UNKNOWN");
});

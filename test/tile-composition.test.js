"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { run } = require("../src");

function request(id, intent) {
  return {
    envelope_version: "0.1",
    request_id: id,
    goal: "Compose one same-container tile-owned view without copying target state",
    intent,
    provenance: { caller: "tile-composition-unit-test" }
  };
}

test("tile element compiles one bounded same-container tile reference without parent bindings", () => {
  const out = run(request("tile-compose", {
    tile_path: "mt_tower",
    title: "Tower + core",
    elements: [
      { kind: "text", text: "Core status" },
      { kind: "tile", tile_id: "mt_core" }
    ]
  }));

  assert.equal(out.status, "CANDIDATE", JSON.stringify(out.holds));
  assert.deepEqual(out.candidate.operation.view.body, [
    { text: "Core status" },
    { tile: "mt_core" }
  ]);
  assert.deepEqual(out.dependencies, [{
    id: "morphtile.interface-target-proof:mt_tower",
    kind: "morphtile.interface-target-proof/v0.1",
    tile_path: "mt_tower",
    requires: {
      tile_exists: true,
      form_hints_include: ["ui_panel"],
      readout_logic_vars: [],
      control_param_ids: [],
      action_input_signal_socket_ids: []
    }
  }]);
});

test("nested owners must use an explicit same-root tile_path instead of an ambiguous bare tile_id", () => {
  const out = run(request("nested-bare-tile-scope", {
    tile_path: "mt_shell/mt_panel",
    elements: [{ kind: "tile", tile_id: "mt_tower" }]
  }));

  assert.equal(out.status, "HOLD");
  assert.equal(out.holds[0].code, "HOLD_INTERFACE_TILE_SCOPE");
});

test("tile element stays bounded to a local tile id rather than inventing cross-container addressing", () => {
  for (const tileId of ["", "mt_shell/mt_inner", "/mt_core", "mt core"]) {
    const out = run(request("tile-invalid-" + String(tileId), {
      tile_path: "mt_tower",
      elements: [{ kind: "tile", tile_id: tileId }]
    }));
    assert.equal(out.status, "HOLD", tileId + " should HOLD");
    assert.equal(out.holds[0].code, "HOLD_INTERFACE_ELEMENT_INVALID");
  }
});

test("tile element rejects authority-shaped or ambiguous extra fields", () => {
  const out = run(request("tile-extra", {
    tile_path: "mt_tower",
    elements: [{ kind: "tile", tile_id: "mt_core", state_value: 1 }]
  }));
  assert.equal(out.status, "HOLD");
  assert.equal(out.holds[0].code, "HOLD_INTERFACE_ELEMENT_FIELD_UNKNOWN");
});

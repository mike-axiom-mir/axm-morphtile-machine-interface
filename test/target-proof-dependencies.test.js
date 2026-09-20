const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("../fixtures/request.counter-view.json");
const placementRequest = require("../fixtures/request.counter-view-placement.json");
const { run, targetProofDependencies } = require("../src");

test("emits one deterministic target-local proof dependency for authored bindings", () => {
  const out = run(request);
  assert.equal(out.status, "CANDIDATE");
  assert.deepEqual(out.dependencies, [{
    id: "morphtile.interface-target-proof:mt_counter",
    kind: "morphtile.interface-target-proof/v0.1",
    tile_path: "mt_counter",
    requires: {
      tile_exists: true,
      form_hints_include: ["ui_panel"],
      readout_logic_vars: ["count"],
      control_param_ids: [],
      action_input_signal_socket_ids: ["increment"]
    }
  }]);
});

test("placement candidates carry the same target-local proof obligation", () => {
  const out = run(placementRequest);
  assert.equal(out.status, "CANDIDATE");
  assert.equal(out.candidate.schema, "morphtile.interface-operations/v0.5");
  assert.deepEqual(out.dependencies, [{
    id: "morphtile.interface-target-proof:mt_counter",
    kind: "morphtile.interface-target-proof/v0.1",
    tile_path: "mt_counter",
    requires: {
      tile_exists: true,
      form_hints_include: ["ui_panel"],
      readout_logic_vars: ["count"],
      control_param_ids: [],
      action_input_signal_socket_ids: ["increment"]
    }
  }]);
});

test("tile presentation anchors become an explicit existence proof dependency", () => {
  const out = run({
    ...placementRequest,
    request_id: "target-proof-anchor",
    intent: {
      ...placementRequest.intent,
      placement: { ...placementRequest.intent.placement, mode: "tile", anchor: "mt_shell/mt_mount" }
    }
  });
  assert.equal(out.status, "CANDIDATE");
  assert.deepEqual(out.dependencies[1], {
    id: "morphtile.presentation-anchor-proof:mt_shell/mt_mount",
    kind: "morphtile.presentation-anchor-proof/v0.1",
    anchor_path: "mt_shell/mt_mount",
    requires: { tile_exists: true }
  });
});

test("anchors that the MorphTile runtime does not resolve do not manufacture existence dependencies", () => {
  const out = run({
    ...placementRequest,
    request_id: "target-proof-inert-anchor",
    intent: {
      ...placementRequest.intent,
      placement: { mode: "screen", anchor: "mt_missing", user_adjustable: false }
    }
  });
  assert.equal(out.status, "CANDIDATE");
  assert.equal(out.dependencies.length, 1);
  assert.equal(out.dependencies[0].id, "morphtile.interface-target-proof:mt_counter");
});

test("proof requirements are canonical sets rather than interface-order history", () => {
  const a = targetProofDependencies({
    tile_path: "mt_panel",
    elements: [
      { kind: "action", binding: "zeta" },
      { kind: "group", children: [
        { kind: "control", binding: "size" },
        { kind: "action", binding: "alpha" },
        { kind: "readout", binding: "temperature" }
      ] },
      { kind: "readout", binding: "alarm" }
    ]
  });
  const b = targetProofDependencies({
    tile_path: "mt_panel",
    elements: [
      { kind: "readout", binding: "alarm" },
      { kind: "action", binding: "alpha" },
      { kind: "readout", binding: "temperature" },
      { kind: "control", binding: "size" },
      { kind: "action", binding: "zeta" }
    ]
  });
  assert.deepEqual(a, b);
  assert.equal(a[0].id, "morphtile.interface-target-proof:mt_panel");
  assert.deepEqual(a[0].requires.action_input_signal_socket_ids, ["alpha", "zeta"]);
  assert.deepEqual(a[0].requires.readout_logic_vars, ["alarm", "temperature"]);
});

test("dependencies carry symbolic requirements only, never caller state values", () => {
  const out = run({
    ...request,
    request_id: "target-proof-no-state-copy",
    canonical_state: { count: 424242 },
    session_state: { secret: "SESSION_ONLY_SENTINEL" }
  });
  const json = JSON.stringify(out.dependencies);
  assert.ok(!json.includes("424242"));
  assert.ok(!json.includes("SESSION_ONLY_SENTINEL"));
  assert.ok(!json.includes("canonical_state"));
  assert.ok(!json.includes("session_state"));
});

test("even a text-only interface declares the target existence and ui_panel proof it still needs", () => {
  const out = run({
    ...request,
    request_id: "text-only-target-proof",
    intent: { tile_path: "mt_counter", title: "Info", text: "Hello" }
  });
  assert.equal(out.status, "CANDIDATE");
  assert.deepEqual(out.dependencies[0].requires, {
    tile_exists: true,
    form_hints_include: ["ui_panel"],
    readout_logic_vars: [],
    control_param_ids: [],
    action_input_signal_socket_ids: []
  });
});

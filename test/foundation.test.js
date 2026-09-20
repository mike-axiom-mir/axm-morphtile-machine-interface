const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("../fixtures/request.counter-view.json");
const placementRequest = require("../fixtures/request.counter-view-placement.json");
const { run } = require("../src");

test("preserves the original view-only candidate when no placement is requested", () => {
  const out = run(request), operation = out.candidate.operation;
  assert.equal(out.status, "CANDIDATE");
  assert.equal(out.candidate.schema, "morphtile.view-operation/v0.4");
  assert.deepEqual(operation, { op: "view.set", id: "mt_counter", view: { title: "Counter", body: [{ value: "count", label: "count" }, { button: "increment", label: "increment" }] } });
  assert.ok(!JSON.stringify(out.candidate).includes("authoritative_state"));
  assert.equal(out.warnings[0].code, "TARGET_MUST_EXIST_AND_DECLARE_UI_PANEL");
  assert.equal(out.warnings[1].code, "CALLER_MUST_PROVE_BINDINGS_MATCH_TARGET");
});

test("emits view.set plus presentation.set without copying top-level canonical or session state", () => {
  const out = run({
    ...placementRequest,
    canonical_state: { secret_counter_snapshot: 424242 },
    session_state: { secret_session_marker: "SESSION_ONLY_SENTINEL" }
  });
  assert.equal(out.status, "CANDIDATE");
  assert.equal(out.candidate.schema, "morphtile.interface-operations/v0.4");
  assert.deepEqual(out.candidate.operations, [
    { op: "view.set", id: "mt_counter", view: { title: "Counter", body: [{ value: "count", label: "count" }, { button: "increment", label: "increment" }] } },
    { op: "presentation.set", id: "mt_counter", presentation: { mode: "docked", dock: "right", preferred_size: [360, 480], preferred_position: [0, 0], user_adjustable: true } }
  ]);
  const json = JSON.stringify(out.candidate);
  assert.ok(!json.includes("424242"));
  assert.ok(!json.includes("SESSION_ONLY_SENTINEL"));
  assert.ok(!json.includes("canonical_state"));
  assert.ok(!json.includes("session_state"));
});

test("holds invalid presentation descriptors instead of widening the MorphTile contract", () => {
  const out = run({ ...request, request_id: "interface-held", intent: { ...request.intent, placement: { mode: "headset-only" } } });
  assert.equal(out.status, "HOLD");
  assert.equal(out.holds[0].code, "HOLD_INVALID_PRESENTATION_PLACEMENT");
  assert.match(out.holds[0].detail, /placement\.mode/);
});

test("holds unknown placement fields instead of silently rewriting caller intent", () => {
  const out = run({
    ...placementRequest,
    request_id: "interface-placement-typo-held",
    intent: {
      ...placementRequest.intent,
      placement: {
        mode: "docked",
        dock: "right",
        prefered_size: [360, 480],
        user_adjustable: true
      }
    }
  });
  assert.equal(out.status, "HOLD");
  assert.equal(out.holds[0].code, "HOLD_INVALID_PRESENTATION_PLACEMENT");
  assert.match(out.holds[0].detail, /prefered_size/);
  assert.equal(out.candidate, null);
});

test("holds authority snapshots nested inside placement instead of silently dropping them", () => {
  const out = run({
    ...placementRequest,
    request_id: "interface-placement-authority-held",
    intent: {
      ...placementRequest.intent,
      placement: {
        ...placementRequest.intent.placement,
        canonical_state: { secret_counter_snapshot: 424242 },
        session_state: { secret_session_marker: "SESSION_ONLY_SENTINEL" }
      }
    }
  });
  assert.equal(out.status, "HOLD");
  assert.equal(out.holds[0].code, "HOLD_INVALID_PRESENTATION_PLACEMENT");
  assert.match(out.holds[0].detail, /canonical_state/);
  assert.match(out.holds[0].detail, /session_state/);
  assert.equal(out.candidate, null);
});

test("interactive controls require an explicit symbolic binding declaration", () => {
  const out = run({
    ...request,
    request_id: "interface-bindings-required",
    intent: { tile_path: "mt_counter", title: "Counter", action: "increment" }
  });
  assert.equal(out.status, "HOLD");
  assert.equal(out.holds[0].code, "HOLD_INVALID_INTERFACE_BINDING");
  assert.match(out.holds[0].detail, /bindings/);
  assert.equal(out.candidate, null);
});

test("undeclared action names hold instead of creating a plausible but ungrounded button", () => {
  const out = run({
    ...request,
    request_id: "interface-undeclared-action",
    intent: {
      tile_path: "mt_counter",
      title: "Counter",
      action: "reset_everything",
      bindings: { readouts: ["count"], actions: ["increment"] }
    }
  });
  assert.equal(out.status, "HOLD");
  assert.equal(out.holds[0].code, "HOLD_INVALID_INTERFACE_BINDING");
  assert.match(out.holds[0].detail, /reset_everything/);
  assert.equal(out.candidate, null);
});

test("declared parameter controls compile as symbolic control nodes without copying parameter values", () => {
  const out = run({
    ...request,
    request_id: "interface-declared-control",
    intent: {
      tile_path: "mt_tower",
      title: "Tower tuning",
      control: "levels",
      control_label: "Tower levels",
      bindings: { controls: ["levels"] }
    }
  });
  assert.equal(out.status, "CANDIDATE");
  assert.deepEqual(out.candidate.operation, {
    op: "view.set",
    id: "mt_tower",
    view: { title: "Tower tuning", body: [{ control: "levels", label: "Tower levels" }] }
  });
  assert.ok(!JSON.stringify(out.candidate).includes("value"));
});

test("undeclared parameter controls hold instead of manufacturing a target parameter", () => {
  const out = run({
    ...request,
    request_id: "interface-undeclared-control",
    intent: {
      tile_path: "mt_tower",
      title: "Tower tuning",
      control: "levels",
      bindings: { controls: ["height"] }
    }
  });
  assert.equal(out.status, "HOLD");
  assert.equal(out.holds[0].code, "HOLD_INVALID_INTERFACE_BINDING");
  assert.match(out.holds[0].detail, /levels/);
  assert.equal(out.candidate, null);
});

test("binding declarations carry names only and fail closed on authority-shaped extras", () => {
  const out = run({
    ...request,
    request_id: "interface-binding-authority-held",
    intent: {
      ...request.intent,
      bindings: {
        readouts: ["count"],
        actions: ["increment"],
        state_values: { count: 424242 }
      }
    }
  });
  assert.equal(out.status, "HOLD");
  assert.equal(out.holds[0].code, "HOLD_INVALID_INTERFACE_BINDING");
  assert.match(out.holds[0].detail, /state_values/);
  assert.equal(out.candidate, null);
});

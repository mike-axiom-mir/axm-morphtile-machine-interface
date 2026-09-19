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
});

test("emits view.set plus presentation.set without copying canonical or session state", () => {
  const out = run({
    ...placementRequest,
    canonical_state: { secret_counter_snapshot: 424242 },
    session_state: { secret_session_marker: "SESSION_ONLY_SENTINEL" },
    intent: {
      ...placementRequest.intent,
      placement: {
        ...placementRequest.intent.placement,
        canonical_state: { secret_counter_snapshot: 424242 },
        session_state: { secret_session_marker: "SESSION_ONLY_SENTINEL" }
      }
    }
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

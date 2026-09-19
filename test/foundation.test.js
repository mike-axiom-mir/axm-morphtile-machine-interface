const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("../fixtures/request.counter-view.json");
const { run } = require("../src");

test("binds presentation to canonical names without copying authoritative state", () => {
  const out = run(request), operation = out.candidate.operation;
  assert.equal(out.status, "CANDIDATE");
  assert.deepEqual(operation, { op: "view.set", id: "mt_counter", view: { title: "Counter", body: [{ value: "count", label: "count" }, { button: "increment", label: "increment" }] } });
  assert.ok(!JSON.stringify(out.candidate).includes("authoritative_state"));
  assert.equal(out.warnings[0].code, "TARGET_MUST_EXIST_AND_DECLARE_UI_PANEL");
});

test("holds presentation placement until MorphTile defines the contract", () => {
  const out = run({ ...request, request_id: "interface-held", intent: { ...request.intent, placement: { mode: "world" } } });
  assert.equal(out.status, "HOLD");
  assert.equal(out.holds[0].code, "HOLD_PRESENTATION_PLACEMENT_NOT_IN_V04");
});

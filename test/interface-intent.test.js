const test = require("node:test");
const assert = require("node:assert/strict");
const fixture = require("../fixtures/request.counter-view.json");
const { MACHINE, run } = require("../src");

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

test("machine v0.3 fails closed on malformed and unknown top-level interface intent", () => {
  assert.equal(MACHINE.version, "0.3.0");

  for (const intent of ["panel", [], 7, null]) {
    const out = run({ ...fixture, request_id: "interface-intent-invalid-" + String(intent), intent });
    assert.equal(out.status, "HOLD");
    assert.equal(out.holds[0].code, "HOLD_INTERFACE_INTENT_INVALID");
  }

  const request = clone(fixture);
  request.request_id = "interface-intent-unknown";
  request.intent.z_extra = true;
  request.intent.a_extra = true;
  const out = run(request);
  assert.equal(out.status, "HOLD");
  assert.equal(out.holds[0].code, "HOLD_INTERFACE_INTENT_FIELD_UNKNOWN");
  assert.equal(out.holds[0].detail, "unknown intent fields: a_extra, z_extra");
  assert.equal(out.candidate, null);
});

test("tile and anchor references fail closed before they become misleading candidates", () => {
  const badTile = clone(fixture);
  badTile.request_id = "interface-bad-tile-path";
  badTile.intent.tile_path = "mt/tower";
  let out = run(badTile);
  assert.equal(out.status, "HOLD");
  assert.equal(out.holds[0].code, "HOLD_INTERFACE_TILE_PATH_INVALID");

  const badAnchor = clone(fixture);
  badAnchor.request_id = "interface-bad-anchor";
  badAnchor.intent.placement = { mode: "tile", anchor: "mt/island" };
  out = run(badAnchor);
  assert.equal(out.status, "HOLD");
  assert.equal(out.holds[0].code, "HOLD_INVALID_PRESENTATION_PLACEMENT");
  assert.match(out.holds[0].detail, /anchor/);
});

test("orphan labels and binding declarations hold instead of being silently ignored", () => {
  const orphanLabel = clone(fixture);
  orphanLabel.request_id = "interface-orphan-label";
  orphanLabel.intent = { tile_path: "mt_counter", action_label: "Do it" };
  let out = run(orphanLabel);
  assert.equal(out.status, "HOLD");
  assert.equal(out.holds[0].code, "HOLD_INTERFACE_ORPHAN_LABEL");

  const orphanBindings = clone(fixture);
  orphanBindings.request_id = "interface-orphan-bindings";
  orphanBindings.intent = { tile_path: "mt_counter", bindings: { actions: ["increment"] } };
  out = run(orphanBindings);
  assert.equal(out.status, "HOLD");
  assert.equal(out.holds[0].code, "HOLD_INTERFACE_ORPHAN_BINDINGS");
});

test("explicit text is preserved alongside controls instead of disappearing", () => {
  const request = clone(fixture);
  request.request_id = "interface-text-plus-controls";
  request.intent.text = "Count carefully";
  request.intent.title = "";
  request.intent.readout_label = "";
  request.intent.action_label = "Add one";

  const before = JSON.stringify(request);
  const out = run(request);
  assert.equal(out.status, "CANDIDATE");
  assert.deepEqual(out.candidate.operation, {
    op: "view.set",
    id: "mt_counter",
    view: {
      title: "",
      body: [
        { text: "Count carefully" },
        { value: "count", label: "" },
        { button: "increment", label: "Add one" }
      ]
    }
  });
  assert.equal(JSON.stringify(request), before);
});

test("explicit null binding names do not disappear through truthiness checks", () => {
  const request = clone(fixture);
  request.request_id = "interface-null-action";
  request.intent.action = null;
  const out = run(request);
  assert.equal(out.status, "HOLD");
  assert.equal(out.holds[0].code, "HOLD_INVALID_INTERFACE_BINDING");
  assert.match(out.holds[0].detail, /symbolic name/);
});

test("text fields are bounded to strings rather than copied as arbitrary authority-shaped objects", () => {
  const request = clone(fixture);
  request.request_id = "interface-text-object";
  request.intent.title = { canonical_state: { count: 42 } };
  const out = run(request);
  assert.equal(out.status, "HOLD");
  assert.equal(out.holds[0].code, "HOLD_INTERFACE_TEXT_INVALID");
  assert.equal(out.candidate, null);
});

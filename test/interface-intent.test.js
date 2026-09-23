const test = require("node:test");
const assert = require("node:assert/strict");
const fixture = require("../fixtures/request.counter-view.json");
const { MACHINE, run } = require("../src");

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

test("machine v0.5 fails closed on malformed and unknown top-level interface intent", () => {
  assert.equal(MACHINE.version, "0.5.18");

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

test("canonical nested tile paths and anchors are accepted while malformed paths fail closed", () => {
  const nested = clone(fixture);
  nested.request_id = "interface-nested-tile-path";
  nested.intent.tile_path = "mt_shell/mt_room/mt_counter";
  nested.intent.placement = { mode: "tile", anchor: "mt_shell/mt_mount" };
  let out = run(nested);
  assert.equal(out.status, "CANDIDATE");
  assert.equal(out.candidate.operations[0].id, "mt_shell/mt_room/mt_counter");
  assert.equal(out.candidate.operations[1].presentation.anchor, "mt_shell/mt_mount");

  for (const value of ["/mt_shell", "mt_shell/", "mt_shell//mt_room", "mt_shell/../mt_room", "mt shell/mt_room"]) {
    const badTile = clone(fixture);
    badTile.request_id = "interface-bad-tile-path-" + value;
    badTile.intent.tile_path = value;
    out = run(badTile);
    assert.equal(out.status, "HOLD");
    assert.equal(out.holds[0].code, "HOLD_INTERFACE_TILE_PATH_INVALID");
  }

  const badAnchor = clone(fixture);
  badAnchor.request_id = "interface-bad-anchor";
  badAnchor.intent.placement = { mode: "tile", anchor: "mt_shell//mt_island" };
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

test("declared symbolic bindings must all be consumed by the authored interface", () => {
  const extraAction = clone(fixture);
  extraAction.request_id = "interface-unused-action-binding";
  extraAction.intent.bindings.actions.push("decrement");
  let out = run(extraAction);
  assert.equal(out.status, "HOLD");
  assert.equal(out.holds[0].code, "HOLD_INVALID_INTERFACE_BINDING");
  assert.equal(out.holds[0].detail, "intent.bindings.actions declares unused symbolic name: decrement");
  assert.equal(out.candidate, null);

  const extraCrossKind = clone(fixture);
  extraCrossKind.request_id = "interface-unused-control-binding";
  extraCrossKind.intent.bindings.controls = ["count"];
  out = run(extraCrossKind);
  assert.equal(out.status, "HOLD");
  assert.equal(out.holds[0].code, "HOLD_INVALID_INTERFACE_BINDING");
  assert.equal(out.holds[0].detail, "intent.bindings.controls declares unused symbolic name: count");
  assert.equal(out.candidate, null);
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

test("authored intent accessors HOLD before caller code executes", () => {
  const request = clone(fixture);
  request.request_id = "interface-intent-accessor";
  let calls = 0;
  Object.defineProperty(request.intent, "title", {
    enumerable: true,
    configurable: true,
    get() {
      calls += 1;
      return "Injected";
    }
  });
  const before = Object.getOwnPropertyDescriptor(request.intent, "title");

  const out = run(request);

  assert.equal(calls, 0);
  assert.equal(out.status, "HOLD");
  assert.equal(out.holds[0].code, "HOLD_INTERFACE_INTENT_NONPORTABLE_VALUE");
  assert.match(out.holds[0].detail, /intent\.title/);
  assert.equal(out.candidate, null);
  const after = Object.getOwnPropertyDescriptor(request.intent, "title");
  assert.equal(after.get, before.get);
  assert.equal(after.enumerable, before.enumerable);
});

test("nested binding accessors HOLD without executing during normalization", () => {
  const request = clone(fixture);
  request.request_id = "interface-binding-accessor";
  let calls = 0;
  Object.defineProperty(request.intent.bindings.actions, "0", {
    enumerable: true,
    configurable: true,
    get() {
      calls += 1;
      return "increment";
    }
  });

  const out = run(request);

  assert.equal(calls, 0);
  assert.equal(out.status, "HOLD");
  assert.equal(out.holds[0].code, "HOLD_INTERFACE_INTENT_NONPORTABLE_VALUE");
  assert.match(out.holds[0].detail, /intent\.bindings\.actions\[0\]/);
  assert.equal(out.candidate, null);
});

test("hidden toJSON cannot rewrite authored interface intent", () => {
  const request = clone(fixture);
  request.request_id = "interface-hidden-tojson";
  let calls = 0;
  Object.defineProperty(request.intent, "toJSON", {
    enumerable: false,
    configurable: true,
    value() {
      calls += 1;
      return { tile_path: "mt_other", title: "Rewritten" };
    }
  });

  const out = run(request);

  assert.equal(calls, 0);
  assert.equal(out.status, "HOLD");
  assert.equal(out.holds[0].code, "HOLD_INTERFACE_INTENT_NONPORTABLE_VALUE");
  assert.match(out.holds[0].detail, /intent\.toJSON/);
  assert.equal(out.candidate, null);
});

test("explicit undefined intent fields HOLD instead of disappearing through JSON transport", () => {
  const request = clone(fixture);
  request.request_id = "interface-undefined-authorship";
  request.intent.text = undefined;

  const out = run(request);

  assert.equal(out.status, "HOLD");
  assert.equal(out.holds[0].code, "HOLD_INTERFACE_INTENT_NONPORTABLE_VALUE");
  assert.match(out.holds[0].detail, /intent\.text/);
  assert.equal(out.candidate, null);
});

test("duplicate symbolic binding declarations HOLD instead of being silently deduplicated", () => {
  const cases = [
    {
      key: "actions",
      name: "increment",
      build() {
        const request = clone(fixture);
        request.intent.bindings.actions.push("increment");
        return request;
      }
    },
    {
      key: "readouts",
      name: "count",
      build() {
        const request = clone(fixture);
        request.intent.bindings.readouts.push("count");
        return request;
      }
    },
    {
      key: "controls",
      name: "count",
      build() {
        const request = clone(fixture);
        request.intent = {
          tile_path: "mt_counter",
          control: "count",
          bindings: { controls: ["count", "count"] }
        };
        return request;
      }
    }
  ];

  for (const entry of cases) {
    const request = entry.build();
    request.request_id = `interface-duplicate-${entry.key}`;
    const out = run(request);
    assert.equal(out.status, "HOLD");
    assert.equal(out.holds[0].code, "HOLD_INVALID_INTERFACE_BINDING");
    assert.equal(out.holds[0].detail, `intent.bindings.${entry.key} contains duplicate symbolic name: ${entry.name}`);
    assert.equal(out.candidate, null);
  }
});

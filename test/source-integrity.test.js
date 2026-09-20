const test = require("node:test");
const assert = require("node:assert/strict");
const fixture = require("../fixtures/request.counter-view.json");
const { run } = require("../src");

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

test("request intent accessor HOLDs before caller code executes", () => {
  const request = clone(fixture);
  request.request_id = "interface-request-intent-accessor";
  const authored = request.intent;
  delete request.intent;
  let calls = 0;
  Object.defineProperty(request, "intent", {
    enumerable: true,
    configurable: true,
    get() {
      calls += 1;
      return authored;
    }
  });

  const out = run(request);

  assert.equal(calls, 0);
  assert.equal(out.status, "HOLD");
  assert.equal(out.holds[0].code, "HOLD_INTERFACE_INTENT_NONPORTABLE_VALUE");
  assert.match(out.holds[0].detail, /request\.intent/);
  assert.equal(out.candidate, null);
});

test("cyclic authored intent HOLDs without transport coercion", () => {
  const request = clone(fixture);
  request.request_id = "interface-intent-cycle";
  request.intent.loop = request.intent;

  const out = run(request);

  assert.equal(out.status, "HOLD");
  assert.equal(out.holds[0].code, "HOLD_INTERFACE_INTENT_NONPORTABLE_VALUE");
  assert.match(out.holds[0].detail, /cyclic/);
  assert.equal(out.candidate, null);
});

test("non-finite authored placement values HOLD before JSON can rewrite them", () => {
  const request = clone(fixture);
  request.request_id = "interface-placement-nonfinite";
  request.intent.placement = { mode: "floating", preferred_position: [Infinity, 0] };

  const out = run(request);

  assert.equal(out.status, "HOLD");
  assert.equal(out.holds[0].code, "HOLD_INTERFACE_INTENT_NONFINITE_VALUE");
  assert.match(out.holds[0].detail, /intent\.placement\.preferred_position\[0\]/);
  assert.equal(out.candidate, null);
});

test("ordinary portable authored intent remains unchanged and produces the same candidate", () => {
  const request = clone(fixture);
  request.request_id = "interface-portable-source-control";
  request.intent.placement = { mode: "docked", dock: "right", user_adjustable: false };
  const before = JSON.stringify(request);

  const out = run(request);

  assert.equal(out.status, "CANDIDATE");
  assert.equal(JSON.stringify(request), before);
  assert.deepEqual(out.candidate.operations[1], {
    op: "presentation.set",
    id: "mt_counter",
    presentation: { mode: "docked", dock: "right", user_adjustable: false }
  });
});

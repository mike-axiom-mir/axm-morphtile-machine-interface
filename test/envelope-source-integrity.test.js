const test = require("node:test");
const assert = require("node:assert/strict");
const fixture = require("../fixtures/request.counter-view.json");
const { run } = require("../src");

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function expectEnvelopeSourceReject(fn) {
  assert.throws(fn, (error) => error && error.code === "INTERFACE_ENVELOPE_NONPORTABLE_VALUE");
}

test("root request Proxy is rejected before caller traps execute", () => {
  const request = clone(fixture);
  let calls = 0;
  const proxied = new Proxy(request, {
    get() {
      calls += 1;
      throw new Error("root request get trap executed");
    },
    getPrototypeOf() {
      calls += 1;
      throw new Error("root request getPrototypeOf trap executed");
    },
    ownKeys() {
      calls += 1;
      throw new Error("root request ownKeys trap executed");
    },
    getOwnPropertyDescriptor() {
      calls += 1;
      throw new Error("root request getOwnPropertyDescriptor trap executed");
    }
  });

  expectEnvelopeSourceReject(() => run(proxied));
  assert.equal(calls, 0);
});

test("revoked root request Proxy fails closed before Array.isArray can throw", () => {
  const request = clone(fixture);
  const revocable = Proxy.revocable(request, {});
  revocable.revoke();

  expectEnvelopeSourceReject(() => run(revocable.proxy));
});

test("required envelope field accessor is rejected without getter execution", () => {
  const request = clone(fixture);
  let calls = 0;
  const requestId = request.request_id;
  delete request.request_id;
  Object.defineProperty(request, "request_id", {
    enumerable: true,
    configurable: true,
    get() {
      calls += 1;
      return requestId;
    }
  });

  expectEnvelopeSourceReject(() => run(request));
  assert.equal(calls, 0);
});

test("provenance accessor is rejected before caller code executes", () => {
  const request = clone(fixture);
  let calls = 0;
  Object.defineProperty(request.provenance, "caller", {
    enumerable: true,
    configurable: true,
    get() {
      calls += 1;
      return "rewritten-caller";
    }
  });

  expectEnvelopeSourceReject(() => run(request));
  assert.equal(calls, 0);
});

test("hidden provenance toJSON hook is rejected without execution", () => {
  const request = clone(fixture);
  let calls = 0;
  Object.defineProperty(request.provenance, "toJSON", {
    enumerable: false,
    configurable: true,
    value() {
      calls += 1;
      return { caller: "rewritten-caller" };
    }
  });

  expectEnvelopeSourceReject(() => run(request));
  assert.equal(calls, 0);
});

test("portable envelope and provenance remain unchanged", () => {
  const request = clone(fixture);
  const before = JSON.stringify(request);

  const out = run(request);

  assert.equal(out.status, "CANDIDATE");
  assert.equal(JSON.stringify(request), before);
  assert.deepEqual(out.provenance, { caller: "fixture" });
  assert.equal(Object.getPrototypeOf(out.provenance), Object.prototype);
});

"use strict";

const { types: { isProxy } } = require("node:util");
const { copyPortableIntentValue } = require("./interface-intent");

const ENVELOPE_VERSION = "0.1";
const STATUSES = new Set(["CANDIDATE", "PASS", "HOLD", "FAIL"]);

class InterfaceEnvelopeError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "InterfaceEnvelopeError";
    this.code = code;
  }
}

function envelopeSourceError(path, detail) {
  return new InterfaceEnvelopeError(
    "INTERFACE_ENVELOPE_NONPORTABLE_VALUE",
    path + " is not portable envelope data" + (detail ? ": " + detail : "")
  );
}

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function ownEnumerableDataValue(value, key, path) {
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  if (!descriptor) return undefined;
  if (descriptor.get || descriptor.set || !Object.prototype.hasOwnProperty.call(descriptor, "value") || !descriptor.enumerable) {
    throw envelopeSourceError(path + "." + key, "envelope fields must be enumerable data properties");
  }
  return descriptor.value;
}

function portableEnvelopeClone(value, path) {
  try {
    const portable = copyPortableIntentValue(value, path);
    // copyPortableIntentValue deliberately uses null-prototype objects so keys
    // such as __proto__ remain data during inspection. Re-encode only that safe
    // copy so public envelope output retains ordinary JSON object prototypes.
    return JSON.parse(JSON.stringify(portable));
  } catch (error) {
    throw envelopeSourceError(path, error && error.message ? error.message : String(error));
  }
}

function inspectRequest(request) {
  if (!request || typeof request !== "object") throw new TypeError("request must be an object");
  // Array.isArray throws for revoked Proxies. util.types.isProxy is non-trapping
  // for both live and revoked Proxy values, so interception must be rejected first.
  if (isProxy(request)) {
    throw envelopeSourceError("request", "Proxy objects are not accepted because envelope inspection could execute caller code");
  }
  if (Array.isArray(request)) throw new TypeError("request must be an object");

  const envelopeVersion = ownEnumerableDataValue(request, "envelope_version", "request");
  const requestId = ownEnumerableDataValue(request, "request_id", "request");
  const goal = ownEnumerableDataValue(request, "goal", "request");

  if (envelopeVersion !== ENVELOPE_VERSION) throw new Error("unsupported envelope_version");
  if (typeof requestId !== "string" || !requestId) throw new Error("request_id is required");
  if (typeof goal !== "string" || !goal) throw new Error("goal is required");

  const provenanceDescriptor = Object.getOwnPropertyDescriptor(request, "provenance");
  let provenance = {};
  if (provenanceDescriptor) {
    if (
      provenanceDescriptor.get || provenanceDescriptor.set ||
      !Object.prototype.hasOwnProperty.call(provenanceDescriptor, "value") ||
      !provenanceDescriptor.enumerable
    ) {
      throw envelopeSourceError("request.provenance", "provenance must be an enumerable data property");
    }
    provenance = portableEnvelopeClone(provenanceDescriptor.value, "request.provenance");
  }

  return { envelope_version: envelopeVersion, request_id: requestId, goal, provenance };
}

function assertRequest(request) {
  inspectRequest(request);
  return request;
}

function result(request, machine, status, fields = {}) {
  const envelope = inspectRequest(request);
  if (!STATUSES.has(status)) throw new Error("invalid result status");
  return {
    envelope_version: ENVELOPE_VERSION,
    request_id: envelope.request_id,
    machine: clone(machine),
    status,
    candidate: fields.candidate === undefined ? null : clone(fields.candidate),
    dependencies: clone(fields.dependencies || []),
    evidence: clone(fields.evidence || []),
    warnings: clone(fields.warnings || []),
    holds: clone(fields.holds || []),
    provenance: fields.provenance === undefined
      ? envelope.provenance
      : portableEnvelopeClone(fields.provenance, "result.provenance"),
    suggested_missing_capability: fields.suggested_missing_capability || null
  };
}

module.exports = {
  ENVELOPE_VERSION,
  STATUSES,
  InterfaceEnvelopeError,
  clone,
  inspectRequest,
  assertRequest,
  result
};

"use strict";

const INTERFACE_INTENT_FIELDS = Object.freeze([
  "tile_path",
  "title",
  "text",
  "readout",
  "readout_label",
  "control",
  "control_label",
  "action",
  "action_label",
  "bindings",
  "placement"
]);
const TILE_ID = /^[A-Za-z0-9_-]+$/;

class InterfaceIntentError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "InterfaceIntentError";
    this.code = code;
  }
}

function isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function assertOnlyFields(value) {
  const unknown = Object.keys(value).filter((key) => !INTERFACE_INTENT_FIELDS.includes(key)).sort();
  if (unknown.length) {
    throw new InterfaceIntentError(
      "HOLD_INTERFACE_INTENT_FIELD_UNKNOWN",
      "unknown intent field" + (unknown.length === 1 ? ": " : "s: ") + unknown.join(", ")
    );
  }
}

function assertString(value, field) {
  if (value !== undefined && typeof value !== "string") {
    throw new InterfaceIntentError("HOLD_INTERFACE_TEXT_INVALID", field + " must be a string when supplied");
  }
}

function normalizeInterfaceIntent(intent) {
  if (!isPlainObject(intent)) {
    throw new InterfaceIntentError("HOLD_INTERFACE_INTENT_INVALID", "intent must be an object");
  }
  assertOnlyFields(intent);

  if (intent.tile_path !== undefined) {
    if (typeof intent.tile_path !== "string" || !TILE_ID.test(intent.tile_path)) {
      throw new InterfaceIntentError("HOLD_INTERFACE_TILE_PATH_INVALID", "intent.tile_path must match [A-Za-z0-9_-]+");
    }
  }

  for (const field of ["title", "text", "readout_label", "control_label", "action_label"]) {
    assertString(intent[field], "intent." + field);
  }

  const pairs = [
    ["readout", "readout_label"],
    ["control", "control_label"],
    ["action", "action_label"]
  ];
  for (const [binding, label] of pairs) {
    if (intent[label] !== undefined && (intent[binding] === undefined || intent[binding] === null)) {
      throw new InterfaceIntentError("HOLD_INTERFACE_ORPHAN_LABEL", "intent." + label + " requires intent." + binding);
    }
  }

  const hasInteractive = ["readout", "control", "action"].some((key) => intent[key] !== undefined && intent[key] !== null);
  if (intent.bindings !== undefined && !hasInteractive) {
    throw new InterfaceIntentError(
      "HOLD_INTERFACE_ORPHAN_BINDINGS",
      "intent.bindings requires at least one requested readout, control or action"
    );
  }

  return JSON.parse(JSON.stringify(intent));
}

module.exports = {
  INTERFACE_INTENT_FIELDS,
  TILE_ID,
  InterfaceIntentError,
  normalizeInterfaceIntent
};

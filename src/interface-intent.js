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
  "elements",
  "bindings",
  "placement"
]);
const LEGACY_CONTENT_FIELDS = Object.freeze([
  "text",
  "readout",
  "readout_label",
  "control",
  "control_label",
  "action",
  "action_label"
]);
const ELEMENT_FIELDS = Object.freeze({
  text: Object.freeze(["kind", "text"]),
  readout: Object.freeze(["kind", "binding", "label"]),
  control: Object.freeze(["kind", "binding", "label"]),
  action: Object.freeze(["kind", "binding", "label"]),
  row: Object.freeze(["kind", "children"]),
  group: Object.freeze(["kind", "children"])
});
const TILE_ID = /^[A-Za-z0-9_-]+$/;
const TILE_PATH = /^[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*$/;
const MAX_LAYOUT_NODES = 64;
const MAX_LAYOUT_DEPTH = 6;

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

function normalizeElements(value, depth, state) {
  if (value === undefined) return undefined;
  const atDepth = depth === undefined ? 0 : depth;
  const budget = state || { count: 0 };
  if (!Array.isArray(value) || value.length === 0) {
    throw new InterfaceIntentError("HOLD_INTERFACE_ELEMENTS_INVALID", "interface element lists must be non-empty arrays when supplied");
  }
  if (atDepth > MAX_LAYOUT_DEPTH) {
    throw new InterfaceIntentError("HOLD_INTERFACE_LAYOUT_TOO_DEEP", "nested row/group layout may be at most " + MAX_LAYOUT_DEPTH + " levels deep");
  }

  return value.map((element, index) => {
    const at = "intent.elements" + (atDepth ? " nested" : "") + "[" + index + "]";
    budget.count += 1;
    if (budget.count > MAX_LAYOUT_NODES) {
      throw new InterfaceIntentError("HOLD_INTERFACE_ELEMENTS_INVALID", "interface layout may contain at most " + MAX_LAYOUT_NODES + " total nodes");
    }
    if (!isPlainObject(element)) {
      throw new InterfaceIntentError("HOLD_INTERFACE_ELEMENT_INVALID", at + " must be an object");
    }
    if (typeof element.kind !== "string" || !Object.prototype.hasOwnProperty.call(ELEMENT_FIELDS, element.kind)) {
      throw new InterfaceIntentError("HOLD_INTERFACE_ELEMENT_INVALID", at + ".kind must be text|readout|control|action|row|group");
    }
    const allowed = ELEMENT_FIELDS[element.kind];
    const unknown = Object.keys(element).filter((key) => !allowed.includes(key)).sort();
    if (unknown.length) {
      throw new InterfaceIntentError(
        "HOLD_INTERFACE_ELEMENT_FIELD_UNKNOWN",
        at + " contains unsupported field" + (unknown.length === 1 ? ": " : "s: ") + unknown.join(", ")
      );
    }
    if (element.kind === "text") {
      if (typeof element.text !== "string") {
        throw new InterfaceIntentError("HOLD_INTERFACE_ELEMENT_INVALID", at + ".text must be a string");
      }
      return { kind: "text", text: element.text };
    }
    if (element.kind === "row" || element.kind === "group") {
      if (!Array.isArray(element.children) || element.children.length === 0) {
        throw new InterfaceIntentError("HOLD_INTERFACE_ELEMENT_INVALID", at + ".children must be a non-empty array");
      }
      return { kind: element.kind, children: normalizeElements(element.children, atDepth + 1, budget) };
    }
    if (typeof element.binding !== "string") {
      throw new InterfaceIntentError("HOLD_INTERFACE_ELEMENT_INVALID", at + ".binding must be a string");
    }
    if (element.label !== undefined && typeof element.label !== "string") {
      throw new InterfaceIntentError("HOLD_INTERFACE_ELEMENT_INVALID", at + ".label must be a string when supplied");
    }
    const normalized = { kind: element.kind, binding: element.binding };
    if (element.label !== undefined) normalized.label = element.label;
    return normalized;
  });
}

function normalizeInterfaceIntent(intent) {
  if (!isPlainObject(intent)) {
    throw new InterfaceIntentError("HOLD_INTERFACE_INTENT_INVALID", "intent must be an object");
  }
  assertOnlyFields(intent);

  if (intent.tile_path !== undefined) {
    if (typeof intent.tile_path !== "string" || !TILE_PATH.test(intent.tile_path)) {
      throw new InterfaceIntentError("HOLD_INTERFACE_TILE_PATH_INVALID", "intent.tile_path must be a MorphTile path of [A-Za-z0-9_-]+ segments separated by /");
    }
  }

  for (const field of ["title", "text", "readout_label", "control_label", "action_label"]) {
    assertString(intent[field], "intent." + field);
  }

  const elements = normalizeElements(intent.elements);
  if (elements !== undefined && LEGACY_CONTENT_FIELDS.some((field) => intent[field] !== undefined)) {
    throw new InterfaceIntentError(
      "HOLD_INTERFACE_CONTENT_AMBIGUOUS",
      "intent.elements cannot be mixed with legacy text/readout/control/action fields because authored order would be ambiguous"
    );
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

  const hasInteractiveLegacy = ["readout", "control", "action"].some((key) => intent[key] !== undefined && intent[key] !== null);
  const hasInteractiveElements = !!(elements && elements.some(function containsInteractive(element) {
    if (element.kind === "row" || element.kind === "group") return element.children.some(containsInteractive);
    return element.kind !== "text";
  }));
  if (intent.bindings !== undefined && !hasInteractiveLegacy && !hasInteractiveElements) {
    throw new InterfaceIntentError(
      "HOLD_INTERFACE_ORPHAN_BINDINGS",
      "intent.bindings requires at least one requested readout, control or action"
    );
  }

  const normalized = JSON.parse(JSON.stringify(intent));
  if (elements !== undefined) normalized.elements = elements;
  return normalized;
}

module.exports = {
  INTERFACE_INTENT_FIELDS,
  LEGACY_CONTENT_FIELDS,
  ELEMENT_FIELDS,
  TILE_ID,
  TILE_PATH,
  MAX_LAYOUT_NODES,
  MAX_LAYOUT_DEPTH,
  InterfaceIntentError,
  normalizeElements,
  normalizeInterfaceIntent
};

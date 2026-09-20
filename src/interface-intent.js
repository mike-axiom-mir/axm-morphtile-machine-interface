"use strict";

const { types: { isProxy } } = require("node:util");

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
  meter: Object.freeze(["kind", "binding", "min", "max", "label"]),
  control: Object.freeze(["kind", "binding", "label"]),
  action: Object.freeze(["kind", "binding", "label"]),
  tile: Object.freeze(["kind", "tile_id"]),
  row: Object.freeze(["kind", "children"]),
  group: Object.freeze(["kind", "children"]),
  when: Object.freeze(["kind", "binding", "children"]),
  repeat: Object.freeze(["kind", "binding", "step", "max", "children"])
});
const TILE_ID = /^[A-Za-z0-9_-]+$/;
const TILE_PATH = /^[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*$/;
const ARRAY_INDEX = /^(0|[1-9][0-9]*)$/;
const MAX_LAYOUT_NODES = 64;
const MAX_LAYOUT_DEPTH = 6;
const MAX_REPEAT_ITEMS = 16;

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

function sourceIntegrityError(path, detail) {
  return new InterfaceIntentError(
    "HOLD_INTERFACE_INTENT_NONPORTABLE_VALUE",
    path + " is not portable authored data" + (detail ? ": " + detail : "")
  );
}

function portablePath(parent, key, isArray) {
  return isArray ? parent + "[" + key + "]" : parent + "." + key;
}

function copyPortableIntentValue(value, path, seen) {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new InterfaceIntentError(
        "HOLD_INTERFACE_INTENT_NONFINITE_VALUE",
        path + " must be finite portable authored data"
      );
    }
    if (Object.is(value, -0)) throw sourceIntegrityError(path, "negative zero would be rewritten by JSON transport");
    return value;
  }
  if (value === undefined || typeof value === "function" || typeof value === "symbol" || typeof value === "bigint") {
    throw sourceIntegrityError(path, "unsupported " + typeof value + " value");
  }
  if (typeof value !== "object") throw sourceIntegrityError(path, "unsupported value type");
  if (isProxy(value)) {
    throw sourceIntegrityError(path, "Proxy objects are not accepted because reflective inspection could execute caller code");
  }

  const stack = seen || new WeakSet();
  if (stack.has(value)) throw sourceIntegrityError(path, "cyclic data is not portable");

  const array = Array.isArray(value);
  const prototype = Object.getPrototypeOf(value);
  if (array) {
    if (prototype !== Array.prototype) throw sourceIntegrityError(path, "array subclasses are not portable authored data");
  } else if (prototype !== Object.prototype && prototype !== null) {
    throw sourceIntegrityError(path, "object must have Object.prototype or null prototype");
  }

  const ownKeys = Reflect.ownKeys(value);
  if (ownKeys.some((key) => typeof key === "symbol")) throw sourceIntegrityError(path, "symbol-keyed fields are not portable");

  let arrayLength = null;
  if (array) {
    const lengthDescriptor = Object.getOwnPropertyDescriptor(value, "length");
    if (!lengthDescriptor || !Object.prototype.hasOwnProperty.call(lengthDescriptor, "value")) {
      throw sourceIntegrityError(path, "array length must be a data property");
    }
    arrayLength = lengthDescriptor.value;
    const indexKeys = ownKeys.filter((key) => key !== "length");
    if (indexKeys.some((key) => !ARRAY_INDEX.test(key) || Number(key) >= arrayLength)) {
      throw sourceIntegrityError(path, "arrays may contain only contiguous indexed values");
    }
    if (indexKeys.length !== arrayLength) throw sourceIntegrityError(path, "sparse arrays are not portable authored data");
  }

  stack.add(value);
  // Null-prototype copies preserve authored keys such as __proto__ as data.
  // A normal object assignment could invoke Object.prototype.__proto__ and
  // silently turn an unknown authored field into prototype mutation.
  const copy = array ? new Array(arrayLength) : Object.create(null);
  try {
    for (const key of ownKeys) {
      if (array && key === "length") continue;
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      const at = portablePath(path, key, array);
      if (!descriptor || descriptor.get || descriptor.set || !Object.prototype.hasOwnProperty.call(descriptor, "value")) {
        throw sourceIntegrityError(at, "accessor-backed fields are not accepted");
      }
      if (!descriptor.enumerable) throw sourceIntegrityError(at, "non-enumerable authored fields are not accepted");
      copy[key] = copyPortableIntentValue(descriptor.value, at, stack);
    }
  } finally {
    stack.delete(value);
  }
  return copy;
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
    throw new InterfaceIntentError("HOLD_INTERFACE_LAYOUT_TOO_DEEP", "nested row/group/when/repeat layout may be at most " + MAX_LAYOUT_DEPTH + " levels deep");
  }

  return value.map((element, index) => {
    const at = "intent.elements" + (atDepth ? " nested" : "") + "[" + index + "]";
    budget.count += 1;
    if (budget.count > MAX_LAYOUT_NODES) {
      throw new InterfaceIntentError("HOLD_INTERFACE_ELEMENTS_INVALID", "interface layout may contain at most " + MAX_LAYOUT_NODES + " total authored nodes");
    }
    if (!isPlainObject(element)) {
      throw new InterfaceIntentError("HOLD_INTERFACE_ELEMENT_INVALID", at + " must be an object");
    }
    if (typeof element.kind !== "string" || !Object.prototype.hasOwnProperty.call(ELEMENT_FIELDS, element.kind)) {
      throw new InterfaceIntentError("HOLD_INTERFACE_ELEMENT_INVALID", at + ".kind must be text|readout|meter|control|action|tile|row|group|when|repeat");
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
    if (element.kind === "tile") {
      if (typeof element.tile_id !== "string" || !TILE_ID.test(element.tile_id)) {
        throw new InterfaceIntentError("HOLD_INTERFACE_ELEMENT_INVALID", at + ".tile_id must be one local MorphTile id matching [A-Za-z0-9_-]+");
      }
      return { kind: "tile", tile_id: element.tile_id };
    }
    if (element.kind === "row" || element.kind === "group" || element.kind === "when" || element.kind === "repeat") {
      if (!Array.isArray(element.children) || element.children.length === 0) {
        throw new InterfaceIntentError("HOLD_INTERFACE_ELEMENT_INVALID", at + ".children must be a non-empty array");
      }
      if ((element.kind === "when" || element.kind === "repeat") && typeof element.binding !== "string") {
        throw new InterfaceIntentError("HOLD_INTERFACE_ELEMENT_INVALID", at + ".binding must be a string");
      }
      if (element.kind === "repeat") {
        if (typeof element.step !== "number" || !Number.isFinite(element.step) || element.step <= 0) {
          throw new InterfaceIntentError("HOLD_INTERFACE_ELEMENT_INVALID", at + ".step must be a positive finite number");
        }
        if (!Number.isInteger(element.max) || element.max < 1 || element.max > MAX_REPEAT_ITEMS) {
          throw new InterfaceIntentError("HOLD_INTERFACE_ELEMENT_INVALID", at + ".max must be an integer from 1 through " + MAX_REPEAT_ITEMS);
        }
      }
      const normalized = { kind: element.kind, children: normalizeElements(element.children, atDepth + 1, budget) };
      if (element.kind === "when") normalized.binding = element.binding;
      if (element.kind === "repeat") {
        normalized.binding = element.binding;
        normalized.step = element.step;
        normalized.max = element.max;
      }
      return normalized;
    }
    if (typeof element.binding !== "string") {
      throw new InterfaceIntentError("HOLD_INTERFACE_ELEMENT_INVALID", at + ".binding must be a string");
    }
    if (element.label !== undefined && typeof element.label !== "string") {
      throw new InterfaceIntentError("HOLD_INTERFACE_ELEMENT_INVALID", at + ".label must be a string when supplied");
    }
    if (element.kind === "meter") {
      if (
        typeof element.min !== "number" || !Number.isFinite(element.min) ||
        typeof element.max !== "number" || !Number.isFinite(element.max) ||
        element.max <= element.min
      ) {
        throw new InterfaceIntentError(
          "HOLD_INTERFACE_ELEMENT_INVALID",
          at + ".min and .max must be finite numbers with max greater than min"
        );
      }
      const normalized = { kind: "meter", binding: element.binding, min: element.min, max: element.max };
      if (element.label !== undefined) normalized.label = element.label;
      return normalized;
    }
    const normalized = { kind: element.kind, binding: element.binding };
    if (element.label !== undefined) normalized.label = element.label;
    return normalized;
  });
}

function expandedLayoutNodeCount(elements) {
  if (!elements) return 0;
  const countNode = (element) => {
    if (element.kind === "row" || element.kind === "group" || element.kind === "when") {
      return 1 + element.children.reduce((sum, child) => sum + countNode(child), 0);
    }
    if (element.kind === "repeat") {
      const body = element.children.reduce((sum, child) => sum + countNode(child), 0);
      return 1 + element.max * body;
    }
    return 1;
  };
  return elements.reduce((sum, element) => sum + countNode(element), 0);
}

function normalizeInterfaceIntent(intent) {
  if (isProxy(intent)) {
    throw sourceIntegrityError("intent", "Proxy objects are not accepted because reflective inspection could execute caller code");
  }
  if (!isPlainObject(intent)) {
    throw new InterfaceIntentError("HOLD_INTERFACE_INTENT_INVALID", "intent must be an object");
  }

  // Establish source integrity before any authored field is read. The previous
  // JSON clone could invoke toJSON/accessors or silently rewrite/drop values.
  const authored = copyPortableIntentValue(intent, "intent");
  assertOnlyFields(authored);

  if (authored.tile_path !== undefined) {
    if (typeof authored.tile_path !== "string" || !TILE_PATH.test(authored.tile_path)) {
      throw new InterfaceIntentError("HOLD_INTERFACE_TILE_PATH_INVALID", "intent.tile_path must be a MorphTile path of [A-Za-z0-9_-]+ segments separated by /");
    }
  }

  for (const field of ["title", "text", "readout_label", "control_label", "action_label"]) {
    assertString(authored[field], "intent." + field);
  }

  const elements = normalizeElements(authored.elements);
  if (elements !== undefined && expandedLayoutNodeCount(elements) > MAX_LAYOUT_NODES) {
    throw new InterfaceIntentError(
      "HOLD_INTERFACE_REPEAT_EXPANSION_TOO_LARGE",
      "worst-case expanded interface layout may contain at most " + MAX_LAYOUT_NODES + " nodes"
    );
  }
  if (elements !== undefined && LEGACY_CONTENT_FIELDS.some((field) => authored[field] !== undefined)) {
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
    if (authored[label] !== undefined && (authored[binding] === undefined || authored[binding] === null)) {
      throw new InterfaceIntentError("HOLD_INTERFACE_ORPHAN_LABEL", "intent." + label + " requires intent." + binding);
    }
  }

  const hasInteractiveLegacy = ["readout", "control", "action"].some((key) => authored[key] !== undefined && authored[key] !== null);
  const hasInteractiveElements = !!(elements && elements.some(function containsInteractive(element) {
    if (element.kind === "row" || element.kind === "group") return element.children.some(containsInteractive);
    if (element.kind === "text" || element.kind === "tile") return false;
    return true;
  }));
  if (authored.bindings !== undefined && !hasInteractiveLegacy && !hasInteractiveElements) {
    throw new InterfaceIntentError(
      "HOLD_INTERFACE_ORPHAN_BINDINGS",
      "intent.bindings requires at least one requested readout, control or action"
    );
  }

  if (elements !== undefined) authored.elements = elements;
  return authored;
}

module.exports = {
  INTERFACE_INTENT_FIELDS,
  LEGACY_CONTENT_FIELDS,
  ELEMENT_FIELDS,
  TILE_ID,
  TILE_PATH,
  MAX_LAYOUT_NODES,
  MAX_LAYOUT_DEPTH,
  MAX_REPEAT_ITEMS,
  InterfaceIntentError,
  copyPortableIntentValue,
  normalizeElements,
  expandedLayoutNodeCount,
  normalizeInterfaceIntent
};

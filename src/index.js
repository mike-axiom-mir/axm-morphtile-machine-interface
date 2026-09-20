"use strict";

const { assertRequest, result } = require("./envelope");
const { TILE_PATH, normalizeInterfaceIntent } = require("./interface-intent");
const MACHINE = { id: "axm.morphtile.machine.interface", version: "0.5.2" };
const PRESENTATION_MODES = new Set(["screen", "docked", "floating", "fullscreen", "embedded", "world", "tile"]);
const DOCKS = new Set(["left", "right", "top", "bottom"]);
const PRESENTATION_KEYS = new Set(["mode", "dock", "preferred_size", "preferred_position", "user_adjustable", "anchor"]);
const BINDING_KEYS = new Set(["readouts", "actions", "controls"]);
const SYMBOLIC_BINDING = /^[A-Za-z0-9_.-]+$/;

function finiteVector(value, length) {
  return Array.isArray(value) && value.length === length && value.every((n) => typeof n === "number" && Number.isFinite(n));
}

function normalizePlacement(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ok: false, error: "placement must be an object" };
  const unknownKeys = Object.keys(value).filter((key) => !PRESENTATION_KEYS.has(key)).sort();
  if (unknownKeys.length) return { ok: false, error: `placement contains unsupported field(s): ${unknownKeys.join(", ")}` };
  if (!PRESENTATION_MODES.has(value.mode)) return { ok: false, error: "placement.mode must be screen|docked|floating|fullscreen|embedded|world|tile" };
  if (value.dock != null && !DOCKS.has(value.dock)) return { ok: false, error: "placement.dock must be left|right|top|bottom" };
  if (value.preferred_size != null && (!finiteVector(value.preferred_size, 2) || value.preferred_size.some((n) => n <= 0))) return { ok: false, error: "placement.preferred_size must be two positive numbers" };
  if (value.preferred_position != null && !(finiteVector(value.preferred_position, 2) || finiteVector(value.preferred_position, 3))) return { ok: false, error: "placement.preferred_position must be two or three numbers" };
  if (value.user_adjustable != null && typeof value.user_adjustable !== "boolean") return { ok: false, error: "placement.user_adjustable must be boolean" };
  if (value.anchor != null && (typeof value.anchor !== "string" || !TILE_PATH.test(value.anchor))) return { ok: false, error: "placement.anchor must be a MorphTile path of [A-Za-z0-9_-]+ segments separated by /" };

  const placement = { mode: value.mode };
  for (const key of ["dock", "preferred_size", "preferred_position", "user_adjustable", "anchor"]) {
    if (value[key] !== undefined) placement[key] = value[key];
  }
  return { ok: true, value: placement };
}

function normalizeBindings(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ok: false, error: "intent.bindings must be an object" };
  const unknownKeys = Object.keys(value).filter((key) => !BINDING_KEYS.has(key)).sort();
  if (unknownKeys.length) return { ok: false, error: `intent.bindings contains unsupported field(s): ${unknownKeys.join(", ")}` };
  const normalized = {};
  for (const key of ["readouts", "actions", "controls"]) {
    const list = value[key] === undefined ? [] : value[key];
    if (!Array.isArray(list)) return { ok: false, error: `intent.bindings.${key} must be an array of symbolic names` };
    if (list.some((name) => typeof name !== "string" || !SYMBOLIC_BINDING.test(name))) return { ok: false, error: `intent.bindings.${key} must contain only symbolic names` };
    normalized[key] = [...new Set(list)].sort();
  }
  return { ok: true, value: normalized };
}

function requestedBindings(intent) {
  const requested = { readouts: [], actions: [], controls: [] };
  if (intent.readout !== undefined) requested.readouts.push(intent.readout);
  if (intent.action !== undefined) requested.actions.push(intent.action);
  if (intent.control !== undefined) requested.controls.push(intent.control);
  const collect = (element) => {
    if (element.kind === "readout") requested.readouts.push(element.binding);
    else if (element.kind === "action") requested.actions.push(element.binding);
    else if (element.kind === "control") requested.controls.push(element.binding);
    else if (element.kind === "row" || element.kind === "group") for (const child of element.children) collect(child);
  };
  for (const element of intent.elements || []) collect(element);
  for (const key of Object.keys(requested)) requested[key] = [...new Set(requested[key])];
  return requested;
}

function targetProofDependencies(intent, placement) {
  const requested = requestedBindings(intent);
  const dependencies = [{
    id: `morphtile.interface-target-proof:${intent.tile_path}`,
    kind: "morphtile.interface-target-proof/v0.1",
    tile_path: intent.tile_path,
    requires: {
      tile_exists: true,
      form_hints_include: ["ui_panel"],
      readout_logic_vars: requested.readouts.slice().sort(),
      control_param_ids: requested.controls.slice().sort(),
      action_input_signal_socket_ids: requested.actions.slice().sort()
    }
  }];
  if (placement && placement.mode === "tile" && placement.anchor !== undefined) {
    dependencies.push({
      id: `morphtile.presentation-anchor-proof:${placement.anchor}`,
      kind: "morphtile.presentation-anchor-proof/v0.1",
      anchor_path: placement.anchor,
      requires: { tile_exists: true }
    });
  }
  return dependencies;
}

function validateBindings(intent) {
  const requested = requestedBindings(intent);
  const wantsBindings = requested.readouts.length || requested.actions.length || requested.controls.length;
  if (!wantsBindings) return { ok: true, value: { readouts: [], actions: [], controls: [] } };
  const bindings = normalizeBindings(intent.bindings);
  if (!bindings.ok) return bindings;

  // First prove every authored interactive target is declared. Only after the
  // requested contract is complete do we report declarations that have no use.
  // This keeps the most direct caller error stable when both defects exist.
  for (const key of ["readouts", "actions", "controls"]) {
    const singular = key === "readouts" ? "readout" : key === "actions" ? "action" : "control";
    for (const name of requested[key]) {
      if (typeof name !== "string" || !SYMBOLIC_BINDING.test(name)) return { ok: false, error: `intent ${singular} binding must be a symbolic name` };
      if (!bindings.value[key].includes(name)) return { ok: false, error: `${singular} ${name} is not declared in intent.bindings.${key}` };
    }
  }

  for (const key of ["readouts", "actions", "controls"]) {
    const unused = bindings.value[key].filter((name) => !requested[key].includes(name));
    if (unused.length) {
      return {
        ok: false,
        error: `intent.bindings.${key} declares unused symbolic name${unused.length === 1 ? "" : "s"}: ${unused.join(", ")}`
      };
    }
  }
  return bindings;
}

function labelFor(intent, labelField, fallback) {
  return intent[labelField] !== undefined ? intent[labelField] : fallback;
}

function nodeForElement(element) {
  if (element.kind === "text") return { text: element.text };
  if (element.kind === "row") return { row: element.children.map(nodeForElement) };
  if (element.kind === "group") return { group: element.children.map(nodeForElement) };
  const label = element.label !== undefined ? element.label : element.binding;
  if (element.kind === "readout") return { value: element.binding, label };
  if (element.kind === "control") return { control: element.binding, label };
  return { button: element.binding, label };
}

function buildView(intent) {
  const body = [];
  if (intent.elements !== undefined) {
    for (const element of intent.elements) body.push(nodeForElement(element));
  } else {
    if (intent.text !== undefined) body.push({ text: intent.text });
    if (intent.readout) body.push({ value: intent.readout, label: labelFor(intent, "readout_label", intent.readout) });
    if (intent.control) body.push({ control: intent.control, label: labelFor(intent, "control_label", intent.control) });
    if (intent.action) body.push({ button: intent.action, label: labelFor(intent, "action_label", intent.action) });
  }
  if (!body.length) body.push({ text: "Interface candidate" });
  return {
    op: "view.set",
    id: intent.tile_path,
    view: {
      title: intent.title !== undefined ? intent.title : "Interface",
      body
    }
  };
}

function run(request) {
  assertRequest(request);

  let intent;
  try {
    intent = normalizeInterfaceIntent(request.intent);
  } catch (error) {
    return result(request, MACHINE, "HOLD", {
      holds: [{ code: error && error.code ? error.code : "HOLD_INTERFACE_INTENT_INVALID", detail: error && error.message ? error.message : String(error) }]
    });
  }

  if (!intent.tile_path) return result(request, MACHINE, "HOLD", { holds: [{ code: "HOLD_TILE_PATH_REQUIRED" }] });

  const bindings = validateBindings(intent);
  if (!bindings.ok) {
    return result(request, MACHINE, "HOLD", {
      holds: [{ code: "HOLD_INVALID_INTERFACE_BINDING", detail: bindings.error }]
    });
  }

  const viewOperation = buildView(intent);
  if (intent.placement !== undefined) {
    const placement = normalizePlacement(intent.placement);
    if (!placement.ok) {
      return result(request, MACHINE, "HOLD", {
        holds: [{ code: "HOLD_INVALID_PRESENTATION_PLACEMENT", detail: placement.error }]
      });
    }
    const dependencies = targetProofDependencies(intent, placement.value);
    return result(request, MACHINE, "CANDIDATE", {
      candidate: {
        schema: "morphtile.interface-operations/v0.5",
        operations: [
          viewOperation,
          { op: "presentation.set", id: intent.tile_path, presentation: placement.value }
        ]
      },
      dependencies,
      evidence: [{
        kind: "AUTHORITY",
        status: "PASS",
        check: "candidate carries only validated authored interface text, bounded nested relative layout, declared symbolic bindings and presentation descriptors; no copied canonical or session state; target-local and runtime-relevant anchor proof remain explicit dependencies"
      }],
      warnings: [{ code: "TARGET_MUST_EXIST_AND_DECLARE_UI_PANEL" }, { code: "CALLER_MUST_PROVE_BINDINGS_MATCH_TARGET" }]
    });
  }

  const dependencies = targetProofDependencies(intent);
  return result(request, MACHINE, "CANDIDATE", {
    candidate: { schema: "morphtile.view-operation/v0.5", operation: viewOperation },
    dependencies,
    evidence: [{ kind: "AUTHORITY", status: "PASS", check: "candidate contains validated authored interface text plus bounded nested relative layout and declared symbolic bindings with no copied state values; target-local proof remains an explicit dependency" }],
    warnings: [{ code: "TARGET_MUST_EXIST_AND_DECLARE_UI_PANEL" }, { code: "CALLER_MUST_PROVE_BINDINGS_MATCH_TARGET" }]
  });
}

module.exports = {
  MACHINE,
  PRESENTATION_MODES,
  PRESENTATION_KEYS,
  BINDING_KEYS,
  normalizePlacement,
  normalizeBindings,
  requestedBindings,
  targetProofDependencies,
  validateBindings,
  nodeForElement,
  buildView,
  run
};

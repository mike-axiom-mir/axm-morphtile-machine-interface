"use strict";

const { assertRequest, result } = require("./envelope");
const MACHINE = { id: "axm.morphtile.machine.interface", version: "0.2.0" };
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
  if (value.anchor != null && typeof value.anchor !== "string") return { ok: false, error: "placement.anchor must be a tile path string" };

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

function validateBindings(intent) {
  const wantsReadout = intent.readout !== undefined && intent.readout !== null;
  const wantsAction = intent.action !== undefined && intent.action !== null;
  const wantsControl = intent.control !== undefined && intent.control !== null;
  if (!wantsReadout && !wantsAction && !wantsControl) return { ok: true, value: { readouts: [], actions: [], controls: [] } };
  const bindings = normalizeBindings(intent.bindings);
  if (!bindings.ok) return bindings;
  if (wantsReadout) {
    if (typeof intent.readout !== "string" || !SYMBOLIC_BINDING.test(intent.readout)) return { ok: false, error: "intent.readout must be a symbolic name" };
    if (!bindings.value.readouts.includes(intent.readout)) return { ok: false, error: `readout ${intent.readout} is not declared in intent.bindings.readouts` };
  }
  if (wantsAction) {
    if (typeof intent.action !== "string" || !SYMBOLIC_BINDING.test(intent.action)) return { ok: false, error: "intent.action must be a symbolic name" };
    if (!bindings.value.actions.includes(intent.action)) return { ok: false, error: `action ${intent.action} is not declared in intent.bindings.actions` };
  }
  if (wantsControl) {
    if (typeof intent.control !== "string" || !SYMBOLIC_BINDING.test(intent.control)) return { ok: false, error: "intent.control must be a symbolic name" };
    if (!bindings.value.controls.includes(intent.control)) return { ok: false, error: `control ${intent.control} is not declared in intent.bindings.controls` };
  }
  return bindings;
}

function buildView(intent) {
  const body = [];
  if (intent.readout) body.push({ value: intent.readout, label: intent.readout_label || intent.readout });
  if (intent.control) body.push({ control: intent.control, label: intent.control_label || intent.control });
  if (intent.action) body.push({ button: intent.action, label: intent.action_label || intent.action });
  if (!body.length) body.push({ text: intent.text || "Interface candidate" });
  return { op: "view.set", id: intent.tile_path, view: { title: intent.title || "Interface", body } };
}

function run(request) {
  assertRequest(request);
  const intent = request.intent || {};
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
    return result(request, MACHINE, "CANDIDATE", {
      candidate: {
        schema: "morphtile.interface-operations/v0.4",
        operations: [
          viewOperation,
          { op: "presentation.set", id: intent.tile_path, presentation: placement.value }
        ]
      },
      evidence: [{
        kind: "AUTHORITY",
        status: "PASS",
        check: "candidate carries only declared symbolic readout/action/control bindings plus presentation descriptors; no copied canonical or session state"
      }],
      warnings: [{ code: "TARGET_MUST_EXIST_AND_DECLARE_UI_PANEL" }, { code: "CALLER_MUST_PROVE_BINDINGS_MATCH_TARGET" }]
    });
  }

  return result(request, MACHINE, "CANDIDATE", {
    candidate: { schema: "morphtile.view-operation/v0.4", operation: viewOperation },
    evidence: [{ kind: "AUTHORITY", status: "PASS", check: "candidate contains only declared symbolic readout/action/control bindings and no copied state values" }],
    warnings: [{ code: "TARGET_MUST_EXIST_AND_DECLARE_UI_PANEL" }, { code: "CALLER_MUST_PROVE_BINDINGS_MATCH_TARGET" }]
  });
}

module.exports = { MACHINE, PRESENTATION_MODES, PRESENTATION_KEYS, BINDING_KEYS, normalizePlacement, normalizeBindings, validateBindings, run };

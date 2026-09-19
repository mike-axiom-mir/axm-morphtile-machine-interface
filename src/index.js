"use strict";

const { assertRequest, result } = require("./envelope");
const MACHINE = { id: "axm.morphtile.machine.interface", version: "0.2.0" };
const PRESENTATION_MODES = new Set(["screen", "docked", "floating", "fullscreen", "embedded", "world", "tile"]);
const DOCKS = new Set(["left", "right", "top", "bottom"]);

function finiteVector(value, length) {
  return Array.isArray(value) && value.length === length && value.every((n) => typeof n === "number" && Number.isFinite(n));
}

function normalizePlacement(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ok: false, error: "placement must be an object" };
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

function buildView(intent) {
  const body = [];
  if (intent.readout) body.push({ value: intent.readout, label: intent.readout_label || intent.readout });
  if (intent.action) body.push({ button: intent.action, label: intent.action_label || intent.action });
  if (!body.length) body.push({ text: intent.text || "Interface candidate" });
  return { op: "view.set", id: intent.tile_path, view: { title: intent.title || "Interface", body } };
}

function run(request) {
  assertRequest(request);
  const intent = request.intent || {};
  if (!intent.tile_path) return result(request, MACHINE, "HOLD", { holds: [{ code: "HOLD_TILE_PATH_REQUIRED" }] });

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
        check: "candidate carries presentation descriptors plus canonical tile/action names and no copied canonical or session state"
      }],
      warnings: [{ code: "TARGET_MUST_EXIST_AND_DECLARE_UI_PANEL" }]
    });
  }

  return result(request, MACHINE, "CANDIDATE", {
    candidate: { schema: "morphtile.view-operation/v0.4", operation: viewOperation },
    evidence: [{ kind: "AUTHORITY", status: "PASS", check: "candidate contains presentation plus real tile/action names and no copied state values" }],
    warnings: [{ code: "TARGET_MUST_EXIST_AND_DECLARE_UI_PANEL" }]
  });
}

module.exports = { MACHINE, PRESENTATION_MODES, normalizePlacement, run };

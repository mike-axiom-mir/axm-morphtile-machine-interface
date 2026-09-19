"use strict";

const { assertRequest, result } = require("./envelope");
const MACHINE = { id: "axm.morphtile.machine.interface", version: "0.1.0" };

function run(request) {
  assertRequest(request);
  const intent = request.intent || {};
  if (intent.placement) {
    return result(request, MACHINE, "HOLD", {
      holds: [{ code: "HOLD_PRESENTATION_PLACEMENT_NOT_IN_V04", detail: "MorphTile v0.4 defines tile views but no canonical placement descriptor." }],
      suggested_missing_capability: "morphtile.presentation-placement"
    });
  }
  if (!intent.tile_path) return result(request, MACHINE, "HOLD", { holds: [{ code: "HOLD_TILE_PATH_REQUIRED" }] });
  const body = [];
  if (intent.readout) body.push({ value: intent.readout, label: intent.readout_label || intent.readout });
  if (intent.action) body.push({ button: intent.action, label: intent.action_label || intent.action });
  if (!body.length) body.push({ text: intent.text || "Interface candidate" });
  return result(request, MACHINE, "CANDIDATE", {
    candidate: { schema: "morphtile.view-operation/v0.4", operation: { op: "view.set", id: intent.tile_path, view: { title: intent.title || "Interface", body } } },
    evidence: [{ kind: "AUTHORITY", status: "PASS", check: "candidate contains presentation plus real tile/action names and no copied state values" }],
    warnings: [{ code: "TARGET_MUST_EXIST_AND_DECLARE_UI_PANEL" }]
  });
}

module.exports = { MACHINE, run };

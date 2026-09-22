"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const manifest = require("../machine.json");
const { run, PRESENTATION_KEYS, PRESENTATION_MODES } = require("../src");

const corePath = process.env.MORPHTILE_CORE;
const runtimeCommit = process.env.MORPHTILE_COMMIT;

function assertPinnedRuntime() {
  assert.equal(runtimeCommit, manifest.tested_against.commit, "CI runtime must match machine.json tested_against.commit");
}

function request(placement) {
  return {
    envelope_version: "0.1",
    request_id: "presentation-layer-substrate-boundary",
    goal: "Keep presentation layer authoring held until MorphTile exposes a canonical substrate primitive",
    intent: {
      tile_path: "mt_tower",
      title: "Layer boundary",
      text: "No private z-order contract",
      placement
    },
    provenance: { caller: "presentation-layer-substrate-boundary-integration-test" }
  };
}

test("presentation layer authoring stays held while the exact pinned MorphTile substrate has no layer field", { skip: !corePath }, () => {
  assertPinnedRuntime();
  const MT = require(path.resolve(corePath));

  assert.deepEqual([...PRESENTATION_MODES].sort(), [...MT.PRESENTATION_MODES].sort(),
    "if pinned MorphTile presentation modes move, Interface must explicitly reassess its bounded mode vocabulary before claiming compatibility");
  assert.equal(PRESENTATION_KEYS.has("layer"), false, "Interface must not invent a private presentation layer field");

  const out = run(request({
    mode: "floating",
    preferred_position: [12, 18],
    user_adjustable: false,
    layer: 2
  }));

  assert.equal(out.status, "HOLD");
  assert.equal(out.holds[0].code, "HOLD_INVALID_PRESENTATION_PLACEMENT");
  assert.match(out.holds[0].detail, /unsupported field\(s\): layer/);
  assert.equal(out.candidate, null);

  const coreError = MT.presentationError({
    mode: "floating",
    preferred_position: [12, 18],
    user_adjustable: false,
    layer: 2
  });
  assert.match(coreError || "", /presentation unknown fields: layer/,
    "if pinned MorphTile begins accepting canonical layer matter this guard must fail so Interface can reassess the HOLD instead of silently drifting behind the substrate");
});

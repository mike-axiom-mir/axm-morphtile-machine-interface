const test = require("node:test");
const assert = require("node:assert/strict");
const { run } = require("../src");

function request(requestId, placement) {
  return {
    envelope_version: "0.1",
    request_id: requestId,
    goal: "Author bounded presentation matter without inert placement fields",
    intent: {
      tile_path: "mt_tower",
      title: "Presentation contract",
      text: "Bounded presentation matter",
      placement
    },
    provenance: { caller: "presentation-contract-test" }
  };
}

test("holds an anchor outside tile mode instead of persisting an inert canonical field", () => {
  const out = run(request("screen-anchor-held", {
    mode: "screen",
    anchor: "mt_island",
    user_adjustable: false
  }));

  assert.equal(out.status, "HOLD");
  assert.equal(out.holds[0].code, "HOLD_INVALID_PRESENTATION_PLACEMENT");
  assert.match(out.holds[0].detail, /anchor/);
  assert.match(out.holds[0].detail, /tile/);
  assert.equal(out.candidate, null);
});

test("tile mode preserves an explicit anchor and emits the matching proof dependency", () => {
  const out = run(request("tile-anchor-explicit", {
    mode: "tile",
    anchor: "mt_island",
    user_adjustable: false
  }));

  assert.equal(out.status, "CANDIDATE");
  assert.deepEqual(out.candidate.operations[1], {
    op: "presentation.set",
    id: "mt_tower",
    presentation: { mode: "tile", anchor: "mt_island", user_adjustable: false }
  });
  assert.deepEqual(out.dependencies.map((dependency) => dependency.id), [
    "morphtile.interface-target-proof:mt_tower",
    "morphtile.presentation-anchor-proof:mt_island"
  ]);
});

test("tile mode may use MorphTile's native self-anchor default without inventing an extra dependency", () => {
  const out = run(request("tile-anchor-default", {
    mode: "tile",
    user_adjustable: false
  }));

  assert.equal(out.status, "CANDIDATE");
  assert.deepEqual(out.candidate.operations[1], {
    op: "presentation.set",
    id: "mt_tower",
    presentation: { mode: "tile", user_adjustable: false }
  });
  assert.deepEqual(out.dependencies.map((dependency) => dependency.id), [
    "morphtile.interface-target-proof:mt_tower"
  ]);
});

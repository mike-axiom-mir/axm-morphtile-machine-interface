# Status

- Machine version: 0.5.5
- State: CANDIDATE — EXACT-HEAD CI + INDEPENDENT VERIFICATION REQUIRED
- Local tests: `npm test`
- MorphTile target: v0.4 at `2bdf8eade1376055473b9cc1b11734b72a5566e5`
- Assembly receiver target: `e62e299f18588ef0146b7db3a864dcad8c06c125`
- Envelope: provisional v0.1
- Visual proof: none

## Implemented in this candidate

- Interface Machine can author bounded same-container tile-owned composition with `{ kind: "tile", tile_id: "mt_core" }`, compiling directly to MorphTile's native `{ tile: "mt_core" }` view node.
- `tile_id` is deliberately one local MorphTile id only (`[A-Za-z0-9_-]+`). Slash-separated/full-path addressing HOLDs rather than silently widening this producer into cross-container authority.
- Local tile references carry no target state, target action bindings or bridge authority. The referenced tile remains owner of its own view/state/actions.
- Missing local targets are not fabricated: current pinned MorphTile renders them as visible inert `v-missing` matter during read-only view compilation.
- Interface Machine still generates complete ordered tile-owned `view.body` matter atomically through `intent.elements`, with MorphTile-native row/group, bounded `when`, bounded `repeat`, bounded meter, controls and safe symbolic actions.
- Interactive/state-read descendants require exact symbolic declarations in `intent.bindings`; requested-but-undeclared and declared-but-unused names both HOLD.
- Every emitted interface still carries a stable `morphtile.interface-target-proof/v0.1` dependency for the interface's actual owning target. Local embedded tiles do not inherit or duplicate that parent proof because composition names existing view matter only.
- Tile-mode anchors carry the separate stable `morphtile.presentation-anchor-proof/v0.1` existence dependency.
- Authored Interface intent/envelope data still crosses the descriptor-safe portable-data boundary before semantic fields are read; accessors, hidden transport hooks, nonportable values and Proxies fail closed.
- Current integration evidence targets MorphTile `2bdf8eade1376055473b9cc1b11734b72a5566e5` and Assembly `e62e299f18588ef0146b7db3a864dcad8c06c125`.

## Why this belongs in Interface Machine

MorphTile core already contains the universal native `{ tile: ... }` view primitive, same-container resolution, recursion/missing-target safety, and read-only compilation. The creation gap was producer vocabulary: Interface Machine could compose text/state/control primitives but could not ask for ordinary tile-owned view matter. Therefore this candidate adds only the smallest bounded authoring form and compiles into existing core semantics. No MorphTile core change, private evaluator, duplicate state representation, or new bridge behavior is required.

## Evidence required before integration

- full Interface Machine unit suite on the exact candidate head;
- pinned MorphTile integration against `machine.json.tested_against.commit`;
- positive runtime proof that `{ kind: "tile", tile_id: "mt_core" }` commits through clone → plan → commit, resolves through real `compilePanel`, renders existing `mt_core` matter and leaves canonical structure unchanged while rendering;
- negative runtime proof that a missing local tile id stays visibly inert rather than fabricating matter, followed by exact rollback;
- validation proof that empty, slash-separated, absolute-looking and whitespace-bearing tile ids HOLD;
- authority proof that extra fields such as copied `state_value` HOLD instead of being retained;
- preserved existing action/control/state-read authority regressions;
- Assembly receiver integration against exact `e62e299f18588ef0146b7db3a864dcad8c06c125`;
- independent Verification of the exact final PR head before Director integration.

Compatibility is earned only when the exact updated candidate head is green and independent Verification has replayed the claimed boundary.

## Reusable rules learned

- If MorphTile core already provides a universal composition primitive, Interface Machine should expose the smallest authoring vocabulary that compiles into it rather than introducing a second runtime mechanism.
- A composition reference should name existing matter, not copy its state, actions or permissions. Ownership stays with the referenced tile.
- Local symbolic composition and cross-container addressing are different authority surfaces. Support the local case independently when it is sufficient and proven; do not smuggle the broader path grammar into the first producer feature.
- Missing referenced matter should remain visibly inert/fail-closed in the runtime rather than causing Interface Machine to invent target state.
- Producer compatibility pins are evidence identities. Refresh them when a real candidate depends on the receiver/runtime relation, not as standalone activity.

## HELD / open

- Independent Verification of the exact 0.5.5 candidate head remains required before Director integration.
- Full-path/cross-container tile embedding remains unclaimed until its path ownership and proof semantics are separately bounded.
- Host rendering evidence and arbitrary responsive/pixel interface-layout design remain unclaimed.
- Ambient host permissions remain unclaimed.
- Positive host visual-quality evidence for supported presentation modes remains NOT_TESTED.
- Compatibility beyond the exact pinned MorphTile and Assembly revisions remains unclaimed.
- Arbitrary MorphTile expression authoring and local repeat-index-dependent child expressions remain unclaimed.
- The provisional v0.1 envelope is Interface-local evidence, not a claimed universal cross-machine envelope standard.
- Visual quality remains NOT_TESTED.

No claim of autonomous creation, production readiness, CANON, or visual quality is made.

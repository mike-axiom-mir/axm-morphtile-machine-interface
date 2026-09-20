# Status

- Machine version: 0.5.6
- State: CANDIDATE — EXACT-HEAD CI + INDEPENDENT VERIFICATION REQUIRED
- Local tests: `npm test`
- MorphTile target: v0.4 at `2bdf8eade1376055473b9cc1b11734b72a5566e5`
- Assembly receiver target: `1a28d546cfa986c00b44abe444ea7b2dd4b56283`
- Envelope: provisional v0.1
- Visual proof: none

## Implemented in this candidate

- Interface Machine still supports bounded local composition with `{ kind: "tile", tile_id: "mt_core" }`.
- It now also supports an explicit canonical multi-segment same-root path with `{ kind: "tile", tile_path: "mt_shell/mt_inner" }` when the embedded path shares the interface target's top-level MorphTile root.
- Same-root paths compile to MorphTile's native absolute-looking `{"tile":"/mt_shell/mt_inner"}` form so runtime resolution is exact rather than relying on the core's root-relative fallback order.
- Cross-root paths return `HOLD_INTERFACE_TILE_SCOPE`; they are not treated as ordinary composition and no bridge or permission is synthesized.
- A tile element must provide exactly one of `tile_id` or `tile_path`. Local IDs remain one segment; explicit paths must be canonical multi-segment MorphTile paths.
- Embedded tile references carry no copied target state, target actions, permissions, parent bindings, or bridge state. The referenced tile remains owner of its own view/state/runtime action bindings.
- Interface generation remains bounded to existing ordered/nested row/group, meter, conditional, repeat, control and safe symbolic action machinery.
- Existing source-integrity, target-proof, presentation and binding boundaries remain unchanged.
- Assembly receiver evidence is refreshed to current integrated Assembly main `1a28d546cfa986c00b44abe444ea7b2dd4b56283`.

## Why this belongs in Interface Machine

Current MorphTile core already contains the universal `{ tile: ... }` view primitive, accepts explicit path-like tile references, performs runtime resolution, owns recursion/missing-target safety, and compiles embedded views read-only. The remaining gap was producer vocabulary and scope policy. Interface Machine therefore adds only bounded same-root authoring and compiles into existing core semantics. No new core primitive, duplicate evaluator, duplicate state surface, or permissionless bridge is introduced.

## Evidence required before integration

- exact-head unit suite;
- pinned MorphTile integration against `machine.json.tested_against.commit`;
- runtime proof that an explicit same-root path resolves the exact nested target through real clone → plan → commit → compilePanel → rollback;
- proof that embedded target view ownership remains unchanged and rendering is structurally read-only;
- validation proof that empty, single-segment, leading-slash, malformed and whitespace-bearing explicit paths HOLD;
- proof that cross-root paths HOLD with `HOLD_INTERFACE_TILE_SCOPE`;
- proof that specifying both local id and explicit path HOLDs;
- preserved local-tile, recursion, action/control/state-read and source-integrity regressions;
- Assembly receiver integration against exact `1a28d546cfa986c00b44abe444ea7b2dd4b56283`;
- independent Verification of the exact final PR head before Director integration.

Compatibility is earned only when the exact candidate head is green and independent Verification has replayed the claimed boundary.

## Reusable rules learned

- A broader path grammar should not silently widen an existing local-reference contract. Make the broader intent explicit and bound it separately.
- When a runtime accepts both relative/fallback and absolute-like references, a producer that knows the exact canonical path should emit the unambiguous form.
- Same-root composition and cross-root composition are different authority surfaces. Same-root view composition can remain ordinary matter while cross-root composition stays held until a separate authority/proof contract exists.
- Composition names existing matter; it does not copy or inherit the referenced tile's canonical state, actions, permissions or bindings.
- Receiver pins are evidence identities and should move when a real candidate is re-proved against the newly integrated receiver.

## HELD / open

- Independent Verification of exact Interface 0.5.6 head remains required before Director integration.
- Cross-root/cross-container tile composition remains unclaimed and explicitly held.
- Host rendering evidence and arbitrary responsive/pixel interface-layout design remain unclaimed.
- Ambient host permissions remain unclaimed.
- Positive host visual-quality evidence for supported presentation modes remains NOT_TESTED.
- Compatibility beyond the exact pinned MorphTile and Assembly revisions remains unclaimed.
- Arbitrary MorphTile expression authoring and local repeat-index-dependent child expressions remain unclaimed.
- The provisional v0.1 envelope is Interface-local evidence, not a claimed universal cross-machine envelope standard.
- Visual quality remains NOT_TESTED.

No claim of autonomous creation, production readiness, CANON, or visual quality is made.

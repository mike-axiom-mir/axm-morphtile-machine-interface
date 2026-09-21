# Changelog

## 0.5.7 — 2026-09-21

- Tightened presentation authoring so `placement.anchor` is accepted only when `placement.mode` is `tile`, matching the only MorphTile runtime branch that resolves an anchor.
- Added regression-first evidence that previous Interface behavior accepted a `screen` presentation with an inert canonical anchor, then made that request fail closed with `HOLD_INVALID_PRESENTATION_PLACEMENT` instead of preserving meaningless authored matter.
- Preserved MorphTile's native tile-mode self-anchor default: tile presentation may still omit `anchor`; an explicit tile anchor still produces the existing tile-existence proof dependency.
- Re-pinned Assembly receiver evidence to current integrated Assembly main `fae372da63ceeb1b4c3711f0b2b0b22b68bb909d` without widening receiver authority.
- Kept MorphTile core unchanged because the universal presentation runtime already exists; this is producer-side semantic consumption policy.

## 0.5.6 — 2026-09-20

- Added bounded explicit same-root tile-path composition with authored `{ kind: "tile", tile_path: "mt_shell/mt_inner" }`.
- Compiled canonical same-root paths to MorphTile's unambiguous native `{ tile: "/mt_shell/mt_inner" }` form while preserving local `tile_id` composition separately.
- Rejected cross-root paths with `HOLD_INTERFACE_TILE_SCOPE`, ambiguous dual addressing, malformed paths, and authority-shaped extras rather than widening composition into an implicit bridge.
- Added pinned runtime proof that the exact nested tile resolves through real MorphTile compilation, keeps ownership of its own view/state/action bindings, remains render-read-only, and rolls back exactly.
- Independent Verification replayed the exact candidate before Director integration; PR #17 was subsequently merged as Interface main `1a941f8ff88ca590952571e3eeeeeeef6daefd77`.

## 0.5.5 — 2026-09-20

- Added bounded same-container tile-owned view composition with authored `{ kind: "tile", tile_id: "mt_core" }`.
- Compiled the local reference directly to MorphTile's existing native tile-view primitive without copying target state, actions, permissions, bindings, or bridge state.
- Kept local IDs to one segment so ordinary same-container composition did not silently become cross-container authority.
- Added real runtime proof that existing tile-owned matter resolves read-only and missing local targets stay visibly inert instead of causing target fabrication.

## 0.5.4 — 2026-09-20

- Added bounded canonical-state repeat generation with authored `{ kind: "repeat", binding, step, max, children }` containers.
- Compiled repeat count to MorphTile's existing native expression `max(0, min(max, floor(var / step)))` and native repeat node; no private evaluator or copied state surface was added.
- Reused the existing symbolic state-read declaration/proof lane, so repeat bindings must be declared in `intent.bindings.readouts` and the receiver must prove the actual target logic variable.
- Bounded `step` to a positive finite number, `max` to an integer from 1 through 16, and worst-case expanded layout to the existing 64-node interface budget before emission.
- Added pinned runtime proof that generated repeat matter follows real `mt_tower.beacon` state across the real `toggle` signal, remains render-read-only, and rolls back the structural edit exactly.
- Re-pinned MorphTile integration to current merged core `2bdf8eade1376055473b9cc1b11734b72a5566e5`; Assembly receiver evidence remains on current integrated Assembly `08836233457d90b571063a8342434c572b87cd5e` while Assembly PR #22 stays in its own lane.
- Explicitly left local repeat-index expressions, arbitrary expressions, cross-tile embedding and host visual-quality claims outside this candidate.

## 0.5.3 — 2026-09-20

- Added bounded canonical-state conditional visibility with authored `{ kind: "when", binding, children }` containers.
- Compiled `when` to MorphTile's existing native `{ group: [...], when: ["var", binding] }` view primitive instead of adding a private evaluator or copied state surface.
- Reused the existing symbolic state-read declaration/proof lane so conditional bindings must be declared in `intent.bindings.readouts` and receiver proof must establish the actual target logic variable.
- Applied the existing recursive node/depth budgets and fail-closed unknown-field handling to conditional containers.
- Added pinned runtime proof that visibility follows real `mt_tower.beacon` state across the real `toggle` signal, remains render-read-only, preserves real input-action authority inside the visible group, and rolls back exactly.
- Re-pinned the real candidate to current integrated MorphTile `63a65c70bb702cb9ac979ec04233ffaa7ed5d179` and Assembly receiver `08836233457d90b571063a8342434c572b87cd5e`.
- Kept output schemas at v0.5 and explicitly left arbitrary expressions, repeat generation, cross-tile embedding and host visual-quality claims outside this lane.

## 0.5.2 — 2026-09-20

- Added stable target-local proof dependencies for interface targets instead of treating symbolic names as target authority.
- Interface target proof now describes tile existence, `ui_panel`, readout variable, parameter ID and input-signal socket requirements without copying canonical or session values.
- Added stable tile-existence proof for tile-mode presentation anchors only, matching the runtime reference that actually needs resolution.
- Added receiver integration evidence that preserves proof identity and rejects same-ID contradictory requirements.
- Re-pinned MorphTile integration to merged core `d2d2df0e4ad88f1cda885e3eb1394151515e7946` after the universal custom-view action-authority repair landed.
- Added a negative runtime proof that symbolic action `lit`, which names an output signal socket rather than an exposed input action, remains visible but inert and never gains `data-signal` authority.
- Kept machine output schemas at v0.5; the evidence refresh does not add a new interface representation or authority layer.

## 0.5.1 — 2026-09-20

- Corrected Interface Machine target normalization to accept canonical MorphTile paths such as `mt_shell/mt_room/mt_panel`, not only one-segment tile IDs.
- Applied the same full-path rule to tile presentation anchors while still rejecting leading, trailing, empty, traversal-like and whitespace-containing segments.
- Kept the v0.5 candidate schemas unchanged; this is a compatibility correction to machine-side request normalization, not a new MorphTile representation.
- Added pinned runtime evidence that `view.set` and `presentation.set` target a real nested tile, resolve a nested tile anchor, compile through the real panel runtime and roll back exactly.

## 0.5.0 — 2026-09-20

- Added MorphTile-native nested relative layout through `row` and `group` elements with recursive `children`.
- Preserved authored order recursively while keeping layout structural rather than introducing a private pixel/layout authority.
- Applied explicit readout/action/control binding validation recursively through nested layout.
- Bounded each interface layout tree to 64 total nodes and six container levels.
- Added fail-closed regressions for empty containers, excessive depth, whole-tree node budget and authority-shaped nested fields.
- Re-pinned exact integration evidence to current MorphTile main `ef2b3c6986aa1a333247feffc43a8443f17239d0`.
- Added pinned runtime proof that nested row/group layout materializes real MorphTile controls/actions without copying canonical values and remains exactly rollbackable.

## 0.4.0 — 2026-09-20

- Added ordered `intent.elements` so a complete MorphTile `view.body` can be authored atomically rather than through overwrite-prone repeated `view.set` candidates.
- Added bounded `text`, `readout`, `control` and `action` element kinds with authored-order preservation.
- Rejected ambiguous mixing of legacy body fields with ordered elements.
- Applied a 64-element bound and retained fail-closed unknown-field and symbolic-binding boundaries.
- Added pinned runtime proof that authored control-before-text order survives real MorphTile panel compilation and exact rollback.

## 0.3.0 — 2026-09-20

- Added a fail-closed top-level interface intent contract so unsupported or misspelled fields cannot disappear silently.
- Bounded tile and anchor references to MorphTile-compatible symbolic tile IDs.
- Rejected orphan labels and binding declarations that would otherwise be ignored.
- Preserved explicitly authored text beside readouts, controls and actions instead of dropping it when interactive nodes are present.
- Preserved explicit empty titles/labels rather than replacing them through truthiness fallbacks.
- Re-pinned exact MorphTile runtime conformance to `a579182ae585e5722ac87dd0cc8209963b18d000` and made CI assert that runtime identity matches `machine.json`.
- Added pinned runtime proof that explanatory text and a canonical parameter control coexist without copying or changing the parameter value.

## 0.2.0 — 2026-09-20

- Retained the original view-only candidate shape for requests without placement.
- Added deterministic `presentation.set` output when placement is requested.
- Whitelisted public presentation fields so canonical/session snapshots cannot leak into candidate matter.
- Added invalid-placement HOLDs.
- Added a GitHub integration lane pinned to MorphTile `fea73dc1a838f90abdf7c3db8b52b23224792137`.

## 0.1.0 — 2026-09-19

- Established the isolated repository boundary.
- Added provisional envelope v0.1, machine manifest, fixture, executable proof, tests, and minimal CI.
- Pinned the exact MorphTile v0.4 commit tested as a contract target.
- Recorded unsupported work as HOLD or NOT TESTED.

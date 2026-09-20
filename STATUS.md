# Status

- Machine version: 0.5.2
- State: CANDIDATE — EXACT-HEAD CI REQUIRED
- Local tests: `npm test`
- MorphTile target: v0.4 at `429a344f7d9333bef01cf9de1c292c3af09abec2`
- Envelope: provisional v0.1
- Visual proof: none

## Implemented in this candidate

- Interface Machine generates a complete ordered tile-owned `view.body` in one request through `intent.elements`, avoiding overwrite-prone repeated `view.set` construction.
- Relative layout uses MorphTile-native `row` and `group` nodes with recursive `children`; no private pixel/layout state is introduced.
- The full nested tree is bounded to 64 total nodes and six container levels.
- Interactive descendants require exact symbolic declarations in `intent.bindings`; requested-but-undeclared and declared-but-unused names both HOLD.
- Unknown nested and top-level fields HOLD instead of being silently ignored, including authority-shaped extras such as copied state values.
- Canonical nested MorphTile paths are accepted for interface targets and tile-mode presentation anchors.
- Every emitted interface carries a stable `morphtile.interface-target-proof/v0.1` dependency describing the exact target-local facts a receiver must prove: tile existence, `ui_panel`, readout variables, parameter IDs and input-signal socket IDs.
- Tile-mode anchors carry a separate stable `morphtile.presentation-anchor-proof/v0.1` tile-existence dependency.
- Proof dependencies carry no canonical/session values and do not grant authority.
- Current integration evidence targets MorphTile `429a344f7d9333bef01cf9de1c292c3af09abec2`, where only real input-signal sockets become custom-view actions. Internal rule names, attach sockets, output-signal names and missing socket names remain visibly inert.
- Missing tile-mode anchors resolve to `HOLD_MISSING_PRESENTATION_ANCHOR` without mutating canonical matter.
- Unsupported host presentation modes resolve to `HOLD_UNSUPPORTED_PRESENTATION` without rewriting portable presentation matter.

## Why this belongs in Interface Machine

MorphTile core already represents and compiles ordered view bodies, row/group structure and presentation descriptors. Interface Machine owns deterministic creation, fail-closed request normalization and explicit proof obligations. Target-local proof resolution remains receiver/Verification work; universal runtime enforcement remains MorphTile core.

The new presentation HOLD coverage is evidence machinery, not a new host authority contract. No duplicate canonical interface, state, permission or host authority is introduced here.

## Evidence required before integration

- full Interface Machine unit suite on the exact candidate head;
- pinned MorphTile integration against `machine.json.tested_against.commit`;
- positive proof that a declared real input action remains actionable;
- negative proof that internal rules, attach sockets, output signal sockets and missing names do not become UI action authority;
- negative proof that missing anchors and unsupported host modes HOLD visibly without canonical mutation;
- preserved target-proof dependency identity without copied state;
- exact rollback after interface commits;
- Assembly receiver integration against its separately pinned exact revision.

Compatibility is earned only when the exact updated candidate head is green.

## Reusable rules learned

- A producer may author and transport symbolic action intent, but a symbolic name never creates authority. The producer must emit the target-local proof obligation; the receiver/core must prove and enforce the actual exposed input authority.
- Presentation descriptors are portable canonical matter; host inability to render a mode is a typed runtime HOLD, not permission to rewrite the descriptor or invent host authority.

## HELD / open

- Host rendering evidence and arbitrary responsive/pixel interface-layout design remain unclaimed.
- Ambient host permissions remain unclaimed.
- Positive host visual-quality evidence for supported presentation modes remains NOT_TESTED.
- Compatibility beyond the exact pinned MorphTile and Assembly revisions remains unclaimed.
- Visual quality remains NOT_TESTED.

No claim of autonomous creation, production readiness, CANON, or visual quality is made.

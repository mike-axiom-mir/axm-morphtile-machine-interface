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
- Bounded `meter` elements bind one declared symbolic readout variable with an explicit finite `min < max` range and compile to MorphTile's native `meter: ["var", name]` expression. The machine never snapshots the target variable value.
- Unknown nested and top-level fields HOLD instead of being silently ignored, including authority-shaped extras such as copied state values.
- Canonical nested MorphTile paths are accepted for interface targets and tile-mode presentation anchors.
- Every emitted interface carries a stable `morphtile.interface-target-proof/v0.1` dependency describing the exact target-local facts a receiver must prove: tile existence, `ui_panel`, readout/meter variables, parameter IDs and input-signal socket IDs.
- Tile-mode anchors carry a separate stable `morphtile.presentation-anchor-proof/v0.1` tile-existence dependency.
- Proof dependencies carry no canonical/session values and do not grant authority.
- Authored Interface intent crosses a descriptor-safe portable-data boundary before semantic fields are read or copied. Accessor-backed fields, hidden `toJSON`, explicit `undefined`, non-finite numbers, negative zero, cycles, sparse/custom arrays, symbol-keyed fields and other nonportable intent data HOLD rather than executing caller code or being silently rewritten by JSON transport.
- `request.intent` itself is inspected by property descriptor, so an accessor cannot run merely because Interface begins normalization.
- Live/revoked JavaScript Proxies are rejected before reflective intent inspection, and the request envelope plus provenance are likewise checked before accessors, `toJSON`, Proxy traps or transport rewriting can execute caller code.
- Current integration evidence targets MorphTile `429a344f7d9333bef01cf9de1c292c3af09abec2`, where only real input-signal sockets become custom-view actions. Internal rule names, attach sockets, output-signal names and missing socket names remain visibly inert.
- Missing tile-mode anchors resolve to `HOLD_MISSING_PRESENTATION_ANCHOR` without mutating canonical matter.
- Unsupported host presentation modes resolve to `HOLD_UNSUPPORTED_PRESENTATION` without rewriting portable presentation matter.

## Why this belongs in Interface Machine

MorphTile core already represents and compiles ordered view bodies, row/group structure, native meters and presentation descriptors. Interface Machine owns deterministic creation, fail-closed request normalization, preservation of its authored intent before transport, and explicit proof obligations. Target-local proof resolution remains receiver/Verification work; universal runtime enforcement remains MorphTile core.

The source-integrity repairs are creation-side input/envelope preservation boundaries, not new MorphTile representation. The meter rule is a bounded producer vocabulary over MorphTile's existing expression/runtime primitive, not a copied state surface. The presentation HOLD coverage is evidence machinery, not a new host authority contract. No duplicate canonical interface, state, permission or host authority is introduced here.

## Evidence required before integration

- full Interface Machine unit suite on the exact candidate head;
- pinned MorphTile integration against `machine.json.tested_against.commit`;
- meter proof that the generated native meter follows the target's canonical variable at render time while the candidate contains only the symbolic variable and explicit range;
- positive proof that a declared real input action remains actionable;
- negative proof that internal rules, attach sockets, output signal sockets and missing names do not become UI action authority;
- negative proof that missing anchors and unsupported host modes HOLD visibly without canonical mutation;
- source-integrity regressions proving Interface intent/envelope accessors, hidden transport hooks and live/revoked Proxy interception do not execute while ordinary portable authored data remains unchanged;
- preserved target-proof dependency identity without copied state;
- exact rollback after interface commits;
- Assembly receiver integration against its separately pinned exact revision.

Compatibility is earned only when the exact updated candidate head is green.

## Reusable rules learned

- A producer may author and transport symbolic action or state-view intent, but a symbolic name never creates authority or a second value store. The producer must emit the target-local proof obligation; the receiver/core must prove and enforce the actual target binding.
- When MorphTile already has a universal view primitive, expose the smallest producer vocabulary that compiles into it instead of duplicating its evaluator. A meter therefore authors one symbolic variable plus an explicit range and lets MorphTile read the live value.
- Presentation descriptors are portable canonical matter; host inability to render a mode is a typed runtime HOLD, not permission to rewrite the descriptor or invent host authority.
- A rejection is not fail-closed source integrity if caller-controlled code already ran or transport already rewrote authorship while deciding to reject it. Establish interception/descriptor/portability admissibility before reading or serializing authored Interface data.

## HELD / open

- Host rendering evidence and arbitrary responsive/pixel interface-layout design remain unclaimed.
- Ambient host permissions remain unclaimed.
- Positive host visual-quality evidence for supported presentation modes remains NOT_TESTED.
- Compatibility beyond the exact pinned MorphTile and Assembly revisions remains unclaimed.
- Arbitrary MorphTile expression authoring, conditional/repeated view generation and cross-tile embedding remain unclaimed until their proof/dependency semantics are separately bounded; this meter candidate does not silently widen into them.
- The provisional v0.1 envelope is Interface-local evidence, not a claimed universal cross-machine envelope standard.
- Visual quality remains NOT_TESTED.

No claim of autonomous creation, production readiness, CANON, or visual quality is made.

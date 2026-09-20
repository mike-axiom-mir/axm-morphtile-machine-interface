# Status

- Machine version: 0.5.4
- State: CANDIDATE — EXACT-HEAD CI + INDEPENDENT VERIFICATION REQUIRED
- Local tests: `npm test`
- MorphTile target: v0.4 at `2bdf8eade1376055473b9cc1b11734b72a5566e5`
- Assembly receiver target: `08836233457d90b571063a8342434c572b87cd5e`
- Envelope: provisional v0.1
- Visual proof: none

## Implemented in this candidate

- Interface Machine generates a complete ordered tile-owned `view.body` in one request through `intent.elements`, avoiding overwrite-prone repeated `view.set` construction.
- Relative layout uses MorphTile-native `row` and `group` nodes with recursive `children`; no private pixel/layout state is introduced.
- Bounded conditional visibility uses a MorphTile-native group carrying `when: ["var", binding]`. The machine authors only one symbolic truthy canonical-state read and never copies the condition value or implements a second expression evaluator.
- Bounded canonical-state repeat uses `{ kind: "repeat", binding, step, max, children }` and compiles to MorphTile's native repeat count `max(0, min(max, floor(var / step)))` with `as: "i"`. The machine carries only the declared symbolic variable, a positive finite step, an integer cap from 1 through 16, and bounded child matter.
- `when` and `repeat` bindings reuse the existing readout/state-read proof lane, so a receiver must prove the named logic variable exists on the actual target before accepting the candidate.
- The authored nested tree is bounded to 64 total nodes and six row/group/when/repeat container levels. Repeat also proves its worst-case expanded tree stays within the same 64-node bound before emission.
- Interactive/state-read descendants require exact symbolic declarations in `intent.bindings`; requested-but-undeclared and declared-but-unused names both HOLD.
- Bounded `meter` elements bind one declared symbolic readout variable with an explicit finite `min < max` range and compile to MorphTile's native `meter: ["var", name]` expression. The machine never snapshots the target variable value.
- Unknown nested and top-level fields HOLD instead of being silently ignored, including authority-shaped extras such as copied state values.
- Canonical nested MorphTile paths are accepted for interface targets and tile-mode presentation anchors.
- Every emitted interface carries a stable `morphtile.interface-target-proof/v0.1` dependency describing the exact target-local facts a receiver must prove: tile existence, `ui_panel`, state-read variables, parameter IDs and input-signal socket IDs.
- Tile-mode anchors carry a separate stable `morphtile.presentation-anchor-proof/v0.1` tile-existence dependency.
- Proof dependencies carry no canonical/session values and do not grant authority.
- Authored Interface intent crosses a descriptor-safe portable-data boundary before semantic fields are read or copied. Accessor-backed fields, hidden `toJSON`, explicit `undefined`, non-finite numbers, negative zero, cycles, sparse/custom arrays, symbol-keyed fields and other nonportable intent data HOLD rather than executing caller code or being silently rewritten by JSON transport.
- `request.intent` itself is inspected by property descriptor, so an accessor cannot run merely because Interface begins normalization.
- Live/revoked JavaScript Proxies are rejected before reflective intent inspection, and the request envelope plus provenance are likewise checked before accessors, `toJSON`, Proxy traps or transport rewriting can execute caller code.
- Current integration evidence targets MorphTile `2bdf8eade1376055473b9cc1b11734b72a5566e5`, where only real input-signal sockets become custom-view actions. Internal rule names, attach sockets, output-signal names and missing socket names remain visibly inert.
- Missing tile-mode anchors resolve to `HOLD_MISSING_PRESENTATION_ANCHOR` without mutating canonical matter.
- Unsupported host presentation modes resolve to `HOLD_UNSUPPORTED_PRESENTATION` without rewriting portable presentation matter.

## Why this belongs in Interface Machine

MorphTile core already represents and compiles ordered view bodies, row/group structure, native `when` and `repeat` expressions, native meters and presentation descriptors. Interface Machine owns deterministic creation, fail-closed request normalization, preservation of authored intent before transport, bounded producer vocabulary and explicit proof obligations. Target-local proof resolution remains receiver/Verification work; universal runtime enforcement remains MorphTile core.

The repeat rule is a bounded producer vocabulary over MorphTile's existing evaluator: one declared target-local variable is divided by an explicit positive step, floored and clamped to an explicit maximum. It does not add an expression language, second state surface, local evaluator or hidden runtime permission. No new MorphTile substrate primitive is required.

## Evidence required before integration

- full Interface Machine unit suite on the exact candidate head;
- pinned MorphTile integration against `machine.json.tested_against.commit`;
- repeat runtime proof that generated repeated matter is absent while canonical `mt_tower.beacon` is `0`, appears once after the real `toggle` signal sets it to `1`, does not mutate canonical matter while rendering, restores runtime state, and rolls back the structural edit exactly;
- repeat validation proof for positive finite `step`, integer `max` 1..16, symbolic binding declaration, fail-closed unknown fields and worst-case expanded-node budget;
- conditional runtime proof that generated `when` matter is hidden while canonical `mt_tower.beacon` is `0`, appears after the real `toggle` signal sets it to `1`, does not mutate canonical matter while rendering, preserves real action authority inside the visible group, restores runtime state, and rolls back the structural edit exactly;
- meter proof that the generated native meter follows the target's canonical variable at render time while the candidate contains only the symbolic variable and explicit range;
- positive proof that a declared real input action remains actionable;
- negative proof that internal rules, attach sockets, output signal sockets and missing names do not become UI action authority;
- negative proof that missing anchors and unsupported host modes HOLD visibly without canonical mutation;
- source-integrity regressions proving Interface intent/envelope accessors, hidden transport hooks and live/revoked Proxy interception do not execute while ordinary portable authored data remains unchanged;
- preserved target-proof dependency identity without copied state;
- exact rollback after interface commits;
- Assembly receiver integration against `08836233457d90b571063a8342434c572b87cd5e`.

Compatibility is earned only when the exact updated candidate head is green and independent Verification has replayed the claimed boundary.

## Reusable rules learned

- A producer may author and transport symbolic action or canonical-state-read intent, but a symbolic name never creates authority or a second value store. The producer must emit the target-local proof obligation; the receiver/core must prove and enforce the actual target binding.
- When MorphTile already has a universal view/evaluation primitive, expose the smallest producer vocabulary that compiles into it instead of duplicating its evaluator. A meter authors one symbolic variable plus an explicit range; a `when` container authors one symbolic truthy variable plus bounded children; a `repeat` container authors one symbolic variable plus an explicit step/cap and bounded children. MorphTile reads the live value.
- Repetition needs an expansion bound as well as an authored-tree bound. A small repeated source tree can otherwise expand beyond the deterministic interface budget at runtime.
- Presentation descriptors are portable canonical matter; host inability to render a mode is a typed runtime HOLD, not permission to rewrite the descriptor or invent host authority.
- A rejection is not fail-closed source integrity if caller-controlled code already ran or transport already rewrote authorship while deciding to reject it. Establish interception/descriptor/portability admissibility before reading or serializing authored Interface data.
- Specialist-local compatibility pins should be refreshed when a real new candidate semantically depends on that runtime/receiver relation, not in a pin-only ping-pong loop.

## HELD / open

- Independent Verification of the exact 0.5.4 candidate head remains required before Director integration.
- Host rendering evidence and arbitrary responsive/pixel interface-layout design remain unclaimed.
- Ambient host permissions remain unclaimed.
- Positive host visual-quality evidence for supported presentation modes remains NOT_TESTED.
- Compatibility beyond the exact pinned MorphTile and Assembly revisions remains unclaimed.
- Arbitrary MorphTile expression authoring, local repeat-index-dependent child expressions and cross-tile embedding remain unclaimed until their proof/dependency semantics are separately bounded. `when` intentionally supports only one truthy symbolic target variable; `repeat` intentionally supports only a clamped floor of one symbolic target variable divided by an explicit step.
- The provisional v0.1 envelope is Interface-local evidence, not a claimed universal cross-machine envelope standard.
- Visual quality remains NOT_TESTED.

No claim of autonomous creation, production readiness, CANON, or visual quality is made.

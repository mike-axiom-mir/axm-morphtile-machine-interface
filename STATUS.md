# Status

- Machine version: 0.5.0
- State: CANDIDATE — EXACT-HEAD CI REQUIRED
- Local tests: `npm test`
- MorphTile target: v0.4 at `ef2b3c6986aa1a333247feffc43a8443f17239d0`
- Envelope: provisional v0.1
- Visual proof: none

## Implemented in this candidate

- Interface Machine can generate a complete ordered view body in one request through `intent.elements` instead of forcing repeated `view.set` calls that overwrite earlier authored interface matter.
- Relative layout now uses MorphTile-native `row` and `group` nodes with recursive `children`; no private pixel/layout state is introduced.
- The full nested tree is bounded to 64 total nodes and six container levels so malformed generation cannot grow without limit.
- Interactive descendants still require explicit symbolic declarations in `intent.bindings`; recursive layout does not widen action/control authority.
- Unknown nested fields HOLD instead of being silently ignored, including authority-shaped extras such as `state_value`.
- Empty layout containers HOLD rather than creating ambiguous no-op structure.
- Legacy single text/readout/control/action fields remain supported for compatibility.
- Legacy body fields and `intent.elements` cannot be mixed, because that would make authored ordering ambiguous.
- Existing fail-closed top-level intent, presentation, placement, label, and symbolic-binding boundaries remain intact.

## Why this belongs in Interface Machine

MorphTile core already represents and compiles ordered `view.body` arrays with `row` and `group` nodes. The missing capability is creation strategy: deterministically assembling bounded nested relative layout while recursively enforcing the same symbolic binding boundary.

No new MorphTile substrate primitive is required for nested relative layout.

## Evidence required before integration

- full Interface Machine unit suite on the exact candidate head;
- pinned MorphTile integration against `machine.json.tested_against.commit`;
- regression proof that existing legacy requests still produce the same semantic candidate shape under v0.5;
- nested-layout regressions for authored order, recursive binding checks, authority-shaped unknown fields, empty containers, depth, and total-node budget;
- pinned runtime proof that native row/group layout compiles to real controls/actions without copying or mutating canonical parameter values and rolls back exactly.

Compatibility is earned only when the exact updated candidate head is green.

## Reusable rule learned

Relative interface layout should compile to existing canonical structural containers instead of inventing a parallel pixel-layout state. Recursive creation rules must also recursively enforce the same authority and resource bounds as top-level nodes.

## HELD / open

- Host rendering evidence and arbitrary responsive/pixel interface-layout design remain unclaimed.
- Ambient host permissions remain unclaimed.
- Generic caller-declared bindings still require target-local proof.
- Compatibility beyond the exact pinned MorphTile commit remains unclaimed.
- Visual quality remains NOT_TESTED.
- A separate MorphTile-core runtime safety candidate is warranted for button/action exposure: current core compilation can fall back from a missing signal socket to an arbitrary signal name. That universal authority boundary cannot be fixed only inside this creation machine.

No claim of autonomous creation, production readiness, CANON, or visual quality is made.

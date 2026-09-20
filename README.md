# MorphTile Interface Machine

Builds candidate interface matter over canonical MorphTile matter. It emits `view.set`; when placement is requested it emits a deterministic two-operation candidate containing `view.set` plus MorphTile's public `presentation.set` contract.

## v0.3 intent integrity

The machine now fails closed on top-level interface intent it does not understand instead of silently ignoring misspelled or unsupported fields.

Supported intent is deliberately small: tile target, title/text, one readout, one canonical parameter control, one action, optional labels, symbolic binding declarations, and optional MorphTile placement.

Important creation-side rules:

- tile and anchor references must match MorphTile-compatible symbolic tile IDs;
- readout/action/control names must be explicitly declared symbolic bindings;
- orphan labels or binding declarations HOLD instead of disappearing;
- authored text can coexist with interactive nodes and is preserved deterministically;
- explicit empty titles/labels remain authored empty strings instead of being replaced by defaults;
- canonical/session state values are never copied into candidate interface matter.

## Boundary answers

1. **What it does:** Builds candidate views and canonical presentation descriptors for an existing tile.
2. **What it does not own:** A second state store, canonical worlds, session/camera state, ambient host authority, arbitrary responsive-layout design, or merge authority.
3. **What it accepts:** `axm.morphtile.interface-request/v0.1` in the provisional v0.1 envelope.
4. **What it produces:** `morphtile.view-operation/v0.4`, or `morphtile.interface-operations/v0.4` containing `view.set` + `presentation.set` when placement is requested.
5. **MorphTile interaction:** output goes through MorphTile's public contracts and clone → plan → commit → receipt → rollback path. MorphTile does not depend on this repository.
6. **Authority boundary:** placement normalization copies only the public presentation descriptor fields. Canonical-state and session-state snapshots are not copied into the candidate.
7. **Interactive binding boundary:** readout, action and parameter-control names must be symbolic names explicitly declared in `intent.bindings.readouts`, `intent.bindings.actions` or `intent.bindings.controls`. Missing, undeclared, malformed, or authority-shaped binding data returns `HOLD_INVALID_INTERFACE_BINDING` rather than generating a plausible but ungrounded control. Parameter controls emit MorphTile's native `{ control: "<param-id>" }` view node and never copy the parameter value.
8. **When placement cannot be satisfied:** invalid or unknown presentation descriptors return `HOLD_INVALID_PRESENTATION_PLACEMENT`.

A binding declaration is not by itself proof that an arbitrary target exposes that name. The caller/receiver must prove it against the target MorphTile before accepting the candidate; emitted candidates carry `CALLER_MUST_PROVE_BINDINGS_MATCH_TARGET`.

## Run

    npm test

Pinned integration proof is also defined:

    MORPHTILE_CORE=../axm-morphtile/core/morphtile.js MORPHTILE_COMMIT=<exact-tested-commit> npm run test:integration

GitHub CI checks out the exact MorphTile commit recorded in `machine.json` and asserts that runtime identity before claiming compatibility.

Node 18 or later; zero runtime dependencies; no secrets required for the local path.

## Truth boundary

- IMPLEMENTED: fail-closed interface intent normalization, view candidates, symbolic readout/action/control declarations, native MorphTile parameter-control nodes, authored text + interactive composition, placement normalization and `presentation.set` candidate output.
- TESTED LOCALLY/CI WHEN GREEN: unknown/malformed intent HOLDs, orphan intent HOLDs, exact text preservation, symbolic binding validation, descriptor validation and structural authority boundaries.
- PINNED INTEGRATION HARNESS: executes placement through real MorphTile clone → plan → commit → receipt → rollback; proves a generated `levels` control resolves to the real `mt_tower` parameter; and proves authored explanatory text can coexist with that control without changing the parameter value.
- COMPATIBILITY TARGET: exact MorphTile v0.4 snapshot `a579182ae585e5722ac87dd0cc8209963b18d000`.
- EXPERIMENTAL: envelope v0.1 and candidate schemas in this repository.
- NOT CLAIMED: universal proof that any caller-supplied binding declaration matches its arbitrary target, compatibility beyond the pinned MorphTile commit, host rendering quality, arbitrary responsive interface-layout design, or ambient host permissions.

This remains a replaceable creation machine, not a dependency of MorphTile core and not evidence that MorphTile can autonomously manufacture MorphTile.

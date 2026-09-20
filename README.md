# MorphTile Interface Machine

Builds candidate interface matter over canonical MorphTile matter. It emits `view.set`; when placement is requested it emits a deterministic two-operation candidate containing `view.set` plus MorphTile's public `presentation.set` contract.

## v0.5 bounded relative layout

The machine fails closed on top-level interface intent it does not understand and can author a complete ordered `view.body` atomically through `intent.elements`.

Supported element kinds are deliberately bounded to MorphTile-native `text`, `readout`, `meter`, `control`, `action`, `row`, and `group` nodes. `row` and `group` recursively contain `children`, giving creation-time relative layout without inventing a private pixel/layout authority. Authored order is preserved at every level.

A `meter` is the bounded canonical-state visualization primitive: `{ kind: "meter", binding: "energy", min: 0, max: 100, label: "Energy" }`. It compiles to MorphTile's native `{ meter: ["var", "energy"], min: 0, max: 100, label: "Energy" }`, so the rendered bar reads the real target variable at render time. The binding must be declared in `intent.bindings.readouts`; the machine carries the symbolic variable name and explicit range, never a copied state value. Ranges require finite numeric `min` and `max` with `max > min`; defaults are not invented.

The layout tree is bounded to 64 total nodes and six nested container levels. Empty containers, unsupported fields, undeclared nested bindings and authority-shaped extras HOLD rather than being silently retained. Ordered and legacy body fields cannot be mixed because that would make author intent ambiguous.

Important creation-side rules:

- tile and anchor references must match MorphTile-compatible symbolic tile IDs;
- readout/meter/action/control names must be explicitly declared symbolic bindings, including when nested inside row/group layout;
- every declared symbolic binding must be consumed by the authored interface; extra declarations HOLD instead of disappearing;
- orphan labels or binding declarations HOLD instead of disappearing;
- authored text and ordered layout are preserved deterministically;
- explicit empty titles/labels remain authored empty strings instead of being replaced by defaults;
- canonical/session state values are never copied into candidate interface matter;
- unknown or authority-shaped element fields HOLD rather than being silently retained.

## Boundary answers

1. **What it does:** Builds candidate ordered/nested relative views and canonical presentation descriptors for an existing tile.
2. **What it does not own:** A second state store, canonical worlds, session/camera state, ambient host authority, arbitrary pixel/responsive-layout design, or merge authority.
3. **What it accepts:** `axm.morphtile.interface-request/v0.1` in the provisional v0.1 envelope.
4. **What it produces:** `morphtile.view-operation/v0.5`, or `morphtile.interface-operations/v0.5` containing `view.set` + `presentation.set` when placement is requested.
5. **MorphTile interaction:** output goes through MorphTile's public contracts and clone → plan → commit → receipt → rollback path. MorphTile does not depend on this repository.
6. **Authority boundary:** placement normalization copies only the public presentation descriptor fields. Canonical-state and session-state snapshots are not copied into the candidate.
7. **Interactive binding boundary:** readout and meter variable names, action names, and parameter-control names must be symbolic names explicitly declared in `intent.bindings.readouts`, `intent.bindings.actions` or `intent.bindings.controls`. Missing, undeclared, malformed, unused, or authority-shaped binding data returns `HOLD_INVALID_INTERFACE_BINDING`. Parameter controls emit MorphTile's native `{ control: "<param-id>" }` view node and never copy the parameter value. Meters emit MorphTile's native variable expression and never copy the variable value.
8. **Layout boundary:** row/group are structural presentation containers only. They do not create state, permissions, host windows, absolute pixels, or action authority.
9. **When placement cannot be satisfied:** invalid or unknown presentation descriptors return `HOLD_INVALID_PRESENTATION_PLACEMENT`.

A binding declaration is not by itself proof that an arbitrary target exposes that name. The caller/receiver must prove it against the target MorphTile before accepting the candidate; emitted candidates carry `CALLER_MUST_PROVE_BINDINGS_MATCH_TARGET`.

## Run

    npm test

Pinned integration proof is also defined:

    MORPHTILE_CORE=../axm-morphtile/core/morphtile.js MORPHTILE_COMMIT=<exact-tested-commit> npm run test:integration

GitHub CI checks out the exact MorphTile commit recorded in `machine.json` and asserts that runtime identity before claiming compatibility.

Node 18 or later; zero runtime dependencies; no secrets required for the local path.

## Truth boundary

- IMPLEMENTED: fail-closed interface intent normalization, atomic ordered/nested relative view generation, bounded canonical-state meters, legacy view candidates, recursive symbolic binding validation with exact consumption, native MorphTile parameter-control nodes, authored text + interactive composition, placement normalization and `presentation.set` candidate output.
- TESTED LOCALLY/CI WHEN GREEN: unknown/malformed intent HOLDs, orphan/unused binding HOLDs, meter range/binding HOLDs, nested depth/node budgets, exact authored order/text preservation, recursive symbolic binding validation, descriptor validation and structural authority boundaries.
- PINNED INTEGRATION HARNESS: executes ordered/nested view, meter and placement behavior through real MorphTile clone → plan → commit → receipt → rollback, proves native row/group materialization through `compilePanel`, proves generated meters follow canonical variables at render time, and proves canonical parameter values remain unchanged by interface generation.
- COMPATIBILITY TARGET: exact MorphTile v0.4 snapshot `429a344f7d9333bef01cf9de1c292c3af09abec2`.
- EXPERIMENTAL: envelope v0.1 and candidate schemas in this repository.
- NOT CLAIMED: universal proof that any caller-supplied binding declaration matches its arbitrary target, compatibility beyond the pinned MorphTile commit, host rendering quality, arbitrary responsive/pixel layout, or ambient host permissions.

This remains a replaceable creation machine, not a dependency of MorphTile core and not evidence that MorphTile can autonomously manufacture MorphTile.

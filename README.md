# MorphTile Interface Machine

Builds candidate interface matter over canonical MorphTile matter. It emits `view.set`; when placement is requested it emits a deterministic two-operation candidate containing `view.set` plus MorphTile's public `presentation.set` contract.

## v0.5 bounded relative, conditional, repeated and local-tile composition

The machine fails closed on top-level interface intent it does not understand and can author a complete ordered `view.body` atomically through `intent.elements`.

Supported element kinds are deliberately bounded to MorphTile-native `text`, `readout`, `meter`, `control`, `action`, `tile`, `row`, `group`, `when`, and `repeat` nodes. `row`, `group`, `when`, and `repeat` recursively contain `children`, giving creation-time relative/conditional/repeated layout without inventing a private pixel/layout or expression authority. Authored order is preserved at every level.

A `tile` element is the bounded same-container composition primitive: `{ kind: "tile", tile_id: "mt_core" }`. It compiles directly to MorphTile's native `{ tile: "mt_core" }` view node. `tile_id` must be one local MorphTile id matching `[A-Za-z0-9_-]+`; slash-separated/full-path addressing is intentionally not authored by this machine yet. The reference carries no copied target state, target actions or bridge authority. The referenced tile keeps ownership of its own view/state/runtime bindings, while MorphTile core performs read-only resolution at render time. Missing local targets remain visible inert `v-missing` matter rather than being fabricated.

A `meter` is the bounded canonical-state visualization primitive: `{ kind: "meter", binding: "energy", min: 0, max: 100, label: "Energy" }`. It compiles to MorphTile's native `{ meter: ["var", "energy"], min: 0, max: 100, label: "Energy" }`, so the rendered bar reads the real target variable at render time. The binding must be declared in `intent.bindings.readouts`; the machine carries the symbolic variable name and explicit range, never a copied state value. Ranges require finite numeric `min` and `max` with `max > min`; defaults are not invented.

A `when` container is the bounded canonical-state visibility primitive: `{ kind: "when", binding: "active", children: [...] }`. It compiles to MorphTile's native `{ group: [...], when: ["var", "active"] }`. The condition is intentionally only a truthy read of one declared symbolic target variable; arbitrary expressions are not authored by this machine. The binding uses the existing `intent.bindings.readouts` / `readout_logic_vars` proof lane because conditional visibility is a canonical-state read, not a second state store. The machine never snapshots the condition value.

A `repeat` container is the bounded canonical-state count primitive: `{ kind: "repeat", binding: "charges", step: 1, max: 4, children: [...] }`. It compiles to MorphTile's native repeat with count `max(0, min(max, floor(var / step)))`. `step` must be a positive finite number and `max` an integer from 1 through 16. The binding reuses the same `intent.bindings.readouts` / `readout_logic_vars` proof lane. The machine transports only the symbolic variable, explicit step/cap and child matter; it does not copy the live value or implement a second evaluator. Local repeat-index expression authoring remains outside this bounded vocabulary.

The authored layout tree is bounded to 64 total nodes and six nested container levels. Repeat additionally checks its worst-case expanded tree before emission; expanded repeated matter may not exceed the same 64-node budget. Empty containers, unsupported fields, undeclared nested bindings and authority-shaped extras HOLD rather than being silently retained. Ordered and legacy body fields cannot be mixed because that would make author intent ambiguous.

Important creation-side rules:

- the interface target and tile-mode presentation anchor must match MorphTile-compatible symbolic tile paths;
- local `tile` composition accepts one same-container tile id only; full-path/cross-container embedding remains outside the bounded producer contract;
- readout/meter/when/repeat/action/control names must be explicitly declared symbolic bindings, including when nested inside row/group/when/repeat layout;
- every declared symbolic binding must be consumed by the authored interface; extra declarations HOLD instead of disappearing;
- an embedded tile does not require or inherit parent binding declarations because it remains owner of its own view/state/actions;
- orphan labels or binding declarations HOLD instead of disappearing;
- authored text and ordered layout are preserved deterministically;
- explicit empty titles/labels remain authored empty strings instead of being replaced by defaults;
- canonical/session state values are never copied into candidate interface matter;
- unknown or authority-shaped element fields HOLD rather than being silently retained.

## Boundary answers

1. **What it does:** Builds candidate ordered/nested relative, bounded conditional/repeated and bounded same-container tile-composed views plus canonical presentation descriptors for an existing tile.
2. **What it does not own:** A second state store, embedded-tile state/action ownership, canonical worlds, session/camera state, ambient host authority, arbitrary expression authoring, arbitrary pixel/responsive-layout design, cross-container addressing, or merge authority.
3. **What it accepts:** `axm.morphtile.interface-request/v0.1` in the provisional v0.1 envelope.
4. **What it produces:** `morphtile.view-operation/v0.5`, or `morphtile.interface-operations/v0.5` containing `view.set` + `presentation.set` when placement is requested.
5. **MorphTile interaction:** output goes through MorphTile's public contracts and clone → plan → commit → receipt → rollback path. MorphTile does not depend on this repository.
6. **Authority boundary:** placement normalization copies only the public presentation descriptor fields. Canonical-state and session-state snapshots are not copied into the candidate. A local tile reference names existing matter for read-only view composition; it does not create, bridge or authorize that matter.
7. **Interactive/state-read binding boundary:** readout/meter/when/repeat variable names, action names, and parameter-control names must be symbolic names explicitly declared in `intent.bindings.readouts`, `intent.bindings.actions` or `intent.bindings.controls`. Missing, undeclared, malformed, unused, or authority-shaped binding data returns `HOLD_INVALID_INTERFACE_BINDING`. Parameter controls emit MorphTile's native `{ control: "<param-id>" }` view node and never copy the parameter value. Meters, `when`, and `repeat` containers emit bounded MorphTile-native expressions and never copy the variable value.
8. **Layout boundary:** row/group/when/repeat are structural presentation containers only. They do not create state, permissions, host windows, absolute pixels, or action authority. Local tile composition delegates rendering to existing target matter rather than duplicating it.
9. **When placement cannot be satisfied:** invalid or unknown presentation descriptors return `HOLD_INVALID_PRESENTATION_PLACEMENT`.

A binding declaration is not by itself proof that an arbitrary target exposes that name. The caller/receiver must prove it against the target MorphTile before accepting the candidate; emitted candidates carry `CALLER_MUST_PROVE_BINDINGS_MATCH_TARGET`.

## Run

    npm test

Pinned integration proof is also defined:

    MORPHTILE_CORE=../axm-morphtile/core/morphtile.js MORPHTILE_COMMIT=<exact-tested-commit> npm run test:integration

GitHub CI checks out the exact MorphTile commit recorded in `machine.json` and asserts that runtime identity before claiming compatibility.

Node 18 or later; zero runtime dependencies; no secrets required for the local path.

## Truth boundary

- IMPLEMENTED: fail-closed interface intent normalization, atomic ordered/nested relative view generation, bounded same-container local-tile composition, bounded canonical-state meters, bounded truthy canonical-state conditional visibility, bounded canonical-state repeat generation, legacy view candidates, recursive symbolic binding validation with exact consumption, native MorphTile parameter-control nodes, authored text + interactive composition, placement normalization and `presentation.set` candidate output.
- TESTED LOCALLY/CI WHEN GREEN: unknown/malformed intent HOLDs, orphan/unused binding HOLDs, local tile-id bounds and authority-shaped-extra HOLDs, meter range/binding HOLDs, conditional and repeat binding/field/depth/budget HOLDs, nested depth/node budgets, exact authored order/text preservation, recursive symbolic binding validation, descriptor validation and structural authority boundaries.
- PINNED INTEGRATION HARNESS: executes ordered/nested view, local tile composition, meter, conditional visibility, bounded repeat and placement behavior through real MorphTile clone → plan → commit → receipt → rollback; proves local tile composition resolves existing tile-owned matter read-only and missing targets remain visibly inert; proves native row/group materialization through `compilePanel`; proves generated meters/conditionals/repeats follow canonical variables at render time; and proves canonical parameter values remain unchanged by interface generation.
- COMPATIBILITY TARGET: exact MorphTile v0.4 snapshot `2bdf8eade1376055473b9cc1b11734b72a5566e5`.
- EXPERIMENTAL: envelope v0.1 and candidate schemas in this repository.
- NOT CLAIMED: universal proof that any caller-supplied binding declaration matches its arbitrary target, compatibility beyond the pinned MorphTile commit, host rendering quality, arbitrary responsive/pixel layout, arbitrary expressions or local repeat-index expressions, full-path/cross-container tile embedding, or ambient host permissions.

This remains a replaceable creation machine, not a dependency of MorphTile core and not evidence that MorphTile can autonomously manufacture MorphTile.

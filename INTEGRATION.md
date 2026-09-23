# MorphTile integration

Tested contract target:

- repository: mike-axiom-mir/axm-morphtile
- commit: 685df074701feeae3e9d789e532d0a3658030bf4
- format: v0.4
- provisional envelope: v0.1
- machine version: 0.5.18

Without placement, the adapter emits `morphtile.view-operation/v0.5`.

With placement, the adapter emits `morphtile.interface-operations/v0.5` with exactly two ordinary MorphTile operations:

1. `view.set`
2. `presentation.set`

Before candidate emission, v0.5 normalizes a bounded Interface Machine intent contract. Unknown top-level fields, malformed tile paths, orphan labels/bindings, malformed symbolic bindings, malformed nested layout and malformed placement descriptors HOLD instead of being silently ignored.

View composition is deterministic. `intent.elements` may recursively use MorphTile-native `row`, `group`, and bounded `when` containers around `text`, `readout`, `meter`, `control` and `action` leaves. Authored ordering is preserved at every level. The complete tree is bounded to 64 total nodes and six nested containers; this is a creation-machine safety bound rather than a change to MorphTile core.

`when` is deliberately narrower than MorphTile's general expression capability. The authored form is `{ kind: "when", binding: "name", children: [...] }`, which compiles to a native group carrying `when: ["var", "name"]`. The binding is declared through `intent.bindings.readouts` and target proof `readout_logic_vars`, because conditional visibility reads canonical target state. Interface Machine never copies the current value and never evaluates the condition itself.

Canonical MorphTile paths such as `mt_shell/mt_room/mt_panel` are accepted for interface targets and tile-mode anchors. The machine emits stable target-local proof dependencies rather than treating a symbolic reference as proof of authority. Interface target proof requires the addressed tile to exist, declare `ui_panel`, and expose the requested state-read variables, parameter IDs and input-signal socket IDs. Tile-mode anchors carry their own tile-existence proof dependency.

The receiver still owns clone → plan → commit → receipt → rollback and target-local dependency discharge. CI checks out the exact MorphTile commit recorded above, passes the same SHA as `MORPHTILE_COMMIT`, and the integration harness asserts that value equals `machine.json.tested_against.commit` before making compatibility claims.

Pinned integration proves:

- placement commits and rolls back exactly;
- session presentation adjustment does not rewrite canonical presentation matter;
- declared `mt_tower:levels` becomes a real native MorphTile parameter control without copying or changing its canonical value;
- authored explanatory text can coexist with that control in the real compiled panel;
- flat authored node order survives real panel compilation;
- nested native `group` → `row` layout compiles to the real tower parameter control plus exposed `toggle` input action without copying canonical values;
- bounded `when` visibility is absent while canonical `mt_tower.beacon` is `0`, appears after the real `toggle` signal changes the canonical variable to `1`, preserves the real `toggle` action inside the visible group, does not mutate canonical matter while rendering, and rolls back exactly;
- a symbolic request for `lit`, which is an output signal socket rather than an exposed input action, remains visibly inert in merged MorphTile core and never gains `data-signal` action authority;
- exact rollback remains available after interface commits.

The machine never receives authority to copy canonical values or session placement into matter. It constructs presentation descriptors only from public descriptor fields and interactive/state-read nodes only from declared symbolic names. Dependency records are obligations, not grants.

Current merged MorphTile core universally enforces custom-view action authority: only an existing `kind: "signal", dir: "in"` socket becomes actionable. Internal rule names, attach sockets, output sockets and absent names remain visible but inert even if a direct caller bypasses this machine.

Assembly receiver compatibility is separately pinned to `726fb4ad8efc4068bcda0c2c3d5e3873335b280e` in CI. Compatibility beyond the exact pinned revisions is not claimed until re-tested and re-pinned for a real semantic candidate.

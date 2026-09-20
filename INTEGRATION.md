# MorphTile integration

Tested contract target:

- repository: mike-axiom-mir/axm-morphtile
- commit: d2d2df0e4ad88f1cda885e3eb1394151515e7946
- format: v0.4
- provisional envelope: v0.1
- machine version: 0.5.2

Without placement, the adapter emits `morphtile.view-operation/v0.5`.

With placement, the adapter emits `morphtile.interface-operations/v0.5` with exactly two ordinary MorphTile operations:

1. `view.set`
2. `presentation.set`

Before candidate emission, v0.5 normalizes a bounded Interface Machine intent contract. Unknown top-level fields, malformed tile paths, orphan labels/bindings, malformed symbolic bindings, malformed nested layout and malformed placement descriptors HOLD instead of being silently ignored.

View composition is deterministic. `intent.elements` may recursively use MorphTile-native `row` and `group` nodes around `text`, `readout`, `control` and `action` leaves. Authored ordering is preserved at every level. The complete tree is bounded to 64 total nodes and six nested containers; this is a creation-machine safety bound rather than a change to MorphTile core.

Canonical MorphTile paths such as `mt_shell/mt_room/mt_panel` are accepted for interface targets and tile-mode anchors. The machine emits stable target-local proof dependencies rather than treating a symbolic reference as proof of authority. Interface target proof requires the addressed tile to exist, declare `ui_panel`, and expose the requested readout variables, parameter IDs and input-signal socket IDs. Tile-mode anchors carry their own tile-existence proof dependency.

The receiver still owns clone → plan → commit → receipt → rollback and target-local dependency discharge. CI checks out the exact MorphTile commit recorded above, passes the same SHA as `MORPHTILE_COMMIT`, and the integration harness asserts that value equals `machine.json.tested_against.commit` before making compatibility claims.

Pinned integration proves:

- placement commits and rolls back exactly;
- session presentation adjustment does not rewrite canonical presentation matter;
- declared `mt_tower:levels` becomes a real native MorphTile parameter control without copying or changing its canonical value;
- authored explanatory text can coexist with that control in the real compiled panel;
- flat authored node order survives real panel compilation;
- nested native `group` → `row` layout compiles to the real tower parameter control plus exposed `toggle` input action without copying canonical values;
- a symbolic request for `lit`, which is an output signal socket rather than an exposed input action, remains visibly inert in merged MorphTile core and never gains `data-signal` action authority;
- exact rollback remains available after interface commits.

The machine never receives authority to copy canonical values or session placement into matter. It constructs presentation descriptors only from public descriptor fields and interactive nodes only from declared symbolic names. Dependency records are obligations, not grants.

Current merged MorphTile core universally enforces custom-view action authority: only an existing `kind: "signal", dir: "in"` socket becomes actionable. Internal rule names, attach sockets, output sockets and absent names remain visible but inert even if a direct caller bypasses this machine.

Assembly receiver compatibility is separately pinned in CI. Compatibility beyond the exact pinned revisions is not claimed until re-tested and re-pinned.

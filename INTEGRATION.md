# MorphTile integration

Tested contract target:

- repository: mike-axiom-mir/axm-morphtile
- commit: a579182ae585e5722ac87dd0cc8209963b18d000
- format: v0.4
- provisional envelope: v0.1
- machine version: 0.3.0

Without placement, the adapter emits `morphtile.view-operation/v0.4`.

With placement, the adapter emits `morphtile.interface-operations/v0.4` with exactly two ordinary MorphTile operations:

1. `view.set`
2. `presentation.set`

Before candidate emission, v0.3 normalizes a bounded Interface Machine intent contract. Unknown top-level fields, malformed tile identifiers, orphan labels/bindings, malformed symbolic bindings and malformed placement descriptors HOLD instead of being silently ignored.

View composition is deterministic: authored text is retained before requested readout/control/action nodes, and explicit empty authored titles/labels are preserved in the candidate rather than replaced through truthiness defaults.

The receiver still owns clone → plan → commit → receipt → rollback. CI checks out the exact MorphTile commit recorded above, passes the same SHA as `MORPHTILE_COMMIT`, and the integration harness asserts that value equals `machine.json.tested_against.commit` before making compatibility claims.

Pinned integration currently proves:

- placement commits and rolls back exactly;
- session presentation adjustment does not rewrite canonical presentation matter;
- declared `mt_tower:levels` becomes a real native MorphTile parameter control without copying or changing its canonical value;
- authored explanatory text can coexist with that control in the real compiled panel;
- exact rollback remains available after those interface commits.

The machine never receives authority to copy canonical values or session placement into matter. It constructs presentation descriptors only from the public descriptor fields and interactive nodes from declared symbolic names.

The target tile must already exist and declare `ui_panel` for host presentation. Generic symbolic binding declarations still require receiving-project proof that the actual target exposes the named readout/action/control.

A separate MorphTile-core draft regression tracks unknown canonical presentation descriptor fields. That core boundary cannot be made safe only by this machine because direct MorphTile callers can bypass the machine entirely.

No compatibility is claimed with newer or older MorphTile commits until re-tested and re-pinned.

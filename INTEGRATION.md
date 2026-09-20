# MorphTile integration

Tested contract target:

- repository: mike-axiom-mir/axm-morphtile
- commit: ef2b3c6986aa1a333247feffc43a8443f17239d0
- format: v0.4
- provisional envelope: v0.1
- machine version: 0.5.0

Without placement, the adapter emits `morphtile.view-operation/v0.5`.

With placement, the adapter emits `morphtile.interface-operations/v0.5` with exactly two ordinary MorphTile operations:

1. `view.set`
2. `presentation.set`

Before candidate emission, v0.5 normalizes a bounded Interface Machine intent contract. Unknown top-level fields, malformed tile identifiers, orphan labels/bindings, malformed symbolic bindings, malformed nested layout and malformed placement descriptors HOLD instead of being silently ignored.

View composition is deterministic. `intent.elements` may recursively use MorphTile-native `row` and `group` nodes around `text`, `readout`, `control` and `action` leaves. Authored ordering is preserved at every level. The complete tree is bounded to 64 total nodes and six nested containers; this is a creation-machine safety bound rather than a change to MorphTile core.

The receiver still owns clone → plan → commit → receipt → rollback. CI checks out the exact MorphTile commit recorded above, passes the same SHA as `MORPHTILE_COMMIT`, and the integration harness asserts that value equals `machine.json.tested_against.commit` before making compatibility claims.

Pinned integration proves:

- placement commits and rolls back exactly;
- session presentation adjustment does not rewrite canonical presentation matter;
- declared `mt_tower:levels` becomes a real native MorphTile parameter control without copying or changing its canonical value;
- authored explanatory text can coexist with that control in the real compiled panel;
- flat authored node order survives real panel compilation;
- nested native `group` → `row` layout compiles to the real tower parameter control plus exposed toggle action without copying canonical values;
- exact rollback remains available after those interface commits.

The machine never receives authority to copy canonical values or session placement into matter. It constructs presentation descriptors only from the public descriptor fields and interactive nodes only from declared symbolic names.

The target tile must already exist and declare `ui_panel` for host presentation. Generic symbolic binding declarations still require receiving-project proof that the actual target exposes the named readout/action/control.

Current MorphTile core already owns row/group view representation, so nested relative layout requires no new substrate primitive. A separate core safety candidate is appropriate for action exposure because current runtime button compilation may emit an arbitrary signal name when no matching exposed input signal socket exists; direct MorphTile callers can bypass this machine.

No compatibility is claimed with newer or older MorphTile commits until re-tested and re-pinned.

# MorphTile integration

Tested contract target:

- repository: mike-axiom-mir/axm-morphtile
- commit: fea73dc1a838f90abdf7c3db8b52b23224792137
- format: v0.4
- provisional envelope: v0.1
- machine version: 0.2.0

Without placement, the adapter preserves the original `morphtile.view-operation/v0.4` shape.

With placement, the adapter emits `morphtile.interface-operations/v0.4` with exactly two ordinary MorphTile operations:

1. `view.set`
2. `presentation.set`

The receiver still owns clone → plan → commit → receipt → rollback. The integration test uses the real pinned MorphTile core and proves that path, including exact rollback.

The machine never receives authority to copy canonical values or session placement into matter. It constructs presentation descriptors only from the public descriptor fields. MorphTile may layer session movement later through `resolvePresentation()`; that layering does not mutate canonical world state.

The target tile must already exist and declare `ui_panel` for host presentation. Missing anchors and unsupported host modes remain visible MorphTile resolution HOLDs.

No compatibility is claimed with newer or older MorphTile commits until re-tested and re-pinned.

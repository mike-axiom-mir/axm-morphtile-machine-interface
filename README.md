# MorphTile Interface Machine

Builds candidate interface matter over canonical MorphTile matter. The foundation emits `view.set`; when placement is requested it now emits a deterministic two-operation candidate containing `view.set` plus MorphTile's public `presentation.set` contract.

## Boundary answers

1. **What it does:** Builds candidate views and canonical presentation descriptors for an existing tile.
2. **What it does not own:** A second state store, canonical worlds, session/camera state, ambient host authority, arbitrary responsive-layout design, or merge authority.
3. **What it accepts:** `axm.morphtile.interface-request/v0.1` in the provisional v0.1 envelope.
4. **What it produces:** The existing `morphtile.view-operation/v0.4` candidate when no placement is requested, or `morphtile.interface-operations/v0.4` containing `view.set` + `presentation.set` when placement is requested.
5. **MorphTile interaction:** output goes through MorphTile's public contracts and clone → plan → commit → receipt → rollback path. MorphTile does not depend on this repository.
6. **Authority boundary:** placement normalization copies only the public presentation descriptor fields. Canonical-state and session-state snapshots are not copied into the candidate.
7. **When it cannot satisfy a request:** invalid or unknown presentation descriptors return a typed `HOLD_INVALID_PRESENTATION_PLACEMENT`.

## Run

    npm test

Pinned integration proof is also defined:

    MORPHTILE_CORE=../axm-morphtile/core/morphtile.js npm run test:integration

GitHub CI checks that proof against the exact MorphTile commit recorded in `machine.json`.

Node 18 or later; zero runtime dependencies; no secrets required for the local path.

## Truth boundary

- IMPLEMENTED: view candidates, placement normalization, `presentation.set` candidate output and the local envelope.
- TESTED LOCALLY: structural authority and descriptor validation tests.
- PINNED INTEGRATION HARNESS: executes the candidate through real MorphTile clone → plan → commit → receipt → rollback and checks that session placement remains outside canonical matter.
- EXPERIMENTAL: envelope v0.1 and candidate schemas in this repository.
- NOT CLAIMED: compatibility beyond the pinned MorphTile commit, host rendering quality, arbitrary responsive interface-layout design, or ambient host permissions.

This remains a replaceable creation machine, not a dependency of MorphTile core and not evidence that MorphTile can autonomously manufacture MorphTile.

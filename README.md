# MorphTile Interface Machine

Builds candidate presentation over canonical MorphTile matter. The foundation proves a view.set operation bound to real state/action names.

## Boundary answers

1. **What it does:** Builds candidate presentation over canonical MorphTile matter. The foundation proves a view.set operation bound to real state/action names.
2. **What it does not own:** A second state store, canonical worlds, session/camera state, ambient host authority, or merge authority.
3. **What it accepts:** axm.morphtile.interface-request/v0.1 in the provisional v0.1 envelope.
4. **What it produces:** A morphtile.view-operation/v0.4 candidate.
5. **MorphTile interaction:** output goes through MorphTile's public contracts and clone → plan → commit → receipt → rollback path. MorphTile does not depend on this repository.
6. **Evidence:** A structural authority test proves no copied state value is introduced.
7. **When it cannot satisfy a request:** Requested presentation placement returns HOLD_PRESENTATION_PLACEMENT_NOT_IN_V04 until core defines that contract.

## Run

    npm test

Node 18 or later; zero runtime dependencies; no secrets or network required.

## Truth boundary

- IMPLEMENTED: the tiny adapter and local envelope used by the fixtures.
- TESTED: the claims named by the local test files.
- EXPERIMENTAL: envelope v0.1 and every candidate schema in this foundation.
- NOT TESTED: compatibility beyond MorphTile commit 13d83a2b2c0d12644442d3d9e45bcbe0af19876a.
- HELD: No placement contract, host rendering, or visual proof.

This is a foundation, not evidence that MorphTile can autonomously manufacture MorphTile.


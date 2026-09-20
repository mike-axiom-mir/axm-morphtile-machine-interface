# Status

- Machine version: 0.4.0
- State: CANDIDATE — EXACT-HEAD CI REQUIRED
- Local tests: `npm test`
- MorphTile target: v0.4 at `b6b086edb70fd4657495fcf01cb9fcdedceafdaf`
- Envelope: provisional v0.1
- Visual proof: none

## Implemented in this candidate

- Interface Machine can generate a complete ordered view body in one request through `intent.elements` instead of forcing repeated `view.set` calls that would overwrite earlier authored interface matter.
- Ordered element kinds are bounded to `text`, `readout`, `control`, and `action`, matching MorphTile's existing tile-owned view vocabulary.
- Ordered interactive elements still require explicit symbolic declarations in `intent.bindings`; no parameter values, variable snapshots, signal payloads, canonical state, or session state are copied into candidate matter.
- Unknown element fields HOLD instead of being silently ignored, including authority-shaped extras such as `state_value`.
- Legacy single text/readout/control/action fields remain supported for compatibility.
- Legacy body fields and `intent.elements` cannot be mixed, because that would make authored ordering ambiguous.
- Ordered element count is bounded to 64 per request to keep machine output inspectable and deterministic.
- Existing fail-closed top-level intent, presentation, placement, label, and symbolic-binding boundaries remain intact.

## Why this belongs in Interface Machine

MorphTile core already represents an ordered `view.body` array with text, value, control and button nodes. The missing capability is creation strategy: deterministically assembling several supported nodes into one atomic `view.set` candidate without repeated overwrite-prone generation.

No new MorphTile substrate primitive is required for ordered interface generation.

## Evidence required before integration

- full Interface Machine unit suite on the exact candidate head;
- pinned MorphTile integration against `machine.json.tested_against.commit`;
- regression proof that existing legacy requests still produce the same candidate shape;
- ordered-element regressions for authored order, undeclared bindings, mixed legacy/ordered content, and unknown authority-shaped fields.

The exact runtime pin has been advanced to converged MorphTile core `b6b086edb70fd4657495fcf01cb9fcdedceafdaf`; compatibility is earned only when the exact updated candidate head is green.

## Reusable rule learned

When a canonical operation replaces a whole authored structure, a creation machine should assemble that structure completely and atomically rather than rely on repeated partial writes whose later calls erase earlier intent.

## HELD / open

- Host rendering evidence and arbitrary responsive interface-layout design remain unclaimed.
- Ambient host permissions remain unclaimed.
- Generic caller-declared bindings still require target-local proof.
- Compatibility beyond the exact pinned MorphTile commit remains unclaimed.
- Visual quality remains NOT_TESTED.

No claim of autonomous creation, production readiness, CANON, or visual quality is made.

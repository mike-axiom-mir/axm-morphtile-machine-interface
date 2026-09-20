# Status

- Machine version: 0.3.0
- State: CANDIDATE — EXACT-HEAD CI REQUIRED
- Local tests: `npm test`
- MorphTile target: v0.4 at `a579182ae585e5722ac87dd0cc8209963b18d000`
- Envelope: provisional v0.1
- Visual proof: none

## Implemented in this candidate

- Top-level interface intent fails closed on malformed or unknown fields instead of silently ignoring them.
- Tile and presentation-anchor references are bounded to MorphTile-compatible symbolic tile IDs.
- Orphan labels and binding declarations HOLD instead of being dropped.
- Authored text is preserved beside readouts, controls and actions rather than disappearing when an interactive node exists.
- Explicit empty titles and labels are preserved instead of being replaced by truthiness fallbacks.
- Existing fail-closed symbolic readout/action/control declarations and presentation descriptors remain intact.
- Interface generation still carries names and authored presentation data only, never canonical parameter values or session-state snapshots.

## Pinned integration evidence

GitHub CI must check the exact runtime identity against `machine.json`, then replay placement and parameter-control semantics through MorphTile clone → plan → commit → receipt → rollback. This candidate also requires a real MorphTile receipt proving authored explanatory text survives beside the canonical `mt_tower:levels` control while the parameter value remains unchanged.

## Reusable rule learned

A creation machine must fail closed on intent it would otherwise ignore, and it must not silently erase authored interface content merely because another supported interface element is present.

## Placement decision

These rules belong in Interface Machine. MorphTile already represents mixed view nodes and canonical parameter controls; no new universal interface primitive is required for them.

A separate MorphTile-core substrate gap remains: `presentationError()` accepts unknown extra descriptor keys, allowing non-contract presentation data to become canonical matter when callers bypass this machine.

## HELD / open

- Host rendering evidence and arbitrary responsive interface-layout design remain unclaimed.
- Ambient host permissions remain unclaimed.
- Generic caller-declared bindings still require target-local proof.
- Compatibility beyond the exact pinned MorphTile commit remains unclaimed.
- Core unknown-presentation-key rejection remains a separate MorphTile-core candidate/HOLD until repaired and verified.

No claim of autonomous creation, production readiness, CANON, or visual quality is made.

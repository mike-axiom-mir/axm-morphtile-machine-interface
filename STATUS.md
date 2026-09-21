# Status

- Machine version: 0.5.9
- State: CANDIDATE — EXACT-HEAD CI + INDEPENDENT VERIFICATION REQUIRED
- Local tests: `npm test`
- MorphTile target: v0.4 at `2bdf8eade1376055473b9cc1b11734b72a5566e5`
- Assembly receiver target: `675ec2498ff94969ad198843ba65aa145134da6c`
- Envelope: provisional v0.1
- Visual proof: runtime vnode/HTML behavior only; aesthetic host quality remains NOT_TESTED

## Integrated baseline

Interface 0.5.8 bounded native styling was independently replayed by Verification PR #38 and integrated by the Creation Director as Interface main `ca377c7d8033acbfb1f4dc7a5172027a7a194b3f` before this candidate branch. Its accent/width/strong semantics therefore are no longer waiting on independent verification.

## Implemented in this candidate

Interface 0.5.9 tightens the existing presentation descriptor boundary so authored fields are accepted only when the selected presentation mode actually owns their semantics:

- `placement.dock` is accepted only with `placement.mode: "docked"`; a dock field on `screen`, `floating`, `fullscreen`, `embedded`, `world`, or `tile` HOLDs with `HOLD_INVALID_PRESENTATION_PLACEMENT` instead of persisting mode-inert canonical matter.
- `placement.mode: "docked"` may still omit `dock`, preserving MorphTile's native default dock edge rather than inventing a producer default.
- the existing rule remains: `placement.anchor` is accepted only with `placement.mode: "tile"`, while tile mode may omit `anchor` to preserve MorphTile's native self-anchor default.
- all previous source-integrity, binding, composition, style, presentation, node/depth/repeat budgets, target-proof rules, and no-copied-state boundaries remain in force.
- no new host authority, session state, bridge state, alternate presentation evaluator, or core representation is introduced.

## Why this belongs in Interface Machine

MorphTile core already owns the universal `docked` presentation runtime, the supported dock edges, and its native default when `dock` is omitted. The gap was producer-side semantic precision: Interface could previously author a valid dock edge under a mode that does not own docking. The repair therefore belongs in request-to-canonical normalization rather than a new MorphTile substrate primitive.

## Evidence before integration

- preserve regression-first run `35553603425`, where the new mode-ownership regression failed while the MorphTile and Assembly integration lanes remained green;
- preserve intermediate run `35553673203`, where the docking semantics themselves passed and both integration lanes remained green while stale 0.5.8 assertions / an inherited dock in the tile-anchor fixture still failed unit;
- final exact-head `unit`, pinned `morphtile-integration`, and current `assembly-receiver-integration` must all pass;
- explicit docked-edge authoring and docked omission/default preservation must remain candidates;
- dock outside docked mode must HOLD without candidate emission;
- independent Verification must replay the exact final PR head before Director integration.

## Reusable rules learned

- A syntactically valid presentation field is not meaningful merely because core can store it; the selected semantic mode must actually own that field.
- Meaningful substrate defaults should be preserved by omission rather than replaced with producer-invented defaults.
- Mode-specific field validation belongs at the producer boundary when the universal runtime primitive already exists.
- Receiver pins are evidence identities; compatibility must be re-earned against the current integrated receiver rather than inherited from older green evidence.

## HELD / not claimed

- independent Verification of the exact Interface 0.5.9 PR head;
- presentation z-order offset authoring: the Director has assigned that lane to Interface, but no canonical MorphTile z-order primitive/schema has yet been evidenced, so this candidate does not invent one;
- aesthetic/host visual-quality proof;
- arbitrary CSS, raw style strings, classes, arbitrary color strings, or expression-authored accent/width;
- arbitrary responsive/pixel layout and ambient host permissions;
- cross-root/cross-container tile composition without a separate authority/proof contract;
- arbitrary MorphTile expression authoring and local repeat-index-dependent child expressions;
- compatibility beyond the exact pinned MorphTile and Assembly revisions;
- a universal cross-machine envelope standard.

No claim of autonomous creation, production readiness, CANON, or visual quality is made.

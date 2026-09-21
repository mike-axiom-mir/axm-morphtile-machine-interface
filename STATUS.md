# Status

- Machine version: 0.5.8
- State: CANDIDATE — EXACT-HEAD CI + INDEPENDENT VERIFICATION REQUIRED
- Local tests: `npm test`
- MorphTile target: v0.4 at `2bdf8eade1376055473b9cc1b11734b72a5566e5`
- Assembly receiver target: `675ec2498ff94969ad198843ba65aa145134da6c`
- Envelope: provisional v0.1
- Visual proof: runtime vnode/HTML behavior only; aesthetic host quality remains NOT_TESTED

## Implemented in this candidate

Interface 0.5.8 adds a deliberately small styling vocabulary over MorphTile-native tile-owned view matter:

- `intent.accent` accepts exactly three finite numeric channels in the normalized range 0..1 and emits native `view.accent`.
- `intent.width` accepts a finite number >= 1 and emits native `view.width`. Values below 1 HOLD instead of being accepted and then clamped by MorphTile at render time.
- ordered text elements accept optional boolean `strong`, emitted as native `{ text, strong }` matter. Explicit `false` remains authored false; non-boolean values HOLD rather than being coerced.
- no CSS strings, class names, arbitrary expressions, canonical values, session state, permissions, or host layout state are introduced.
- all previous source-integrity, binding, composition, presentation, node/depth/repeat budgets, and target-proof rules remain in force.
- the Assembly receiver pin is refreshed to current integrated Assembly main `675ec2498ff94969ad198843ba65aa145134da6c`.

## Why this belongs in Interface Machine

MorphTile core already defines `view = { title, accent, width, body }`, already interprets `{ text, strong }`, already maps an RGB array to its native panel accent, and already consumes `width` as panel growth. The substrate primitive exists. The gap was bounded producer vocabulary, so this candidate compiles into core semantics instead of adding another styling/state/runtime layer.

## Evidence before integration

- regression-first run must remain preserved, showing the old producer rejected the new bounded vocabulary while existing integration lanes stayed green;
- exact-head `unit`, pinned `morphtile-integration`, and current `assembly-receiver-integration` must all pass;
- pinned runtime proof must commit the generated `view.set`, render the expected native accent/width/strong behavior without mutating canonical matter, then roll back exactly;
- invalid accent shape/range, width values that core would normalize, and non-boolean `strong` must HOLD;
- independent Verification must replay the exact final PR head before Director integration.

## Reusable rules learned

- When core already has a universal presentation primitive, expose the smallest bounded producer vocabulary rather than inventing private host styling.
- A producer should reject authored values that the runtime would silently clamp or reinterpret when that would change authored meaning.
- Static view styling is presentation matter, not authority: it must not carry state, permissions, session values, CSS execution, or host-window behavior.
- Receiver pins are evidence identities; compatibility must be re-earned against the current integrated receiver rather than inherited from an older green run.

## HELD / not claimed

- independent Verification of the exact Interface 0.5.8 PR head;
- aesthetic/host visual-quality proof;
- arbitrary CSS, raw style strings, classes, arbitrary color strings, or expression-authored accent/width;
- arbitrary responsive/pixel layout and ambient host permissions;
- cross-root/cross-container tile composition without a separate authority/proof contract;
- arbitrary MorphTile expression authoring and local repeat-index-dependent child expressions;
- compatibility beyond the exact pinned MorphTile and Assembly revisions;
- a universal cross-machine envelope standard.

No claim of autonomous creation, production readiness, CANON, or visual quality is made.

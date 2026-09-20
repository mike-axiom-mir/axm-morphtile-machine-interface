# Architecture

`src/index.js` emits public MorphTile operations. It has no state store and no network, file, payment, device or host bridge.

`src/interface-intent.js` owns the creation-side intent boundary. It defines the small top-level vocabulary the machine actually understands and fails closed on everything else. This prevents misspelled or unsupported caller fields from disappearing while the machine returns a plausible candidate.

The view composer is additive across supported elements: authored text, readout, canonical parameter control and action may coexist in one deterministic body. An element being present never authorizes silently erasing another authored element. Explicit empty titles/labels are preserved as authored data.

Interactive state remains symbolic. Readouts, actions and parameter controls carry declared names, not canonical values. Generic declarations remain subject to target-local verification by the receiver.

The no-placement path emits a single `view.set` candidate. A placement request produces a deterministic ordered bundle: `view.set` first, then `presentation.set`. The placement normalizer whitelists only MorphTile's public descriptor fields: `mode`, `dock`, `preferred_size`, `preferred_position`, `user_adjustable` and `anchor`. Unknown fields and invalid symbolic anchor references HOLD rather than being copied or ignored.

Dependency direction is one-way: this machine may target MorphTile's public contract; MorphTile core must never import this machine. Candidate output is data, not CANON.

The pinned MorphTile checkout in GitHub Actions is test-time evidence only. It is not a runtime package dependency and does not introduce shared mutable state. The integration harness asserts the checked-out runtime identity against the manifest pin before claiming compatibility.

Repository isolation rules remain: no sibling imports at runtime, no sibling writes, no shared mutable state, no assumed installed machines, and no automatic CANON.

A canonical descriptor acceptance gap cannot be solved here for every caller. The separate MorphTile-core draft regression therefore owns unknown-field rejection for canonical `presentation` matter.

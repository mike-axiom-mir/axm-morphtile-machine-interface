# Architecture

`src/index.js` emits public MorphTile operations. It has no state store and no network, file, payment, device or host bridge.

`src/interface-intent.js` owns the creation-side intent boundary. It defines the small top-level vocabulary the machine actually understands and fails closed on everything else. This prevents misspelled or unsupported caller fields from disappearing while the machine returns a plausible candidate.

The view composer is additive across supported elements. Authored text, readout, canonical parameter control and action may coexist in one deterministic body. `row` and `group` provide bounded relative structure by compiling directly to MorphTile's native view containers. The machine does not invent absolute pixel coordinates, responsive breakpoints, hidden layout state, or a second interface tree.

Nested layout is recursively constrained: one tree may contain at most 64 total nodes and six container levels, empty containers HOLD, and unsupported nested fields HOLD. Those are creation-machine resource/integrity bounds, not new MorphTile format rules.

Interactive state remains symbolic. Readouts, actions and parameter controls carry declared names, not canonical values. Binding checks recursively walk nested layout, so placing a control deeper in a group never bypasses the same authority boundary. Generic declarations remain subject to target-local verification by the receiver.

The no-placement path emits a single `view.set` candidate. A placement request produces a deterministic ordered bundle: `view.set` first, then `presentation.set`. The placement normalizer whitelists only MorphTile's public descriptor fields: `mode`, `dock`, `preferred_size`, `preferred_position`, `user_adjustable` and `anchor`. Unknown fields and invalid symbolic anchor references HOLD rather than being copied or ignored.

Dependency direction is one-way: this machine may target MorphTile's public contract; MorphTile core must never import this machine. Candidate output is data, not CANON.

The pinned MorphTile checkout in GitHub Actions is test-time evidence only. It is not a runtime package dependency and does not introduce shared mutable state. The integration harness asserts the checked-out runtime identity against the manifest pin before claiming compatibility.

Repository isolation rules remain: no sibling imports at runtime, no sibling writes, no shared mutable state, no assumed installed machines, and no automatic CANON.

Canonical/runtime authority gaps that affect every MorphTile caller belong in MorphTile core. In particular, whether a compiled UI button may emit a signal without a real exposed input signal socket is a core runtime contract, not something this machine can make safe for callers that bypass it.

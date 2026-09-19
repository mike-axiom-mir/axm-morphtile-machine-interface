# Architecture

`src/index.js` emits public MorphTile operations. It has no state store and no network, file, payment, device or host bridge.

The no-placement path remains the original single `view.set` candidate. A placement request produces a deterministic ordered bundle: `view.set` first, then `presentation.set`. The placement normalizer whitelists only MorphTile's public descriptor fields: `mode`, `dock`, `preferred_size`, `preferred_position`, `user_adjustable` and `anchor`. Unknown fields are not copied, so request-side canonical/session snapshots cannot silently become matter.

Dependency direction is one-way: this machine may target MorphTile's public contract; MorphTile core must never import this machine. Candidate output is data, not canon.

The pinned MorphTile checkout in GitHub Actions is test-time evidence only. It is not a runtime package dependency and does not introduce shared mutable state.

Repository isolation rules remain: no sibling imports at runtime, no sibling writes, no shared mutable state, no assumed installed machines, and no automatic canon.

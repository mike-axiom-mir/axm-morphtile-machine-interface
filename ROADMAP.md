# Roadmap

- [x] Add bounded same-container tile-owned view composition over MorphTile's native `{ tile: id }` view primitive without copying target state or bindings.
- [x] Add explicit same-root full-path tile composition while keeping cross-root composition held behind a separate authority contract.
- [x] Reject presentation `anchor` outside tile mode and `dock` outside docked mode while preserving meaningful MorphTile defaults by omission.
- [x] Expose bounded MorphTile-native view styling: normalized RGB `accent`, finite `width >= 1`, and boolean text `strong`, without adding CSS or host authority.
- [x] Add bounded canonical-state truthy, numeric-threshold, and scalar equality/inequality conditional visibility without general expression authoring.
- [x] Add bounded canonical-state repeat generation with explicit source-tree and worst-case expanded-layout budgets.
- [x] Add bounded nearest-repeat lexical equality selectors over native `i` / `i_of`; independently verify and integrate Interface 0.5.12.
- [ ] Independently verify Interface 0.5.13 exact-head bounded lexical relational selectors before Director integration.
- [ ] Expose direct repeat-local value rendering only after MorphTile core truthfully propagates lexical repeat scope into expression-backed view text; core PR #17 is the current HOLD lane.
- [ ] Define a separate proof/authority contract before any cross-root tile composition is exposed; do not infer cross-root authority from same-root paths.
- [ ] Add host-side visual evidence for supported presentation modes without turning host/session state into canonical matter.
- [ ] Add presentation z-order/layer authoring only after a canonical MorphTile substrate primitive/schema is evidenced; do not invent a private Interface-only ordering contract.
- [x] Add negative integration fixtures for missing anchors and unsupported host-mode HOLD outcomes.
- [x] Deepen safe action-binding fixtures across real input, internal rule, attach socket, output signal and missing socket names while keeping state references symbolic rather than copied.
- [ ] Re-test and re-pin before widening MorphTile compatibility beyond the exact verified core and receiver revisions.

Do not add arbitrary responsive-layout claims, speculative host authority, arbitrary CSS/general expression authoring, duplicate embedded-tile state, state-to-state predicates, object/array equality predicates, repeat-local arithmetic, or permissionless bridge behavior merely to make the repository look complete.

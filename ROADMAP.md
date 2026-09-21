# Roadmap

- [x] Add bounded same-container tile-owned view composition over MorphTile's native `{ tile: id }` view primitive without copying target state or bindings.
- [x] Add explicit same-root full-path tile composition while keeping cross-root composition held behind a separate authority contract.
- [x] Reject presentation `anchor` outside tile mode and `dock` outside docked mode while preserving meaningful MorphTile defaults by omission.
- [x] Reject explicit authored `null` for optional presentation descriptors while keeping genuine omission distinct and preserving receiver-owned defaults.
- [x] Expose bounded MorphTile-native view styling: normalized RGB `accent`, finite `width >= 1`, and boolean text `strong`, without adding CSS or host authority.
- [x] Add bounded canonical-state truthy, numeric-threshold, and scalar equality/inequality conditional visibility without general expression authoring.
- [x] Add bounded canonical-state repeat generation with explicit source-tree and worst-case expanded-layout budgets.
- [x] Add bounded nearest-repeat lexical equality selectors over native `i` / `i_of`; independently verify and integrate Interface 0.5.12.
- [x] Add bounded nearest-repeat lexical relational selectors over native `i` / `i_of`; independently verify and integrate Interface 0.5.13.
- [x] Re-pin the Interface receiver harness to integrated Assembly `92f97d4d9b002c76d37a14910e05e65a60f78de8` and require fresh CI before claiming compatibility.
- [x] Re-earn receiver compatibility against integrated Assembly `3a4af4417de21fff862bf309e3576c362bcac7f5`, whose semantic-container checks advanced after the previous receiver receipt.
- [x] Re-prove the repaired Interface-v0.5 presentation receiver against integrated Assembly `4b7f89f83dff90d07ab6e70b7b40e8623579bbf1` using a real Interface-generated positive-control candidate that distinguishes omission, authored `false`, and numeric zero.
- [ ] Re-earn exact receiver compatibility against integrated Assembly `9fe8b53daf3e572c596c142859cca2199a976553`, whose compatibility grammar now fails closed on malformed status-less candidate wrappers while preserving valid plain-map wrappers and upstream HOLD authority; rerun the existing producer-generated positive-control suite before claiming compatibility.
- [ ] Expose direct repeat-local value rendering only after MorphTile core truthfully propagates lexical repeat scope into expression-backed view text; core PR #17 is the current HOLD lane.
- [ ] Keep expression-backed meter/button/control labels under the same core lexical-scope rule when nested in repeats; do not work around the core by copying repeat locals or action/control authority into Interface matter.
- [ ] Define a separate proof/authority contract before any cross-root tile composition is exposed; do not infer cross-root authority from same-root paths.
- [ ] Add host-side visual evidence for supported presentation modes without turning host/session state into canonical matter.
- [ ] Add presentation z-order/layer authoring only after a canonical MorphTile substrate primitive/schema is evidenced; do not invent a private Interface-only ordering contract.
- [x] Add negative integration fixtures for missing anchors and unsupported host-mode HOLD outcomes.
- [x] Deepen safe action-binding fixtures across real input, internal rule, attach socket, output signal and missing socket names while keeping state references symbolic rather than copied.
- [ ] Re-test and re-pin before widening MorphTile compatibility beyond the exact verified core and receiver revisions.

Do not add arbitrary responsive-layout claims, speculative host authority, arbitrary CSS/general expression authoring, duplicate embedded-tile state, state-to-state predicates, object/array equality predicates, repeat-local arithmetic, or permissionless bridge behavior merely to make the repository look complete.

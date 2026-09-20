# Roadmap

- [x] Add bounded same-container tile-owned view composition over MorphTile's native `{ tile: id }` view primitive without copying target state or bindings.
- [x] Independently verify Interface 0.5.5 local-tile composition and integrate it through the Creation Director.
- [x] Add explicit same-root full-path tile composition that compiles to an unambiguous absolute native tile reference while keeping cross-root composition held.
- [ ] Independently verify Interface 0.5.6 exact-head same-root path composition before Director integration.
- [ ] Define a separate proof/authority contract before any cross-root tile composition is exposed; do not infer cross-root authority from same-root paths.
- [ ] Add host-side visual evidence for the supported presentation modes without turning host/session state into canonical matter.
- [x] Add negative integration fixtures for missing anchors and unsupported host-mode HOLD outcomes.
- [x] Deepen safe action-binding fixtures across real input, internal rule, attach socket, output signal and missing socket names while keeping state references symbolic rather than copied.
- [ ] Re-test and re-pin before widening MorphTile compatibility beyond the exact verified core revision.

Do not add arbitrary responsive-layout claims, speculative host authority, duplicate embedded-tile state, or permissionless bridge behavior merely to make the repository look complete.

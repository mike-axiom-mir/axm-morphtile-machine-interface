# Changelog

## 0.3.0 — 2026-09-20

- Added a fail-closed top-level interface intent contract so unsupported or misspelled fields cannot disappear silently.
- Bounded tile and anchor references to MorphTile-compatible symbolic tile IDs.
- Rejected orphan labels and binding declarations that would otherwise be ignored.
- Preserved explicitly authored text beside readouts, controls and actions instead of dropping it when interactive nodes are present.
- Preserved explicit empty titles/labels rather than replacing them through truthiness fallbacks.
- Re-pinned exact MorphTile runtime conformance to `a579182ae585e5722ac87dd0cc8209963b18d000` and made CI assert that runtime identity matches `machine.json`.
- Added pinned runtime proof that explanatory text and a canonical parameter control coexist without copying or changing the parameter value.

## 0.2.0 — 2026-09-20

- Retained the original view-only candidate shape for requests without placement.
- Added deterministic `presentation.set` output when placement is requested.
- Whitelisted public presentation fields so canonical/session snapshots cannot leak into candidate matter.
- Added invalid-placement HOLDs.
- Added a GitHub integration lane pinned to MorphTile `fea73dc1a838f90abdf7c3db8b52b23224792137`.

## 0.1.0 — 2026-09-19

- Established the isolated repository boundary.
- Added provisional envelope v0.1, machine manifest, fixture, executable proof, tests, and minimal CI.
- Pinned the exact MorphTile v0.4 commit tested as a contract target.
- Recorded unsupported work as HOLD or NOT TESTED.

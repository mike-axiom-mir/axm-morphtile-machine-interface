# Status

- Machine version: 0.5.13
- State: CANDIDATE — EXACT-HEAD CI + INDEPENDENT VERIFICATION REQUIRED
- Local tests: `npm test`
- MorphTile target: v0.4 at `2bdf8eade1376055473b9cc1b11734b72a5566e5`
- Assembly receiver target: `66eb29fa8a344a20aabce0cb73f1cd302166efd8`
- Envelope: provisional v0.1
- Visual proof: runtime vnode/HTML behavior only; aesthetic host quality remains NOT_TESTED

## Integrated baseline

Interface 0.5.12 nearest-repeat equality selectors were independently verified and integrated by the Creation Director as Interface main `ee6faff8ecfa1274ffc91c72aa46ba17185bc9ab` before this candidate. The integrated baseline therefore already includes bounded canonical-state truthy/threshold/equality conditions, bounded canonical-state repeat, meter, tile-owned composition, native view styling, mode-owned placement fields, and exact lexical repeat equality selection.

## Implemented in this candidate

Interface 0.5.13 extends only the existing lexical `repeat_when` producer vocabulary. The old `{ kind: "repeat_when", source: "index"|"count", equals: N, children }` shorthand remains compatible. A selector may instead author `comparison` plus integer `value`, using the same bounded names already proven for canonical `when`: `above`, `at_least`, `below`, `at_most`, `equals`, or `not_equals`.

These compile directly to MorphTile's existing scoped native comparison expressions over lexical `i` / `i_of`. Index operands remain bounded from 0 through nearest-repeat `max - 1`; count operands remain bounded from 1 through nearest-repeat `max`; nested selectors still bind to the nearest repeat. The machine rejects half-specified forms, unsupported operators, fractional/out-of-range operands, and mixing the old `equals` shorthand with the new `comparison`/`value` form. Lexical locals remain runtime scope, not canonical state, and create no extra readout proof obligation.

## Evidence

- Regression-first head `3e62850f17592fbcb39b10c2ea7e5cf1ae17af2a`, Actions `35568112714`: unit and pinned MorphTile integration failed on the missing producer vocabulary while Assembly receiver integration stayed green.
- Semantic implementation head `de0e9e7c7456ffb9c3010183606deb7cb160591e`, Actions `35568288390`: unit, pinned MorphTile integration, and Assembly receiver integration all passed. The runtime proof verifies `index >= 1`, `index < 2`, and `count >= 3` inside real repeat lexical scope while rendering stays structurally read-only and rollback remains exact.
- Assembly was then re-pinned to current integrated main `66eb29fa8a344a20aabce0cb73f1cd302166efd8`; head `bb470197f01861e157f1127fd79014c2823d9f5e`, Actions `35568353896`, passed all three lanes.
- Version alignment to 0.5.13 intentionally exposed three stale version assertions; only those assertions were updated. Head `3eec92718f4543dcd374face47a9eaedf8645f63`, Actions `35568690577`, passed unit, MorphTile integration, and Assembly receiver integration.
- Independent Verification must replay the final exact PR head before Director integration.

## Existing substrate HOLDs

MorphTile core PR #17 remains the canonical HOLD lane for propagating repeat lexical scope into expression-backed view text. Interface does not expose direct repeat-local numeric/text rendering until core genuinely consumes that lexical scope. Presentation z-order/layer authoring also remains held because current MorphTile core has no evidenced canonical z-order primitive/schema. No duplicate core candidate or private Interface workaround was created this run.

## Reusable rules learned

- Lexical runtime locals are not canonical state and must not be promoted into target proof obligations or copied state.
- A bounded producer may reuse a substrate evaluator only for semantics the substrate demonstrably consumes in the same lexical scope.
- Extend an existing bounded vocabulary before exposing a general expression language.
- Nearest-scope bounds remain part of the authority contract even when the underlying evaluator could accept wider numbers.
- Receiver pins are evidence identities; compatibility must be re-earned against current integrated receiver heads.

## HELD / not claimed

- independent Verification of the exact Interface 0.5.13 PR head;
- direct repeat-local value rendering until MorphTile core PR #17 is truthfully repaired and integrated;
- arbitrary/compound expression authoring, state-to-state comparisons, repeat-local arithmetic, or object/array predicates;
- presentation z-order/layer authoring without a canonical core primitive;
- aesthetic host visual quality, arbitrary CSS/classes/raw style strings, arbitrary responsive/pixel layout, or ambient host permissions;
- cross-root/cross-container tile composition without a separate authority/proof contract;
- compatibility beyond the exact pinned MorphTile and Assembly revisions;
- a universal cross-machine envelope standard.

No claim of autonomous creation, production readiness, CANON, or visual quality is made.

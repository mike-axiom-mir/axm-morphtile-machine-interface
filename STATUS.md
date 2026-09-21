# Status

- Machine version: 0.5.11
- State: CANDIDATE — EXACT-HEAD CI + INDEPENDENT VERIFICATION REQUIRED
- Local tests: `npm test`
- MorphTile target: v0.4 at `2bdf8eade1376055473b9cc1b11734b72a5566e5`
- Assembly receiver target: `9bb340ca0b7e9e7c456fb4ef2931171d11bbab00`
- Envelope: provisional v0.1
- Visual proof: runtime vnode/HTML behavior only; aesthetic host quality remains NOT_TESTED

## Integrated baseline

Interface 0.5.10 bounded numeric-threshold visibility was integrated by the Creation Director as Interface main `261041eb40e055bfaa8f4923ff44f672f64356d0` before this candidate. Truthy `when`, bounded threshold `when`, bounded repeat, native meter, tile-owned composition, native view styling and presentation-mode ownership rules therefore remain baseline behavior rather than being reimplemented here.

## Implemented in this candidate

Interface 0.5.11 adds bounded equality conditional visibility on top of the existing canonical-state `when` element:

- `{ kind: "when", binding, comparison: "equals", expected, children }` compiles to MorphTile's native `["==", ["var", binding], expected]` expression;
- `comparison: "not_equals"` compiles to native `!=`;
- `expected` is deliberately limited to portable authored scalar values: string, boolean, finite number or `null`;
- equality uses `comparison + expected`, while numeric threshold predicates keep their separate `comparison + threshold` contract; the two operand forms cannot be mixed;
- the original truthy form remains unchanged when no comparison is authored;
- the live value still comes only from the symbolic canonical-state binding, which must be declared through `intent.bindings.readouts` and proven by the ordinary target-proof dependency;
- no copied live value, second evaluator, bridge state, target permission or arbitrary expression tree is introduced.

## Why this belongs in Interface Machine

MorphTile core already owns the universal conditional evaluator and strict `==` / `!=` expression operators. The missing capability was only a bounded producer vocabulary for a common interface need such as showing matter for one canonical phase, state or choice. Creating another core primitive or a private evaluator would duplicate substrate behavior, so this candidate compiles directly into the existing native expression language.

## Evidence before integration

- regression-first head `f9e3a8ef39b0c223467b47ac5c7bbfe8b93a9b52`, Actions run `35560858213`: unit and pinned MorphTile integration failed on the new equality expectations while Assembly receiver integration stayed green, proving the producer vocabulary was genuinely absent;
- implementation/receiver-refresh head `46ab24412de2846b7cc5951bff8d5c414decc8b0`, Actions run `35561044360`: pinned MorphTile integration and current Assembly receiver integration passed, including the live equality-state runtime proof; unit remained red only because three existing version assertions still expected 0.5.10;
- those stale assertions were repaired without weakening their semantic checks;
- the final exact PR head must retain all three green lanes before integration;
- independent Verification must replay the exact final PR head before Director integration.

## Reusable rules learned

- A common state-driven UI predicate does not require handing callers the whole expression language: expose the smallest semantic vocabulary that compiles into an already-owned substrate primitive.
- Equality constants are authored configuration, not state authority. The compared live value must remain a symbolic read from canonical target state.
- Keep semantically different predicate families explicit: numeric thresholds use a numeric threshold operand; equality uses a bounded scalar expected operand. Do not infer one from the other.
- Receiver pins are evidence identities; compatibility must be re-earned against the current integrated receiver rather than inherited from older green evidence.

## HELD / not claimed

- independent Verification of the exact Interface 0.5.11 PR head;
- arbitrary MorphTile expression authoring, compound boolean predicates, state-to-state comparisons, object/array predicates, regex/pattern predicates, or repeat-index-dependent child expressions;
- presentation z-order/layer authoring: current MorphTile core still has no evidenced canonical z-order primitive/schema, so Interface does not invent one;
- aesthetic/host visual-quality proof;
- arbitrary CSS, raw style strings, classes, arbitrary color strings, or expression-authored accent/width;
- arbitrary responsive/pixel layout and ambient host permissions;
- cross-root/cross-container tile composition without a separate authority/proof contract;
- compatibility beyond the exact pinned MorphTile and Assembly revisions;
- a universal cross-machine envelope standard.

No claim of autonomous creation, production readiness, CANON, or visual quality is made.

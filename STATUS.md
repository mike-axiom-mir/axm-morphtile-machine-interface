# Status

- Machine version: 0.5.12
- State: CANDIDATE — EXACT-HEAD CI + INDEPENDENT VERIFICATION REQUIRED
- Local tests: `npm test`
- MorphTile target: v0.4 at `2bdf8eade1376055473b9cc1b11734b72a5566e5`
- Assembly receiver target: `1c3b59f192f036fd872a0e5245abaef684ea715f`
- Envelope: provisional v0.1
- Visual proof: runtime vnode/HTML behavior only; aesthetic host quality remains NOT_TESTED

## Integrated baseline

Interface 0.5.11 bounded equality visibility was independently verified and integrated by the Creation Director as Interface main `5488b71b3431e13eb681e301ec171a47b70a630f` before this candidate. Truthy/threshold/equality `when`, bounded canonical-state repeat, meter, tile-owned composition, native view styling and presentation-mode ownership rules therefore remain baseline behavior rather than being reimplemented here.

## Implemented in this candidate

Interface 0.5.12 adds one bounded producer vocabulary for selecting matter from MorphTile's already-native lexical repeat scope:

- `{ kind: "repeat_when", source: "index", equals: N, children }` compiles to native `when: ["==", ["var", "i"], N]`;
- `{ kind: "repeat_when", source: "count", equals: N, children }` compiles to native `when: ["==", ["var", "i_of"], N]`;
- the element is legal only inside a nearest authored `repeat`;
- `index` is zero-based and bounded by that nearest repeat's authored `max`; `count` is bounded from 1 through the nearest repeat's `max`;
- nested selectors bind to the nearest repeat scope rather than an outer repeat;
- repeat-local values are lexical runtime locals, not canonical target state, so they do not create readout proof dependencies;
- child controls/actions/readouts still carry their ordinary target-proof obligations;
- no copied state, new evaluator, bridge authority, arbitrary expression tree or permission surface is introduced.

## Evidence

- regression-first head `03ef704d5bf5f69af4f163a05f35a167bb426883`, Actions `35564351306`: unit failed on the missing `repeat_when` vocabulary while pinned MorphTile integration and Assembly receiver integration stayed green;
- intermediate head `4cdf76f7d5dc673aaec7b6640301e204df306651`, Actions `35564504631`: MorphTile integration and current Assembly receiver integration passed, including the new real runtime selector proof; unit was red only because three pre-existing assertions still expected machine version 0.5.11;
- those stale version assertions were updated without weakening their semantic checks;
- exact semantic head `18a86114c24b1602496e13c3ad28afe6d04aa164`, Actions `35564604672`: unit, MorphTile integration and Assembly receiver integration all passed before this documentation refresh;
- final exact PR head still requires the same three green lanes after all documentation commits;
- independent Verification must replay the final exact head before Director integration.

## Failed path preserved as evidence

A broader `repeat_value` experiment was opened as Interface PR #23 and deliberately closed unmerged after core inspection showed it would be false. MorphTile's repeat runtime creates lexical `i` / `i_of` scope and its native `when` and meter paths consume that scoped evaluator, but expression-backed text currently renders through the outer label evaluator. Interface therefore does not pretend that repeat-local numeric/text value rendering works. A truthful future repair requires MorphTile core to propagate lexical repeat scope into expression-backed view text first; only then may Interface expose a bounded value vocabulary.

## Reusable rules learned

- Lexical runtime locals are not canonical state and must not be promoted into target proof obligations or copied state.
- A producer may expose only the portion of a substrate primitive that the runtime actually consumes; syntactically plausible output is insufficient evidence.
- Nested lexical features must bind to the nearest owning scope and inherit that scope's bounds.
- When core lacks a universal runtime behavior, Interface must HOLD rather than create a private evaluator or duplicate authority.
- Receiver pins are evidence identities; compatibility must be re-earned against the current integrated receiver.

## HELD / not claimed

- independent Verification of the exact Interface 0.5.12 PR head;
- direct repeat-local index/count value rendering until MorphTile core gains scoped expression-backed text;
- arbitrary MorphTile expression authoring, compound predicates, state-to-state comparisons or repeat-local arithmetic;
- presentation z-order/layer authoring: current MorphTile core still has no evidenced canonical z-order primitive/schema;
- aesthetic/host visual-quality proof;
- arbitrary CSS/classes/raw style strings, arbitrary responsive/pixel layout or ambient host permissions;
- cross-root/cross-container tile composition without a separate authority/proof contract;
- compatibility beyond the exact pinned MorphTile and Assembly revisions;
- a universal cross-machine envelope standard.

No claim of autonomous creation, production readiness, CANON, or visual quality is made.

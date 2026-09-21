# Status

- Machine version: 0.5.10
- State: CANDIDATE — EXACT-HEAD CI + INDEPENDENT VERIFICATION REQUIRED
- Local tests: `npm test`
- MorphTile target: v0.4 at `2bdf8eade1376055473b9cc1b11734b72a5566e5`
- Assembly receiver target: `92eaf40c2f458687a6a9ba6361cc0ec3ff540d0b`
- Envelope: provisional v0.1
- Visual proof: runtime vnode/HTML behavior only; aesthetic host quality remains NOT_TESTED

## Integrated baseline

Interface 0.5.9 mode-owned docking semantics were integrated by the Creation Director as Interface main `3e07fd6f87e077bd477ca65bb94c75179d971956` before this candidate. The existing truthy `when`, bounded repeat, native meter, tile-owned composition, native view styling and presentation-mode ownership rules therefore remain baseline behavior rather than being reimplemented here.

## Implemented in this candidate

Interface 0.5.10 adds bounded numeric-threshold conditional visibility on top of the existing canonical-state `when` element:

- existing `{ kind: "when", binding, children }` remains backward-compatible and compiles to MorphTile's native truthy `["var", binding]` condition;
- optional `comparison` + `threshold` must be supplied together;
- the only comparison vocabulary is `above`, `at_least`, `below`, `at_most`, compiling respectively to MorphTile's native `>`, `>=`, `<`, `<=` expressions;
- `threshold` must be one finite authored number; arbitrary expressions, equality/string predicates and copied live values are not accepted;
- the state source remains the existing symbolic `binding`, which must still be declared in `intent.bindings.readouts` and proven by the ordinary target-proof dependency;
- unknown/authority-shaped fields still HOLD, so a caller cannot attach a `state_value` snapshot to the condition;
- no alternate evaluator, duplicated canonical state, bridge authority or new MorphTile representation is introduced.

## Why this belongs in Interface Machine

MorphTile core already owns the universal conditional-view evaluator and the comparison operators used here. The missing capability was a bounded producer vocabulary for a common UI need: show ordinary interface matter when a canonical numeric value crosses an authored threshold. Creating another core primitive or a private evaluator would duplicate substrate behavior, so this compiles directly into the existing native expression language.

## Evidence before integration

- regression-first head `34ab759b7aa6c3c6551048510be7b26a481b5074`, Actions run `35556880726`: unit failed on the new threshold expectations while pinned MorphTile and Assembly receiver integration stayed green;
- semantic implementation head `4cf84b113232e1174b537d4ca6a26033e8dd0a69`, Actions run `35556971153`: unit, pinned MorphTile integration and Assembly receiver integration all passed, including the live threshold-state runtime proof;
- consolidated 0.5.10 head `10d80b5bfa3e6561223972dd150dcd591cc9354f`, Actions run `35557112104`: all three jobs passed after the version alignment and Assembly receiver refresh to `92eaf40c2f458687a6a9ba6361cc0ec3ff540d0b`;
- final documentation head must also retain all three green lanes before integration;
- independent Verification must replay the exact final PR head before Director integration.

## Reusable rules learned

- Common state-driven UI conditions do not require handing callers the whole expression language: expose the smallest semantic vocabulary that compiles into an already-owned substrate primitive.
- An authored threshold is configuration, not state authority; the live value must still be read from the canonical target through the existing proof lane.
- Backward-compatible semantic extension should preserve the old truthy form exactly when the new bounded fields are omitted.
- Receiver pins are evidence identities; compatibility must be re-earned against the current integrated receiver rather than inherited from older green evidence.

## HELD / not claimed

- independent Verification of the exact Interface 0.5.10 PR head;
- arbitrary MorphTile expression authoring, equality/string predicates, compound boolean predicates, or repeat-index-dependent child expressions;
- presentation z-order/layer authoring: current MorphTile core still has no evidenced canonical z-order primitive/schema, so Interface does not invent one;
- aesthetic/host visual-quality proof;
- arbitrary CSS, raw style strings, classes, arbitrary color strings, or expression-authored accent/width;
- arbitrary responsive/pixel layout and ambient host permissions;
- cross-root/cross-container tile composition without a separate authority/proof contract;
- compatibility beyond the exact pinned MorphTile and Assembly revisions;
- a universal cross-machine envelope standard.

No claim of autonomous creation, production readiness, CANON, or visual quality is made.

"use strict";

const fs = require("node:fs");

function replaceOnce(path, oldText, newText) {
  const text = fs.readFileSync(path, "utf8");
  const first = text.indexOf(oldText);
  const last = text.lastIndexOf(oldText);
  if (first < 0 || first !== last) throw new Error(`${path}: expected exactly one occurrence of ${JSON.stringify(oldText)}`);
  fs.writeFileSync(path, text.slice(0, first) + newText + text.slice(first + oldText.length));
}

const fixture = require("../fixtures/request.counter-view.json");
const beforeMachine = require("../src");
const pre = JSON.parse(JSON.stringify(fixture));
pre.request_id = "prepatch-duplicate-action-binding";
pre.intent.bindings.actions.push("increment");
const preOut = beforeMachine.run(pre);
if (preOut.status !== "CANDIDATE") throw new Error(`expected prepatch duplicate declaration to be silently accepted, got ${preOut.status}`);
console.log("PREPATCH_EVIDENCE duplicate action declaration was accepted and deduplicated implicitly");

replaceOnce(
  "src/index.js",
  'const MACHINE = { id: "axm.morphtile.machine.interface", version: "0.5.16" };',
  'const MACHINE = { id: "axm.morphtile.machine.interface", version: "0.5.17" };'
);
replaceOnce(
  "src/index.js",
  "    normalized[key] = [...new Set(list)].sort();",
  [
    "    const unique = [...new Set(list)];",
    "    if (unique.length !== list.length) {",
    "      const duplicates = [...new Set(list.filter((name, index) => list.indexOf(name) !== index))].sort();",
    "      return {",
    "        ok: false,",
    "        error: `intent.bindings.${key} contains duplicate symbolic name${duplicates.length === 1 ? \"\" : \"s\"}: ${duplicates.join(\", \")}`",
    "      };",
    "    }",
    "    normalized[key] = unique.sort();"
  ].join("\n")
);
replaceOnce("machine.json", '"version":"0.5.16"', '"version":"0.5.17"');
replaceOnce("package.json", '"version":"0.5.16"', '"version":"0.5.17"');
replaceOnce("test/interface-intent.test.js", 'assert.equal(MACHINE.version, "0.5.16");', 'assert.equal(MACHINE.version, "0.5.17");');
replaceOnce("INTEGRATION.md", "- machine version: 0.5.16", "- machine version: 0.5.17");
replaceOnce("STATUS.md", "- Machine version: 0.5.16", "- Machine version: 0.5.17");
replaceOnce("STATUS.md", "Interface 0.5.16 consumes the now-integrated MorphTile lexical presentation primitive", "Interface 0.5.17 consumes the now-integrated MorphTile lexical presentation primitive");
replaceOnce(
  "README.md",
  "- every declared symbolic binding must be consumed by the authored interface; extra declarations HOLD instead of disappearing;",
  "- every declared symbolic binding must be unique and consumed by the authored interface; duplicate or extra declarations HOLD instead of being silently collapsed or disappearing;"
);
replaceOnce(
  "STATUS.md",
  "- Multiple interface surfaces may share one symbolic target capability without multiplying canonical state or authority; view multiplicity and state multiplicity are different things.",
  "- Multiple interface surfaces may share one symbolic target capability without multiplying canonical state or authority; view multiplicity and state multiplicity are different things.\n- Binding declaration arrays are proof vocabularies, not multisets: declare each symbolic capability once; duplicate declarations HOLD instead of being silently deduplicated."
);
replaceOnce(
  "ROADMAP.md",
  "- [x] Add bounded same-container tile-owned view composition over MorphTile's native `{ tile: id }` view primitive without copying target state or bindings.",
  "- [x] Add bounded same-container tile-owned view composition over MorphTile's native `{ tile: id }` view primitive without copying target state or bindings.\n- [x] Fail closed on duplicate symbolic binding declarations so proof vocabulary is unique even when multiple view surfaces legitimately share one capability."
);

const testPath = "test/interface-intent.test.js";
let testText = fs.readFileSync(testPath, "utf8");
const marker = 'test("duplicate symbolic binding declarations HOLD instead of being silently deduplicated"';
if (testText.includes(marker)) throw new Error("duplicate declaration regression test already exists unexpectedly");
testText += [
  "",
  'test("duplicate symbolic binding declarations HOLD instead of being silently deduplicated", () => {',
  "  const cases = [",
  "    {",
  '      key: "actions",',
  '      name: "increment",',
  "      build() {",
  "        const request = clone(fixture);",
  '        request.intent.bindings.actions.push("increment");',
  "        return request;",
  "      }",
  "    },",
  "    {",
  '      key: "readouts",',
  '      name: "count",',
  "      build() {",
  "        const request = clone(fixture);",
  '        request.intent.bindings.readouts.push("count");',
  "        return request;",
  "      }",
  "    },",
  "    {",
  '      key: "controls",',
  '      name: "count",',
  "      build() {",
  "        const request = clone(fixture);",
  "        request.intent = {",
  '          tile_path: "mt_counter",',
  '          control: "count",',
  '          bindings: { controls: ["count", "count"] }',
  "        };",
  "        return request;",
  "      }",
  "    }",
  "  ];",
  "",
  "  for (const entry of cases) {",
  "    const request = entry.build();",
  "    request.request_id = `interface-duplicate-${entry.key}`;",
  "    const out = run(request);",
  '    assert.equal(out.status, "HOLD");',
  '    assert.equal(out.holds[0].code, "HOLD_INVALID_INTERFACE_BINDING");',
  "    assert.equal(out.holds[0].detail, `intent.bindings.${entry.key} contains duplicate symbolic name: ${entry.name}`);",
  "    assert.equal(out.candidate, null);",
  "  }",
  "});",
  ""
].join("\n");
fs.writeFileSync(testPath, testText);

const changelogPath = "CHANGELOG.md";
let changelog = fs.readFileSync(changelogPath, "utf8");
const heading = "# Changelog\n";
if (!changelog.startsWith(heading)) throw new Error("CHANGELOG.md heading changed unexpectedly");
const entry = [
  "",
  "## 0.5.17 — 2026-09-22",
  "",
  "- Reject duplicate symbolic names inside `intent.bindings.readouts`, `.actions`, or `.controls` instead of silently deduplicating authored proof vocabulary.",
  "- Preserve legitimate view multiplicity: multiple readout/action/control surfaces may still share one declared target capability, while the authority declaration itself is unique.",
  "- Keep canonical state, target proof structure, MorphTile Core pins, Assembly receiver pins, and bridge permissions unchanged.",
  ""
].join("\n");
fs.writeFileSync(changelogPath, heading + entry + changelog.slice(heading.length));

console.log("PATCH_READY binding declaration uniqueness repair staged");

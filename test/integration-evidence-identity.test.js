"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const sources = require("../fixtures/integration-sources.json");

const root = path.resolve(__dirname, "..");
const read = (name) => fs.readFileSync(path.join(root, name), "utf8");
const lines = (text) => text.split(/\r?\n/);

test("receiver evidence truth surfaces match the executable Assembly fixture identity", () => {
  const repository = sources.assembly.repository;
  const commit = sources.assembly.commit;

  assert.match(repository, /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/);
  assert.match(commit, /^[0-9a-f]{40}$/);

  const status = read("STATUS.md");
  const readme = read("README.md");
  const roadmap = read("ROADMAP.md");
  const workflow = read(".github/workflows/test.yml");

  assert.ok(
    lines(status).includes(`- Assembly receiver evidence target: \`${commit}\``),
    "STATUS.md must name the same exact Assembly evidence commit that CI checks out"
  );
  assert.ok(
    lines(readme).some((line) => line.startsWith(`- ASSEMBLY RECEIVER TARGET: exact integrated Assembly \`${commit}\`;`)),
    "README.md must name the same exact Assembly evidence commit that CI checks out"
  );
  const currentRoadmapLines = lines(roadmap).filter((line) => line.includes(commit));
  assert.ok(
    currentRoadmapLines.some((line) => line.startsWith("- [x] ")),
    "ROADMAP.md must mark the current exact Assembly receiver evidence target as completed"
  );
  assert.equal(
    currentRoadmapLines.filter((line) => line.startsWith("- [ ] ")).length,
    0,
    "ROADMAP.md must not leave the current exact Assembly receiver evidence target as an unresolved TODO"
  );
  assert.ok(
    lines(workflow).some((line) => line.trim() === `repository: ${repository}`),
    "the receiver workflow repository must match fixtures/integration-sources.json"
  );
});

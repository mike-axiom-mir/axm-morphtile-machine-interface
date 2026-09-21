"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const sources = require("../fixtures/integration-sources.json");

const root = path.resolve(__dirname, "..");
const read = (name) => fs.readFileSync(path.join(root, name), "utf8");
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

test("receiver evidence truth surfaces match the executable Assembly fixture identity", () => {
  const repository = sources.assembly.repository;
  const commit = sources.assembly.commit;

  assert.match(repository, /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/);
  assert.match(commit, /^[0-9a-f]{40}$/);

  const status = read("STATUS.md");
  const readme = read("README.md");
  const workflow = read(".github/workflows/test.yml");

  assert.match(
    status,
    new RegExp(`^- Assembly receiver evidence target: \\`${escapeRegExp(commit)}\\`$`, "m"),
    "STATUS.md must name the same exact Assembly evidence commit that CI checks out"
  );
  assert.match(
    readme,
    new RegExp(`^- ASSEMBLY RECEIVER TARGET: exact integrated Assembly \\`${escapeRegExp(commit)}\\`;`, "m"),
    "README.md must name the same exact Assembly evidence commit that CI checks out"
  );
  assert.match(
    workflow,
    new RegExp(`^\\s*repository: ${escapeRegExp(repository)}$`, "m"),
    "the receiver workflow repository must match fixtures/integration-sources.json"
  );
});

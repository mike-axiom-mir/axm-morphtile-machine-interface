"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (name) => fs.readFileSync(path.join(root, name), "utf8");

test("every Assembly-dependent integration proof is executed by the Assembly receiver CI lane", () => {
  const testDir = path.join(root, "test");
  const receiverProofs = fs.readdirSync(testDir)
    .filter((name) => name.endsWith(".integration.test.js"))
    .filter((name) => read(path.join("test", name)).includes("MORPHTILE_ASSEMBLY"))
    .map((name) => `test/${name}`)
    .sort();

  assert.ok(receiverProofs.length > 0, "the repository must expose at least one Assembly-dependent integration proof");

  const workflow = read(".github/workflows/test.yml");
  const job = workflow.match(/(?:^|\n)  assembly-receiver-integration:\n([\s\S]*?)(?=\n  [A-Za-z0-9_-]+:\n|$)/);
  assert.ok(job, "test.yml must expose the Assembly receiver integration job");

  const listed = Array.from(
    job[0].matchAll(/test\/[A-Za-z0-9._-]+\.integration\.test\.js/g),
    (match) => match[0]
  ).sort();
  const uniqueListed = [...new Set(listed)];

  assert.deepEqual(
    listed,
    uniqueListed,
    "the Assembly receiver CI lane must not execute the same proof more than once"
  );
  assert.deepEqual(
    uniqueListed,
    receiverProofs,
    "every integration proof that consumes MORPHTILE_ASSEMBLY must be explicitly executed by the Assembly receiver CI lane, and stale workflow entries are forbidden"
  );
});

"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const machine = require("../machine.json");
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

test("repository truth describes evidence state without embedding pull-request lifecycle", () => {
  const status = read("STATUS.md");
  const stateLine = lines(status).find((line) => line.startsWith("- State:"));
  const currentReceiverHeading = lines(status).find((line) => line.startsWith("## Current receiver evidence"));

  assert.ok(stateLine, "STATUS.md must expose one repository state line");
  assert.doesNotMatch(
    stateLine,
    /\bcandidate\b/i,
    "repository state must remain true before and after merge; PR lifecycle belongs in the PR/handoff, not persistent repository truth"
  );
  assert.equal(
    currentReceiverHeading,
    "## Current receiver evidence",
    "current receiver evidence heading must remain lifecycle-neutral rather than becoming stale after merge"
  );
});

test("receiver evidence wording stays pinned rather than pretending to follow Assembly main", () => {
  const commit = sources.assembly.commit;
  const status = read("STATUS.md");

  assert.ok(
    status.includes(`Executable Interface receiver evidence is pinned to integrated Assembly \`${commit}\`.`),
    "STATUS.md must describe the executable receiver commit as a pinned evidence identity"
  );
  assert.doesNotMatch(
    status,
    /Assembly receiver evidence currently targets integrated main/i,
    "a reproducible receiver pin must not be worded as a floating claim about the latest Assembly main"
  );
});

test("INTEGRATION.md current contract identity matches executable machine and receiver pins", () => {
  const integration = read("INTEGRATION.md");
  const contractLines = lines(integration);

  assert.ok(
    contractLines.includes(`- repository: ${machine.tested_against.repository}`),
    "INTEGRATION.md must name the repository from machine.json tested_against"
  );
  assert.ok(
    contractLines.includes(`- commit: ${machine.tested_against.commit}`),
    "INTEGRATION.md must name the exact MorphTile commit from machine.json tested_against"
  );
  assert.ok(
    contractLines.includes(`- format: ${machine.tested_against.format}`),
    "INTEGRATION.md must name the exact MorphTile format from machine.json tested_against"
  );
  assert.ok(
    contractLines.includes(`- provisional envelope: v${machine.envelope}`),
    "INTEGRATION.md must name the machine envelope version"
  );
  assert.ok(
    contractLines.includes(`- machine version: ${machine.version}`),
    "INTEGRATION.md must name the current machine version"
  );
  assert.ok(
    integration.includes(`Assembly receiver compatibility is separately pinned to \`${sources.assembly.commit}\` in CI.`),
    "INTEGRATION.md must name the exact Assembly receiver identity exercised by CI"
  );
});

"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const packageJson = require("../package.json");
const {
  loadManifest,
  listIntegrationProofFiles,
  validateManifest,
  proofsForDependency
} = require("../scripts/run-integration-proofs");

const read = (name) => fs.readFileSync(path.join(root, name), "utf8");

function uncommentedLines(text) {
  return text
    .split(/\r?\n/)
    .filter((line) => !/^\s*#/.test(line));
}

function workflowJob(text, jobName) {
  const lines = uncommentedLines(text);
  const start = lines.findIndex((line) => line === `  ${jobName}:`);
  assert.notEqual(start, -1, `workflow must expose ${jobName}`);

  let end = lines.length;
  for (let i = start + 1; i < lines.length; i += 1) {
    if (/^  [A-Za-z0-9_-]+:\s*$/.test(lines[i])) {
      end = i;
      break;
    }
  }
  return lines.slice(start, end);
}

function runCommands(lines) {
  return lines
    .map((line) => line.match(/^\s*- run:\s*(.+?)\s*$/))
    .filter(Boolean)
    .map((match) => match[1]);
}

test("every integration proof has structured dependency identity", () => {
  const manifest = loadManifest();
  assert.equal(validateManifest(manifest), true);

  const declared = manifest.proofs.map((proof) => proof.path).sort();
  assert.deepEqual(declared, listIntegrationProofFiles());
});

test("Assembly proof execution is selected from dependency declarations, not source spelling", () => {
  const manifest = loadManifest();
  assert.deepEqual(proofsForDependency(manifest, "assembly"), [
    "test/assembly-dependency.integration.test.js",
    "test/assembly-plan-coverage.integration.test.js",
    "test/binding-namespace-authority.integration.test.js"
  ]);

  const actual = listIntegrationProofFiles();
  assert.throws(
    () => validateManifest(manifest, [...actual, "test/derived-env.integration.test.js"]),
    /unregistered=.*derived-env\.integration\.test\.js/,
    "a new integration proof must be registered even if it derives an environment key without a literal MORPHTILE_ASSEMBLY token"
  );
});

test("package script binds the Assembly CI lane to the registry-backed runner", () => {
  assert.equal(
    packageJson.scripts["test:integration:assembly"],
    "node scripts/run-integration-proofs.js --dependency assembly"
  );
});

test("Assembly workflow executes the registry-backed package script as a real run step", () => {
  const workflow = read(".github/workflows/test.yml");
  const job = workflowJob(workflow, "assembly-receiver-integration");
  const commands = runCommands(job);

  assert.ok(
    commands.includes("npm run test:integration:assembly"),
    "Assembly receiver job must execute the registry-backed package script"
  );
  assert.equal(
    commands.filter((command) => command === "npm run test:integration:assembly").length,
    1,
    "Assembly receiver job must execute the registry-backed package script exactly once"
  );
  assert.equal(
    commands.some((command) => /node\s+--test\s+test\//.test(command)),
    false,
    "Assembly receiver job must not maintain a second raw proof-path list"
  );
});

test("commented workflow text is not executable evidence", () => {
  const fake = [
    "jobs:",
    "  assembly-receiver-integration:",
    "    steps:",
    "      # - run: npm run test:integration:assembly",
    "      # test/binding-namespace-authority.integration.test.js",
    "      - run: echo no-proof"
  ].join("\n");

  const commands = runCommands(workflowJob(fake, "assembly-receiver-integration"));
  assert.deepEqual(commands, ["echo no-proof"]);
});

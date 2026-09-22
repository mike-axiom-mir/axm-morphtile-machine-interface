"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const manifestPath = path.join(root, "test", "integration-proof-manifest.json");
const KNOWN_DEPENDENCIES = new Set(["assembly", "morphtile"]);

function loadManifest() {
  return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
}

function listIntegrationProofFiles() {
  return fs.readdirSync(path.join(root, "test"))
    .filter((name) => name.endsWith(".integration.test.js"))
    .map((name) => `test/${name}`)
    .sort();
}

function validateManifest(manifest, actualProofFiles = listIntegrationProofFiles()) {
  if (!manifest || manifest.schema !== "axm.interface-integration-proofs/v0.1") {
    throw new Error("integration proof manifest schema must be axm.interface-integration-proofs/v0.1");
  }
  if (!Array.isArray(manifest.proofs) || manifest.proofs.length === 0) {
    throw new Error("integration proof manifest must declare at least one proof");
  }

  const seen = new Set();
  const declared = [];

  for (const proof of manifest.proofs) {
    if (!proof || typeof proof.path !== "string" || !proof.path.endsWith(".integration.test.js")) {
      throw new Error("every integration proof manifest entry must name a .integration.test.js path");
    }
    if (seen.has(proof.path)) {
      throw new Error(`duplicate integration proof manifest entry: ${proof.path}`);
    }
    seen.add(proof.path);
    declared.push(proof.path);

    if (!Array.isArray(proof.dependencies) || proof.dependencies.length === 0) {
      throw new Error(`integration proof ${proof.path} must declare at least one dependency`);
    }
    const depSet = new Set(proof.dependencies);
    if (depSet.size !== proof.dependencies.length) {
      throw new Error(`integration proof ${proof.path} declares duplicate dependencies`);
    }
    for (const dependency of proof.dependencies) {
      if (!KNOWN_DEPENDENCIES.has(dependency)) {
        throw new Error(`integration proof ${proof.path} declares unknown dependency ${dependency}`);
      }
    }
    if (proof.dependencies.includes("assembly") && !proof.dependencies.includes("morphtile")) {
      throw new Error(`Assembly proof ${proof.path} must also declare the MorphTile substrate dependency`);
    }
  }

  const sortedDeclared = [...declared].sort();
  const sortedActual = [...actualProofFiles].sort();
  if (JSON.stringify(sortedDeclared) !== JSON.stringify(sortedActual)) {
    const missing = sortedActual.filter((item) => !seen.has(item));
    const stale = sortedDeclared.filter((item) => !sortedActual.includes(item));
    throw new Error(`integration proof registry mismatch; unregistered=${JSON.stringify(missing)} stale=${JSON.stringify(stale)}`);
  }

  return true;
}

function proofsForDependency(manifest, dependency) {
  if (!KNOWN_DEPENDENCIES.has(dependency)) {
    throw new Error(`unknown integration dependency ${dependency}`);
  }
  validateManifest(manifest);
  return manifest.proofs
    .filter((proof) => proof.dependencies.includes(dependency))
    .map((proof) => proof.path)
    .sort();
}

function parseDependencyArg(argv) {
  const marker = argv.indexOf("--dependency");
  if (marker === -1 || marker + 1 >= argv.length) {
    throw new Error("usage: node scripts/run-integration-proofs.js --dependency <assembly|morphtile>");
  }
  return argv[marker + 1];
}

function runDependency(dependency) {
  const manifest = loadManifest();
  const proofs = proofsForDependency(manifest, dependency);
  if (proofs.length === 0) {
    throw new Error(`no integration proofs declared for dependency ${dependency}`);
  }

  const result = spawnSync(process.execPath, ["--test", ...proofs], {
    cwd: root,
    env: process.env,
    stdio: "inherit"
  });

  if (result.error) {
    throw result.error;
  }
  return result.status === null ? 1 : result.status;
}

if (require.main === module) {
  try {
    process.exitCode = runDependency(parseDependencyArg(process.argv.slice(2)));
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    process.exitCode = 1;
  }
}

module.exports = {
  KNOWN_DEPENDENCIES,
  loadManifest,
  listIntegrationProofFiles,
  validateManifest,
  proofsForDependency,
  parseDependencyArg,
  runDependency
};

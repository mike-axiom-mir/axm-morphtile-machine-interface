"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const manifest = require("./integration-proof-manifest.json");
const { CLAIM_ID, validateManifest } = require("../scripts/run-integration-proofs");

const actualProofFiles = manifest.proofs.map((proof) => proof.path);
const copyManifest = () => JSON.parse(JSON.stringify(manifest));

test("every integration proof has one stable semantic claim identity", () => {
  assert.equal(validateManifest(manifest, actualProofFiles), true);

  const claims = manifest.proofs.map((proof) => proof.claim);
  for (const [index, claim] of claims.entries()) {
    assert.equal(
      typeof claim,
      "string",
      `integration proof ${manifest.proofs[index].path} must declare a semantic claim identity`
    );
    assert.match(
      claim,
      CLAIM_ID,
      `integration proof ${manifest.proofs[index].path} claim must be lowercase kebab-case`
    );
  }

  assert.equal(new Set(claims).size, claims.length, "integration proof semantic claim identities must be unique");
});

test("proof registry rejects absent, malformed and duplicate semantic claim identities", () => {
  const missing = copyManifest();
  delete missing.proofs[0].claim;
  assert.throws(
    () => validateManifest(missing, actualProofFiles),
    /must declare one lowercase kebab-case semantic claim identity/
  );

  const malformed = copyManifest();
  malformed.proofs[0].claim = "Action Authority";
  assert.throws(
    () => validateManifest(malformed, actualProofFiles),
    /must declare one lowercase kebab-case semantic claim identity/
  );

  const duplicate = copyManifest();
  duplicate.proofs[1].claim = duplicate.proofs[0].claim;
  assert.throws(
    () => validateManifest(duplicate, actualProofFiles),
    /duplicate integration proof semantic claim identity/
  );
});

"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const manifest = require("./integration-proof-manifest.json");

const CLAIM = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

test("every integration proof has one stable semantic claim identity", () => {
  const claims = manifest.proofs.map((proof) => proof.claim);

  for (const [index, claim] of claims.entries()) {
    assert.equal(
      typeof claim,
      "string",
      `integration proof ${manifest.proofs[index].path} must declare a semantic claim identity`
    );
    assert.match(
      claim,
      CLAIM,
      `integration proof ${manifest.proofs[index].path} claim must be lowercase kebab-case`
    );
  }

  assert.equal(
    new Set(claims).size,
    claims.length,
    "integration proof semantic claim identities must be unique"
  );
});

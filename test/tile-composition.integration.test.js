"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const manifest = require("../machine.json");
const { run } = require("../src");

const corePath = process.env.MORPHTILE_CORE;
const runtimeCommit = process.env.MORPHTILE_COMMIT;

function assertPinnedRuntime() {
  assert.equal(runtimeCommit, manifest.tested_against.commit, "CI runtime must match machine.json tested_against.commit");
}

function request(id, tileId) {
  return {
    envelope_version: "0.1",
    request_id: id,
    goal: "Compose another tile-owned view through MorphTile's native local tile reference",
    intent: {
      tile_path: "mt_tower",
      title: "Tower composition",
      elements: [{ kind: "tile", tile_id: tileId }]
    },
    provenance: { caller: "pinned-tile-composition-integration-test" }
  };
}

function commitView(MT, ws, out, by) {
  const candidate = MT.cloneBody(ws, "ai", by);
  const edited = MT.editCandidate(ws, candidate, out.candidate.operation);
  assert.ok(edited.ok, edited.error);
  const plan = MT.planMerge(ws, [candidate]);
  assert.equal(plan.status, "READY", JSON.stringify(plan));
  const committed = MT.commitPlan(ws, plan.id);
  assert.ok(committed.ok, JSON.stringify(committed));
  return committed;
}

test("generated local tile composition resolves through the real MorphTile view compiler without copied state", { skip: !corePath }, () => {
  assertPinnedRuntime();
  const MT = require(path.resolve(corePath));
  const ws = MT.createWorkspace(MT.seedWorld());
  const before = MT.structHash(ws.live);

  const out = run(request("tile-compose-runtime", "mt_core"));
  assert.equal(out.status, "CANDIDATE", JSON.stringify(out.holds));
  assert.deepEqual(out.candidate.operation.view.body, [{ tile: "mt_core" }]);

  const committed = commitView(MT, ws, out, "ai:interface-tile-composition-test");
  const committedHash = MT.structHash(ws.live);
  const html = MT.vnodeToHTML(MT.compilePanel(ws.live).root);
  assert.match(html, /class="v-embed"[^>]*data-tile="mt_core"/);
  assert.match(html, />Matter core</);
  assert.equal(MT.structHash(ws.live), committedHash, "compiling an embedded tile-owned view must not mutate canonical matter");

  const rollback = MT.rollback(ws, committed.receipt.rollback_token);
  assert.ok(rollback.ok && rollback.exact);
  assert.equal(MT.structHash(ws.live), before);
});

test("missing local tile references stay visibly inert instead of fabricating target matter", { skip: !corePath }, () => {
  assertPinnedRuntime();
  const MT = require(path.resolve(corePath));
  const ws = MT.createWorkspace(MT.seedWorld());
  const before = MT.structHash(ws.live);

  const out = run(request("tile-compose-missing", "mt_missing"));
  assert.equal(out.status, "CANDIDATE", JSON.stringify(out.holds));
  const committed = commitView(MT, ws, out, "ai:interface-missing-tile-test");
  const committedHash = MT.structHash(ws.live);
  const html = MT.vnodeToHTML(MT.compilePanel(ws.live).root);
  assert.match(html, /class="v-missing"/);
  assert.match(html, /no tile called mt_missing/);
  assert.equal(MT.structHash(ws.live), committedHash, "resolving a missing tile reference must not mutate canonical matter");

  const rollback = MT.rollback(ws, committed.receipt.rollback_token);
  assert.ok(rollback.ok && rollback.exact);
  assert.equal(MT.structHash(ws.live), before);
});

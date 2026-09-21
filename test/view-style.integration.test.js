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

test("bounded native view styling commits, renders read-only and rolls back exactly", { skip: !corePath }, () => {
  assertPinnedRuntime();
  const MT = require(path.resolve(corePath));
  const ws = MT.createWorkspace(MT.seedWorld());
  const before = MT.structHash(ws.live);

  const out = run({
    envelope_version: "0.1",
    request_id: "pinned-view-style",
    goal: "Style the existing tile-owned interface using bounded MorphTile-native fields",
    intent: {
      tile_path: "mt_tower",
      title: "Styled tower",
      accent: [0.2, 0.4, 0.6],
      width: 3,
      elements: [{ kind: "text", text: "Important", strong: true }]
    },
    provenance: { caller: "pinned-view-style-integration" }
  });

  assert.equal(out.status, "CANDIDATE");
  assert.deepEqual(out.candidate.operation, {
    op: "view.set",
    id: "mt_tower",
    view: {
      title: "Styled tower",
      body: [{ text: "Important", strong: true }],
      accent: [0.2, 0.4, 0.6],
      width: 3
    }
  });

  const candidate = MT.cloneBody(ws, "ai", "ai:interface-machine-view-style");
  const edited = MT.editCandidate(ws, candidate, out.candidate.operation);
  assert.ok(edited.ok, edited.error);
  const plan = MT.planMerge(ws, [candidate]);
  assert.equal(plan.status, "READY");
  const committed = MT.commitPlan(ws, plan.id);
  assert.ok(committed.ok);
  assert.deepEqual(ws.live.tiles.mt_tower.view, out.candidate.operation.view);

  const beforeRender = MT.hashOf(ws.live);
  const html = MT.vnodeToHTML(MT.compilePanel(ws.live).root);
  assert.match(html, /--tile:rgb\(51,102,153\)/);
  assert.match(html, /flex-grow:3/);
  assert.match(html, /class="v-text is-strong"/);
  assert.match(html, />Important<\/p>/);
  assert.equal(MT.hashOf(ws.live), beforeRender, "rendering styled view must not mutate canonical matter");

  const rollback = MT.rollback(ws, committed.receipt.rollback_token);
  assert.ok(rollback.ok && rollback.exact);
  assert.equal(MT.structHash(ws.live), before);
});

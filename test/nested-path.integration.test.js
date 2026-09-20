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

test("nested tile target and nested presentation anchor commit through real MorphTile paths and roll back exactly", { skip: !corePath }, () => {
  assertPinnedRuntime();
  const MT = require(path.resolve(corePath));
  const world = MT.seedWorld();

  const inner = MT.createTile({
    id: "mt_inner",
    name: "Nested interface target",
    form_hints: ["ui_panel"]
  });
  const shell = MT.createTile({
    id: "mt_shell",
    name: "Interface shell",
    form_hints: ["ui_panel"]
  });
  shell.facets.mesh = { type: "interior", source: null, data: {} };
  shell.interior = { tiles: { mt_inner: inner }, edges: {}, ports: [] };
  shell.provenance.sha256 = MT.contentHash(shell);
  world.tiles.mt_shell = shell;

  const valid = MT.validateWorld(world);
  assert.equal(valid.ok, true, valid.errors.join("; "));

  const ws = MT.createWorkspace(world);
  const before = MT.structHash(ws.live);
  const nestedPath = "mt_shell/mt_inner";
  const out = run({
    envelope_version: "0.1",
    request_id: "pinned-nested-tile-path",
    goal: "Author ordinary interface matter on a nested MorphTile target",
    intent: {
      tile_path: nestedPath,
      title: "Nested panel",
      text: "Nested path proof",
      placement: {
        mode: "tile",
        anchor: nestedPath,
        user_adjustable: false
      }
    },
    provenance: { caller: "pinned-integration-test" }
  });

  assert.equal(out.status, "CANDIDATE");
  assert.deepEqual(out.candidate.operations.map((op) => op.op), ["view.set", "presentation.set"]);
  assert.equal(out.candidate.operations[0].id, nestedPath);
  assert.equal(out.candidate.operations[1].id, nestedPath);
  assert.equal(out.candidate.operations[1].presentation.anchor, nestedPath);

  const candidate = MT.cloneBody(ws, "nested interface", "ai:interface-machine");
  for (const op of out.candidate.operations) {
    const edited = MT.editCandidate(ws, candidate, op);
    assert.ok(edited.ok, edited.error);
  }
  const plan = MT.planMerge(ws, [candidate]);
  assert.equal(plan.status, "READY");
  const committed = MT.commitPlan(ws, plan.id, "ai:interface-machine");
  assert.ok(committed.ok);
  assert.deepEqual(committed.receipt.units.map((unit) => unit.key).sort(), [
    "tile:mt_shell/mt_inner#presentation",
    "tile:mt_shell/mt_inner#view"
  ]);

  const target = MT.resolveTile(ws.live, nestedPath);
  assert.deepEqual(target.view, {
    title: "Nested panel",
    body: [{ text: "Nested path proof" }]
  });
  assert.deepEqual(target.presentation, {
    mode: "tile",
    anchor: nestedPath,
    user_adjustable: false
  });

  const resolved = MT.resolvePresentation(ws.live, nestedPath);
  assert.equal(resolved.status, "READY");
  assert.equal(resolved.anchor_frame.anchor, nestedPath);
  const html = MT.vnodeToHTML(MT.compilePanel(ws.live, { open: { mt_shell: true } }).root);
  assert.match(html, /Nested path proof/);
  assert.match(html, /tile anchor mt_shell\/mt_inner/);

  const rollback = MT.rollback(ws, committed.receipt.rollback_token);
  assert.ok(rollback.ok && rollback.exact);
  assert.equal(MT.structHash(ws.live), before);
});

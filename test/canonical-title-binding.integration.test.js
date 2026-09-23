"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const manifest = require("../machine.json");
const { run } = require("../src");

const corePath = process.env.MORPHTILE_CORE;
const runtimeCommit = process.env.MORPHTILE_COMMIT;

function collect(root, predicate) {
  const found = [];
  const visit = (node) => {
    if (!node || typeof node !== "object") return;
    if (predicate(node)) found.push(node);
    for (const child of node.children || []) visit(child);
  };
  visit(root);
  return found;
}

function titleOf(MT, ws) {
  const compiled = MT.compilePanel(ws.live);
  const panels = collect(compiled.root, (node) => node.tile === "mt_tower" && String(node.cls || "").includes("is-view"));
  assert.equal(panels.length, 1, "exactly one authored tower view must render");
  const headings = collect(panels[0], (node) => node.tag === "h3");
  assert.equal(headings.length, 1, "authored view must expose one title heading");
  return headings[0].text;
}

test("canonical title follows target state through the pinned MorphTile evaluator without rewriting view matter", { skip: !corePath }, () => {
  assert.equal(runtimeCommit, manifest.tested_against.commit, "CI runtime must match machine.json tested_against.commit");
  const MT = require(path.resolve(corePath));
  const ws = MT.createWorkspace(MT.seedWorld());
  assert.equal(MT.readVars(ws.live, "mt_tower", 0).beacon, 0);

  const out = run({
    envelope_version: "0.1",
    request_id: "canonical-title-runtime",
    goal: "Prove a generated title reads canonical state live while Interface owns no duplicate value",
    intent: {
      tile_path: "mt_tower",
      title_binding: "beacon",
      elements: [{ kind: "text", text: "Canonical tower title" }],
      bindings: { readouts: ["beacon"] }
    },
    provenance: { caller: "canonical-title-binding-integration" }
  });

  assert.equal(out.status, "CANDIDATE", JSON.stringify(out.holds));
  assert.deepEqual(out.dependencies[0].requires.readout_logic_vars, ["beacon"]);
  assert.deepEqual(out.candidate.operation.view.title, ["var", "beacon"]);

  const candidate = MT.cloneBody(ws, "ai", "ai:interface-canonical-title");
  const edited = MT.editCandidate(ws, candidate, out.candidate.operation);
  assert.ok(edited.ok, edited.error);
  const plan = MT.planMerge(ws, [candidate]);
  assert.equal(plan.status, "READY", JSON.stringify(plan));
  const committed = MT.commitPlan(ws, plan.id);
  assert.ok(committed.ok, JSON.stringify(committed));

  const authoredView = JSON.stringify(ws.live.tiles.mt_tower.view);
  const committedHash = MT.structHash(ws.live);
  assert.equal(titleOf(MT, ws), "0");
  assert.equal(MT.structHash(ws.live), committedHash, "rendering the canonical title must remain read-only");

  MT.act(ws, { do: "signal", tile: "mt_tower", name: "toggle" });
  assert.equal(MT.readVars(ws.live, "mt_tower", 0).beacon, 1);
  assert.equal(titleOf(MT, ws), "1", "title must follow canonical target state without a new Interface state store");
  assert.equal(JSON.stringify(ws.live.tiles.mt_tower.view), authoredView, "runtime state changes must not rewrite Interface-authored view matter");
});

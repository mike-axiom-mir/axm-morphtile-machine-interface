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

function bodyTextOf(MT, ws) {
  const compiled = MT.compilePanel(ws.live);
  const panels = collect(compiled.root, (node) => node.tile === "mt_tower" && String(node.cls || "").includes("is-view"));
  assert.equal(panels.length, 1, "exactly one authored tower view must render");
  const paragraphs = collect(panels[0], (node) => node.tag === "p" && String(node.cls || "").includes("v-text"));
  assert.equal(paragraphs.length, 1, "authored view must expose one canonical body-text node");
  return paragraphs[0].text;
}

test("canonical body text follows target state through the pinned MorphTile evaluator without rewriting view matter", { skip: !corePath }, () => {
  assert.equal(runtimeCommit, manifest.tested_against.commit, "CI runtime must match machine.json tested_against.commit");
  const MT = require(path.resolve(corePath));
  const ws = MT.createWorkspace(MT.seedWorld());
  assert.equal(MT.readVars(ws.live, "mt_tower", 0).beacon, 0);

  const out = run({
    envelope_version: "0.1",
    request_id: "canonical-body-runtime",
    goal: "Prove generated body text reads canonical state live while Interface owns no duplicate value",
    intent: {
      tile_path: "mt_tower",
      title: "Canonical tower body",
      elements: [{ kind: "text", text_binding: "beacon", strong: true }],
      bindings: { readouts: ["beacon"] }
    },
    provenance: { caller: "canonical-body-text-integration" }
  });

  assert.equal(out.status, "CANDIDATE", JSON.stringify(out.holds));
  assert.deepEqual(out.dependencies[0].requires.readout_logic_vars, ["beacon"]);
  assert.deepEqual(out.candidate.operation.view.body, [{ text: ["var", "beacon"], strong: true }]);

  const candidate = MT.cloneBody(ws, "ai", "ai:interface-canonical-body");
  const edited = MT.editCandidate(ws, candidate, out.candidate.operation);
  assert.ok(edited.ok, edited.error);
  const plan = MT.planMerge(ws, [candidate]);
  assert.equal(plan.status, "READY", JSON.stringify(plan));
  const committed = MT.commitPlan(ws, plan.id);
  assert.ok(committed.ok, JSON.stringify(committed));

  const authoredView = JSON.stringify(ws.live.tiles.mt_tower.view);
  const committedHash = MT.structHash(ws.live);
  assert.equal(bodyTextOf(MT, ws), "0");
  assert.equal(MT.structHash(ws.live), committedHash, "rendering canonical body text must remain read-only");

  MT.act(ws, { do: "signal", tile: "mt_tower", name: "toggle" });
  assert.equal(MT.readVars(ws.live, "mt_tower", 0).beacon, 1);
  assert.equal(bodyTextOf(MT, ws), "1", "body text must follow canonical target state without a new Interface state store");
  assert.equal(JSON.stringify(ws.live.tiles.mt_tower.view), authoredView, "runtime state changes must not rewrite Interface-authored view matter");
});

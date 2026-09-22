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

test("repeat-local Interface presentation renders through MorphTile lexical scope without duplicating state or authority", { skip: !corePath }, () => {
  assertPinnedRuntime();
  const MT = require(path.resolve(corePath));
  const ws = MT.createWorkspace(MT.seedWorld());
  const before = MT.structHash(ws.live);

  const out = run({
    envelope_version: "0.1",
    request_id: "repeat-local-presentation-runtime",
    goal: "Render repeat-local indices/counts in text and interactive labels while controls/actions remain bound to canonical tile authority",
    intent: {
      tile_path: "mt_tower",
      title: "Repeated tower controls",
      elements: [{
        kind: "repeat",
        binding: "beacon",
        step: 0.25,
        max: 4,
        children: [
          { kind: "repeat_text", source: "index", prefix: "slot " },
          { kind: "meter", binding: "beacon", min: 0, max: 1, repeat_label: { source: "count", prefix: "meter of " } },
          { kind: "action", binding: "toggle", repeat_label: { source: "index", prefix: "toggle " } },
          { kind: "control", binding: "levels", repeat_label: { source: "index", prefix: "level " } }
        ]
      }],
      bindings: { readouts: ["beacon"], actions: ["toggle"], controls: ["levels"] }
    },
    provenance: { caller: "pinned-repeat-local-presentation-integration-test" }
  });

  assert.equal(out.status, "CANDIDATE");
  assert.deepEqual(out.dependencies[0].requires.readout_logic_vars, ["beacon"]);
  assert.deepEqual(out.dependencies[0].requires.action_input_signal_socket_ids, ["toggle"]);
  assert.deepEqual(out.dependencies[0].requires.control_param_ids, ["levels"]);

  const candidate = MT.cloneBody(ws, "ai", "ai:interface-repeat-local-presentation-test");
  const edited = MT.editCandidate(ws, candidate, out.candidate.operation);
  assert.ok(edited.ok, edited.error);
  const plan = MT.planMerge(ws, [candidate]);
  assert.equal(plan.status, "READY");
  const committed = MT.commitPlan(ws, plan.id);
  assert.ok(committed.ok);
  const committedHash = MT.structHash(ws.live);

  const offHtml = MT.vnodeToHTML(MT.compilePanel(ws.live).root);
  assert.equal((offHtml.match(/slot /g) || []).length, 0, "zero repeat count should render no lexical-local presentation");
  assert.equal(MT.structHash(ws.live), committedHash, "rendering must not mutate canonical matter");

  MT.act(ws, { do: "signal", tile: "mt_tower", name: "toggle" });
  assert.equal(MT.readVars(ws.live, "mt_tower", 0).beacon, 1);
  const onHash = MT.structHash(ws.live);
  const onHtml = MT.vnodeToHTML(MT.compilePanel(ws.live).root);

  for (let i = 0; i < 4; i++) {
    assert.match(onHtml, new RegExp(`slot ${i}`));
    assert.match(onHtml, new RegExp(`toggle ${i}`));
    assert.match(onHtml, new RegExp(`level ${i}`));
  }
  assert.equal((onHtml.match(/meter of 4/g) || []).length, 4, "count should resolve from the nearest repeat scope for every repeated meter label");
  assert.equal((onHtml.match(/data-signal="mt_tower:toggle"/g) || []).length, 4, "repeated labels must not widen or copy signal authority");
  assert.equal((onHtml.match(/data-param="mt_tower:levels"/g) || []).length, 4, "repeated labels must remain views over the one canonical parameter authority");
  assert.equal(MT.structHash(ws.live), onHash, "lexical-local rendering must remain read-only");

  MT.act(ws, { do: "signal", tile: "mt_tower", name: "toggle" });
  assert.equal(MT.readVars(ws.live, "mt_tower", 0).beacon, 0);
  const rollback = MT.rollback(ws, committed.receipt.rollback_token);
  assert.ok(rollback.ok && rollback.exact);
  assert.equal(MT.structHash(ws.live), before);
});

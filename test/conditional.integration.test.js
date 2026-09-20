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

test("generated conditional visibility follows canonical MorphTile state without copying it", { skip: !corePath }, () => {
  assertPinnedRuntime();
  const MT = require(path.resolve(corePath));
  const ws = MT.createWorkspace(MT.seedWorld());
  const before = MT.structHash(ws.live);

  const out = run({
    envelope_version: "0.1",
    request_id: "conditional-runtime",
    goal: "Show a bounded group only while the canonical beacon variable is truthy",
    intent: {
      tile_path: "mt_tower",
      title: "Tower state",
      elements: [{
        kind: "when",
        binding: "beacon",
        children: [
          { kind: "text", text: "Beacon active" },
          { kind: "action", binding: "toggle", label: "Turn off" }
        ]
      }],
      bindings: { readouts: ["beacon"], actions: ["toggle"] }
    },
    provenance: { caller: "pinned-conditional-integration-test" }
  });

  assert.equal(out.status, "CANDIDATE");
  assert.deepEqual(out.dependencies[0].requires.readout_logic_vars, ["beacon"]);
  assert.deepEqual(out.dependencies[0].requires.action_input_signal_socket_ids, ["toggle"]);
  assert.deepEqual(out.candidate.operation.view.body, [{
    group: [
      { text: "Beacon active" },
      { button: "toggle", label: "Turn off" }
    ],
    when: ["var", "beacon"]
  }]);

  const candidate = MT.cloneBody(ws, "ai", "ai:interface-conditional-test");
  const edited = MT.editCandidate(ws, candidate, out.candidate.operation);
  assert.ok(edited.ok, edited.error);
  const plan = MT.planMerge(ws, [candidate]);
  assert.equal(plan.status, "READY");
  const committed = MT.commitPlan(ws, plan.id);
  assert.ok(committed.ok);

  const committedHash = MT.structHash(ws.live);
  assert.equal(MT.readVars(ws.live, "mt_tower", 0).beacon, 0);
  const offHtml = MT.vnodeToHTML(MT.compilePanel(ws.live).root);
  assert.doesNotMatch(offHtml, /Beacon active/);
  assert.doesNotMatch(offHtml, /Turn off/);
  assert.equal(MT.structHash(ws.live), committedHash, "conditional rendering must not mutate canonical matter");

  MT.act(ws, { do: "signal", tile: "mt_tower", name: "toggle" });
  assert.equal(MT.readVars(ws.live, "mt_tower", 0).beacon, 1);
  const onHtml = MT.vnodeToHTML(MT.compilePanel(ws.live).root);
  assert.match(onHtml, /Beacon active/);
  assert.match(onHtml, /Turn off/);
  assert.match(onHtml, /data-signal="mt_tower:toggle"/);
  assert.equal(MT.structHash(ws.live), committedHash, "rendering live conditional state must remain read-only");

  MT.act(ws, { do: "signal", tile: "mt_tower", name: "toggle" });
  assert.equal(MT.readVars(ws.live, "mt_tower", 0).beacon, 0, "restore runtime state before structural rollback");

  const rollback = MT.rollback(ws, committed.receipt.rollback_token);
  assert.ok(rollback.ok && rollback.exact);
  assert.equal(MT.structHash(ws.live), before);
});

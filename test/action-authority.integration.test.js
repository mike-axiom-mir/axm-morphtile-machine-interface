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

test("symbolic non-input names do not become interface action authority in merged MorphTile core", { skip: !corePath }, () => {
  assertPinnedRuntime();
  const MT = require(path.resolve(corePath));
  const ws = MT.createWorkspace(MT.seedWorld());
  const tower = ws.live.tiles.mt_tower;
  tower.facets.logic.data.rules.push({ on: "hidden-rule", do: [{ set: ["beacon", 1] }] });
  tower.provenance.sha256 = MT.contentHash(tower);
  const before = MT.structHash(ws.live);

  const out = run({
    envelope_version: "0.1",
    request_id: "merged-core-action-authority",
    goal: "Keep symbolic action intent separate from target authority",
    intent: {
      tile_path: "mt_tower",
      title: "Authority proof",
      elements: [
        { kind: "action", binding: "toggle", label: "Allowed input" },
        { kind: "action", binding: "hidden-rule", label: "Rule without socket" },
        { kind: "action", binding: "roof", label: "Attach socket is not an action" },
        { kind: "action", binding: "lit", label: "Output is not an input action" },
        { kind: "action", binding: "missing-action", label: "No such socket" }
      ],
      bindings: { actions: ["toggle", "hidden-rule", "roof", "lit", "missing-action"] }
    },
    provenance: { caller: "pinned-integration-test" }
  });

  assert.equal(out.status, "CANDIDATE");
  assert.deepEqual(out.dependencies, [{
    id: "morphtile.interface-target-proof:mt_tower",
    kind: "morphtile.interface-target-proof/v0.1",
    tile_path: "mt_tower",
    requires: {
      tile_exists: true,
      form_hints_include: ["ui_panel"],
      readout_logic_vars: [],
      control_param_ids: [],
      action_input_signal_socket_ids: ["hidden-rule", "lit", "missing-action", "roof", "toggle"]
    }
  }]);

  const candidate = MT.cloneBody(ws, "ai", "ai:interface-machine");
  const edited = MT.editCandidate(ws, candidate, out.candidate.operation);
  assert.ok(edited.ok, edited.error);
  const plan = MT.planMerge(ws, [candidate]);
  assert.equal(plan.status, "READY");
  const committed = MT.commitPlan(ws, plan.id);
  assert.ok(committed.ok);

  const html = MT.vnodeToHTML(MT.compilePanel(ws.live).root);
  assert.match(html, /data-signal="mt_tower:toggle"/, "real input signal socket stays actionable");
  assert.doesNotMatch(html, /data-signal="mt_tower:hidden-rule"/, "internal rule name must not gain input action authority");
  assert.doesNotMatch(html, /data-signal="mt_tower:roof"/, "attach socket must not gain input action authority");
  assert.doesNotMatch(html, /data-signal="mt_tower:lit"/, "output signal socket must not gain input action authority");
  assert.doesNotMatch(html, /data-signal="mt_tower:missing-action"/, "missing socket must not gain input action authority");
  assert.match(html, /no exposed action called hidden-rule/);
  assert.match(html, /no exposed action called roof/);
  assert.match(html, /no exposed action called lit/);
  assert.match(html, /no exposed action called missing-action/);

  const rollback = MT.rollback(ws, committed.receipt.rollback_token);
  assert.ok(rollback.ok && rollback.exact);
  assert.equal(MT.structHash(ws.live), before);
});

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = file => fs.readFileSync(path.join(__dirname, "..", file), "utf8");
function runtime() {
  const window = { MiftahGame: { LettersArt: { icon: () => "<svg></svg>" } } };
  const context = { window, document: { body: { classList: { toggle() {} } } }, setTimeout, clearTimeout };
  vm.runInNewContext(source("LettersGardenArt.js"), context);
  vm.runInNewContext(source("LettersJourney.js"), context);
  return window.MiftahGame.LettersJourney;
}
const world = (id, games) => ({ id, games });

test("every Pop-Trace-Feed and Pairs-Trace-Pop chapter gets an adventure matched to its activity order", () => {
  const J = runtime();
  for (const id of ["pack-boat", "pack-little", "pack-tall", "pack-round"]) assert.equal(J.forWorld(world(id, ["pop", "trace", "feed"]))?.kind, "picnic", id);
  for (const id of ["pack-smile", "pack-wave", "pack-strong"]) assert.equal(J.forWorld(world(id, ["pairs", "trace", "pop"]))?.kind, "bed", id);
  assert.equal(J.forWorld(world("pack-smile", ["pop", "trace", "feed"])), null, "a story never forces a different game order");
  assert.equal(J.forWorld(world("join-1", ["fuse", "parade", "unfuse"])), null, "a reordered chapter falls back to the plain route");
  const route = J.route(world("pack-smile", ["pairs", "trace", "pop"]), 1);
  assert.match(route, /Seed bed adventure/);
  assert.ok(route.indexOf("Sort the seeds") < route.indexOf("Draw the plant signs") && route.indexOf("Draw the plant signs") < route.indexOf("Water the bed"));
});

test("the seed bed carries each result forward: sprouts, then the child's own signs, then blooms", () => {
  const J = runtime();
  const items = [{ display: "ج" }, { display: "ح" }, { display: "خ" }];
  const drawing = "data:image/png;base64,AAAA";
  const at = phase => J.scene({ kind: "bed", completed: phase, items, drawings: { "ح": drawing }, pet: "<svg></svg>" });
  assert.doesNotMatch(at(0), /bed-sprout|bed-sign|bed-bloom/);
  assert.match(at(1), /bed-sprout/); assert.doesNotMatch(at(1), /bed-sign/);
  assert.match(at(2), /bed-sign/); assert.match(at(2), new RegExp(`href="${drawing}"`), "the child's drawing becomes a sign");
  assert.match(at(3), /bed-bloom/); assert.match(at(3), /bed-can/);
  assert.doesNotMatch(J.scene({ kind: "bed", completed: 2, items, drawings: { "ح": "javascript:alert(1)" } }), /javascript:/, "only real drawings are embedded");
});

test("keepsakes come only from saved completion and stay at the chapter", () => {
  const J = runtime();
  const smile = { id: "pack-smile", games: ["pairs", "trace", "pop"], items: () => [{ display: "ج" }] };
  assert.equal(J.memento({ done: [] }, smile), "");
  assert.match(J.memento({ done: ["pack-smile"] }, smile), /map-journey-memento/);
  assert.match(J.memento({ done: ["pack-little"] }, { id: "pack-little" }), /picnic basket/);
  assert.match(J.memento({ done: ["pack-boat"] }), /map-picnic-memento/, "Boat keeps its basket in the boat");
  const game = source("LettersGame.js");
  assert.match(game, /world\.id !== "pack-boat" && ns\.LettersJourney\?\.memento\?\.\(this\.progress, world\)/);
  assert.match(game, /if \(s\.boatCelebrationShown\) return;/, "a replayed ending cannot duplicate the celebration");
});

test("Pop-Build-Feed chapters turn the built word into the parcel label", () => {
  const J = runtime();
  for (const id of ["muqattaat", "tanween", "leen", "shaddah"]) assert.equal(J.forWorld(world(id, ["pop", "build", "feed"]))?.kind, "parcel", id);
  const route = J.route(world("tanween", ["pop", "build", "feed"]), 1);
  assert.match(route, /Parcel adventure/); assert.match(route, /Build the packet labels/);
  assert.match(J.scene({ kind: "parcel", completed: 2, items: [{ display: "بً" }], pet: "" }), /بً/, "the built word labels the packet");
});

const ALL = {
  "pack-boat": ["pop", "trace", "feed"], "pack-smile": ["pairs", "trace", "pop"], "pack-little": ["pop", "trace", "feed"],
  "pack-wave": ["pairs", "trace", "pop"], "pack-tall": ["pop", "trace", "feed"], "pack-strong": ["pairs", "trace", "pop"],
  "pack-round": ["pop", "trace", "feed"], "join-1": ["fuse", "unfuse", "parade"], "join-2": ["fuse", "chain", "unfuse"],
  muqattaat: ["pop", "build", "feed"], fatha: ["blend", "pop", "trace"], "kasra-damma": ["blend", "pop", "catch"],
  tanween: ["pop", "build", "feed"], standing: ["pop", "feed", "catch"], "long-sounds": ["build", "pop", "pairs"],
  leen: ["pop", "build", "feed"], sukoon: ["build", "pop", "catch"], shaddah: ["pop", "build", "feed"],
  "shaddah-mix": ["pop", "build", "pairs"], "words-2": ["feed", "build", "pop"], decode: ["feed", "build", "pop"],
  "decode-4": ["feed", "pop", "pairs"],
};

test("all 22 chapters have a story that follows their activity order", () => {
  const J = runtime();
  for (const [id, games] of Object.entries(ALL)) {
    const journey = J.forWorld(world(id, games));
    assert.ok(journey, id);
    assert.deepEqual(Array.from(journey.steps, step => step.game), games, id);
    for (const step of journey.steps) {
      assert.ok(step.label && step.next, `${id} ${step.game} is labelled`);
      assert.match(J.icon(step.game, journey.kind), /^<svg viewBox="0 0 64 60"/, `${id} ${step.game} has a picture`);
    }
    assert.match(J.route(world(id, games), 1), /aria-current="step"/);
  }
});

test("later-chapter projects grow with each completed step and only embed real drawings", () => {
  const J = runtime();
  const items = [{ display: "بِ" }, { display: "تُ" }, { display: "ثَ" }];
  const drawing = "data:image/png;base64,AAAA";
  for (const kind of ["garland", "harvest", "jars", "raft"]) {
    const scenes = [0, 1, 2, 3].map(completed => J.scene({ kind, completed, items, drawings: { "تُ": drawing }, pet: "" }));
    assert.equal(new Set(scenes).size, 4, `${kind} changes at every phase`);
    assert.doesNotMatch(scenes[0], /بِ/, `${kind} starts unlabelled`);
    assert.match(scenes[3], /بِ/, `${kind} ends with the child's items`);
    assert.doesNotMatch(J.scene({ kind, completed: 3, items, drawings: { "تُ": "javascript:alert(1)" } }), /javascript:/);
    assert.match(J.keepsakeArt(kind), /<svg viewBox=/);
  }
  assert.match(J.scene({ kind: "harvest", completed: 3, items, drawings: { "تُ": drawing } }), new RegExp(`href="${drawing}"`), "a traced label shows on the fruit");
  assert.match(J.memento({ done: ["join-2"] }, { id: "join-2", items: () => [{ display: "عم" }] }), /lanterns are glowing/);
});

test("later-chapter projects are presentation only and never change how games play", () => {
  const game = source("LettersGame.js");
  assert.match(game, /\(!!journey && !journey\.craft\)/, "craft chapters keep their moving Pop and Catch");
  const party = game.slice(game.indexOf("    renderParty("), game.indexOf("    renderParty(") + 2600);
  assert.match(party, /REPLAY\?\.\[ns\.LettersJourney\.forWorld\(this\.session\?\.world\)/, "the ending reads its own session, not an out-of-scope variable");
});

test("the map waterwheel keeps clear of chapter keepsakes", () => {
  const game = source("LettersGame.js");
  assert.match(game, /\.map-journey-memento > svg, \.map-picnic-memento > svg"\)/, "keepsakes count as taken space when placing the wheel");
});

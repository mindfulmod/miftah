const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const source = file => fs.readFileSync(path.join(__dirname, "..", file), "utf8");

test("Water Garden reports only the guided gate choice, never bends or free play", () => {
  const code = source("WaterGarden.js");
  assert.equal((code.match(/reportOutcome/g) || []).length, 1, "one learning report");
  const tap = code.slice(code.indexOf("tapGate(i) {"), code.indexOf("turnBend(i) {"));
  assert.ok(tap.indexOf("if (this.mode === 'free')") < tap.indexOf("reportOutcome"), "free play returns before any report");
  const bend = code.slice(code.indexOf("turnBend(i) {"), code.indexOf("flow(i, fromBend"));
  assert.doesNotMatch(bend, /reportOutcome|correct\?\.\(/, "turning a bend is never a letter answer");
  assert.doesNotMatch(code, /stars|sticker|wallet|localStorage|progress\./i, "no currency, rewards or saves");
});

test("guided rounds use only the child's taught letters and introduce the bend later", () => {
  const code = source("WaterGarden.js");
  assert.match(code, /this\.items = \[\.\.\.new Map\(\(ctx\.items \|\| \[\]\)/, "letters come from the practice items");
  assert.match(code, /this\.away = \[0, 1, 2\]\.map\(i => this\.round >= 2 && i === this\.targetLane\)/, "bends appear from round three");
  assert.match(code, /turnable\(\) \{ return this\.mode === 'free' \|\| this\.round >= 2; \}/);
  assert.match(code, /this\.bends\[i\]\.hidden = !this\.turnable\(i\);/);
  assert.match(code, /rotate\(-90deg\)/, "the bend visibly turns its spout toward the puddle");
  const game = source("LettersGame.js");
  assert.match(game, /const choices=\['Feed','DotGarden','GardenPaths','SandTable','WaterGarden'\];/);
  assert.match(game, /const familiar=this\.petKnowledge\(\)/, "practice items are letters the child has finished");
});

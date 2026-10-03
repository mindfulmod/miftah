const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = file => fs.readFileSync(path.join(__dirname, "..", file), "utf8");
function load() {
  const store = new Map();
  const localStorage = { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) };
  const sent = [];
  const window = { MiftahGame: {}, localStorage, plausible: (name, opts) => sent.push([name, opts && opts.props]) };
  const ctx = vm.createContext({ window, console, JSON, Array });
  vm.runInContext(source("LettersAnalytics.js"), ctx, { filename: "LettersAnalytics.js" });
  return { A: window.MiftahGame.LettersAnalytics, sent, store };
}

test("analytics sends only coarse, anonymous signals", () => {
  const { A, sent } = load();
  A.visit({ days: 5, strong: 12 });
  A.activity("pop");
  A.graduated();
  assert.deepEqual(JSON.parse(JSON.stringify(sent)), [["Visit", { days: "4-7", strong: "10-18" }], ["Activity", { game: "pop" }], ["Graduated", null]]);
});

test("each item is reported strong once per device, only at mastery >= 0.7", () => {
  const { A, sent } = load();
  A.letterStrength("ب", 0.5);
  A.letterStrength("ب", 0.7);
  A.letterStrength("ب", 0.9);
  A.letterStrength("بَ", 0.8);
  assert.deepEqual(JSON.parse(JSON.stringify(sent)), [["Item Strong", { item: "ب", kind: "letter" }], ["Item Strong", { item: "بَ", kind: "syllable" }]]);
});

test("the grown-up switch silences every event and sets Plausible's own ignore flag", () => {
  const { A, sent, store } = load();
  A.setEnabled(false);
  A.visit({ days: 1 }); A.activity("pop"); A.letterStrength("ت", 1); A.graduated();
  assert.equal(sent.length, 0);
  assert.equal(store.get("plausible_ignore"), "true");
  A.setEnabled(true);
  assert.equal(store.has("plausible_ignore"), false);
  A.activity("pop");
  assert.equal(sent.length, 1);
});

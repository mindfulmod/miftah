const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..", "..", "..");
const source = fs.readFileSync(path.join(root, "src/letters/LetterStudio.js"), "utf8");
const plain = value => JSON.parse(JSON.stringify(value));

function classes() {
  const values = new Set();
  return {
    add: (...names) => names.forEach(name => values.add(name)),
    remove: (...names) => names.forEach(name => values.delete(name)),
    contains: name => values.has(name),
    toggle(name, force) { const add = force ?? !values.has(name); add ? values.add(name) : values.delete(name); return add; },
  };
}

function element() {
  const listeners = {};
  const attrs = {};
  const children = [];
  return {
    listeners, attrs, children, classList: classes(), dataset: {}, disabled: false, hidden: false,
    innerHTML: "", isConnected: true, scrollWidth: 0, clientWidth: 0, scrollLeft: 0,
    addEventListener(name, fn) { (listeners[name] ||= []).push(fn); },
    setAttribute(name, value) { attrs[name] = String(value); },
    getAttribute(name) { return attrs[name]; },
    removeAttribute(name) { delete attrs[name]; },
    appendChild(child) { children.push(child); child.parentNode = this; return child; },
    remove() { const index = this.parentNode?.children.indexOf(this) ?? -1; if (index >= 0) this.parentNode.children.splice(index, 1); },
    get lastElementChild() { return children.at(-1) || null; },
    querySelectorAll(selector) { return selector === "button" ? this.buttons || [] : []; },
    scrollTo({ left }) { this.scrollLeft = left; },
    getScreenCTM() { return { inverse: () => ({}) }; },
    createSVGPoint() { return { matrixTransform() { return { x: this.x, y: this.y }; } }; },
  };
}

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function harness(options = {}) {
  const log = { prompts: [], spoken: [], sounds: [], saved: [], done: 0, correct: 0, outcomes: 0, cheers: 0, cancelled: 0 };
  const stage = element();
  const rootNode = element(), svg = element(), layer = element(), cursor = element();
  const undo = element(), hang = element(), inks = element(), tray = element();
  const moreInk = element(), moreStamps = element();
  const buttons = [];
  const inkButtons = (options.colors || ["#4a3620", "#c25a49", "#2f5c46", "#3a8fc4", "#70501b"]).map((color, index) => {
    const button = element(); button.dataset.ink = color; buttons.push(button); return button;
  });
  const stampButtons = (options.items || [{ id: "ba", display: "ب" }, { id: "ta", display: "ت" }]).map((_, index) => {
    const button = element(); button.dataset.letter = String(index); buttons.push(button); return button;
  });
  for (const id of options.stickers || []) { const button = element(); button.dataset.sticker = id; buttons.push(button); stampButtons.push(button); }
  buttons.push(moreInk, moreStamps, undo, hang);
  rootNode.buttons = buttons;
  hang.innerHTML = "hang";

  const nodes = {
    ".studio": rootNode, ".studio-canvas": svg, ".studio-stamps": layer, ".studio-cursor": cursor,
    ".studio-undo": undo, ".studio-hang": hang, ".studio-inks": inks, ".studio-tray": tray,
    '[data-rail="ink"]': moreInk, '[data-rail="stamps"]': moreStamps,
  };
  stage.querySelector = selector => nodes[selector] || null;
  stage.querySelectorAll = selector => selector === ".studio-stamp" ? stampButtons : selector === ".studio-ink" ? inkButtons : [];

  const ns = {
    DrawingPalette: options.palette,
    LetterStudioArt: { scene: () => "<rect width='400' height='300' />", stamp: () => "", hanger: () => "hanger" },
    LettersArt: { icon: name => name, stickerMotif: id => `<svg>${id}</svg>`, fitGlyphs() {} },
  };
  const fakeDocument = {
    fonts: options.fonts,
    createElementNS(_namespace, tag) { const node = element(); node.tagName = tag; return node; },
    createElement(tag) { const node = element(); node.tagName = tag; if (tag === "canvas") node.getContext = () => null; return node; },
  };
  class FakeImage {
    set src(_value) { queueMicrotask(() => this.onerror?.()); }
  }
  const context = vm.createContext({
    window: { MiftahGame: ns }, document: fakeDocument, Image: options.Image || FakeImage,
    setTimeout, clearTimeout, Promise, console,
  });
  vm.runInContext(source, context, { filename: "LetterStudio.js" });
  const activity = {
    items: options.items || [{ id: "ba", display: "ب" }, { id: "ta", display: "ت" }],
    stickers: options.stickers || [], stage, land: "meadow", worldId: "current", completedWorldIds: [],
    prompt: item => log.prompts.push(item?.id ?? null), say: item => { log.spoken.push(item?.id); return Promise.resolve(); },
    sfx: name => log.sounds.push(name), saveDrawing: async url => { log.saved.push(url); return true; },
    correct: () => log.correct++, reportOutcome: () => log.outcomes++, pet: { cheer: () => log.cheers++ },
    done: () => log.done++, cancel: () => log.cancelled++, ...options.ctx,
  };
  const studio = new ns.GardenPractice.LetterStudio(activity);
  const dispatch = (node, name, event = {}) => (node.listeners[name] || []).forEach(fn => fn({ preventDefault() {}, detail: 1, ...event }));
  return { studio, activity, log, nodes, stage, rootNode, svg, layer, cursor, undo, hang, buttons, inkButtons, stampButtons, dispatch, ns };
}

function click(studioHarness, x, y) {
  studioHarness.dispatch(studioHarness.svg, "click", { clientX: x, clientY: y, detail: 1 });
}

test("eligibility removes untaught, locked, prerequisite-blocked, and ambiguous duplicate displays", () => {
  const items = [
    { id: "good", display: "ب" },
    { id: "untaught", display: "ت", taught: false },
    { id: "locked", display: "ث", locked: true },
    { id: "prereq", display: "ج", prerequisiteWorldIds: ["previous"] },
    { id: "duplicate-open", display: "ح" },
    { id: "duplicate-blocked", display: "ح", taught: false },
  ];
  const h = harness({ items });
  assert.deepEqual(h.studio.letters.map(item => item.id), ["good"]);
});

test("pointer placement clamps every edge and ignores points in SVG letterboxing", () => {
  const h = harness();
  click(h, 0, 120); click(h, 400, 120); click(h, 180, 0); click(h, 180, 300);
  assert.deepEqual(plain(h.studio.stamps.map(({ x, y }) => [x, y])), [[48, 120], [352, 120], [180, 48], [180, 252]]);
  click(h, -1, 150); click(h, 401, 150); click(h, 200, -1); click(h, 200, 301);
  assert.equal(h.studio.stamps.length, 4);
});

test("chosen ink is stored on each letter stamp, undo removes only the last mark, and the canvas caps at 24", () => {
  const h = harness();
  h.inkButtons[2].onclick();
  h.stampButtons[1].onclick();
  click(h, 120, 140);
  assert.deepEqual({ kind: h.studio.stamps[0].kind, text: h.studio.stamps[0].text, ink: h.studio.stamps[0].ink }, { kind: "letter", text: "ت", ink: "#2f5c46" });
  h.undo.onclick();
  assert.equal(h.studio.stamps.length, 0);
  assert.equal(h.layer.children.length, 0);
  for (let i = 0; i < 25; i++) click(h, 200, 150);
  assert.equal(h.studio.stamps.length, 24);
  assert.equal(h.rootNode.classList.contains("is-full"), true);
  assert.equal(h.studio.placeAt(200, 150), false);
});

test("arrow keys move the cursor and Enter places a stamp without creating a learning outcome", () => {
  const h = harness();
  let prevented = 0;
  const send = key => h.dispatch(h.svg, "keydown", { key, preventDefault() { prevented++; } });
  send("ArrowLeft"); send("ArrowUp");
  assert.deepEqual([...h.studio.cursor], [176, 126]);
  send("Enter");
  assert.deepEqual([h.studio.stamps[0].x, h.studio.stamps[0].y], [176, 126]);
  assert.equal(prevented, 3);
  assert.equal(h.log.outcomes, 0);
});

test("hang snapshots the art, locks editing during the save, and ignores stale interactions", async () => {
  const pending = deferred();
  const h = harness({ ctx: { saveDrawing: () => pending.promise } });
  h.studio.thumbnail = async snapshot => { assert.equal(snapshot.length, 1); return "thumbnail"; };
  click(h, 80, 90);
  const snapshotValue = { ...h.studio.stamps[0] };
  const operation = h.studio.hang();
  assert.equal(h.studio.hanging, true);
  assert.equal(h.rootNode.getAttribute("aria-busy"), "true");
  assert.equal(h.buttons.every(button => button.disabled), true);
  h.studio.placeAt(250, 160);
  h.undo.onclick(); h.hang.onclick();
  h.dispatch(h.svg, "keydown", { key: "ArrowRight" }); click(h, 250, 160);
  assert.deepEqual(plain(h.studio.stamps), [snapshotValue]);
  pending.resolve(true);
  assert.equal(await operation, true);
  assert.equal(h.log.done, 1);
  assert.equal(h.log.outcomes, 0);
});

test("failed storage preserves marks and unlocks a retry; successful duplicate hang finishes once", async () => {
  let attempts = 0;
  const h = harness({ ctx: { saveDrawing: async url => { attempts++; h.log.saved.push(url); return attempts > 1; } } });
  h.studio.thumbnail = async () => "thumbnail";
  click(h, 120, 140);
  const original = { ...h.studio.stamps[0] };
  assert.equal(await h.studio.hang(), false);
  assert.deepEqual(plain(h.studio.stamps), [original]);
  assert.equal(h.studio.hanging, false);
  assert.equal(h.undo.disabled, false);
  assert.equal(h.hang.disabled, false);
  assert.equal(h.rootNode.classList.contains("save-failed"), true);
  const first = h.studio.hang();
  const duplicate = h.studio.hang();
  assert.equal(await first, true);
  assert.equal(await duplicate, false);
  assert.equal(attempts, 2);
  assert.equal(h.log.done, 1);
  assert.equal(h.log.correct, 1);
  assert.equal(h.log.cheers, 1);
  assert.equal(h.log.outcomes, 0);
});

test("cancelling a full picture shelf keeps the drawing editable without failure or reward", async () => {
  const h = harness({ ctx: { saveDrawing: async () => null } });
  h.studio.thumbnail = async () => 'thumbnail'; click(h, 120, 140);
  const original = plain(h.studio.stamps);
  assert.equal(await h.studio.hang(), false);
  assert.deepEqual(plain(h.studio.stamps), original);
  assert.equal(h.studio.hanging, false); assert.equal(h.hang.disabled, false);
  assert.equal(h.rootNode.classList.contains('save-failed'), false);
  assert.equal(h.log.done, 0); assert.equal(h.log.correct, 0); assert.equal(h.log.cheers, 0);
  click(h, 240, 100); assert.equal(h.studio.stamps.length, 2);
});

test("destroying while thumbnail work is pending prevents storage and completion", async () => {
  const pending = deferred();
  let thumbnails = 0;
  const h = harness();
  h.studio.thumbnail = async snapshot => { thumbnails++; assert.equal(snapshot.length, 1); return pending.promise; };
  click(h, 100, 110);
  const operation = h.studio.hang();
  h.studio.destroy();
  pending.resolve("data:image/png;base64,still-not-saved");
  assert.equal(await operation, false);
  assert.equal(thumbnails, 1);
  assert.equal(h.log.saved.length, 0);
  assert.equal(h.log.done, 0);
});

test("the real thumbnail rejection path retains the picture and restores controls for retry", async () => {
  const h = harness();
  click(h, 180, 140);
  const result = await h.studio.hang();
  assert.equal(result, false);
  assert.equal(h.studio.stamps.length, 1);
  assert.equal(h.studio.hanging, false);
  assert.equal(h.hang.disabled, false);
  assert.equal(h.rootNode.classList.contains("save-failed"), true);
  assert.equal(h.log.done, 0);
});

test("Colour a Friend treats a false drawing save as failure and retains art without reward or completion", async () => {
  const ns = {
    LetterFriends: { FRIENDS: { "ب": {} }, art: () => "<svg/>", item: c => ({ id: c, display: c }) },
    LettersStrokes: { LETTERS: {} }, PracticeLearning: {}, LettersStrength: {}, DrawingPalette: {},
  };
  const canvasContext = { fillRect() {}, drawImage() {}, set fillStyle(_value) {} };
  const env = vm.createContext({
    window: { MiftahGame: ns }, Math, Date, Promise, performance: { now: () => 1 }, getComputedStyle: () => ({ left: "0px" }),
    document: { createElement: tag => tag === "canvas" ? { width: 0, height: 0, getContext: () => canvasContext, toDataURL: () => "data:image/png;base64,picture" } : {} },
    Image: class { constructor() { this.width = this.height = 160; } set src(_value) { queueMicrotask(() => this.onload?.()); } },
  });
  vm.runInContext(fs.readFileSync(path.join(root, "src/letters/ToyBoxGames.js"), "utf8"), env, { filename: "ToyBoxGames.js" });

  const svg = element(); svg.outerHTML = '<svg width="280" height="280"><path fill="pink"/></svg>';
  const originalArt = svg.outerHTML;
  const paper = element(), next = element(), hang = element();
  const rootNode = {
    contains: node => node === svg || node === paper || node === next || node === hang,
    querySelector: selector => selector === ".tb-paper" ? paper : null,
    querySelectorAll: selector => selector === ".tb-next-page, .tb-hang" ? [next, hang] : [],
  };
  let completed = 0, rewards = 0, saves = 0;
  const game = Object.create(ns.GardenPractice.ColourFriend.prototype);
  Object.assign(game, {
    alive: true, busy: false, saving: false, pageToken: 3, svg, root: rootNode,
    ctx: { saveDrawing() { saves++; return false; }, done() { completed++; }, correct() { rewards++; }, pet: { cheer() { rewards++; } }, confettiAt() { rewards++; } },
    cheer() { rewards++; }, finish() { completed++; },
  });

  assert.equal(await game.hang(), false);
  assert.equal(saves, 1);
  assert.equal(svg.outerHTML, originalArt, "the current colouring remains intact for another save attempt");
  assert.equal(game.busy, false);
  assert.equal(game.saving, false);
  assert.equal(next.disabled, false);
  assert.equal(hang.disabled, false);
  assert.equal(next.getAttribute("aria-busy"), undefined);
  assert.equal(hang.getAttribute("aria-busy"), undefined);
  assert.equal(paper.classList.contains("is-hung"), false);
  assert.equal(rewards, 0);
  assert.equal(completed, 0);
});

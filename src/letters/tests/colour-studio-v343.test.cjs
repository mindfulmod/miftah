const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..', '..', '..');
const toySource = fs.readFileSync(path.join(root, 'src/letters/ToyBoxGames.js'), 'utf8');
const { saveDrawing } = require('./helpers/drawing-save.cjs');
function runtime() {
  let image;
  const ns = { LetterFriends: { FRIENDS: { 'ب': {}, 'ت': {}, 'ث': {} }, art: c => `<svg>${c}</svg>`, item: c => ({ id: c, display: c }), get: c => ({ en: c }) },
    LettersStrokes: { LETTERS: { 'ب': [], 'ت': [], 'ث': [] } },
    DrawingPalette: { colors: [{ value: '#e44', name: 'Red' }, { value: '#48a', name: 'Blue' }] },
    LettersArt: { icon: () => '' }, ToyStudioArt: { drawingEasel: () => '', crayon: () => '' } };
  const context = { window: { MiftahGame: ns }, Math, Promise,
    document: { createElement: () => ({ getContext: () => ({ fillRect() {}, drawImage() {}, set fillStyle(_) {} }), toDataURL: () => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAE=' }) },
    Image: class { constructor() { image = this; this.width = this.height = 160; } set src(v) { this.srcValue = v; queueMicrotask(() => this.onload?.()); } },
    setTimeout(fn, ms) { return { fn, ms }; }, clearTimeout() {} };
  vm.runInNewContext(toySource, context);
  return { ns, get image() { return image; } };
}
function node(dataset = {}, attrs = {}) {
  const result = { dataset: { ...dataset }, attrs: { ...attrs }, style: {}, classList: { add() {}, remove() {}, toggle() {} },
    getAttribute(k) { return this.attrs[k] ?? null; }, setAttribute(k, v) { this.attrs[k] = String(v); }, removeAttribute(k) { delete this.attrs[k]; } };
  result.closest = selector => selector.includes('data-part') && result.dataset.part != null ? result : null;
  return result;
}
function gameFor(rt, { studio = true, page = 'ب', parts } = {}) {
  const game = Object.create(rt.ns.GardenPractice.ColourFriend.prototype);
  const ink = parts || [node({ part: '0' }, { fill: '#fff' }), node({ part: '1', body: '1' }, { stroke: '#fff' })];
  const svg = { outerHTML: '<svg width="280" height="280"></svg>', querySelectorAll(sel) { return sel === '[data-part]' ? ink : sel === '.lf-fill' ? [ink[1]] : []; }, querySelector(sel) { return ink.find(n => n.dataset.part === sel.match(/"(\d+)"/)[1]); }, classList: { add() {}, remove() {} } };
  const hang = node(), undo = node(), finish = node(), strip = { innerHTML: '', querySelectorAll: () => [] };
  const paper = node(); paper.classList = { add() {}, remove() {} };
  const rootNode = { contains: n => n === svg || n === hang || n === undo || n === finish || n === paper,
    querySelector(sel) { return ({ '.tb-paper': paper, '.tb-hang': hang, '.cf-undo': undo, '.cf-finish': finish, '.cf-pages': strip })[sel] || null; },
    querySelectorAll: () => [] };
  Object.assign(game, { alive: true, busy: false, saving: false, finished: false, studio, chars: ['ب', 'ت', 'ث'], visitChars: ['ب', 'ت', 'ث'], c: page,
    root: rootNode, svg, parts: ink.length, crayon: '#e44', coloured: new Set(), named: false, pagesDone: new Set(), drafts: new Map(),
    history: new Map(), savedPaint: new Map(), pagePictures: new Map(), pageSignatures: new Map(), pageToken: 1, timers: [], finishCalls: [],
    ctx: { saveDrawing: async () => true, beginRound() {}, reportOutcome(o) { (game.outcomes ||= []).push(o); }, sfx() {}, done() {} },
    cheer() {}, finish(ms) { this.finishCalls.push(ms); }, say() {}, later() {},
  });
  return { game, ink, hang, undo, finish, strip };
}
const png = suffix => `data:image/png;base64,iVBORw0KGgoAAAANSUhEUg${suffix}`;

test('painting, undo, and repaint record one motor participation report', () => {
  const rt = runtime(), { game, ink } = gameFor(rt);
  game.paint(ink[1]); game.undoPaint(); game.paint(ink[1]);
  assert.equal(ink[1].getAttribute('stroke'), '#e44');
  assert.equal(game.outcomes.length, 1);
  assert.equal(game.outcomes[0].evidence, 'motor_assembly_participation');
  assert.equal(game.outcomes[0].correct, undefined);
  const edge = { dataset: { bodyEdge: '0' }, closest() { return this; } };
  const before = game.history.get('ب').length;
  game.paint(edge);
  assert.equal(game.history.get('ب').length, before, 'same-colour edge tap does not add an empty undo step');
  game.crayon = '#48a'; game.paint(edge); game.undoPaint();
  assert.equal(ink[1].getAttribute('stroke'), '#e44', 'edge colouring undoes the letter body');
});

test('studio remembers each page draft and its undo history independently', () => {
  const rt = runtime(), { game, ink } = gameFor(rt);
  game.paint(ink[0]); game.saveDraft('ب');
  const firstDraft = JSON.stringify(game.drafts.get('ب'));
  const otherInk = node({ part: '0' }, { fill: '#fff' });
  game.c = 'ت'; game.svg = { outerHTML: '<svg>other page</svg>', querySelectorAll: sel => sel === '[data-part]' ? [otherInk] : [],
    querySelector: sel => sel.includes('data-part') ? otherInk : null, classList: { add() {}, remove() {} } };
  game.root.contains = n => n === game.svg || n === otherInk;
  game.crayon = '#48a'; game.coloured = new Set(); game.named = false; game.paint(otherInk); game.saveDraft('ت');
  assert.equal(game.history.get('ت').length, 1);
  game.undoPaint();
  assert.equal(game.history.get('ب').length, 1);
  assert.ok(game.drafts.has('ب') && game.drafts.has('ت'));
  assert.equal(JSON.stringify(game.drafts.get('ب')), firstDraft, 'undo on the second friend leaves the first saved draft unchanged');
  assert.equal(otherInk.getAttribute('fill'), '#fff');
});

test('successful hang remains in studio until explicit finish, which can happen only once', async () => {
  const rt = runtime(), { game } = gameFor(rt);
  game.ctx.saveDrawing = async () => true; game.savedPaint.set('ب', 'prior');
  assert.equal(await game.hang(), true);
  assert.equal(game.finishCalls.length, 0);
  assert.equal(game.busy, false);
  assert.equal(game.finishStudio(game.pageToken - 1), false, 'a stale page token cannot finish the visit');
  assert.equal(game.finishStudio(), true);
  assert.equal(game.finishStudio(), false, 'finished studio cannot finish a second time');
  assert.equal(game.finishCalls.length, 1);
  assert.equal(game.finished, true);
});

test('same paint is deduplicated, while changed paint can be saved again', async () => {
  const rt = runtime(), { game } = gameFor(rt);
  let writes = 0; game.ctx.saveDrawing = async () => { writes++; return true; };
  game.paint( game.svg.querySelectorAll('[data-part]')[0] );
  assert.equal(await game.hang(), true);
  assert.equal(await game.hang(), false);
  assert.equal(writes, 1);
  game.crayon = '#48a'; game.paint(game.svg.querySelectorAll('[data-part]')[0]);
  assert.equal(await game.hang(), true);
  assert.equal(await game.hang(), false);
  assert.equal(writes, 2);
});

test('failed save clears the pending state so the child can retry', async () => {
  const rt = runtime(), { game, hang } = gameFor(rt); let attempts = 0;
  game.ctx.saveDrawing = async () => ++attempts > 1;
  game.paint(game.svg.querySelectorAll('[data-part]')[0]);
  assert.equal(await game.hang(), false);
  assert.equal(game.busy, false); assert.equal(game.saving, false);
  assert.equal(hang.disabled, false, 'failed export restores the save action');
  assert.equal(await game.hang(), true); assert.equal(attempts, 2);
  assert.equal(hang.disabled, true, 'a successfully saved identical paint is deduplicated');
});

test('export completion from a stale page is ignored', async () => {
  const rt = runtime(), { game } = gameFor(rt); let resolve;
  game.ctx.saveDrawing = () => new Promise(r => { resolve = r; });
  const pending = game.hang(); await new Promise(r => setImmediate(r)); game.pageToken++; resolve(true);
  assert.equal(await pending, false); assert.equal(game.savedPaint.size, 0); assert.equal(game.finishCalls.length, 0);
});

test('cancelling a full shelf retains paint and does not mark it saved or finish', async () => {
  const rt = runtime(), { game, hang } = gameFor(rt);
  game.ctx.saveDrawing = async () => null;
  game.paint(game.svg.querySelectorAll('[data-part]')[0]);
  const signature = game.paintSignature();
  assert.equal(await game.hang(), false);
  assert.equal(game.busy, false); assert.equal(game.saving, false); assert.equal(hang.disabled, false);
  assert.equal(game.paintSignature(), signature); assert.equal(game.savedPaint.size, 0);
  assert.equal(game.finishCalls.length, 0);
  game.ctx.saveDrawing = async () => true;
  assert.equal(await game.hang(), true);
});

test('page slots are committed only after a write and editing one of three pages preserves the others', async () => {
  const slots = new Map();
  const writes = [];
  const target = { savedDrawings: { 'ت': png('AAAA'), keepsake: png('BBBB') }, saveJSON(_key, value) { writes.push(value); return this.fail !== true; } };
  target.fail = true;
  assert.equal(await saveDrawing.call(target, png('FAIL'), 'ث', slots), false);
  assert.equal(slots.has('ث'), false, 'failed first save does not reserve a page slot');
  target.fail = false;
  for (const [page, data] of [['ب', 'AAAA'], ['ت', 'BBBB'], ['ث', 'CCCC']])
    assert.equal(await saveDrawing.call(target, png(data), page, slots), true);
  const saved = target.savedDrawings;
  assert.equal(slots.size, 3);
  assert.equal(await saveDrawing.call(target, png('EDIT'), 'ت', slots), true);
  assert.equal(target.savedDrawings[slots.get('ت')], png('EDIT'));
  assert.equal(target.savedDrawings[slots.get('ب')], saved[slots.get('ب')]);
  assert.equal(target.savedDrawings[slots.get('ث')], saved[slots.get('ث')]);
  assert.equal(target.savedDrawings['ت'], png('AAAA')); assert.equal(target.savedDrawings.keepsake, png('BBBB'));
  assert.equal(writes.length, 5);
});

test('guided colour game retains the 1400ms finish and stale input cannot paint', async () => {
  const rt = runtime(), { game, ink } = gameFor(rt, { studio: false });
  const token = game.pageToken; game.pageToken++;
  game.paint(ink[0], token);
  assert.equal(ink[0].getAttribute('fill'), '#fff');
  game.pageToken = token; game.paint(ink[0], token);
  assert.equal(ink[0].getAttribute('fill'), '#e44');
  assert.equal(game.studio, false);
  assert.equal(await game.hang(), true);
  assert.deepEqual(game.finishCalls, [1400]);
});

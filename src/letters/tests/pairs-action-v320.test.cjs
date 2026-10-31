const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function fixture(firstActionDemo = true) {
  const outcomes = [], cues = []; let finished = 0;
  const node = () => {
    const flags = new Set();
    return { style: {}, children: [], attrs: {}, hidden: false,
      classList: { add: c => flags.add(c), remove: c => flags.delete(c), contains: c => flags.has(c) },
      setAttribute(k, v) { this.attrs[k] = v; }, addEventListener() {}, insertAdjacentHTML() {}, focus() {},
      appendChild(el) { this.children.push(el); },
    };
  };
  const grid = node(), next = node(), pots = [node(), node()];
  const stage = { ...node(), querySelector: s => s === '.pairs-next' ? next : grid,
    querySelectorAll: s => s === '.pairs-pot' ? pots : [] };
  const ns = { LettersArt: { icon: () => '<svg/>', inkShift: () => ({ dx: 0, dy: 0 }) } };
  const context = { window: { MiftahGame: ns }, document: { createElement: node }, clearTimeout() {}, performance: { now: () => 0 } };
  for (const f of ['LettersLearning.js', 'MiniGames.js']) vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'), context);
  const session = new ns.LettersLearning.LearningSession({ recordOutcome(o) { outcomes.push(o); return true; } }, () => 10);
  const ctx = { stage, beginner: true, rounds: 4, firstActionDemo, items: ['ب','ت','ث','ج'].map(id => ({id,display:id})),
    setRoundProgress() {}, setPrompt() {}, say() {}, sfx() {}, confettiAt() {}, onDone() { finished++; },
    beginRound: (item, meta) => session.beginPrompt(item, meta), reportOutcome: o => session.report(o),
    setupActionCue(options) {
      const cue = { options, destroyed: false, show() { if (!this.destroyed) options.onShow(); }, destroy() { this.destroyed = true; } };
      cues.push(cue); return cue;
    },
  };
  const game = new ns.LettersMiniGames.pairs(ctx);
  const pair = id => game.cards.filter(c => c.id === (id || game.cards[0].id));
  const pick = c => game.pick(c, c.el);
  return { game, ctx, outcomes, cues, pair, pick, session, finished: () => finished };
}

test('first matching example never selects, completes, or reports an answer; real shown pair is assisted', () => {
  const f = fixture(), cue = f.cues.at(-1), [a,b] = f.pair();
  assert.equal(cue.options.type, 'pair'); assert.equal(cue.options.automatic, true);
  cue.show();
  assert.equal(f.game.selected, null); assert.equal(f.game.matched, 0); assert.equal(f.outcomes.length, 0);
  f.pick(a); f.pick(b);
  assert.equal(f.outcomes.length, 1); assert.equal(f.outcomes[0].evidence, 'assisted_response');
  assert.equal(f.outcomes[0].skill, 'matching-memory'); assert.equal(f.outcomes[0].affectsStrength, false);
  assert.equal(f.finished(), 0, 'helped match still waits for child to finish and continue');
  const remaining = f.game.cards.filter(c => c.id !== a.id);
  f.pick(remaining[0]); f.pick(remaining[1]);
  assert.equal(f.outcomes[1].evidence, 'supported_visible_matching', 'unshown pair is not marked assisted');
  assert.equal(f.cues.at(-1).destroyed, true); assert.equal(f.game.next.hidden, false);
});

test('early input cancels unseen help; selected reference gets only its partner and deselection restores two taps', () => {
  const f = fixture(), old = f.cues.at(-1), [a,b] = f.pair();
  f.pick(a); assert.equal(old.destroyed, true); old.show();
  let cue = f.cues.at(-1);
  assert.equal(cue.options.type, 'tap'); assert.equal(cue.options.source, b.el); assert.equal(cue.options.automatic, false);
  f.pick(a); assert.equal(cue.destroyed, true);
  assert.equal(f.cues.at(-1).options.type, 'pair');
  f.pick(a); f.pick(b);
  assert.equal(f.outcomes[0].assisted, false);
});

test('manual partner help follows a retained reference after a wrong match', () => {
  const f = fixture(), [a,b] = f.pair(), wrong = f.game.cards.find(c => c.id !== a.id);
  f.pick(a); f.pick(wrong);
  const cue = f.cues.at(-1);
  assert.equal(f.game.selected.card, a); assert.equal(cue.options.source, b.el);
  cue.show(); f.pick(b);
  assert.equal(f.outcomes.length, 2); assert.equal(f.outcomes[1].evidence, 'assisted_response');
  assert.equal(f.game.slips, 1);
});

test('later boards and completed visits keep manual help without automatic examples; stale help cannot affect new board', () => {
  const f = fixture(), first = f.cues.at(-1);
  for (const id of new Set(f.game.cards.map(c => c.id))) { const [a,b] = f.pair(id); f.pick(a); f.pick(b); }
  f.game.nextBoard();
  assert.equal(f.game.boardIndex, 1); assert.equal(f.game.pairCount, 2);
  assert.equal(f.cues.at(-1).options.automatic, false);
  first.options.onShow(); assert.equal(f.game.coachedPairs.size, 0);
  const pending = f.cues.at(-1); f.game.destroy(); assert.equal(pending.destroyed, true);
  pending.options.onShow(); assert.equal(f.game.coachedPairs.size, 0);
  const replay = fixture(false); assert.equal(replay.cues.at(-1).options.automatic, false);
});

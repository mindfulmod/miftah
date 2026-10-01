const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

function node(dataset = {}) {
  const listeners = {};
  const classes = new Set();
  return {
    dataset, listeners, isConnected: true, hidden: false, disabled: false,
    classList: { add: x => classes.add(x), remove: x => classes.delete(x), contains: x => classes.has(x) },
    addEventListener(type, fn) { listeners[type] = fn; },
    click() { (this.onclick || listeners.click)?.({}); },
    focus() {}, contains() { return false; }, scrollBy() {},
    querySelector() { return null; },
  };
}

function harness() {
  let body, accessory, hue, petBig, partyPet;
  let current = null, renderCount = 0, speech = 0, spent = 0, saves = 0;
  const root = { querySelector: selector => selector === '.lg-pet' && current?.className === 'lg-pet' ? current : null };
  const Art = { icon: () => '', pet: () => '', skillFlower: () => '', watchGlyphs: () => () => {} };
  const ns = { LettersArt: Art, LettersRoomArt: { alcove: () => '', tab: () => '', floor: () => '' },
    DecoratingGarden: { icon: () => '' }, LETTERS_BODIES: [{ id: 'blob', cost: 0 }, { id: 'bunny', cost: 20 }],
    LETTERS_ACCESSORIES: [{ id: 'cap', cost: 8 }] };
  const window = { MiftahGame: ns };
  const document = { activeElement: null };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'LettersGame.js'), 'utf8'), { window, document, setTimeout() {}, requestAnimationFrame() {} });
  const game = Object.create(ns.LettersGame.prototype);
  Object.assign(game, {
    root, pet: { hue: 200, species: 'blob', bodies: ['blob'], accessories: [], worn: [] }, skills: {},
    session: { world: { id: 'test', games: ['pairs'] } }, sound: { play() {} },
    topBar: () => '', wireTopBar() {}, wireShelf() {}, petRadiance: () => 0, starBalance: () => 50,
    petSVG: () => '', petRecite: () => { speech++; }, prefersReducedMotion: () => true,
    spendStars: amount => { spent += amount; return true; }, saveJSON: () => { saves++; }, confettiAt() {},
    isBoatAdventure: () => false, rewardScene: () => '', wirePractice() {}, renderDecoratingGarden() {}, renderHome() {},
    screen(className) {
      if (current) current.isConnected = false;
      renderCount++;
      const el = node(); el.className = className; el.dataset = {};
      const shelf = node(); Object.assign(shelf, { scrollLeft: 0, clientWidth: 300, scrollWidth: 300 });
      const room = node(); room.scrollTop = 0;
      const bubble = node();
      if (className === 'lg-pet') {
        body = node({ body: 'bunny' }); accessory = node({ acc: 'cap' }); hue = node({ petHue: '320' }); petBig = node();
      } else {
        const partyBubble = node(); partyPet = node(); partyPet.querySelector = selector => selector === '.pet-bubble' ? partyBubble : null;
      }
      const tabs = ['friends', 'outfits', 'colors'].map(wardrobeTab => node({ wardrobeTab }));
      const map = className === 'lg-pet'
        ? { '.pet-shelf': shelf, '.pet-room': room, '.pet-big': petBig, '.pet-bubble': bubble,
            '.wardrobe-prev': node(), '.wardrobe-more': node() }
        : { '.party-pet': partyPet, '.party-mascot': null, '.party-stars': null };
      el.querySelector = selector => {
        if (selector === '.pet-acc[data-body]') return body;
        if (selector === '.pet-acc[data-acc]') return accessory;
        if (selector === '.party-decorate' || selector === '.party-next') return node();
        return map[selector] || null;
      };
      el.querySelectorAll = selector => selector === '[data-wardrobe-tab]' ? tabs
        : selector === '[data-pet-hue]' ? [hue]
        : selector === '.pet-acc[data-body]' ? [body]
        : selector === '.pet-acc[data-acc]' ? [accessory]
        : selector === '.pet-shelf' ? [shelf] : [];
      current = el; return el;
    },
  });
  return { game, get renderCount() { return renderCount; }, get speech() { return speech; }, get spent() { return spent; }, get saves() { return saves; }, get hue() { return hue; }, get body() { return body; }, get accessory() { return accessory; }, get petBig() { return petBig; }, get partyPet() { return partyPet; } };
}

test('detached wardrobe controls cannot recolor, buy, change outfit, recite or rerender', () => {
  for (const [tab, control, expectedSpend] of [
    ['colors', 'hue', 0], ['friends', 'body', 20], ['outfits', 'accessory', 8],
  ]) {
    const h = harness(); h.game.wardrobeTab = tab; h.game.renderPet();
    const old = h[control]; old.click(); // A normal live interaction still works, including toggles.
    assert.equal(h.spent, expectedSpend);
    const snapshot = { pet: JSON.stringify(h.game.pet), spent: h.spent, saves: h.saves, renders: h.renderCount, speech: h.speech };
    old.click();
    assert.deepEqual({ pet: JSON.stringify(h.game.pet), spent: h.spent, saves: h.saves, renders: h.renderCount, speech: h.speech }, snapshot,
      `stale ${control} control must have no effects`);
  }
});

test('detached pet and party-pet controls cannot recite or rerender', () => {
  const h = harness(); h.game.wardrobeTab = 'outfits'; h.game.renderPet();
  const oldPet = h.petBig; oldPet.click(); assert.equal(h.speech, 1);
  h.game.renderPet();
  const beforePet = { speech: h.speech, renders: h.renderCount };
  oldPet.click();
  assert.deepEqual({ speech: h.speech, renders: h.renderCount }, beforePet);

  h.game.renderParty(3, false);
  const oldPartyPet = h.partyPet; oldPartyPet.click(); assert.equal(h.speech, 2);
  h.game.renderParty(3, false);
  const beforeParty = { speech: h.speech, renders: h.renderCount };
  oldPartyPet.click();
  assert.deepEqual({ speech: h.speech, renders: h.renderCount }, beforeParty);
});

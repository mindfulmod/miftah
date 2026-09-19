const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'LettersArt.js'), 'utf8');

function glyph(size, text = 'ي', hidden = false) {
  return {
    isConnected: true,
    hidden,
    textContent: text,
    style: { transform: 'unchanged' },
    classList: { contains: () => false },
    renderedSize: size,
  };
}

function runtime(extra = {}) {
  const canvas = {
    getContext() {
      return {
        font: '',
        measureText(text) {
          const size = parseFloat(this.font);
          // Deliberately asymmetric Arabic ink, with a tall descender. Every
          // measurement scales with the computed CSS font size.
          return {
            width: size * 1.2,
            actualBoundingBoxLeft: size * 0.15,
            actualBoundingBoxRight: size * 0.7,
            actualBoundingBoxAscent: size * 0.5,
            actualBoundingBoxDescent: size * 1.1,
            fontBoundingBoxAscent: size * 0.9,
            fontBoundingBoxDescent: size * 0.3,
          };
        },
      };
    },
  };
  const window = { MiftahGame: {} };
  const context = {
    window,
    document: { createElement: () => canvas },
    getComputedStyle: (el) => ({ fontSize: `${el.renderedSize}px` }),
    ...extra,
  };
  vm.runInNewContext(source, context);
  return window.MiftahGame.LettersArt;
}

test('inline Arabic ink fitting follows rendered font size and skips hidden or empty prompts', () => {
  const art = runtime();
  const small = glyph(40);
  const large = glyph(80);
  const hidden = glyph(40, 'ي', true);
  const empty = glyph(40, '');
  const root = { querySelectorAll: (selector) => selector === '[data-fit-ink]' ? [small, large, hidden, empty] : [] };

  art.fitInlineGlyphs(root);

  // dx corrects asymmetric side bearings; htmlDy corrects the descender. Both
  // must scale with the actual computed font size, not a fixed CSS offset.
  assert.equal(small.style.transform, 'translate(13.0px, -24.0px)');
  assert.equal(large.style.transform, 'translate(26.0px, -48.0px)');
  assert.equal(hidden.style.transform, 'unchanged');
  assert.equal(empty.style.transform, 'unchanged');
});

test('glyph watcher observes resize and disposes its observers safely', () => {
  const frames = [];
  const mutations = [];
  const resizes = [];
  class MockMutationObserver {
    constructor(callback) { this.callback = callback; mutations.push(this); }
    observe(target, options) { this.target = target; this.options = options; }
    disconnect() { this.disconnected = true; }
  }
  class MockResizeObserver {
    constructor(callback) { this.callback = callback; resizes.push(this); }
    observe(target) { this.target = target; }
    disconnect() { this.disconnected = true; }
  }
  const art = runtime({
    MutationObserver: MockMutationObserver,
    ResizeObserver: MockResizeObserver,
    requestAnimationFrame: (callback) => frames.push(callback),
  });
  const inline = glyph(40);
  const root = {
    isConnected: true,
    querySelectorAll: (selector) => selector === '[data-fit-ink]' ? [inline] : [],
  };

  const stop = art.watchGlyphs(root);
  assert.equal(mutations[0].target, root);
  assert.equal(resizes[0].target, root);
  frames.shift()();
  assert.equal(inline.style.transform, 'translate(13.0px, -24.0px)');

  stop();
  assert.equal(mutations[0].disconnected, true);
  assert.equal(resizes[0].disconnected, true);
});

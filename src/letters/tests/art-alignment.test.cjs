const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'LettersArt.js'), 'utf8');

function mockSvgNode(tagName) {
  const attributes = {};
  let textContent = '';
  const children = [];
  const node = {
    tagName, isConnected: true, attributes, children, dataset: {},
    setAttribute(name, value) {
      attributes[name] = String(value);
      if (name === 'data-fit-box') this.dataset.fitBox = String(value);
    },
    getAttribute(name) { return attributes[name] ?? null; },
    appendChild(child) { children.push(child); child.parentNode = this; return child; },
    querySelector(selector) { return selector === 'text' ? children.find(child => child.tagName === 'text') || null : null; },
    querySelectorAll(selector) { return selector === 'text[data-fit-box]' ? children.filter(child => child.tagName === 'text' && child.dataset.fitBox) : []; },
  };
  Object.defineProperty(node, 'textContent', {
    get() { return tagName === 'text' ? textContent : children.map(child => child.textContent).join(''); },
    set(value) { textContent = String(value); },
  });
  return node;
}

function glyph(size, text = 'ي', { hidden = false, connected = true, latin = false } = {}) {
  const node = {
    isConnected: connected, hidden, textContent: text, renderedSize: size,
    style: {}, svg: null, replacements: 0,
    classList: { contains: name => name === 'is-latin' && latin },
    querySelector(selector) { return selector === 'svg' ? this.svg : this.svg?.querySelector(selector) || null; },
    querySelectorAll(selector) { return selector === 'text[data-fit-box]' ? this.svg?.querySelectorAll(selector) || [] : []; },
    replaceChildren(svg) {
      this.replacements++;
      this.svg = svg;
      svg.isConnected = this.isConnected;
      for (const child of svg.children) child.isConnected = this.isConnected;
    },
  };
  return node;
}

function runtime(extra = {}) {
  const measurements = [];
  const fontMetrics = { loaded: false };
  const canvas = {
    getContext() {
      return {
        font: '', textAlign: '', textBaseline: '', direction: '',
        measureText(text) {
          const size = Number(this.font.match(/([\d.]+)px/)?.[1]);
          const long = text === 'LONGWORD';
          const tall = text.includes('ً');
          const m = {
            width: size * (long ? 7 : 1) * (fontMetrics.loaded ? 1.6 : 1),
            actualBoundingBoxLeft: size * (long ? 2.1 : tall ? .35 : .25),
            actualBoundingBoxRight: size * (long ? 3.3 : tall ? .45 : .45),
            actualBoundingBoxAscent: size * (tall ? 1.05 : .5),
            actualBoundingBoxDescent: size * (tall ? .85 : .15),
          };
          measurements.push({ text, font: this.font, size, metrics: m });
          return m;
        },
      };
    },
  };
  const document = {
    ...extra.document,
    createElement: extra.document?.createElement || (() => canvas),
    createElementNS: extra.document?.createElementNS || ((_ns, tagName) => mockSvgNode(tagName)),
  };
  const window = { MiftahGame: {} };
  const context = {
    window,
    getComputedStyle: el => ({ fontSize: `${el.renderedSize}px` }),
    ...extra,
    document,
  };
  vm.runInNewContext(source, context);
  return { art: window.MiftahGame.LettersArt, measurements, document, context, fontMetrics };
}

function inlineRoot(...glyphs) {
  return {
    isConnected: true,
    querySelectorAll(selector) {
      if (selector === '[data-fit-ink]') return glyphs;
      return [];
    },
  };
}

function assertInkFitsWithInset(el) {
  const text = el.svg.querySelector('text');
  const [cx, cy, width, height, maxSize] = text.dataset.fitBox.split(',').map(Number);
  const size = Number(text.getAttribute('font-size'));
  const measured = el._measurements.filter(entry => entry.text === el.textContent).at(-1).metrics;
  const inkWidth = measured.actualBoundingBoxLeft + measured.actualBoundingBoxRight;
  const inkHeight = measured.actualBoundingBoxAscent + measured.actualBoundingBoxDescent;
  assert.ok(size <= maxSize + 1e-7, `fitted size ${size} exceeds frame maximum ${maxSize}`);
  assert.ok(inkWidth <= width + 1e-6, `${inkWidth}px ink exceeds ${width}px inner width`);
  assert.ok(inkHeight <= height + 1e-6, `${inkHeight}px ink exceeds ${height}px inner height`);
  assert.ok(cx > 0 && cy > 0);
  const frameWidth = Number(el.style.width.slice(0, -2));
  const frameHeight = Number(el.style.height.slice(0, -2));
  assert.ok(frameWidth - width >= maxSize * .2 - 1e-5, 'horizontal safety inset is retained');
  assert.ok(frameHeight - height >= maxSize * .2 - 1e-5, 'vertical safety inset is retained');
}

test('inline glyph fitting skips hidden, empty, disconnected, and invalid-size prompts', () => {
  const { art } = runtime();
  const hidden = glyph(40, 'ي', { hidden: true });
  const empty = glyph(40, '');
  const disconnected = glyph(40, 'ي', { connected: false });
  const invalidSize = glyph(0);
  art.fitInlineGlyphs(inlineRoot(hidden, empty, disconnected, invalidSize));
  for (const el of [hidden, empty, disconnected, invalidSize]) {
    assert.equal(el.svg, null);
    assert.equal(el.replacements, 0);
  }
});

test('inline SVG ink fitting constrains long and stacked marks with a safety inset', () => {
  const { art, measurements } = runtime();
  const long = glyph(40, 'LONGWORD');
  const tall = glyph(40, 'يً');
  long._measurements = measurements; tall._measurements = measurements;
  art.fitInlineGlyphs(inlineRoot(long, tall));
  assert.ok(Number(long.style.width.slice(0, -2)) <= 40 * 4.4 + 1e-6);
  assert.ok(Number(tall.style.height.slice(0, -2)) <= 40 * 1.75 + 1e-6);
  assertInkFitsWithInset(long);
  assertInkFitsWithInset(tall);
});

test('repeated fitting reuses SVG nodes and refits the same text to the current font size', () => {
  const { art, measurements } = runtime();
  const label = glyph(40, 'يً'); label._measurements = measurements;
  const root = inlineRoot(label);
  art.fitInlineGlyphs(root);
  const svg = label.svg, text = svg.querySelector('text');
  const firstWidth = label.style.width, firstFontSize = text.getAttribute('font-size');
  art.fitInlineGlyphs(root);
  assert.equal(label.svg, svg);
  assert.equal(label.svg.querySelector('text'), text);
  assert.equal(label.replacements, 1, 'fitting an existing SVG does not replace its child');
  label.renderedSize = 72;
  art.fitInlineGlyphs(root);
  assert.equal(label.svg, svg);
  assert.equal(label.svg.querySelector('text'), text);
  assert.notEqual(label.style.width, firstWidth);
  assert.notEqual(text.getAttribute('font-size'), firstFontSize);
  assertInkFitsWithInset(label);
});

test('Latin labels keep bold left-to-right SVG text in the same fitting path', () => {
  const { art } = runtime();
  const latin = glyph(48, 'LONGWORD', { latin: true });
  art.fitInlineGlyphs(inlineRoot(latin));
  const text = latin.svg.querySelector('text');
  assert.equal(text.getAttribute('direction'), 'ltr');
  assert.equal(text.getAttribute('font-weight'), '800');
  assert.match(text.getAttribute('font-family'), /system-ui/);
});

test('glyph watcher refits after resize and font readiness, reuses nodes, and tears down observers', async () => {
  const frames = [], mutations = [], resizes = [], fontListeners = new Map();
  let resolveFonts;
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
  const fonts = {
    ready: new Promise(resolve => { resolveFonts = resolve; }),
    addEventListener(type, callback) { fontListeners.set(type, callback); },
    removeEventListener(type, callback) { if (fontListeners.get(type) === callback) fontListeners.delete(type); },
  };
  const { art, measurements, fontMetrics } = runtime({
    document: { fonts },
    MutationObserver: MockMutationObserver,
    ResizeObserver: MockResizeObserver,
    requestAnimationFrame: callback => frames.push(callback),
  });
  const label = glyph(32, 'يً'); label._measurements = measurements;
  const root = inlineRoot(label);
  const stop = art.watchGlyphs(root);
  frames.shift()();
  const svg = label.svg, text = svg.querySelector('text');
  const initialWidth = label.style.width;

  mutations[0].callback(); frames.shift()();
  assert.equal(label.replacements, 1, 'the mutation caused by SVG setup cannot create another SVG');
  label.renderedSize = 52;
  resizes[0].callback(); frames.shift()();
  const resizedWidth = label.style.width;
  assert.notEqual(resizedWidth, initialWidth);
  fontMetrics.loaded = true;
  resolveFonts();
  await Promise.resolve();
  frames.shift()();
  assert.notEqual(label.style.width, resizedWidth, 'font readiness triggers measurement with the loaded face');
  assertInkFitsWithInset(label);
  assert.equal(label.svg, svg);
  assert.equal(label.svg.querySelector('text'), text);
  assert.equal(label.replacements, 1);

  stop();
  assert.equal(mutations[0].disconnected, true);
  assert.equal(resizes[0].disconnected, true);
  assert.equal(fontListeners.has('loadingdone'), false);
});

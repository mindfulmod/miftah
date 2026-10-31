const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const window = { MiftahGame: {} };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../VillageArt.js'), 'utf8'), { window, Math });
const V = window.MiftahGame.VillageArt;

test('v359 village changes composition across phone, tablet and wide rotation', () => {
  for (const [w, h, family] of [[390, 844, 'portrait'], [320, 568, 'portrait'], [1024, 768, 'tablet'], [1280, 800, 'wide'], [844, 390, 'wide'], [768, 1024, 'portrait']]) {
    const scene = V.layout(w, h);
    assert.equal(scene.family, family);
    for (const name of ['gate', 'cottage', 'yard', 'stall', 'friends', 'toy', 'stones', 'sundial', 'flowers', 'pet']) {
      const [x, y, size] = scene[name];
      assert.ok([x, y, size].every(Number.isFinite), name);
      assert.ok(x > 0 && x < scene.W && y > 0 && y < scene.H && size > 0, name);
    }
    assert.ok(scene.cottage[0] < scene.pet[0] && scene.pet[0] < scene.stall[0], 'clear central route between house and stand');
    assert.ok(scene.yard[1] > scene.cottage[1] + 86 * scene.cottage[2], 'yard is below the cottage step');
    const house = 156 * scene.cottage[2], chest = 128 * scene.toy[2], bench = 180 * scene.friends[2];
    assert.ok(house / chest >= 1.7 && house / chest <= 2.4, 'house remains substantially wider than the toy box');
    assert.ok(bench / house >= .65 && bench / house <= .85, 'bench fits the household scale');
  }
});

test('v359 cottage retains its readable warm details after resizing', () => {
  const svg = V.cottage();
  assert.equal((svg.match(/class="vg-win"/g) || []).length, 2);
  assert.equal((svg.match(/class="vg-smoke"/g) || []).length, 3);
  assert.match(svg, /class="vg-home-heart"/);
  assert.doesNotMatch(svg, /NaN|undefined|linearGradient|radialGradient/);
});

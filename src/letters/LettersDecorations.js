// Pure earned-decoration catalog and four-slot layout helpers.
(function (ns) {
  const STICKER_IDS = ['star', 'palm', 'dove', 'fish', 'boat', 'lantern'];
  const STICKER_LABELS = { star: 'Star', palm: 'Palm', dove: 'Dove', fish: 'Fish', boat: 'Boat', lantern: 'Lantern' };
  const FLOWER_LABELS = ['single flower patch', 'two-flower patch', 'three-flower patch'];

  const isIndex = (slot) => Number.isInteger(slot) && slot >= 0 && slot < 4;
  const entries = (catalog) => Array.isArray(catalog) ? catalog : [];
  const ids = (catalog) => new Set(entries(catalog).map((item) => item && item.id).filter((id) => typeof id === 'string'));

  function catalog({ progress = {}, bests = {}, stickers = {} } = {}) {
    const safeProgress = progress && typeof progress === 'object' && Array.isArray(progress.done)
      ? progress : { done: [] };
    const safeBests = bests && typeof bests === 'object' ? bests : {};
    const earned = ns.LettersGardenArt && typeof ns.LettersGardenArt.growth === 'function'
      ? ns.LettersGardenArt.growth(safeProgress, safeBests) : 0;
    const result = [];
    for (let count = 1; count <= 3; count++) {
      if (earned >= count) result.push({ id: `flower:${count}`, label: FLOWER_LABELS[count - 1], kind: 'flower', count });
    }
    if (earned >= 1) result.push({ id: 'boat', label: 'paper boat', kind: 'boat' });
    const known = new Set((Array.isArray(ns.LETTERS_STICKERS) ? ns.LETTERS_STICKERS : []).map((item) => item && item.id));
    const owned = new Set(Array.isArray(stickers && stickers.owned) ? stickers.owned : []);
    for (const stickerId of STICKER_IDS) {
      if (known.has(stickerId) && owned.has(stickerId)) {
        result.push({ id: `sticker:${stickerId}`, label: STICKER_LABELS[stickerId] + ' sticker', kind: 'sticker', stickerId });
      }
    }
    return result;
  }

  function normalize(value) {
    const source = value && typeof value === 'object' && !Array.isArray(value) ? value.slots : undefined;
    const slots = Array.isArray(source) ? source : [];
    const seen = new Set();
    const repaired = Array.from({ length: 4 }, (_, index) => {
      const item = slots[index];
      if (typeof item !== 'string' || seen.has(item)) return null;
      seen.add(item);
      return item;
    });
    return { version: 1, slots: repaired };
  }

  function visibleSlots(layout, available) {
    const normalized = normalize(layout);
    const allowed = ids(available);
    return normalized.slots.map((id) => typeof id === 'string' && allowed.has(id) ? id : null);
  }

  function place(layout, slot, id, available) {
    if (!isIndex(slot) || typeof id !== 'string' || !ids(available).has(id)) return null;
    const result = normalize(layout);
    const oldSlot = result.slots.indexOf(id);
    if (oldSlot === slot) return null;
    if (oldSlot >= 0) result.slots[oldSlot] = null;
    result.slots[slot] = id;
    return result;
  }

  function remove(layout, slot) {
    if (!isIndex(slot)) return null;
    const result = normalize(layout);
    if (result.slots[slot] === null) return null;
    result.slots[slot] = null;
    return result;
  }

  ns.LettersDecorations = { catalog, normalize, visibleSlots, place, remove };
})(window.MiftahGame || (window.MiftahGame = {}));

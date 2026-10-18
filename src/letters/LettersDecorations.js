// Pure earned-decoration catalog and four-slot layout helpers.
(function (ns) {
  const STICKER_IDS = ['star', 'palm', 'dove', 'fish', 'boat', 'lantern'];
  const STICKER_LABELS = { star: 'Star', palm: 'Palm', dove: 'Dove', fish: 'Fish', boat: 'Boat', lantern: 'Lantern' };
  const FLOWER_LABELS = ['single flower patch', 'two-flower patch', 'three-flower patch'];

  // 2026-10-16: the garden grows with the pet — 4 spaces, then 6, then 8.
  let size = 4;
  const setSize = (n) => { size = Math.max(4, Math.min(8, Number.isInteger(n) ? n : 4)); return size; };
  const isIndex = (slot) => Number.isInteger(slot) && slot >= 0 && slot < size;
  const entries = (catalog) => Array.isArray(catalog) ? catalog : [];
  const ids = (catalog) => new Set(entries(catalog).map((item) => item && item.id).filter((id) => typeof id === 'string'));

  const KEEPSAKE_LABELS = { bed: 'seed bed', picnic: 'picnic basket', parcel: 'parcel stack', garland: 'lantern string', harvest: 'fruit tree', jars: 'seed jars', raft: 'little raft' };
  function catalog({ progress = {}, bests = {}, stickers = {}, savedDrawings = {}, pet = null, eggShell = null } = {}) {
    const safeProgress = progress && typeof progress === 'object' && Array.isArray(progress.done)
      ? progress : { done: [] };
    const safeBests = bests && typeof bests === 'object' ? bests : {};
    const earned = ns.LettersGardenArt && typeof ns.LettersGardenArt.growth === 'function'
      ? ns.LettersGardenArt.growth(safeProgress, safeBests) : 0;
    const result = [];
    // 2026-10-13: every hatched child owns one keepsake from the start: the
    // egg shell their pet came out of, in their own egg's colours. A new
    // child's garden was four empty plots and an empty tray.
    if (pet && typeof pet === 'object') {
      let shell; try { shell = typeof eggShell === 'function' ? eggShell() : undefined; } catch { shell = undefined; }
      result.push({ id: 'shell', label: 'egg shell', kind: 'shell', ...(Array.isArray(shell) ? { shell } : {}) });
    }
    for (let count = 1; count <= 3; count++) {
      if (earned >= count) result.push({ id: `flower:${count}`, label: FLOWER_LABELS[count - 1], kind: 'flower', count });
    }
    if (earned >= 1) result.push({ id: 'boat', label: 'paper boat', kind: 'boat' });
    // Garden props come from finished stories, never from a new currency:
    // any picnic chapter brings the blanket, any seed bed the watering can.
    const storyOf = ns.LettersJourney?.CHAPTERS || {};
    const stories = new Set(safeProgress.done.map((id) => storyOf[id]).filter(Boolean));
    if (stories.has('picnic')) result.push({ id: 'blanket', label: 'picnic blanket', kind: 'blanket' });
    if (stories.has('bed')) result.push({ id: 'can', label: 'watering can', kind: 'can' });
    const known = new Set((Array.isArray(ns.LETTERS_STICKERS) ? ns.LETTERS_STICKERS : []).map((item) => item && item.id));
    const owned = new Set(Array.isArray(stickers && stickers.owned) ? stickers.owned : []);
    for (const stickerId of STICKER_IDS) {
      if (known.has(stickerId) && owned.has(stickerId)) {
        result.push({ id: `sticker:${stickerId}`, label: STICKER_LABELS[stickerId] + ' sticker', kind: 'sticker', stickerId });
      }
    }
    // Update 5: finished chapter keepsakes and the child's own drawings as signs.
    const chapters = ns.LettersJourney?.CHAPTERS || {};
    for (const id of safeProgress.done) {
      const story = chapters[id];
      if (story && id !== 'pack-boat') result.push({ id: `keepsake:${id}`, label: KEEPSAKE_LABELS[story] || 'keepsake', kind: 'keepsake', story, worldId: id });
    }
    // 2026-10-16: daily treasures can be placed in the garden too — what a
    // child finds becomes something to play with, not only to shelve.
    const finds = Array.isArray(arguments[0]?.findsOwned) ? arguments[0].findsOwned : [];
    for (const id of finds) if (typeof id === 'string') result.push({ id: `find:${id}`, label: id.replace('gold:', 'golden ') + ' treasure', kind: 'treasure', find: id });
    const drawings = savedDrawings && typeof savedDrawings === 'object' ? Object.entries(savedDrawings) : [];
    for (const [letter, drawing] of drawings.slice(-4)) {
      if (typeof drawing === 'string' && /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(drawing)) {
        result.push({ id: `sign:${letter}`, label: `${letter} sign`, kind: 'sign', letter, drawing });
      }
    }
    return result;
  }

  function normalize(value) {
    const source = value && typeof value === 'object' && !Array.isArray(value) ? value.slots : undefined;
    const slots = Array.isArray(source) ? source : [];
    const seen = new Set();
    const repaired = Array.from({ length: size }, (_, index) => {
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

  ns.LettersDecorations = { catalog, normalize, visibleSlots, place, remove, setSize, get size() { return size; } };
})(window.MiftahGame || (window.MiftahGame = {}));

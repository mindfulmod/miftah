// Chapter presentation only. Curriculum, rewards and saves belong to the game.
(function (ns) {
  // Each chapter's pictorial purpose is chosen from its existing activity
  // order (update 3). Pop → Trace → Feed is the picnic delivery; Pairs → Trace →
  // Pop plants a signed seed bed. Curriculum and game order never change here.
  const STORIES = Object.freeze({
    picnic: Object.freeze([
      Object.freeze({ game: 'pop', label: 'Find seed packets at the pond', next: 'Draw the packet labels' }),
      Object.freeze({ game: 'trace', label: 'Draw the packet labels', next: 'Deliver packets to your friend' }),
      Object.freeze({ game: 'feed', label: 'Deliver packets to your friend', next: 'Return to the garden' }),
    ]),
    // Pop → Build → Feed: the word built on the workbench becomes the parcel label.
    parcel: Object.freeze([
      Object.freeze({ game: 'pop', label: 'Find seed packets at the pond', next: 'Build the packet labels' }),
      Object.freeze({ game: 'build', label: 'Build the packet labels', next: 'Deliver packets to your friend' }),
      Object.freeze({ game: 'feed', label: 'Deliver packets to your friend', next: 'Return to the garden' }),
    ]),
    bed: Object.freeze([
      Object.freeze({ game: 'pairs', label: 'Sort the seeds for the bed', next: 'Draw the plant signs' }),
      Object.freeze({ game: 'trace', label: 'Draw the plant signs', next: 'Water the bed from the pond' }),
      Object.freeze({ game: 'pop', label: 'Water the bed from the pond', next: 'Return to the garden' }),
    ]),
  });
  // The later chapters mix activities more freely, so their stories name each
  // activity's part in the project and follow the chapter's own order:
  // lanterns for joining, a fruit tree for vowels, seed jars for sorting and
  // a raft for whole words. Each scene only grows with completed steps.
  const CRAFT_STEPS = Object.freeze({
    garland: { fuse: 'Tie the lanterns together', unfuse: 'Untie the tangled lanterns', chain: 'Add lanterns to the string', parade: 'Hang the lanterns up' },
    harvest: { blend: 'Wake the little tree', pop: 'Water the tree from the pond', trace: 'Draw the fruit labels', build: 'Build the fruit labels', feed: 'Share fruit with your friend', catch: 'Pick the fruit' },
    jars: { build: 'Build the jar labels', pop: 'Find seed packets at the pond', feed: 'Bring seeds to your friend', pairs: 'Sort the seeds into jars' },
    raft: { feed: 'Gather planks with your friend', build: 'Build the raft', pop: 'Sail the raft on the pond' },
  });
  const CRAFT_CHAPTERS = Object.freeze({
    'join-1': ['garland', ['fuse', 'unfuse', 'parade']], 'join-2': ['garland', ['fuse', 'chain', 'unfuse']],
    fatha: ['harvest', ['blend', 'pop', 'trace']], 'kasra-damma': ['harvest', ['blend', 'pop', 'catch']],
    standing: ['harvest', ['pop', 'feed', 'catch']], sukoon: ['harvest', ['build', 'pop', 'catch']],
    'long-sounds': ['jars', ['build', 'pop', 'pairs']], 'shaddah-mix': ['jars', ['pop', 'build', 'pairs']], 'decode-4': ['jars', ['feed', 'pop', 'pairs']],
    'words-2': ['raft', ['feed', 'build', 'pop']], decode: ['raft', ['feed', 'build', 'pop']],
  });
  const craftSteps = (kind, games) => Object.freeze(games.map((game, i) => Object.freeze({
    game, label: CRAFT_STEPS[kind][game], next: games[i + 1] ? CRAFT_STEPS[kind][games[i + 1]] : 'Return to the garden' })));
  const CHAPTERS = Object.freeze({
    'pack-boat': 'picnic', 'pack-little': 'picnic', 'pack-tall': 'picnic', 'pack-round': 'picnic',
    'pack-smile': 'bed', 'pack-wave': 'bed', 'pack-strong': 'bed',
    muqattaat: 'parcel', tanween: 'parcel', leen: 'parcel', shaddah: 'parcel',
    ...Object.fromEntries(Object.entries(CRAFT_CHAPTERS).map(([id, [kind]]) => [id, kind])),
  });
  const NAMES = Object.freeze({ picnic: 'Picnic adventure', bed: 'Seed bed adventure', parcel: 'Parcel adventure',
    garland: 'Lantern adventure', harvest: 'Fruit tree adventure', jars: 'Seed jar adventure', raft: 'Raft adventure' });
  const REPLAY = Object.freeze({ bed: 'Plant the seed bed again', garland: 'Hang the lanterns again', harvest: 'Grow the fruit tree again',
    jars: 'Fill the seed jars again', raft: 'Sail the raft again' });
  const journeys = Object.fromEntries(Object.entries(CHAPTERS).map(([id, kind]) =>
    [id, Object.freeze({ id, kind, craft: !!CRAFT_CHAPTERS[id], steps: CRAFT_CHAPTERS[id] ? craftSteps(kind, CRAFT_CHAPTERS[id][1]) : STORIES[kind] })]));
  const boat = journeys['pack-boat'];
  const escape = text => String(text || '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  function forWorld(world) {
    const journey = journeys[world?.id];
    return journey && world.games?.length === journey.steps.length &&
      journey.steps.every((step, index) => step.game === world.games[index]) ? journey : null;
  }
  function packet(label = '', drawing = '') {
    const ink = /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(drawing)
      ? `<image href="${drawing}" x="-37" y="-36" width="74" height="74" preserveAspectRatio="xMidYMid meet"/>`
      : label ? `<text x="0" y="1" text-anchor="middle" font-family="Amiri Quran, serif" font-size="44" fill="#4a3620" direction="rtl" data-fit-box="0,0,68,66,44">${escape(label)}</text>` : '';
    return ns.LettersGardenArt.seedPacket(ink);
  }
  // Route pictures for the seed-bed story: seed pairs, a sign being drawn, a watering can.
  const BED_ICONS = {
    pairs: '<rect x="6" y="12" width="24" height="32" rx="5" fill="#e5dcc8" stroke="#4a3620" stroke-width="2.4" transform="rotate(-8 18 28)"/><rect x="33" y="12" width="24" height="32" rx="5" fill="#e5dcc8" stroke="#4a3620" stroke-width="2.4" transform="rotate(8 45 28)"/><path d="M17 33Q12 22 18 18Q24 22 17 33M45 33Q40 22 46 18Q52 22 45 33" fill="#7fce54"/><ellipse cx="32" cy="52" rx="26" ry="4" fill="#4e9677" opacity=".3"/>',
    trace: '<path d="M30 56V30" stroke="#a89478" stroke-width="4" stroke-linecap="round"/><rect x="10" y="8" width="40" height="26" rx="5" fill="#fffdf7" stroke="#4a3620" stroke-width="2.4"/><path d="M18 24Q26 14 34 22" fill="none" stroke="#4e9677" stroke-width="3" stroke-linecap="round"/><path d="M38 34L41 24 56 9 62 15 47 30Z" fill="#7fce54" stroke="#4a3620" stroke-width="2.4"/>',
    pop: '<ellipse cx="32" cy="50" rx="27" ry="7" fill="#96ecff"/><path d="M10 32H40L44 46Q26 52 12 46Z" fill="#62cdf4" stroke="#4a3620" stroke-width="2.4"/><path d="M40 34L56 22" stroke="#4a3620" stroke-width="4" stroke-linecap="round"/><path d="M14 32Q26 14 38 32" fill="none" stroke="#4a3620" stroke-width="3"/><circle cx="58" cy="28" r="2.4" fill="#96ecff"/><circle cx="54" cy="36" r="2.4" fill="#96ecff"/>',
  };
  const BUILD_ICON = '<path d="M6 42H58L54 52H10Z" fill="#a89478" stroke="#4a3620" stroke-width="2.4"/><rect x="10" y="20" width="20" height="20" rx="4" fill="#fffdf7" stroke="#4a3620" stroke-width="2.4"/><rect x="34" y="20" width="20" height="20" rx="4" fill="#fffdf7" stroke="#4a3620" stroke-width="2.4"/><path d="M16 32Q20 25 25 31M40 27V34M46 27Q48 33 44 35" fill="none" stroke="#4e9677" stroke-width="2.4" stroke-linecap="round"/><path d="M30 30H34" stroke="#e8743c" stroke-width="3" stroke-linecap="round"/>';
  const lanternIcon = (x, y, fill = '#ffa798', w = 18) => `<rect x="${x + w / 2 - 5}" y="${y}" width="10" height="5" rx="2" fill="#c25a49" stroke="#4a3620" stroke-width="1.6"/><rect x="${x}" y="${y + 4}" width="${w}" height="${w + 6}" rx="7" fill="${fill}" stroke="#4a3620" stroke-width="2.4"/>`;
  const CRAFT_ICONS = {
    garland: {
      fuse: `<path d="M6 12Q32 22 58 12" fill="none" stroke="#4a3620" stroke-width="2.4" stroke-linecap="round"/>${lanternIcon(13, 18)}${lanternIcon(32, 18, '#ccfbef')}<circle cx="32" cy="18" r="4" fill="#c25a49" stroke="#4a3620" stroke-width="1.6"/>`,
      unfuse: `<path d="M4 14Q14 20 22 18M42 18Q50 20 60 14" fill="none" stroke="#4a3620" stroke-width="2.4" stroke-linecap="round"/>${lanternIcon(5, 20)}${lanternIcon(41, 20, '#ccfbef')}<path d="M28 30H36M30 24L34 20M30 36L34 40" stroke="#e8743c" stroke-width="2.4" stroke-linecap="round"/>`,
      chain: `<path d="M2 10Q32 24 62 10" fill="none" stroke="#4a3620" stroke-width="2.4" stroke-linecap="round"/>${lanternIcon(5, 16, '#ffa798', 15)}${lanternIcon(24, 19, '#ccfbef', 15)}${lanternIcon(43, 16, '#f3c955', 15)}`,
      parade: `<path d="M5 8V56M59 8V56" stroke="#a89478" stroke-width="4" stroke-linecap="round"/><path d="M5 12Q32 26 59 12" fill="none" stroke="#4a3620" stroke-width="2.4"/><circle cx="32" cy="32" r="16" fill="#ffe49a" opacity=".6"/>${lanternIcon(12, 18, '#ffe49a', 13)}${lanternIcon(26, 21, '#ffe49a', 13)}${lanternIcon(40, 18, '#ffe49a', 13)}`,
    },
    harvest: {
      // v58: the feed step had the picnic basket in every theme; each theme
      // now carries its own — fruit to share, a seed jar, a plank bundle, a
      // parcel — matching the step's own words.
      feed: '<ellipse cx="32" cy="52" rx="26" ry="5" fill="#2f5c46" opacity=".16"/><path d="M8 32H56Q54 50 32 52Q10 50 8 32Z" fill="#c69434" stroke="#4a3620" stroke-width="3" stroke-linejoin="round"/><path d="M14 40Q32 46 50 40" fill="none" stroke="#70501b" stroke-width="2.4" stroke-linecap="round"/><circle cx="22" cy="26" r="9" fill="#ee806f" stroke="#4a3620" stroke-width="2.4"/><circle cx="40" cy="25" r="9" fill="#f3c955" stroke="#4a3620" stroke-width="2.4"/><circle cx="31" cy="18" r="8" fill="#7fce54" stroke="#4a3620" stroke-width="2.4"/><path d="M31 10Q33 4 38 4" fill="none" stroke="#4e9677" stroke-width="2.4" stroke-linecap="round"/><path d="M18 22Q20 19 23 19" fill="none" stroke="#ffa798" stroke-width="2.4" stroke-linecap="round"/>',
      blend: '<ellipse cx="32" cy="50" rx="24" ry="7" fill="#70501b"/><path d="M32 50Q34 38 32 24" fill="none" stroke="#4e9677" stroke-width="4" stroke-linecap="round"/><path d="M32 36Q16 37 17 24Q30 23 32 36M32 30Q47 30 48 17Q35 17 32 30" fill="#7fce54" stroke="#4a3620" stroke-width="1.6"/>',
      catch: '<circle cx="44" cy="10" r="6" fill="#f3c955" stroke="#4a3620" stroke-width="1.6"/><path d="M8 32H56L50 52Q32 58 14 52Z" fill="#c9bda4" stroke="#4a3620" stroke-width="2.4" stroke-linejoin="round"/><circle cx="24" cy="30" r="7" fill="#f3c955" stroke="#4a3620" stroke-width="1.6"/><circle cx="38" cy="29" r="7" fill="#ee806f" stroke="#4a3620" stroke-width="1.6"/><path d="M12 40Q32 47 52 40" fill="none" stroke="#a89478" stroke-width="2.4"/>',
    },
    raft: {
      feed: '<ellipse cx="32" cy="52" rx="26" ry="5" fill="#2f5c46" opacity=".16"/>' + [14, 26, 38].map((y) => `<rect x="8" y="${y}" width="48" height="10" rx="5" fill="#c69434" stroke="#4a3620" stroke-width="2.4"/><path d="M14 ${y + 5}H24" stroke="#ffe49a" stroke-width="2.4" stroke-linecap="round"/>`).join('') + '<path d="M20 12V50M44 12V50" stroke="#a89478" stroke-width="4" stroke-linecap="round"/><path d="M17 30Q20 27 23 30M41 30Q44 27 47 30" fill="none" stroke="#4a3620" stroke-width="1.6" stroke-linecap="round"/>',
      build: '<path d="M16 12V54M48 12V54" stroke="#a89478" stroke-width="3" stroke-linecap="round"/><g fill="#c69434" stroke="#4a3620" stroke-width="2.4"><rect x="6" y="16" width="52" height="10" rx="5"/><rect x="6" y="28" width="52" height="10" rx="5"/><rect x="6" y="40" width="52" height="10" rx="5"/></g>',
      pop: '<ellipse cx="32" cy="48" rx="29" ry="8" fill="#96ecff"/><path d="M33 8V38" stroke="#70501b" stroke-width="3" stroke-linecap="round"/><path d="M35 10Q54 21 35 33Z" fill="#fffdf7" stroke="#4a3620" stroke-width="2.4" stroke-linejoin="round"/><rect x="12" y="37" width="40" height="9" rx="4" fill="#c69434" stroke="#4a3620" stroke-width="2.4"/>',
    },
    jars: {
      feed: '<ellipse cx="32" cy="54" rx="20" ry="4" fill="#2f5c46" opacity=".16"/><rect x="14" y="16" width="36" height="38" rx="9" fill="#ccfbef" stroke="#4a3620" stroke-width="3"/><rect x="12" y="8" width="40" height="10" rx="4" fill="#c69434" stroke="#4a3620" stroke-width="3"/><path d="M19 40Q32 32 45 40V48Q32 52 19 48Z" fill="#a89478"/>' + [[24, 42], [32, 39], [40, 43], [28, 47], [37, 48]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2.6" ry="3.4" fill="#70501b"/>`).join('') + '<path d="M20 24Q22 20 26 20" fill="none" stroke="#fffdf7" stroke-width="3" stroke-linecap="round"/>',
    },
    parcel: {
      feed: '<ellipse cx="32" cy="54" rx="24" ry="4" fill="#2f5c46" opacity=".16"/><path d="M8 22L32 12L56 22V48L32 56L8 48Z" fill="#c69434" stroke="#4a3620" stroke-width="3" stroke-linejoin="round"/><path d="M8 22L32 32L56 22M32 32V56" fill="none" stroke="#4a3620" stroke-width="2.4" stroke-linejoin="round"/><path d="M20 17L44 27V36" fill="none" stroke="#ee806f" stroke-width="4" stroke-linecap="round"/><rect x="36" y="38" width="14" height="10" rx="2" fill="#fffaf0" stroke="#4a3620" stroke-width="1.6" transform="rotate(-20 43 43)"/>',
    },
  };
  function icon(game, kind = 'picnic') {
    if (kind === 'bed' && BED_ICONS[game]) return `<svg viewBox="0 0 64 60" aria-hidden="true">${BED_ICONS[game]}</svg>`;
    if (CRAFT_ICONS[kind]?.[game]) return `<svg viewBox="0 0 64 60" aria-hidden="true">${CRAFT_ICONS[kind][game]}</svg>`;
    if (kind === 'harvest' && BED_ICONS[game] && game !== 'pairs') return `<svg viewBox="0 0 64 60" aria-hidden="true">${BED_ICONS[game]}</svg>`;
    if (kind === 'jars' && game === 'pairs') return `<svg viewBox="0 0 64 60" aria-hidden="true">${BED_ICONS.pairs}</svg>`;
    if (game === 'build') return `<svg viewBox="0 0 64 60" aria-hidden="true">${BUILD_ICON}</svg>`;
    const shape = game === 'pop'
      ? '<ellipse cx="32" cy="43" rx="28" ry="12" fill="#96ecff"/><path d="M7 43Q32 53 57 43" fill="none" stroke="#3a8fc4" stroke-width="2.4"/><path d="M22 8Q32 5 42 8L43 39Q32 44 21 39Z" fill="#e5dcc8" stroke="#4a3620" stroke-width="3"/><rect x="25" y="16" width="14" height="16" rx="4" fill="#fffdf7"/>'
      : game === 'trace'
        ? '<rect x="9" y="8" width="38" height="42" rx="9" fill="#e5dcc8" stroke="#4a3620" stroke-width="3"/><rect x="15" y="15" width="25" height="26" rx="6" fill="#fffdf7"/><path d="M27 38L30 27 48 9 56 17 38 35Z" fill="#7fce54" stroke="#4a3620" stroke-width="3"/><path d="M27 38L30 27 38 35Z" fill="#fffaf0"/><path d="M28 36L32 34" stroke="#4a3620" stroke-width="3"/>'
        : '<path d="M18 25C15 2 49 2 46 25" fill="none" stroke="#4a3620" stroke-width="4"/><path d="M21 7H38V32H21Z" fill="#e5dcc8" stroke="#4a3620" stroke-width="2.4"/><path d="M7 25H57L51 48Q32 56 13 48Z" fill="#c9bda4" stroke="#4a3620" stroke-width="3"/><path d="M10 30Q32 39 54 30M15 43Q32 50 49 43" fill="none" stroke="#fffaf0" stroke-width="3"/><path d="M26 35Q19 28 19 35Q22 42 30 41Q40 30 44 35Q41 43 31 42" fill="#4e9677"/>';
    return `<svg viewBox="0 0 64 60" aria-hidden="true">${shape}</svg>`;
  }
  function route(world, completed = 0) {
    const journey = forWorld(world);
    if (!journey) return '';
    const current = Math.max(0, Math.min(3, Number.isFinite(completed) ? completed : 0));
    return `<div class="adventure-route" role="list" aria-label="${NAMES[journey.kind] || NAMES.picnic}">${journey.steps.map((step, index) =>
      `<span class="adventure-stop${index < current ? ' is-done' : ''}" role="listitem" ${index === current ? 'aria-current="step"' : ''} aria-label="${step.label}${index < current ? ', completed' : ''}">${icon(step.game, journey.kind)}${index < current ? `<i>${ns.LettersArt.icon('check', 14)}</i>` : ''}</span>`).join('')}</div>`;
  }
  // The seed bed: soil, then sprouts (seeds sorted), then the child's own signs
  // (drawn), then blooms once it is watered. Phase only ever comes from the
  // chapter's completed steps, so replays and returns cannot skip or repeat it.
  function bedArt({ phase = 0, letters = [], drawings = {}, size = 'scene' } = {}) {
    const xs = [150, 210, 270], colors = ['#ee806f', '#f3c955', '#ffa798'];
    const sign = (x, letter, i) => {
      const drawing = drawings[letter];
      const ink = /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(drawing || '')
        ? `<image href="${drawing}" x="${x + 2}" y="146" width="30" height="24" preserveAspectRatio="xMidYMid meet"/>`
        : letter ? `<text x="${x + 17}" y="164" text-anchor="middle" font-family="Amiri Quran, serif" font-size="18" fill="#4a3620" direction="rtl">${escape(letter)}</text>` : '';
      return `<g class="bed-sign" style="--sign-turn:${[-6, 4, -3][i]}deg"><path d="M${x + 17} 172V196" stroke="#a89478" stroke-width="4" stroke-linecap="round"/><rect x="${x}" y="143" width="34" height="30" rx="5" fill="#fffdf7" stroke="#4a3620" stroke-width="2.4"/>${ink}</g>`;
    };
    const plant = (x, i) => phase >= 3
      ? `<g class="bed-bloom"><path d="M${x} 186Q${x + 3} 160 ${x} 136" fill="none" stroke="#4e9677" stroke-width="4" stroke-linecap="round"/><path d="M${x + 1} 168Q${x - 16} 168 ${x - 15} 154Q${x - 3} 155 ${x + 1} 168" fill="#7fce54"/>${[0, 72, 144, 216, 288].map(a => `<ellipse cx="${x}" cy="128" rx="6" ry="10" transform="rotate(${a} ${x} 136)" fill="${colors[i]}" stroke="#4a3620" stroke-width="1.6"/>`).join('')}<circle cx="${x}" cy="136" r="6" fill="#ffe49a" stroke="#4a3620" stroke-width="1.6"/></g>`
      : phase >= 1 ? `<g class="bed-sprout"><path d="M${x} 186Q${x + 2} 172 ${x} 160" fill="none" stroke="#4e9677" stroke-width="4" stroke-linecap="round"/><path d="M${x} 164Q${x - 15} 166 ${x - 14} 152Q${x - 3} 152 ${x} 164M${x} 162Q${x + 14} 162 ${x + 15} 149Q${x + 3} 150 ${x} 162" fill="#7fce54"/></g>` : '';
    return `<g class="seed-bed">
      <ellipse cx="210" cy="214" rx="118" ry="11" fill="#2f5c46" opacity=".18"/>
      <path d="M96 184H324Q324 214 300 216H120Q96 214 96 184Z" fill="#c69434" stroke="#4a3620" stroke-width="3" stroke-linejoin="round"/>
      <path d="M140 188V212M180 188V214M220 188V214M260 188V214M300 188V212" stroke="#70501b" stroke-width="2.4" stroke-linecap="round"/>
      <ellipse cx="124" cy="200" rx="9" ry="3" fill="#fffdf7" opacity=".55"/>
      <rect x="92" y="176" width="236" height="14" rx="7" fill="#a89478" stroke="#4a3620" stroke-width="3"/>
      <ellipse cx="210" cy="182" rx="108" ry="5" fill="#70501b"/>
      <ellipse cx="200" cy="181" rx="90" ry="6" fill="#c69434" opacity=".35"/>
      ${xs.map(plant).join('')}
      ${phase >= 2 ? letters.map((letter, i) => sign(xs[i] - 2, letter, i)).join('') : ''}
      ${phase >= 3 && size === 'scene' ? `<g class="bed-can"><rect x="50" y="182" width="40" height="28" rx="12" fill="#62cdf4" stroke="#4a3620" stroke-width="3"/><path d="M58 194H82" stroke="#3a8fc4" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="60" cy="188" rx="5" ry="2.4" fill="#fffdf7" opacity=".6"/><path d="M86 188L104 174" stroke="#4a3620" stroke-width="4" stroke-linecap="round"/><path d="M58 184Q70 164 82 184" fill="none" stroke="#4a3620" stroke-width="3"/><circle cx="110" cy="174" r="3" fill="#96ecff"/><circle cx="114" cy="182" r="2.4" fill="#96ecff"/></g>` : ''}
    </g>`;
  }
  // Later-chapter projects share the seed bed's rule: each phase is the number
  // of completed steps, and the child's items (or drawings) label the result.
  const word = (x, y, text, size, max) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Amiri Quran, serif" font-size="${size}" fill="#4a3620" direction="rtl"${[...String(text)].length > 3 ? ` textLength="${max}" lengthAdjust="spacingAndGlyphs"` : ''}>${escape(text)}</text>`;
  const drawn = drawing => /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(drawing || '');
  const tag = (x, y, w, h, text, drawings, size) => drawn(drawings[text])
    ? `<image href="${drawings[text]}" x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"/>`
    : text ? word(x, y + size * .35, text, size, w - 4) : '';
  function lantern(cx, top, text, i, { lit = false, drawings = {} } = {}) {
    const fill = lit ? '#ffe49a' : ['#ffa798', '#fffdf7', '#ccfbef'][i % 3];
    return `<g class="craft-lantern" style="--swing:${[-4, 3, -2][i % 3]}deg">${lit ? `<circle cx="${cx}" cy="${top + 30}" r="27" fill="#ffe49a" opacity=".45"/>` : ''}
      <rect x="${cx - 9}" y="${top + 4}" width="18" height="7" rx="2" fill="#c25a49" stroke="#4a3620" stroke-width="1.6"/>
      <rect x="${cx - 18}" y="${top + 10}" width="36" height="38" rx="13" fill="${fill}" stroke="#4a3620" stroke-width="2.4"/>
      <rect x="${cx - 7}" y="${top + 47}" width="14" height="6" rx="2" fill="#c25a49" stroke="#4a3620" stroke-width="1.6"/>
      <path d="M${cx} ${top + 53}V${top + 60}" stroke="#c25a49" stroke-width="2.4" stroke-linecap="round"/>
      ${tag(cx, top + 29, 30, 26, text, drawings, 17)}</g>`;
  }
  function garlandArt(phase, letters, drawings) {
    const hung = phase >= 2;
    const spots = hung ? [[127, 118], [180, 124], [233, 118]] : [[130, 144], [180, 148], [230, 144]];
    return `<g class="craft-garland">
      <rect x="64" y="100" width="14" height="104" rx="7" fill="#a89478" stroke="#4a3620" stroke-width="3"/><rect x="282" y="100" width="14" height="104" rx="7" fill="#a89478" stroke="#4a3620" stroke-width="3"/><path d="M69 112V194M287 112V194" stroke="#c9bda4" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M71 202V104M289 202V104" stroke="#c9bda4" stroke-width="3" stroke-linecap="round" opacity=".7"/>
      <g fill="#c69434" stroke="#4a3620" stroke-width="1.6"><circle cx="71" cy="102" r="6"/><circle cx="289" cy="102" r="6"/></g>
      ${hung ? '<path d="M74 112Q180 140 286 112" fill="none" stroke="#4a3620" stroke-width="2.4" stroke-linecap="round"/>'
        : '<g fill="none" stroke="#4a3620" stroke-width="2.4"><ellipse cx="96" cy="200" rx="15" ry="5"/><ellipse cx="96" cy="196" rx="10" ry="3"/></g><path d="M74 112Q80 150 90 196" fill="none" stroke="#4a3620" stroke-width="2.4" stroke-linecap="round"/>'}
      ${spots.map(([x, y], i) => `${hung ? `<path d="M${x} ${y}V${y + 6}" stroke="#4a3620" stroke-width="1.6"/>` : ''}${lantern(x, hung ? y + 2 : y, phase >= 1 ? letters[i] : '', i, { lit: phase >= 3, drawings })}`).join('')}
      ${phase >= 3 ? [[98, 92], [262, 90], [180, 84]].map(([x, y]) => `<path class="craft-twinkle" d="M${x} ${y - 7}L${x + 2} ${y - 2} ${x + 7} ${y} ${x + 2} ${y + 2} ${x} ${y + 7} ${x - 2} ${y + 2} ${x - 7} ${y} ${x - 2} ${y - 2}Z" fill="#ffe49a" stroke="#c69434" stroke-width="1.6" stroke-linejoin="round"/>`).join('') : ''}
    </g>`;
  }
  function harvestArt(phase, letters, drawings) {
    const fruit = [[150, 118], [184, 92], [212, 124]];
    return `<g class="craft-harvest">
      <ellipse cx="180" cy="202" rx="60" ry="10" fill="#70501b"/><ellipse cx="174" cy="199" rx="40" ry="4" fill="#c69434" opacity=".35"/>
      ${phase === 0 ? '<path d="M180 200Q182 184 180 168" fill="none" stroke="#4e9677" stroke-width="4" stroke-linecap="round"/><path d="M180 182Q164 183 165 170Q178 170 180 182M180 176Q196 176 197 163Q184 163 180 176" fill="#7fce54" stroke="#4a3620" stroke-width="1.6"/>'
      : `<rect x="172" y="132" width="18" height="70" rx="9" fill="#c69434" stroke="#4a3620" stroke-width="3"/><path d="M179 144V170M184 178V194" stroke="#70501b" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M181 134Q166 124 156 114M181 128Q196 118 206 108" fill="none" stroke="#4a3620" stroke-width="8" stroke-linecap="round"/><path d="M181 134Q166 124 156 114M181 128Q196 118 206 108" fill="none" stroke="#c69434" stroke-width="4" stroke-linecap="round"/>
        <g class="craft-canopy">${(() => { const C = [[182, 98, 30], [154, 112, 22], [210, 112, 22], [164, 84, 20], [200, 82, 20], [182, 130, 18], [226, 98, 15], [140, 96, 15]];
          return C.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r + 3}" fill="#4a3620"/>`).join('') + C.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#4e9677"/>`).join('') + C.map(([x, y, r]) => `<circle cx="${x - r * 0.14}" cy="${y - r * 0.16}" r="${r * 0.84}" fill="#7fce54"/>`).join('') + C.filter(([, y]) => y < 100).map(([x, y, r]) => `<circle cx="${x - r * 0.3}" cy="${y - r * 0.32}" r="${r * 0.4}" fill="#b7e779"/>`).join('') + C.map(([x, y, r]) => `<path d="M${x + r * 0.2} ${y + r * 0.25}q3 -4 7 -3" fill="none" stroke="#4e9677" stroke-width="2.4" stroke-linecap="round"/>`).join(''); })()}</g>
        ${phase === 1 ? [[146, 112], [170, 88], [204, 100], [216, 126], [180, 128]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#ffa798" stroke="#4a3620" stroke-width="1.6"/>`).join('') : ''}`}
      ${phase >= 2 ? fruit.map(([x, y], i) => `<g class="craft-fruit"><path d="M${x} ${y - 15}Q${x + 2} ${y - 21} ${x + 6} ${y - 22}" fill="none" stroke="#4a3620" stroke-width="1.6"/><circle cx="${x}" cy="${y}" r="16" fill="${['#f3c955', '#ee806f', '#f3c955'][i]}" stroke="#4a3620" stroke-width="2.4"/>${tag(x, y, 22, 20, letters[i], drawings, 16)}</g>`).join('') : ''}
      ${phase >= 3 ? `<g class="craft-basket"><g stroke="#4a3620" stroke-width="1.6"><circle cx="98" cy="183" r="9" fill="#f3c955"/><circle cx="114" cy="179" r="9" fill="#ee806f"/><circle cx="128" cy="184" r="9" fill="#f3c955"/></g><path d="M82 188H144Q144 212 128 212H98Q82 212 82 188Z" fill="#c9bda4" stroke="#4a3620" stroke-width="3" stroke-linejoin="round"/><rect x="79" y="183" width="68" height="9" rx="4.5" fill="#f3c955" stroke="#4a3620" stroke-width="2.4"/><path d="M86 195Q113 204 140 195" fill="none" stroke="#a89478" stroke-width="2.4"/></g>` : ''}
    </g>`;
  }
  function jarsArt(phase, letters, drawings) {
    const base = phase >= 1 ? 160 : 206, seeds = ['#c69434', '#e8743c', '#4e9677'];
    const jar = (cx, i) => `<g class="craft-jar">
      <rect x="${cx - 16}" y="${base - 66}" width="32" height="10" rx="3" fill="#ccfbef" stroke="#4a3620" stroke-width="2.4"/>
      <rect x="${cx - 24}" y="${base - 58}" width="48" height="58" rx="12" fill="#ccfbef" stroke="#4a3620" stroke-width="2.4"/>
      ${phase >= 2 ? `<rect x="${cx - 21}" y="${base - (phase >= 3 ? 48 : 24)}" width="42" height="${phase >= 3 ? 45 : 21}" rx="9" fill="${seeds[i]}"/>` : ''}
      <path d="M${cx - 16} ${base - 50}V${base - 14}" stroke="#fffdf7" stroke-width="3" stroke-linecap="round"/>
      ${phase >= 2 ? `<rect x="${cx - 19}" y="${base - 46}" width="38" height="26" rx="5" fill="#fffdf7" stroke="#4a3620" stroke-width="1.6"/>${tag(cx, base - 33, 34, 22, letters[i], drawings, 18)}` : ''}
      ${phase >= 3 ? `<rect x="${cx - 19}" y="${base - 73}" width="38" height="10" rx="4" fill="#ee806f" stroke="#4a3620" stroke-width="2.4"/><path d="M${cx} ${base - 73}Q${cx + 1} ${base - 81} ${cx} ${base - 85}M${cx} ${base - 81}Q${cx + 11} ${base - 83} ${cx + 10} ${base - 92}Q${cx + 1} ${base - 90} ${cx} ${base - 81}" fill="#7fce54" stroke="#4e9677" stroke-width="1.6"/>` : ''}
    </g>`;
    return `<g class="craft-jars">
      ${phase >= 1 ? '<rect x="97" y="166" width="16" height="40" rx="8" fill="#a89478" stroke="#4a3620" stroke-width="3"/><rect x="267" y="166" width="16" height="40" rx="8" fill="#a89478" stroke="#4a3620" stroke-width="3"/><rect x="82" y="156" width="216" height="15" rx="7.5" fill="#c69434" stroke="#4a3620" stroke-width="3"/><path d="M94 160H160" stroke="#ffe49a" stroke-width="2.4" stroke-linecap="round"/>' : ''}
      ${[248, 190, 132].map(jar).join('')}
    </g>`;
  }
  function raftArt(phase, letters, drawings) {
    const afloat = phase >= 3, x = afloat ? 52 : 150, y = afloat ? 180 : 182;
    // v219: the raft is two lashed logs with ringed ends and rope bindings, not one plank.
    const deck = `<rect x="${x}" y="${y + 16}" width="132" height="12" rx="6" fill="#c69434" stroke="#4a3620" stroke-width="2.4"/><path d="M${x + 14} ${y + 22}H${x + 58}M${x + 74} ${y + 22}H${x + 116}" stroke="#70501b" stroke-width="1.6" stroke-linecap="round"/><circle cx="${x + 126}" cy="${y + 22}" r="5" fill="#ffe49a" stroke="#4a3620" stroke-width="2.4"/>
      <rect x="${x}" y="${y - 4}" width="132" height="22" rx="10" fill="#c69434" stroke="#4a3620" stroke-width="2.4"/><circle cx="${x + 127}" cy="${y + 7}" r="5.5" fill="#ffe49a" stroke="#4a3620" stroke-width="2.4"/><circle cx="${x + 127}" cy="${y + 7}" r="2.4" fill="none" stroke="#c69434" stroke-width="1.6"/>${[44, 88].map((dx) => `<rect x="${x + dx - 3}" y="${y - 6}" width="6" height="36" rx="3" fill="#e5dcc8" stroke="#4a3620" stroke-width="1.6"/>`).join('')}
      ${[110, 66, 22].map((dx, i) => tag(x + dx, y + 7, 38, 22, letters[i], drawings, 17)).join('')}`;
    return `<g class="craft-raft">
      <path d="M26 200Q40 178 120 178Q196 178 214 198Q200 218 120 220Q40 220 26 200Z" fill="#62cdf4"/>
      <path d="M48 192Q90 184 130 186M66 210L120 208" fill="none" stroke="#96ecff" stroke-width="4" stroke-linecap="round"/>
      ${phase === 0 ? '<g fill="#c69434" stroke="#4a3620" stroke-width="2.4"><rect x="206" y="196" width="76" height="13" rx="6"/><rect x="190" y="183" width="76" height="13" rx="6" transform="rotate(-6 228 189)"/><rect x="214" y="170" width="64" height="13" rx="6" transform="rotate(4 246 176)"/></g>'
      : `<g class="craft-raft-boat${afloat ? ' is-afloat' : ''}">${phase >= 2 ? `<path d="M${x + 66} ${y}V${y - 72}" stroke="#70501b" stroke-width="4" stroke-linecap="round"/><path d="M${x + 70} ${y - 68}Q${x + 110} ${y - 40} ${x + 70} ${y - 8}Z" fill="#fffdf7" stroke="#4a3620" stroke-width="2.4" stroke-linejoin="round"/>` : ''}${afloat ? `<path d="M${x + 66} ${y - 72}L${x + 48} ${y - 65} ${x + 66} ${y - 58}Z" fill="#ee806f" stroke="#4a3620" stroke-width="1.6" stroke-linejoin="round"/>` : ''}${deck}</g>
        ${afloat ? `<path d="M${x - 8} ${y + 30}Q${x + 66} ${y + 38} ${x + 140} ${y + 30}" fill="none" stroke="#96ecff" stroke-width="2.4" stroke-linecap="round"/>` : ''}`}
    </g>`;
  }
  const CRAFT_ART = { garland: garlandArt, harvest: harvestArt, jars: jarsArt, raft: raftArt };
  const CROP = { bed: '86 112 248 112', garland: '56 76 248 136', harvest: '74 60 172 156', jars: '90 86 200 124', raft: '16 96 208 132' };
  function craftArt(kind, { phase = 0, letters = [], drawings = {} } = {}) {
    return CRAFT_ART[kind]?.(Math.max(0, Math.min(3, phase)), letters, drawings || {}) || '';
  }
  function keepsakeArt(kind, letters = []) {
    if (kind === 'bed') return `<svg viewBox="${CROP.bed}" aria-hidden="true">${bedArt({ phase: 3, letters, size: 'map' })}</svg>`;
    return CRAFT_ART[kind] ? `<svg viewBox="${CROP[kind]}" aria-hidden="true">${craftArt(kind, { phase: 3, letters })}</svg>` : '';
  }
  const GROUND = '<ellipse cx="210" cy="231" rx="185" ry="19" fill="#2f5c46" opacity=".16"/><path d="M10 190Q120 160 216 168Q330 160 410 195L385 227Q215 255 31 224Z" fill="#b7e779"/><path d="M31 224Q212 248 385 227L395 213Q212 234 22 209Z" fill="#4e9677"/>';
  function craftScene({ kind, phase, letters, drawings, pet, interactivePet }) {
    return `<div class="adventure-scene craft-scene" data-craft="${kind}" data-journey-phase="${phase}">
      <svg class="adventure-ground" viewBox="0 0 420 260" aria-hidden="true">${GROUND}${craftArt(kind, { phase, letters, drawings })}</svg>
      ${interactivePet ? `<button type="button" class="adventure-friend party-pet" aria-label="Celebrate with your pet"><span class="pet-bubble" hidden></span>${pet}</button>` : `<div class="adventure-friend" aria-hidden="true">${pet}</div>`}
    </div>`;
  }
  function bedScene({ phase, letters, drawings, pet, interactivePet }) {
    return `<div class="adventure-scene seed-bed-scene" data-journey-phase="${phase}">
      <svg class="adventure-ground" viewBox="0 0 420 260" aria-hidden="true"><ellipse cx="210" cy="231" rx="185" ry="19" fill="#2f5c46" opacity=".16"/><path d="M10 190Q123 151 216 178Q329 152 410 195L385 227Q215 255 31 224Z" fill="#b7e779"/><path d="M31 224Q212 248 385 227L395 213Q212 234 22 209Z" fill="#4e9677"/><path d="M19 189Q103 169 152 183L139 215Q61 225 21 209Z" fill="#96ecff"/><path d="M27 196Q65 186 100 195M38 210L81 207" fill="none" stroke="#ccfbef" stroke-width="4" stroke-linecap="round"/>${bedArt({ phase, letters, drawings })}</svg>
      ${interactivePet ? `<button type="button" class="adventure-friend party-pet" aria-label="Celebrate with your pet"><span class="pet-bubble" hidden></span>${pet}</button>` : `<div class="adventure-friend" aria-hidden="true">${pet}</div>`}
    </div>`;
  }
  function scene({ completed = 0, items = [], drawings = {}, pet = '', growth = 0, interactivePet = false, kind = 'picnic' } = {}) {
    if (CRAFT_ART[kind]) {
      const letters = [...new Set(items.map(item => item.display).filter(Boolean))].sort((a,b) => Number(!!drawings[b])-Number(!!drawings[a])).slice(0, 3);
      return craftScene({ kind, phase: Math.max(0, Math.min(3, completed)), letters, drawings, pet, interactivePet });
    }
    if (kind === 'bed') {
      const phase = Math.max(0, Math.min(3, completed));
      const letters = [...new Set(items.map(item => item.display).filter(Boolean))].sort((a,b) => Number(!!drawings[b])-Number(!!drawings[a])).slice(0, 3);
      return bedScene({ phase, letters, drawings, pet, interactivePet });
    }
    const phase = Math.max(0, Math.min(3, completed));
    const letters = [...new Set(items.map(item => item.display).filter(Boolean))]
      .sort((a,b) => Number(!!drawings[b])-Number(!!drawings[a])).slice(0, 3);
    const labels = phase >= 2;
    return `<div class="adventure-scene" data-journey-phase="${phase}">
      <svg class="adventure-ground" viewBox="0 0 420 260" aria-hidden="true"><ellipse cx="210" cy="231" rx="185" ry="19" fill="#2f5c46" opacity=".16"/><path d="M10 190Q123 151 216 178Q329 152 410 195L385 227Q215 255 31 224Z" fill="#b7e779"/><path d="M31 224Q212 248 385 227L395 213Q212 234 22 209Z" fill="#4e9677"/><path d="M19 189Q103 169 152 183L139 215Q61 225 21 209Z" fill="#96ecff"/><path d="M27 196Q65 186 100 195M38 210L81 207" fill="none" stroke="#ccfbef" stroke-width="4" stroke-linecap="round"/><path d="M208 192L321 182 356 222 228 232Z" fill="#fffaf0"/><path d="M212 200L333 194M223 218L347 211" stroke="#e5dcc8" stroke-width="6"/></svg>
      <div class="adventure-boat party-mascot" aria-hidden="true">${ns.LettersGardenArt.boat({ stage: growth, terrain: false })}</div>
      <div class="adventure-cargo" aria-hidden="true">${letters.map((letter, index) => `<span style="--packet-turn:${[-9,5,-3][index]}deg">${packet(labels ? letter : '', labels ? drawings[letter] : '')}</span>`).join('')}</div>
      ${phase === 1 ? `<div class="adventure-pencil" aria-hidden="true">${icon(kind === 'parcel' ? 'build' : 'trace')}</div>` : ''}
      ${phase >= 2 ? `<div class="adventure-basket" aria-hidden="true">${ns.LettersGardenArt.seedBasket()}</div>` : ''}
      ${interactivePet ? `<button type="button" class="adventure-friend party-pet" aria-label="Celebrate with your pet"><span class="pet-bubble" hidden></span>${pet}</button>` : `<div class="adventure-friend" aria-hidden="true">${pet}</div>`}
    </div>`;
  }
  // Keepsakes come from chapter completion, so returning/reloading cannot lose
  // them. Boat's basket rides in its boat; other chapters keep theirs at the stop.
  const MEMENTO_LABELS = { garland: 'Your lanterns are glowing', harvest: 'Your fruit tree is ready to pick', jars: 'Your seed jars are full', raft: 'Your raft is sailing' };
  function memento(progress, world = { id: boat.id }) {
    const journey = journeys[world?.id];
    if (!journey || !progress?.done?.includes(journey.id)) return '';
    if (journey.id === boat.id) return `<span class="map-picnic-memento" role="img" aria-label="Your Boat picnic is ready">${ns.LettersGardenArt.seedBasket()}</span>`;
    const letters = () => [...new Set((world.items?.() || world.letters || []).map?.(item => item.display || item.char || item) || [])].slice(0, 3);
    if (journey.kind === 'bed') return `<span class="map-journey-memento" role="img" aria-label="Your seed bed is in bloom">${keepsakeArt('bed', letters())}</span>`;
    if (CRAFT_ART[journey.kind]) return `<span class="map-journey-memento" data-craft="${journey.kind}" role="img" aria-label="${MEMENTO_LABELS[journey.kind]}">${keepsakeArt(journey.kind, letters())}</span>`;
    return `<span class="map-journey-memento" role="img" aria-label="${journey.kind === 'parcel' ? 'Your parcels are delivered' : 'Your picnic basket is packed'}">${ns.LettersGardenArt.seedBasket()}</span>`;
  }
  ns.LettersJourney = { forWorld, packet, icon, route, scene, memento, bedArt, craftArt, keepsakeArt, CHAPTERS, NAMES, REPLAY };
})(window.MiftahGame || (window.MiftahGame = {}));

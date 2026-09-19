// Chapter presentation only. Curriculum, rewards and saves belong to the game.
(function (ns) {
  const boat = Object.freeze({
    id: 'pack-boat',
    steps: Object.freeze([
      Object.freeze({ game: 'pop', label: 'Find seed packets at the pond', next: 'Draw the packet labels' }),
      Object.freeze({ game: 'trace', label: 'Draw the packet labels', next: 'Deliver packets to your friend' }),
      Object.freeze({ game: 'feed', label: 'Deliver packets to your friend', next: 'Return to the garden' }),
    ]),
  });
  const escape = text => String(text || '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  function forWorld(world) {
    return world?.id === boat.id && world.games?.length === boat.steps.length &&
      boat.steps.every((step, index) => step.game === world.games[index]) ? boat : null;
  }
  function packet(label = '', drawing = '') {
    const ink = /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(drawing)
      ? `<image href="${drawing}" x="-37" y="-36" width="74" height="74" preserveAspectRatio="xMidYMid meet"/>`
      : label ? `<text x="0" y="1" text-anchor="middle" font-family="Amiri Quran, serif" font-size="44" fill="#4a3620" direction="rtl" data-fit-box="0,0,68,66,44">${escape(label)}</text>` : '';
    return ns.LettersGardenArt.seedPacket(ink);
  }
  function icon(game) {
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
    return `<div class="adventure-route" role="list" aria-label="Boat picnic adventure">${journey.steps.map((step, index) =>
      `<span class="adventure-stop${index < current ? ' is-done' : ''}" role="listitem" ${index === current ? 'aria-current="step"' : ''} aria-label="${step.label}${index < current ? ', completed' : ''}">${icon(step.game)}${index < current ? `<i>${ns.LettersArt.icon('check', 14)}</i>` : ''}</span>`).join('')}</div>`;
  }
  function scene({ completed = 0, items = [], drawings = {}, pet = '', growth = 0, interactivePet = false } = {}) {
    const phase = Math.max(0, Math.min(3, completed));
    const letters = [...new Set(items.map(item => item.display).filter(Boolean))]
      .sort((a,b) => Number(!!drawings[b])-Number(!!drawings[a])).slice(0, 3);
    const labels = phase >= 2;
    return `<div class="adventure-scene" data-journey-phase="${phase}">
      <svg class="adventure-ground" viewBox="0 0 420 260" aria-hidden="true"><ellipse cx="210" cy="231" rx="185" ry="19" fill="#2f5c46" opacity=".16"/><path d="M10 190Q123 151 216 178Q329 152 410 195L385 227Q215 255 31 224Z" fill="#b7e779"/><path d="M31 224Q212 248 385 227L395 213Q212 234 22 209Z" fill="#4e9677"/><path d="M19 189Q103 169 152 183L139 215Q61 225 21 209Z" fill="#96ecff"/><path d="M27 196Q65 186 100 195M38 210L81 207" fill="none" stroke="#ccfbef" stroke-width="4" stroke-linecap="round"/><path d="M208 192L321 182 356 222 228 232Z" fill="#fffaf0"/><path d="M212 200L333 194M223 218L347 211" stroke="#e5dcc8" stroke-width="6"/></svg>
      <div class="adventure-boat party-mascot" aria-hidden="true">${ns.LettersGardenArt.boat({ stage: growth, terrain: false })}</div>
      <div class="adventure-cargo" aria-hidden="true">${letters.map((letter, index) => `<span style="--packet-turn:${[-9,5,-3][index]}deg">${packet(labels ? letter : '', labels ? drawings[letter] : '')}</span>`).join('')}</div>
      ${phase === 1 ? `<div class="adventure-pencil" aria-hidden="true">${icon('trace')}</div>` : ''}
      ${phase >= 2 ? `<div class="adventure-basket" aria-hidden="true">${ns.LettersGardenArt.seedBasket()}</div>` : ''}
      ${interactivePet ? `<button type="button" class="adventure-friend party-pet" aria-label="Celebrate with your pet"><span class="pet-bubble" hidden></span>${pet}</button>` : `<div class="adventure-friend" aria-hidden="true">${pet}</div>`}
    </div>`;
  }
  // The keepsake uses chapter completion, so returning/reloading cannot lose it.
  function memento(progress) {
    return progress?.done?.includes(boat.id) ? `<span class="map-picnic-memento" role="img" aria-label="Your Boat picnic is ready">${ns.LettersGardenArt.seedBasket()}</span>` : '';
  }
  ns.LettersJourney = { forWorld, packet, icon, route, scene, memento };
})(window.MiftahGame || (window.MiftahGame = {}));

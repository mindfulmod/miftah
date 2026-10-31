// One pictured family at a time, with a remembered place on every shelf.
// Eligibility and learning rules belong to LettersGame; this owns navigation only.
(function (ns) {
  const LABELS = { play: 'Play with friends', listen: 'Listening toys', read: 'Books and words', think: 'Puzzles and matching', write: 'Drawing and making', explore: 'Garden discoveries' };
  let serial = 0;

  function mount({ host, groups, tile, familyArt, state = {}, onLaunch, onFamily, reducedMotion = () => false }) {
    const available = groups.filter(([id, kinds]) => LABELS[id] && kinds.length);
    if (!available.length) { host.innerHTML = ''; return { destroy() {} }; }
    const id = `toy-chest-${++serial}`;
    let alive = true, version = 0, launched = false;
    state.positions = state.positions || {};
    if (!available.some(([family]) => family === state.family)) state.family = available[0][0];
    host.innerHTML = `<div class="tc-families" role="tablist" aria-label="Toy families">${available.map(([family]) => `<button type="button" role="tab" id="${id}-${family}" data-family="${family}" aria-label="${LABELS[family]}" aria-controls="${id}-panel">${familyArt(family)}<span class="tc-tab-mark" aria-hidden="true"></span></button>`).join('')}</div><div class="tc-cabinet"><div class="practice-garden-hub tc-shelf-scroll"></div><button type="button" class="tc-more" hidden aria-label="More toys below"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M11 15L20 24L29 15" fill="none" stroke="#4a3620" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg></button><span class="tc-cabinet-feet" aria-hidden="true"></span></div>`;
    const scroller = host.querySelector('.tc-shelf-scroll');
    const more = host.querySelector('.tc-more');
    const tabs = [...host.querySelectorAll('[data-family]')];
    const live = () => alive && host.isConnected;
    const updateMore = () => {
      if (!live()) return;
      more.hidden = !(scroller.scrollHeight > scroller.clientHeight + 2);
      const atEnd = scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 2;
      more.dataset.direction = atEnd ? 'up' : 'down';
      more.setAttribute('aria-label', atEnd ? 'Back to first toys' : 'More toys below');
    };
    more.onclick = () => {
      if (!live() || launched || more.hidden) return;
      const end = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
      const top = scroller.scrollTop >= end - 2 ? 0 : Math.min(end, scroller.scrollTop + scroller.clientHeight * .75);
      scroller.scrollTo({ top, behavior: reducedMotion() ? 'auto' : 'smooth' });
    };
    scroller.onscroll = updateMore;
    const resize = typeof ResizeObserver === 'function' ? new ResizeObserver(updateMore) : null;
    resize?.observe(scroller);
    const remember = () => { state.positions[state.family] = scroller.scrollTop; };
    const draw = (restoreFocus = false) => {
      const family = state.family;
      const kinds = available.find(([key]) => key === family)[1];
      const generation = ++version;
      tabs.forEach(button => {
        const selected = button.dataset.family === family;
        button.setAttribute('aria-selected', String(selected));
        button.tabIndex = selected ? 0 : -1;
      });
      host.dataset.family = family;
      scroller.innerHTML = `<section class="tc-panel" id="${id}-panel" role="tabpanel" aria-labelledby="${id}-${family}"><div class="tc-toys">${kinds.map(tile).join('')}</div></section>`;
      scroller.scrollTop = state.positions[family] || 0;
      scroller.querySelectorAll('[data-kind]').forEach(button => {
        button.onclick = () => {
          if (!live() || launched || generation !== version || !kinds.includes(button.dataset.kind)) return;
          launched = true;
          remember();
          state.focusKind = button.dataset.kind;
          onLaunch(button.dataset.kind);
        };
      });
      updateMore();
      if (restoreFocus && state.focusKind) {
        [...scroller.querySelectorAll('[data-kind]')].find(button => button.dataset.kind === state.focusKind)?.focus({ preventScroll: true });
      }
    };
    const choose = (button, focus = false) => {
      if (!live() || launched) return;
      if (button.dataset.family !== state.family) {
        remember();
        state.family = button.dataset.family;
        state.focusKind = null;
        draw();
        onFamily?.(state.family);
      }
      if (focus) button.focus({ preventScroll: true });
    };
    tabs.forEach((button, index) => {
      button.onclick = () => choose(button);
      button.onkeydown = event => {
        let next;
        if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
        else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = tabs.length - 1;
        else return;
        event.preventDefault();
        choose(tabs[next], true);
      };
    });
    draw(true);
    return { destroy() { if (!alive) return; remember(); alive = false; version++; resize?.disconnect(); scroller.onscroll = null; } };
  }
  ns.ToyChest = { mount };
})(window.MiftahGame || (window.MiftahGame = {}));

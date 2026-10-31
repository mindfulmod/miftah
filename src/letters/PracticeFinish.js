// A completed toy waits for the child. This presentation never grants rewards.
(function () {
  'use strict';
  const ns = window.MiftahGame = window.MiftahGame || {};
  function mount({ screen, stage, paid = false, petArt = '', reducedMotion = false, go, replay, creation, sound }) {
    let alive = true, chosen = false;
    const timers = new Set();
    const root = document.createElement('section');
    root.className = `practice-finish${reducedMotion ? ' is-still' : ''}`;
    root.setAttribute('aria-label', paid ? 'Activity complete. You earned a star.' : 'Activity complete.');
    const icon = name => ns.LettersArt.icon(name, 40);
    const picture = typeof creation?.open === 'function' && typeof creation.picture === 'string' && creation.picture.length <= 60000 && /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(creation.picture) ? creation.picture : null;
    const scene = ns.PracticeFinishArt.scene({ petArt, paid, picture });
    root.innerHTML = `${picture ? `<button type="button" class="practice-finish-scene practice-finish-picture" aria-label="Put your picture in the garden">${scene}</button>` : `<div class="practice-finish-scene" aria-hidden="true">${scene}</div>`}
      <div class="practice-finish-actions">${replay ? `<button type="button" class="practice-finish-replay" aria-label="Play this game again">${icon('replay')}</button>` : ''}<button type="button" class="practice-finish-next" aria-label="Continue">${icon('next')}</button></div>`;
    screen.dataset.practiceFinished = 'true';
    const heading = screen.querySelector('.practice-heading');
    if (heading) { heading.hidden = true; heading.inert = true; }
    stage.replaceChildren(root);
    // Cast SVGs have different amounts of space below their feet. Align the
    // actual contact shadow, not their outer boxes, to the clearing's ground.
    const groundPet = () => {
      const pet = root.querySelector('.pf-pet');
      const shadow = pet?.querySelector('.art-pet > ellipse, .lg-animal .ground');
      const anchor = root.querySelector('.pf-pet-ground');
      if (!pet || !shadow || !anchor || !alive) return;
      pet.style.transform = '';
      const a = anchor.getBoundingClientRect(), b = shadow.getBoundingClientRect();
      if (!a.width || !b.width) return;
      pet.style.transform = `translateY(${a.top + a.height / 2 - b.top - b.height / 2}px)`;
    };
    groundPet();
    const resize = typeof ResizeObserver === 'function' ? new ResizeObserver(groundPet) : null;
    resize?.observe(root);
    const current = () => alive && !chosen && screen.isConnected && stage.contains(root);
    const choose = action => {
      if (!current()) return;
      chosen = true;
      root.querySelectorAll('button').forEach(button => { button.disabled = true; });
      timers.forEach(clearTimeout); timers.clear();
      action?.();
    };
    root.querySelector('.practice-finish-next').onclick = () => choose(go);
    const again = root.querySelector('.practice-finish-replay');
    if (again) again.onclick = () => choose(replay);
    const displayPicture = root.querySelector('.practice-finish-picture');
    if (displayPicture) displayPicture.onclick = () => choose(creation.open);
    // The reward was already saved by the caller. No timer navigates or pays.
    if (paid) {
      const id = setTimeout(() => { timers.delete(id); if (current()) sound?.('star1'); }, 300);
      timers.add(id);
    }
    root.querySelector('.practice-finish-next').focus({ preventScroll: true });
    return () => {
      alive = false;
      resize?.disconnect();
      timers.forEach(clearTimeout); timers.clear();
      root.querySelectorAll('button').forEach(button => { button.disabled = true; });
    };
  }
  ns.PracticeFinish = { mount };
})();

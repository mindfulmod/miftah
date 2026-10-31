// An example gesture on the real object. Never dispatches game input or awards
// an outcome; showing a quiz target is explicitly reported as assistance.
(function (ns) {
  const hand = '<svg viewBox="0 0 64 72" aria-hidden="true"><path d="M22 6Q30 4 30 12V30L44 32Q56 34 54 46L50 60Q48 68 38 68H26Q18 68 14 60L6 44Q4 38 10 36Q14 35 18 40V12Q18 6 22 6Z" fill="#fffdf7" stroke="#4a3620" stroke-width="4" stroke-linejoin="round"/><path d="M30 30V42M38 32V42M46 34V44" fill="none" stroke="#c69434" stroke-width="3" stroke-linecap="round"/></svg>';
  let serial = 0;
  function mount({ host, source, destination, destinationY = .78, type = 'tap', control, automatic = false, reducedMotion = () => false, onShow }) {
    let alive = true, layer = null, timer = null, automaticTimer = null, animations = [];
    const live = () => alive && host?.isConnected && source?.isConnected && !source.disabled;
    const stop = () => {
      clearTimeout(timer); clearTimeout(automaticTimer); timer = automaticTimer = null;
      animations.forEach(animation => animation.cancel()); animations = [];
      layer?.remove(); layer = null;
    };
    const rectOf = el => {
      if (!el?.isConnected || el.hidden || !el.getClientRects().length) return null;
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 ? rect : null;
    };
    const animate = (el, frames, options) => {
      const animation = el.animate?.(frames, options);
      if (animation) animations.push(animation);
    };
    const show = () => {
      stop();
      if (!live()) return false;
      const linked = type === 'drag' || type === 'pair';
      const from = rectOf(source), to = linked ? rectOf(typeof destination === 'function' ? destination() : destination) : null;
      if (!from || (linked && !to)) return false;
      const still = reducedMotion();
      const sx = from.left + from.width * .55, sy = from.top + from.height * .55;
      const dx = to ? to.left + to.width * .5 : sx, dy = to ? to.top + to.height * (type === 'pair' ? .55 : destinationY) : sy;
      layer = document.createElement('div');
      layer.className = `lg-action-cue${still ? ' is-still' : ''}`;
      layer.dataset.action = type; layer.setAttribute('aria-hidden', 'true');
      const ring = (x, y, size = 42) => {
        const node = document.createElement('i'); node.className = 'lg-action-ring';
        Object.assign(node.style, { left: `${x-size/2}px`, top: `${y-size/2}px`, width: `${size}px`, height: `${size}px` });
        layer.appendChild(node); return node;
      };
      const contact = ring(sx, sy);
      if (type === 'pair') {
        // Two separate presses, never a drag or a synthetic card selection.
        const second = ring(dx, dy);
        const pointer = (x, y) => {
          const node = document.createElement('i'); node.className = 'lg-action-hand'; node.innerHTML = hand;
          Object.assign(node.style, { left: `${x-17}px`, top: `${y-5}px` }); layer.appendChild(node); return node;
        };
        const firstHand = pointer(sx, sy), secondHand = pointer(dx, dy);
        if (!still) {
          const press = [{ transform: 'translateY(8px)', opacity: 0 },
            { transform: 'translateY(0)', opacity: 1, offset: .25 },
            { transform: 'scale(.9)', opacity: 1, offset: .6 }, { transform: 'translateY(8px)', opacity: 0 }];
          const pulse = [{ transform: 'scale(.8)', opacity: 0 }, { transform: 'scale(1.15)', opacity: 1, offset: .6 }, { transform: 'scale(1.25)', opacity: 0 }];
          for (const [index, nodes] of [[0, [firstHand, contact]], [1, [secondHand, second]]]) {
            animate(nodes[0], [{ ...press[0], opacity: index ? 0 : 1 }, ...press.slice(1)], { duration: 1400, delay: index * 1750, easing: 'ease-in-out', fill: 'both' });
            animate(nodes[1], [{ ...pulse[0], opacity: index ? 0 : 1 }, ...pulse.slice(1)], { duration: 1400, delay: index * 1750, fill: 'both' });
          }
        }
        document.body.appendChild(layer);
        onShow?.();
        timer = setTimeout(stop, still ? 4200 : 3500);
        return true;
      }
      if (to) {
        const id = `action-arrow-${++serial}`;
        const route = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        route.setAttribute('class', 'lg-action-route');
        route.innerHTML = `<defs><marker id="${id}" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="10" markerHeight="10" orient="auto-start-reverse"><path d="M2 2L10 6L2 10Z"/></marker></defs><path d="M${sx} ${sy}Q${sx} ${dy} ${dx} ${dy}" marker-end="url(#${id})"/>`;
        layer.appendChild(route); ring(dx, dy, 54);
        if (!still) {
          const ghost = document.createElement('div'); ghost.className = 'lg-action-ghost';
          ghost.innerHTML = source.innerHTML;
          Object.assign(ghost.style, { left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px` });
          layer.appendChild(ghost);
          animate(ghost, [{ transform: 'translate(0,0) scale(.8)', opacity: 0, offset: 0 },
            { transform: 'translate(0,0) scale(.8)', opacity: .75, offset: .2 },
            { transform: `translate(0,${(dy-sy)*.65}px) scale(.72)`, opacity: .75, offset: .55 },
            { transform: `translate(${dx-sx}px,${dy-sy}px) scale(.6)`, opacity: .65, offset: .85 },
            { transform: `translate(${dx-sx}px,${dy-sy}px) scale(.6)`, opacity: 0, offset: 1 }],
            { duration: 2600, easing: 'ease-in-out', fill: 'both' });
        }
      }
      const pointer = document.createElement('i'); pointer.className = 'lg-action-hand'; pointer.innerHTML = hand;
      Object.assign(pointer.style, { left: `${sx-17}px`, top: `${sy-5}px` }); layer.appendChild(pointer);
      if (!still) {
        animate(pointer, to ? [{ transform: 'translate(0,0)', offset: 0 }, { transform: 'translate(0,0) scale(.92)', offset: .2 },
          { transform: `translate(0,${(dy-sy)*.65}px)`, offset: .55 }, { transform: `translate(${dx-sx}px,${dy-sy}px)`, offset: .85 }, { transform: `translate(${dx-sx}px,${dy-sy}px)`, offset: 1 }]
          : [{ transform: 'translateY(10px)', opacity: 1 }, { transform: 'translateY(0)', opacity: 1, offset: .25 },
            { transform: 'scale(.9)', opacity: 1, offset: .5 }, { transform: 'translateY(8px)', opacity: 0 }],
          { duration: to ? 2600 : 1800, easing: 'ease-in-out', fill: 'both' });
        if (!to) animate(contact, [{ transform: 'scale(.7)', opacity: .3 }, { transform: 'scale(1.2)', opacity: 1 }, { transform: 'scale(1.4)', opacity: 0 }], { duration: 1800, fill: 'both' });
      }
      document.body.appendChild(layer);
      onShow?.();
      timer = setTimeout(stop, still ? 4200 : to ? 2900 : 2100);
      return true;
    };
    const replay = () => show();
    if (control) { control.hidden = false; control.addEventListener('click', replay); }
    document.addEventListener('pointerdown', stop, true);
    document.addEventListener('keydown', stop, true);
    window.addEventListener('resize', stop);
    if (automatic) automaticTimer = setTimeout(show, 1100);
    return { show, stop, destroy() {
      if (!alive) return;
      alive = false; stop();
      document.removeEventListener('pointerdown', stop, true);
      document.removeEventListener('keydown', stop, true);
      window.removeEventListener('resize', stop);
      if (control) { control.removeEventListener('click', replay); control.hidden = true; }
    } };
  }
  ns.LettersActionCue = { hand, mount };
})(window.MiftahGame || (window.MiftahGame = {}));

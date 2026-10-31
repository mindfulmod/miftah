// Paper-diorama balloon art. Interaction and live letter fitting stay in
// LetterBalloons.js; classic() retains the v24/v58 drawing for rollback.
(function (ns) {
  const INK = "#4a3620";
  const COLORS = {
    "#ffa798": { fill: "#ffa798", shine: "#fffaf0", detail: "#ee806f" },
    "#96ecff": { fill: "#96ecff", shine: "#ccfbef", detail: "#62cdf4" },
    "#b7e779": { fill: "#b7e779", shine: "#fffdf7", detail: "#7fce54" },
    "#ffe49a": { fill: "#ffe49a", shine: "#fffdf7", detail: "#f3c955" },
    "#b49fcf": { fill: "#b49fcf", shine: "#e6d6f0", detail: "#8c74b0" },
    "#ee806f": { fill: "#ee806f", shine: "#ffa798", detail: "#c25a49" }
  };
  const escape = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

  function balloon(color, letter) {
    const ramp = COLORS[color] || COLORS["#ffa798"];
    return `<svg class="balloon-art" viewBox="0 0 120 164" aria-hidden="true" focusable="false">
      <ellipse cx="60" cy="153" rx="27" ry="5" fill="#3e5236" opacity=".16"/>
      <path d="M60 111Q53 128 61 151" fill="none" stroke="#a89478" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M60 8C31 8 12 31 12 58C12 84 33 106 60 112C87 106 108 84 108 58C108 31 89 8 60 8Z" fill="${ramp.fill}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M53 110L60 121L67 110Z" fill="${ramp.fill}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M31 39Q38 21 52 19" fill="none" stroke="${ramp.shine}" stroke-width="6" stroke-linecap="round"/>
      <path d="M25 64Q26 83 43 94" fill="none" stroke="${ramp.detail}" stroke-width="2.4" stroke-linecap="round" opacity=".78"/>
      <rect x="34" y="37" width="52" height="52" rx="18" fill="#fffaf0" stroke="${INK}" stroke-width="2.4"/>
      <text class="balloon-letter" data-fit-box="60,63,43,43,48" x="60" y="79" text-anchor="middle" font-family="'Amiri Quran',serif" font-size="48" fill="${INK}" direction="rtl">${escape(letter)}</text>
    </svg>`;
  }

  function classic(color, letter) {
    return `<svg viewBox="0 0 100 140" aria-hidden="true">
      <path d="M50 104Q44 120 52 138" fill="none" stroke="#a89478" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M50 6C24 6 10 28 10 50C10 76 30 98 50 104C70 98 90 76 90 50C90 28 76 6 50 6Z" fill="${color}" stroke="#4a3620" stroke-width="3"/>
      <path d="M44 104L50 112L56 104Z" fill="${color}" stroke="#4a3620" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M28 30Q34 18 46 16" fill="none" stroke="#fffdf7" stroke-width="6" stroke-linecap="round" opacity=".8"/>
      <circle cx="50" cy="54" r="33" fill="#fffaf0" opacity=".9"/>
      <text data-fit-box="50,54,46,46,48" x="50" y="68" text-anchor="middle" font-family="'Amiri Quran', serif" font-size="48" fill="#4a3620" direction="rtl">${escape(letter)}</text>
    </svg>`;
  }

  function clearing() {
    const box = `<ellipse cx="84" cy="157" rx="66" ry="8" fill="#2f5c46" opacity=".16"/><path d="M28 107H140L134 148Q132 154 124 154H44Q36 154 34 148Z" fill="#c69434" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><rect x="21" y="99" width="126" height="17" rx="8" fill="#ffe49a" stroke="${INK}" stroke-width="4"/><path d="M42 126H126M42 140H126M57 120V145M111 120V145" fill="none" stroke="#70501b" stroke-width="2.4" stroke-linecap="round"/>`;
    return `<div class="balloon-clearing" aria-hidden="true">
      <svg class="balloon-land" viewBox="0 0 800 500" preserveAspectRatio="none"><path d="M0 416Q220 384 440 420Q650 445 800 404V500H0Z" fill="#b7e779"/><path d="M0 468Q200 423 450 453Q670 477 800 440V500H0Z" fill="#7fce54"/></svg>
      <svg class="balloon-cloud" viewBox="0 0 180 80"><path d="M20 62Q0 62 6 42Q10 26 31 30Q37 4 61 12Q82 -1 103 20Q128 9 141 31Q169 28 174 48Q176 64 156 64Z" fill="#fffaf0"/><path d="M18 60Q82 73 162 60" fill="none" stroke="#ccfbef" stroke-width="6" stroke-linecap="round"/></svg>
      <svg class="balloon-planter balloon-planter-left" viewBox="0 0 170 170">
        <path d="M84 106Q78 67 54 42M84 106Q106 74 116 40" fill="none" stroke="#4e9677" stroke-width="6" stroke-linecap="round"/>
        <path d="M73 80Q31 87 22 56Q56 42 73 80ZM86 72Q65 42 91 23Q117 48 86 72ZM96 87Q119 54 149 72Q134 101 96 87Z" fill="#4e9677" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M36 63L61 75M89 35V58M112 84L136 76" fill="none" stroke="#7fce54" stroke-width="2.4" stroke-linecap="round"/>${box}
      </svg>
      <svg class="balloon-planter balloon-planter-right" viewBox="0 0 170 170">
        <path d="M60 110L49 57M108 109L118 43" fill="none" stroke="#4e9677" stroke-width="6" stroke-linecap="round"/>
        <path d="M62 93Q79 64 92 80Q83 100 62 93M104 81Q87 52 75 68Q80 87 104 81" fill="#7fce54" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M48 57Q26 65 30 50Q15 35 34 32Q39 11 50 27Q69 18 66 36Q84 45 66 54Q62 72 48 57Z" fill="#ffa798" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M118 43Q100 51 102 37Q87 24 105 22Q110 3 119 18Q136 12 133 28Q148 35 133 42Q131 58 118 43Z" fill="#ffe49a" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
        <circle cx="49" cy="43" r="8" fill="#f3c955" stroke="${INK}" stroke-width="2.4"/><circle cx="118" cy="31" r="7" fill="#ee806f" stroke="${INK}" stroke-width="2.4"/>${box}
      </svg>
    </div>`;
  }

  function pump(color, letter, air = 0) {
    const ramp = COLORS[color] || COLORS['#ffa798'];
    const amount = Math.max(0, Math.min(3, air)), scale = .64 + amount * .12;
    return `<svg class="balloon-pump-art" viewBox="0 0 120 246" aria-hidden="true" focusable="false">
      <ellipse cx="60" cy="238" rx="43" ry="5" fill="#3e5236" opacity=".16"/>
      <path class="balloon-hose" d="M60 ${65+48*scale}Q56 147 99 161Q119 172 99 212H86" fill="none" stroke="#a89478" stroke-width="4" stroke-linecap="round"/>
      <g class="balloon-inflatable">
        <g transform="translate(60 65) scale(${scale}) translate(-60 -65)">
          <g class="balloon-skin" style="--grow-from:${amount ? (scale-.12)/scale : 1}">
          <path d="M60 8C31 8 12 31 12 58C12 84 33 106 60 112C87 106 108 84 108 58C108 31 89 8 60 8Z" fill="${ramp.fill}" stroke="${INK}" stroke-width="4"/>
          <path d="M53 110L60 121L67 110Z" fill="${ramp.detail}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
          <path d="M31 39Q38 21 52 19" fill="none" stroke="${ramp.shine}" stroke-width="6" stroke-linecap="round"/>
          </g>
        </g>
        <rect x="36" y="39" width="48" height="49" rx="16" fill="#fffaf0" stroke="${INK}" stroke-width="2.4"/>
        <text class="balloon-letter" data-fit-box="60,63,40,41,48" x="60" y="79" text-anchor="middle" font-family="'Amiri Quran',serif" font-size="48" fill="${INK}" direction="rtl">${escape(letter)}</text>
      </g>
      ${amount===3?`<g class="balloon-release-cue"><path d="M99 64V30M88 41L99 30L110 41" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></g>`:''}
      <g class="balloon-pump-handle"><path d="M60 178V214" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><rect x="30" y="166" width="60" height="16" rx="8" fill="#ee806f" stroke="${INK}" stroke-width="4"/><path d="M39 172H78" stroke="#ffa798" stroke-width="3" stroke-linecap="round"/></g>
      <path d="M35 199Q35 193 42 193H78Q85 193 85 199V233H35Z" fill="#ffe49a" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M24 234H96" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>
      ${[0,1,2].map(i=>`<circle cx="${46+i*14}" cy="217" r="4.5" fill="${i<amount?'#4e9677':'#fffaf0'}" stroke="${INK}" stroke-width="2"/>`).join('')}
    </svg>`;
  }

  function modeIcon(mode) {
    return `<svg viewBox="0 0 72 64" aria-hidden="true" focusable="false">${mode==='pump'?`
      <ellipse cx="22" cy="20" rx="15" ry="18" fill="#96ecff" stroke="${INK}" stroke-width="3"/><path d="M22 38Q16 52 45 52" fill="none" stroke="#a89478" stroke-width="3"/>
      <path d="M54 26V48M43 25H65" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M46 43H62V59H46Z" fill="#ffe49a" stroke="${INK}" stroke-width="3"/><path d="M40 60H68" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`:`
      <path d="M34 35Q28 52 36 61" fill="none" stroke="#a89478" stroke-width="3"/><path d="M28 6L37 16L51 8L47 23L62 30L46 35L48 49L34 42L22 51L23 36L9 30L24 23Z" fill="#ffa798" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M12 8L18 14M59 7L55 14M64 46L60 41" stroke="#c69434" stroke-width="3" stroke-linecap="round"/>`}</svg>`;
  }
  ns.BalloonPlayArt = { balloon, clearing, classic, pump, modeIcon };
})(window.MiftahGame || (window.MiftahGame = {}));

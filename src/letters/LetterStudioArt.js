// Letter Studio scenery and keepsake tools. Scenes are inserted into the
// studio's 400×300 SVG; stamp and hanger are fixed-proportion toy illustrations.
(function (ns) {
  const INK = "#4a3620";
  const stroke = (width = 3) => `stroke="${INK}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"`;

  const palettes = {
    meadow: { sky: "#ccfbef", far: "#b7e779", bank: "#7fce54", low: "#4e9677" },
    orchard: { sky: "#ccfbef", far: "#b7e779", bank: "#7fce54", low: "#4e9677" },
    lagoon: { sky: "#ccfbef", far: "#b7e779", bank: "#7fce54", low: "#62cdf4" },
    night: { sky: "#4a4d84", far: "#4e9677", bank: "#2f5c46", low: "#34375f" },
    peaks: { sky: "#ccfbef", far: "#e5dcc8", bank: "#b7e779", low: "#7fce54" },
    river: { sky: "#ccfbef", far: "#b7e779", bank: "#7fce54", low: "#62cdf4" },
  };

  function scene(land) {
    const p = palettes[land] || palettes.meadow;
    const night = land === "night";
    const water = land === "lagoon" || land === "river";
    const peaks = land === "peaks";
    const orchard = land === "orchard";
    const tree = (x, y, s) => ns.DetailKit?.tree
      ? `<g transform="translate(${x} ${y}) scale(${s})">${ns.DetailKit.tree({ kind: orchard ? "apple" : "round", seed: orchard ? 8 : 3 })}</g>`
      : `<g transform="translate(${x} ${y}) scale(${s})">
        <ellipse cx="0" cy="1" rx="39" ry="8" fill="#2f5c46" opacity=".17"/>
        <path d="M-18 0Q-10 -4 -10 -17L-8 -45L-23 -60M-8 -45L9 -63M-8 -45L-26 -51M10 -1Q3 -8 4 -19L9 -46L24 -59M9 -46L-6 -61" fill="none" stroke="#c69434" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M-35 -75Q-33 -92 -15 -93Q-7 -111 11 -103Q31 -109 37 -91Q54 -83 44 -67Q38 -55 21 -59Q8 -45 -7 -57Q-23 -51 -32 -62Z" fill="#4e9677"/>
        <path d="M-27 -78Q-26 -92 -11 -88Q-5 -101 10 -95Q25 -100 30 -85Q43 -79 33 -67Q22 -57 10 -66Q-1 -55 -12 -66Q-24 -61 -29 -70Z" fill="#7fce54"/>
        <path d="M-12 -91Q-4 -103 8 -97Q17 -101 23 -92Q13 -86 4 -89Q-5 -83 -12 -91Z" fill="#b7e779"/>
        <path d="M-21 -76Q-16 -83 -10 -81M9 -91Q16 -96 21 -91" fill="none" stroke="#4e9677" stroke-width="2.4" stroke-linecap="round"/>
        ${orchard ? `<circle cx="-19" cy="-69" r="5" fill="#ee806f"/><path d="M-19 -74q2 -4 5 -4" fill="none" stroke="#70501b" stroke-width="1.6" stroke-linecap="round"/>` : ""}
      </g>`;
    const peaksArt = `<path d="M0 142L43 88L72 121L119 68L157 119L187 87L229 143Z" fill="#c9bda4"/><path d="M43 88L57 107L72 97L83 113L72 121ZM119 68L139 98L151 88L157 119L139 107Z" fill="#fffdf7"/>`;
    const lagoonArt = `<path d="M0 204Q78 176 145 198Q206 220 274 195Q341 171 400 199V300H0Z" fill="#62cdf4"/><path d="M0 216Q72 192 143 212M276 208Q338 188 400 211" fill="none" stroke="#96ecff" stroke-width="3" stroke-linecap="round"/>`;
    const riverArt = `<path d="M0 209Q87 189 151 210Q212 230 266 208Q331 182 400 203V300H0Z" fill="#62cdf4"/><path d="M0 219Q72 202 132 220M270 218Q332 194 400 214" fill="none" stroke="#96ecff" stroke-width="3" stroke-linecap="round"/>`;
    const nightSky = `<circle cx="338" cy="45" r="22" fill="#ffe49a"/><path d="M327 28Q342 24 352 36Q361 49 351 61Q369 49 361 33Q351 16 333 19Z" fill="#4a4d84"/><circle cx="74" cy="48" r="2.5" fill="#fffaf0"/><circle cx="116" cy="27" r="2" fill="#fffaf0"/><circle cx="285" cy="81" r="2.5" fill="#fffaf0"/>`;
    const sides = `<g>${tree(43, 265, .5)}
      <g transform="translate(365 275)">
        <ellipse cx="0" cy="0" rx="26" ry="5" fill="#2f5c46" opacity=".16"/>
        ${water ? `<path d="M-30 -4Q-6 -16 23 -5Q30 -2 26 3Q-2 10 -29 3Z" fill="#62cdf4"/><path d="M-19 -1Q0 -7 15 -1" fill="none" stroke="#96ecff" stroke-width="2.4" stroke-linecap="round"/>` : `<path d="M-27 0Q-18 -12 -11 -1Q-3 -15 5 -2Q12 -12 20 0Z" fill="#c9bda4"/>`}
        <path d="M-31 0Q-37 -20 -42 -10M-35 0Q-30 -16 -26 -8M29 1Q35 -19 39 -10M34 1Q31 -13 27 -7" fill="none" stroke="#4e9677" stroke-width="3" stroke-linecap="round"/>
        <path d="M-36 0Q-32 -8 -28 0M25 1Q29 -7 33 1" fill="none" stroke="#b7e779" stroke-width="2.4" stroke-linecap="round"/>
      </g></g>`;

    return `<rect width="400" height="300" fill="${p.sky}"/>
      ${night ? nightSky : `<path d="M20 67Q24 53 40 55Q49 39 66 48Q78 39 88 53Q105 52 107 66Q102 77 88 76H37Q22 77 20 67Z" fill="#fffaf0" opacity=".58"/>`}
      ${peaks ? peaksArt : `<path d="M0 151Q69 130 137 151Q206 174 274 148Q339 126 400 150V224H0Z" fill="${p.far}"/>`}
      ${water ? (land === "lagoon" ? lagoonArt : riverArt) : `<path d="M0 203Q55 185 112 197Q180 213 232 198Q307 177 400 199V300H0Z" fill="${p.bank}"/>`}
      ${!water ? `<path d="M0 230Q66 211 132 230Q198 248 264 227Q334 205 400 225V300H0Z" fill="${p.low}"/>` : `<path d="M0 252Q72 231 137 247Q201 264 266 244Q335 224 400 246V300H0Z" fill="${p.bank}"/>`}
      ${sides}
      ${water ? `<g fill="#4e9677"><path d="M24 225Q30 205 37 224Q47 205 51 227Q39 231 24 225Z"/><path d="M350 230Q357 206 364 229Q374 209 380 233Q365 237 350 230Z"/></g><ellipse cx="204" cy="238" rx="28" ry="7" fill="#96ecff" opacity=".85"/>` : `<g fill="#b7e779"><path d="M118 248q-8-16-13-3q4 7 13 3M118 248q4-18 11-10q1 8-11 10Z"/><path d="M286 237q-7-14-12-3q4 7 12 3M286 237q4-17 11-9q1 7-11 9Z"/></g>`}
      ${night ? `<g fill="#ffe49a"><circle cx="31" cy="217" r="3"/><circle cx="372" cy="213" r="2.5"/></g>` : ""}`;
  }

  function stamp(size = 48) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true">
      <ellipse cx="33" cy="57" rx="21" ry="4" fill="#2f5c46" opacity=".18"/>
      <path d="M23 27Q23 19 29 17V10Q29 5 34 5H39Q44 5 44 10V18Q50 20 50 27V34H23Z" fill="#c69434" ${stroke(4)}/>
      <path d="M32 9H39Q41 9 41 12V17H32Z" fill="#ffe49a"/>
      <path d="M21 29Q21 25 25 25H48Q52 25 52 29V34Q52 38 48 38H25Q21 38 21 34Z" fill="#f3c955" ${stroke(4)}/>
      <path d="M17 37Q17 34 21 34H52Q56 34 56 38V47Q56 51 52 51H21Q17 51 17 47Z" fill="#c25a49" ${stroke(4)}/>
      <path d="M23 42H47" fill="none" stroke="#ee806f" stroke-width="3" stroke-linecap="round"/><path d="M27 30H44" fill="none" stroke="#ffe49a" stroke-width="2.4" stroke-linecap="round"/>
    </svg>`;
  }

  function hanger(size = 48) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true">
      <path d="M32 4Q25 4 25 10Q25 14 29 16V20" fill="none" stroke="#a89478" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M29 16Q32 18 35 16" fill="none" stroke="#a89478" stroke-width="3" stroke-linecap="round"/>
      <path d="M12 20Q32 24 52 20V54Q32 58 12 54Z" fill="#fffaf0" ${stroke(4)}/>
      <path d="M16 25Q32 28 48 25V50Q32 53 16 50Z" fill="#e5dcc8"/>
      <circle cx="39" cy="32" r="5" fill="#f3c955"/>
      <path d="M18 46L29 35L36 42L41 37L48 46Z" fill="#7fce54"/>
      <path d="M19 46L29 35L36 42" fill="none" stroke="#4e9677" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M29 9Q25 11 27 17L29 22H35L37 17Q39 11 35 9Z" fill="#c69434" ${stroke(3)}/>
      <path d="M30 12L32 17L34 12" fill="none" stroke="#ffe49a" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M18 24Q22 25 25 25" fill="none" stroke="#fffdf7" stroke-width="2.4" stroke-linecap="round"/>
    </svg>`;
  }

  ns.LetterStudioArt = { scene, stamp, hanger };
})(window.MiftahGame || (window.MiftahGame = {}));

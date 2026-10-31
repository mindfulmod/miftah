// Small paper-world props for the picture-book games.
(function (ns) {
  const ink = "#4a3620";

  function door(index = 0) {
    const greens = ["#7fce54", "#b7e779"];
    const leaf = greens[((Number(index) || 0) % greens.length + greens.length) % greens.length];
    return `<svg class="bk-flap-door" viewBox="0 0 100 110" aria-hidden="true">
      <ellipse cx="51" cy="105" rx="38" ry="4" fill="#2f5c46" opacity=".2"/>
      <path d="M8 104V34Q8 7 50 7Q92 7 92 34V104Z" fill="#2f5c46" stroke="${ink}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M13 101V35Q13 13 50 13Q87 13 87 35V101Z" fill="${leaf}"/>
      <path d="M19 99V36Q19 20 50 20Q81 20 81 36V99Z" fill="#b7e779" opacity=".38"/>
      <path d="M25 36Q27 25 43 24M57 24Q73 25 75 36" fill="none" stroke="#4e9677" stroke-width="2.4" stroke-linecap="round"/>
      <rect x="12" y="43" width="6" height="16" rx="3" fill="#c9bda4" stroke="${ink}" stroke-width="1.6"/>
      <rect x="12" y="79" width="6" height="16" rx="3" fill="#c9bda4" stroke="${ink}" stroke-width="1.6"/>
      <circle cx="81" cy="83" r="3.5" fill="#f3c955" stroke="${ink}" stroke-width="2.4"/>
      <path d="M17 101H83" stroke="#2f5c46" stroke-width="3" stroke-linecap="round"/>
    </svg>`;
  }

  function closeDoors() {
    return `<svg viewBox="0 0 52 52" aria-hidden="true"><path d="M13 43V16Q13 7 26 7Q39 7 39 16V43Z" fill="#7fce54" stroke="${ink}" stroke-width="3"/><path d="M18 39V17Q18 12 26 12Q34 12 34 17V39Z" fill="#b7e779"/><path d="M4 30H27M19 23L27 30L19 37" fill="none" stroke="${ink}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="34" cy="31" r="2.4" fill="${ink}"/></svg>`;
  }

  function basket() {
    return `<svg class="bk-basket-art" viewBox="0 0 120 90" aria-hidden="true">
      <ellipse cx="60" cy="82" rx="46" ry="6" fill="#2f5c46" opacity=".2"/>
      <path d="M26 39Q28 19 60 19Q92 19 94 39" fill="none" stroke="#70501b" stroke-width="6" stroke-linecap="round"/>
      <path d="M31 38Q34 23 60 23Q86 23 89 38" fill="none" stroke="#f3c955" stroke-width="3" stroke-linecap="round"/>
      <path d="M12 37Q60 48 108 37L97 75Q95 82 87 83H33Q25 82 23 75Z" fill="#c69434" stroke="${ink}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M18 42Q60 51 102 42L94 71Q92 76 86 77H34Q28 76 26 71Z" fill="#f3c955"/>
      <path d="M28 50L34 74M43 52L46 77M59 53V78M75 52L72 77M91 49L85 74" fill="none" stroke="#c69434" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M23 59Q60 66 98 58M26 70Q60 77 95 69" fill="none" stroke="#70501b" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M11 36Q60 46 109 36L106 44Q60 55 14 44Z" fill="#ffe49a" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M24 39Q60 47 96 39" fill="none" stroke="#fffaf0" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>
    </svg>`;
  }

  function tripBackdrop() {
    return `<svg class="bk-trip-backdrop" viewBox="0 0 600 400" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 0H600V247Q524 219 457 246T309 248T158 242T0 256Z" fill="#ccfbef"/>
      <path d="M0 90Q82 64 167 90T334 89T500 85T600 81V400H0Z" fill="#b7e779"/>
      <path d="M0 240Q84 213 168 239T336 234T504 237T600 220V400H0Z" fill="#7fce54"/>
      <path d="M0 347Q104 319 211 344T420 341T600 329V400H0Z" fill="#4e9677" opacity=".42"/>
      <path data-ribbon="trail" d="M266 400Q280 359 291 325Q302 292 291 262Q279 233 299 209Q319 187 315 165" fill="none" stroke="#e5dcc8" stroke-width="52" stroke-linecap="round"/>
      <path data-ribbon="trail" d="M266 400Q280 359 291 325Q302 292 291 262Q279 233 299 209Q319 187 315 165" fill="none" stroke="#fffaf0" stroke-width="40" stroke-linecap="round"/>
    </svg>`;
  }

  function sign() {
    return `<svg class="bk-sign-art" viewBox="0 0 120 120" aria-hidden="true">
      <ellipse cx="60" cy="115" rx="24" ry="4" fill="#2f5c46" opacity=".2"/>
      <rect x="54" y="68" width="12" height="46" rx="6" fill="#c69434" stroke="${ink}" stroke-width="3"/>
      <rect x="14" y="8" width="92" height="78" rx="22" fill="#c69434" stroke="${ink}" stroke-width="4"/>
      <rect x="17" y="10" width="86" height="70" rx="20" fill="#fffaf0" stroke="${ink}" stroke-width="3"/>
      <path d="M30 18H90" stroke="#fffdf7" stroke-width="4" stroke-linecap="round"/>
      <path d="M49 113H71" stroke="#70501b" stroke-width="4" stroke-linecap="round"/>
    </svg>`;
  }

  function home() {
    return `<svg class="bk-home-art" viewBox="0 0 200 160" aria-hidden="true">
      <ellipse cx="100" cy="150" rx="76" ry="8" fill="#2f5c46" opacity=".22"/>
      <rect x="135" y="24" width="18" height="38" rx="6" fill="#e5dcc8" stroke="${ink}" stroke-width="3"/>
      <rect x="131" y="20" width="26" height="10" rx="5" fill="#fffaf0" stroke="${ink}" stroke-width="3"/>
      <path d="M27 73L100 23L173 73V143H27Z" fill="#fffaf0" stroke="${ink}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M35 77L100 34L165 77V136H35Z" fill="#fffdf7"/>
      <path d="M19 73L100 17L181 73L171 81L100 35L29 81Z" fill="#c25a49" stroke="${ink}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M34 68L100 23L166 68L158 72L100 33L42 72Z" fill="#ffa798"/>
      <path d="M47 142V96Q47 87 56 87H83Q92 87 92 96V142Z" fill="#c69434" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M52 96Q52 92 57 92H78Q87 92 87 98V138H52Z" fill="#70501b"/>
      <path d="M63 96V134M76 96V134" stroke="#c69434" stroke-width="2.4" stroke-linecap="round"/>
      <circle cx="80" cy="117" r="2.4" fill="#ffe49a"/>
      <rect x="43" y="138" width="53" height="9" rx="4" fill="#e5dcc8" stroke="${ink}" stroke-width="2.4"/>
      <rect x="111" y="82" width="34" height="30" rx="6" fill="#c69434" stroke="${ink}" stroke-width="3"/>
      <rect x="115" y="86" width="26" height="22" rx="3" fill="#96ecff"/>
      <path d="M128 86V108M115 97H141" stroke="#fffaf0" stroke-width="2.4"/>
      <rect x="108" y="116" width="40" height="12" rx="6" fill="#c69434" stroke="${ink}" stroke-width="2.4"/>
      <path d="M114 116Q107 106 119 112Q126 99 128 115Q141 103 140 116Z" fill="#4e9677"/>
      <circle cx="119" cy="110" r="4" fill="#ffa798"/><circle cx="138" cy="108" r="4" fill="#ee806f"/>
      <path d="M59 54L100 26L141 54M73 54L78 60M96 40L101 46M119 54L124 60" fill="none" stroke="#c25a49" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M21 145H179" stroke="#4e9677" stroke-width="4" stroke-linecap="round"/>
      <circle cx="37" cy="142" r="6" fill="#7fce54"/><circle cx="163" cy="142" r="6" fill="#7fce54"/>
    </svg>`;
  }

  const stallRamps = [
    { light: "#ffa798", base: "#ee806f", shadow: "#c25a49", dark: "#8a3a2d" },
    { light: "#ccfbef", base: "#96ecff", shadow: "#62cdf4", dark: "#3a8fc4" },
    { light: "#b7e779", base: "#7fce54", shadow: "#4e9677", dark: "#2f5c46" },
  ];

  function marketStall(index = 0) {
    const ramp = stallRamps[((Number(index) || 0) % stallRamps.length + stallRamps.length) % stallRamps.length];
    return `<svg class="bk-market-stall" viewBox="0 0 160 70" aria-hidden="true">
      <path d="M10 18Q10 11 17 11H143Q150 11 150 18V45Q150 56 140 62Q130 56 120 62Q110 56 100 62Q90 56 80 62Q70 56 60 62Q50 56 40 62Q30 56 20 62Q10 56 10 45Z" fill="${ramp.shadow}" stroke="${ink}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M16 18Q16 17 19 17H141Q144 17 144 20V44Q144 50 140 54Q130 48 120 54Q110 48 100 54Q90 48 80 54Q70 48 60 54Q50 48 40 54Q30 48 20 54Q16 50 16 44Z" fill="${ramp.base}"/>
      <path d="M19 18H42V51Q31 47 20 53Q16 49 16 44V21Q16 18 19 18Z" fill="${ramp.light}"/>
      <path d="M65 18H88V51Q77 47 66 51Z" fill="${ramp.light}"/>
      <path d="M111 18H141Q144 18 144 21V44Q144 49 140 53Q130 47 120 51H111Z" fill="${ramp.light}"/>
      <path d="M18 18H142" stroke="#fffdf7" stroke-width="2.4" stroke-linecap="round" opacity=".75"/>
      <path d="M20 57Q30 51 40 57Q50 51 60 57Q70 51 80 57Q90 51 100 57Q110 51 120 57Q130 51 140 57" fill="none" stroke="${ramp.dark}" stroke-width="2.4" stroke-linecap="round"/>
    </svg>`;
  }

  ns.BookPlayArt = { closeDoors, door, basket, tripBackdrop, sign, home, marketStall };
})(window.MiftahGame || (window.MiftahGame = {}));

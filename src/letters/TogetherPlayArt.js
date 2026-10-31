// Warm picnic art for the Garden Together memory game. The game owns the live
// cards and collected tokens; this module supplies only the surrounding SVGs.
(function (ns) {
  function basket() {
    return `<svg viewBox="0 0 180 110" aria-hidden="true" focusable="false">
      <ellipse cx="90" cy="105" rx="66" ry="4" fill="#4a3620" opacity=".16"/>
      <path d="M48 43Q49 13 90 12Q131 13 132 43" fill="none" stroke="#70501b" stroke-width="8" stroke-linecap="round"/>
      <path d="M51 42Q53 17 90 16Q127 17 129 42" fill="none" stroke="#f3c955" stroke-width="3" stroke-linecap="round"/>
      <path d="M18 34Q18 29 24 29H156Q162 29 162 35L154 94Q153 100 146 101H34Q27 100 26 94Z" fill="#c69434" stroke="#4a3620" stroke-width="4" stroke-linejoin="round"/>
      <path d="M24 27Q90 31 156 27L155 31Q90 34 25 31Z" fill="#ffe49a"/>
      <path d="M29 48Q90 55 151 48M31 63Q90 70 149 63M33 78Q90 85 147 78" fill="none" stroke="#70501b" stroke-width="2.4" stroke-linecap="round" opacity=".4"/>
      <path d="M45 38L48 91M68 40L69 93M91 40V94M114 40L113 93M137 38L134 91" fill="none" stroke="#f3c955" stroke-width="3" stroke-linecap="round" opacity=".65"/>
      <path d="M32 79Q90 84 148 79L146 94Q90 100 34 94Z" fill="#b0501f" opacity=".24"/>
      <path d="M35 83Q90 88 145 83M38 91Q90 96 142 91" fill="none" stroke="#70501b" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M43 75L45 82M60 77L61 84M77 78L77 85M94 78L93 85M111 77L110 84M128 75L127 82" fill="none" stroke="#f3c955" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M35 101Q90 106 145 101" fill="none" stroke="#70501b" stroke-width="4" stroke-linecap="round"/>
    </svg>`;
  }

  function mat() {
    return `<svg viewBox="0 0 600 400" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <ellipse cx="300" cy="378" rx="274" ry="12" fill="#4a3620" opacity=".12"/>
      <path d="M50 20Q24 20 22 48L12 348Q11 378 42 380L558 380Q589 378 588 348L578 48Q576 20 550 20Z" fill="#4e9677"/>
      <path d="M55 30Q34 30 33 52L24 345Q23 365 46 366H554Q577 365 576 345L567 52Q566 30 545 30Z" fill="#fffaf0"/>
      <path d="M48 40Q300 31 552 40M42 354Q300 363 558 354" fill="none" stroke="#b7e779" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M39 82L38 96M36 124L35 138M34 166L33 180M32 208L31 222M31 250L30 264M30 292L29 306M561 82L562 96M564 124L565 138M566 166L567 180M568 208L569 222M569 250L570 264M570 292L571 306" fill="none" stroke="#4e9677" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M74 43Q300 37 526 43" fill="none" stroke="#fffdf7" stroke-width="3" stroke-linecap="round" opacity=".9"/>
    </svg>`;
  }

  function cardBack() {
    return `<svg viewBox="0 0 100 120" aria-hidden="true" focusable="false">
      <rect x="3" y="3" width="94" height="114" rx="24" fill="#4e9677" stroke="#4a3620" stroke-width="4"/>
      <rect x="10" y="10" width="80" height="100" rx="20" fill="#7fce54"/>
      <rect x="15" y="15" width="70" height="90" rx="18" fill="#fffaf0"/>
      <path d="M29 22Q50 18 71 22" fill="none" stroke="#fffdf7" stroke-width="3" stroke-linecap="round"/>
      <path d="M50 76Q50 56 50 43" fill="none" stroke="#4e9677" stroke-width="4" stroke-linecap="round"/>
      <path d="M50 56Q31 55 29 39Q45 37 50 56Z" fill="#7fce54" stroke="#4a3620" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M50 48Q51 31 68 30Q69 46 50 48Z" fill="#4e9677" stroke="#4a3620" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M34 41L45 50M63 35L54 44" fill="none" stroke="#b7e779" stroke-width="2.4" stroke-linecap="round"/>
    </svg>`;
  }

  ns.TogetherPlayArt = { basket, mat, cardBack };
})(window.MiftahGame || (window.MiftahGame = {}));

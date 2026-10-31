// Small, calm waterside assets for Letter Garden. These are presentational SVG
// strings only; placement and interaction stay with the game screens.
(function (ns) {
  const INK = "#4a3620";

  function fish(index = 0) {
    const ramps = [
      { light: "#ffa798", base: "#ee806f", shade: "#c25a49" },
      { light: "#ffe49a", base: "#f3c955", shade: "#c69434" },
      { light: "#ccfbef", base: "#96ecff", shade: "#62cdf4" },
    ];
    const colors = ramps[((index % ramps.length) + ramps.length) % ramps.length];
    return `<svg viewBox="0 0 120 70" aria-hidden="true">
      <g>
        <path d="M21 35Q8 20 3 17Q4 35 3 53Q10 49 21 35Z" fill="${colors.shade}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
        <path d="M16 35Q29 10 65 12Q93 12 105 35Q93 58 65 58Q29 60 16 35Z" fill="${colors.base}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M24 30Q28 22 35 19" fill="none" stroke="${colors.light}" stroke-width="4" stroke-linecap="round"/>
        <ellipse cx="98" cy="31" rx="3.2" ry="4" fill="#fffdf7" stroke="${INK}" stroke-width="1.6"/>
        <circle cx="99" cy="32" r="1.7" fill="${INK}"/>
        <path d="M100 40Q104 42 107 39" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>
      </g>
    </svg>`;
  }

  function pond() {
    return `<svg class="tb-water" viewBox="0 0 600 420" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 0H600V420H0Z" fill="#7fce54"/>
      <path d="M0 0H600V52Q547 67 493 53Q433 38 378 56Q316 75 254 55Q188 35 126 56Q61 77 0 53Z" fill="#b7e779"/>
      <path d="M0 365Q61 345 120 364Q178 384 242 363Q305 343 370 363Q433 383 492 361Q548 341 600 362V420H0Z" fill="#b7e779"/>
      <path d="M0 83Q40 67 81 75Q115 81 153 72Q211 57 271 75Q329 92 385 72Q444 51 498 72Q550 91 600 75V350Q554 333 503 351Q447 371 387 350Q328 329 269 350Q210 371 151 349Q95 329 48 349Q22 360 0 350Z" fill="#fffaf0"/>
      <path d="M0 93Q41 78 81 86Q117 93 157 83Q213 69 271 87Q328 104 387 84Q445 64 496 84Q550 103 600 86V338Q552 322 502 340Q446 360 388 340Q328 319 270 340Q212 360 153 339Q95 319 48 339Q22 350 0 340Z" fill="#96ecff"/>
      <path d="M0 111Q57 98 114 110Q166 122 219 105Q275 88 329 110Q383 132 438 108Q500 82 554 105Q578 115 600 110V136Q550 122 502 142Q443 165 383 139Q330 117 275 139Q218 162 163 140Q107 118 55 139Q27 150 0 142Z" fill="#ccfbef" opacity=".56"/>
      <path d="M0 298Q51 280 101 297Q157 316 209 294Q270 269 326 294Q381 320 438 294Q493 268 549 291Q577 302 600 294V338Q551 322 502 340Q446 360 388 340Q328 319 270 340Q212 360 153 339Q95 319 48 339Q22 350 0 340Z" fill="#62cdf4" opacity=".3"/>
      <g fill="none" stroke="#ccfbef" stroke-width="2.4" stroke-linecap="round" opacity=".76">
        <path d="M15 169Q29 164 43 168"/><path d="M557 183Q571 177 585 181"/><path d="M22 274Q36 269 50 273"/><path d="M550 257Q565 251 580 255"/>
      </g>
    </svg>`;
  }

  function reeds() {
    return `<svg class="tb-reeds" viewBox="0 0 100 120" aria-hidden="true">
      <ellipse cx="50" cy="110" rx="35" ry="6" fill="#4e9677" opacity=".2"/>
      <path d="M34 108Q27 66 19 30M49 109Q48 64 54 17M64 108Q71 74 83 40" fill="none" stroke="#4e9677" stroke-width="4" stroke-linecap="round"/>
      <path d="M19 34Q5 21 8 8Q23 14 19 34ZM54 22Q42 10 45 0Q59 6 54 22ZM83 44Q92 28 89 18Q77 26 83 44Z" fill="#7fce54"/>
      <g fill="#c9bda4" stroke="#4a3620" stroke-width="2.4"><rect x="13" y="19" width="8" height="24" rx="4"/><rect x="50" y="8" width="8" height="25" rx="4"/><rect x="79" y="30" width="8" height="24" rx="4"/></g>
      <path d="M37 108Q4 94 6 72Q28 77 37 108ZM58 108Q75 82 96 82Q91 103 58 108Z" fill="#4e9677"/>
      <path d="M36 104Q16 88 7 74M59 104Q80 88 94 84" fill="none" stroke="#b7e779" stroke-width="2.4" stroke-linecap="round"/>
    </svg>`;
  }

  function stones() {
    return `<svg class="tb-stones" viewBox="0 0 100 42" aria-hidden="true">
      <ellipse cx="51" cy="36" rx="43" ry="4" fill="#4a3620" opacity=".14"/>
      <path d="M8 31Q10 21 23 19Q31 11 40 20Q49 13 58 21Q71 12 79 22Q91 21 94 31Q75 37 51 34Q26 38 8 31Z" fill="#e5dcc8" stroke="#4a3620" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M13 29Q17 22 25 22Q31 18 37 23M47 25Q53 19 60 23M72 25Q78 20 85 25" fill="none" stroke="#c9bda4" stroke-width="2.4" stroke-linecap="round"/>
    </svg>`;
  }

  function dock() {
    return `<svg viewBox="0 0 180 70" aria-hidden="true">
      <ellipse cx="91" cy="62" rx="78" ry="6" fill="#4e9677" opacity=".22"/>
      <path d="M18 17Q88 6 162 17L157 56Q89 65 23 56Z" fill="#c9bda4" opacity=".65"/>
      <path d="M15 12Q88 2 165 13L160 49Q89 59 20 49Z" fill="#e5dcc8" stroke="#4a3620" stroke-width="3" stroke-linejoin="round"/>
      <path d="M18 16Q88 7 162 16L160 28Q88 21 17 29Z" fill="#fffaf0"/>
      <path d="M17 29Q89 21 162 29L161 40Q89 33 18 40Z" fill="#e5dcc8"/>
      <path d="M18 40Q89 33 161 40L160 49Q90 58 20 49Z" fill="#c9bda4"/>
      <g fill="none" stroke="#a89478" stroke-width="1.6" stroke-linecap="round">
        <path d="M29 17L28 48M62 13L62 51M98 12L98 53M132 14L132 51"/>
      </g>
      <g fill="#70501b">
        <ellipse cx="40" cy="18" rx="2.4" ry="1.6"/><ellipse cx="111" cy="13" rx="2.4" ry="1.6"/><ellipse cx="76" cy="52" rx="2.4" ry="1.6"/><ellipse cx="145" cy="46" rx="2.4" ry="1.6"/>
      </g>
      <path d="M22 25Q88 17 159 25M21 43Q91 50 160 43" fill="none" stroke="#a89478" stroke-width="1.6" stroke-linecap="round"/>
    </svg>`;
  }

  function bathBackdrop() {
    return `<svg class="tb-bath-setting" viewBox="0 0 500 500" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 0H500V500H0Z" fill="#fffaf0"/>
      <path d="M0 0H500V284Q365 274 250 286T0 279Z" fill="#fffdf7"/>
      <g fill="none" stroke="#e5dcc8" stroke-width="1.6" opacity=".8">
        <path d="M0 84H500M0 168H500M0 252H500M82 0V280M166 0V280M250 0V280M334 0V280M418 0V280"/>
      </g>
      <path d="M0 281Q111 269 250 282T500 278V500H0Z" fill="#e5dcc8" opacity=".62"/>
      <path d="M0 302Q116 292 243 302T500 299" fill="none" stroke="#fffdf7" stroke-width="3" opacity=".85"/>
      <path d="M0 463Q126 450 250 465T500 460V500H0Z" fill="#c9bda4" opacity=".38"/>
    </svg>`;
  }

  function bathPlant() {
    return `<svg class="tb-bath-plant" viewBox="0 0 130 105" aria-hidden="true">
      <g transform="translate(-20 -345)">
        <ellipse cx="83" cy="430" rx="54" ry="9" fill="#4e9677" opacity=".16"/>
        <path d="M30 402Q31 377 44 360Q55 376 50 401M54 402Q60 369 76 351Q83 376 69 403M72 405Q83 381 100 376Q99 399 82 411" fill="#7fce54" stroke="#4a3620" stroke-width="2.4" stroke-linejoin="round"/>
        <path d="M40 412Q55 406 89 412L83 435Q61 441 44 433Z" fill="#e8743c" stroke="#4a3620" stroke-width="3" stroke-linejoin="round"/>
        <path d="M44 415Q63 410 87 415" fill="none" stroke="#ffa06e" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M51 408Q51 392 43 375M64 408Q68 385 76 361M70 408Q81 393 95 382" fill="none" stroke="#4e9677" stroke-width="1.6" stroke-linecap="round"/>
      </g>
    </svg>`;
  }

  function bathTowels() {
    return `<svg class="tb-bath-towels" viewBox="0 0 127 68" aria-hidden="true">
      <g transform="translate(-354 -382)">
        <ellipse cx="421" cy="434" rx="48" ry="8" fill="#4a3620" opacity=".12"/>
        <path d="M365 397Q365 389 373 389H462Q470 389 470 397V430Q470 438 462 438H373Q365 438 365 430Z" fill="#fffdf7" stroke="#4a3620" stroke-width="3" stroke-linejoin="round"/>
        <path d="M374 396H461V414H374Z" fill="#ccfbef"/>
        <path d="M377 418H457" fill="none" stroke="#e5dcc8" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M384 396V406M395 396V406M406 396V406" fill="none" stroke="#a89478" stroke-width="1.6" stroke-linecap="round"/>
      </g>
    </svg>`;
  }

  function sponge() {
    return `<svg viewBox="0 0 100 80" aria-hidden="true">
      <ellipse cx="50" cy="71" rx="34" ry="5" fill="#4a3620" opacity=".18"/>
      <path d="M14 19Q15 12 24 13L33 10L43 13L55 9L65 13L78 11Q86 13 86 22L89 31L86 40L89 52L84 61Q82 68 73 66L62 69L51 66L40 70L29 66L19 68Q12 65 13 57L10 47L13 37L10 27Z" fill="#f3c955" stroke="#4a3620" stroke-width="4" stroke-linejoin="round"/>
      <path d="M17 22Q18 17 25 18L34 15L43 18L55 14L64 18L77 16Q81 18 81 24L83 31Q72 27 61 31T38 30T15 34Z" fill="#ffe49a"/>
      <path d="M15 47Q26 42 39 46T63 46T86 43L84 57Q82 63 74 61L62 64L51 61L40 65L29 61L20 63Q15 61 16 55Z" fill="#c69434" opacity=".75"/>
      <g fill="#70501b" opacity=".8">
        <ellipse cx="27" cy="31" rx="3.3" ry="2.5"/><ellipse cx="48" cy="25" rx="2.8" ry="2.2"/><ellipse cx="70" cy="34" rx="3.6" ry="2.7"/><ellipse cx="35" cy="52" rx="3.4" ry="2.4"/><ellipse cx="62" cy="53" rx="2.8" ry="2.2"/><ellipse cx="76" cy="48" rx="2.1" ry="1.8"/>
      </g>
      <g fill="none" stroke="#ccfbef" stroke-width="2.4">
        <circle cx="82" cy="14" r="4"/><circle cx="91" cy="22" r="2.4"/><circle cx="18" cy="9" r="2.4"/>
      </g>
      <path d="M80 14H84M82 12V16" stroke="#fffdf7" stroke-width="1.6" stroke-linecap="round"/>
    </svg>`;
  }

  function shower() {
    return `<svg viewBox="0 0 100 90" aria-hidden="true"><path d="M72 72V36Q72 15 53 17L39 25" fill="none" stroke="${INK}" stroke-width="12" stroke-linecap="round"/><path d="M72 70V36Q72 20 54 22L40 29" fill="none" stroke="#96ecff" stroke-width="6" stroke-linecap="round"/><path d="M18 33Q24 14 41 18L51 31Z" fill="#62cdf4" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M17 36L53 32" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><path d="M19 34L50 31" stroke="#ccfbef" stroke-width="2.4" stroke-linecap="round"/><g fill="#96ecff" stroke="#3a8fc4" stroke-width="1.6"><path d="M20 48Q9 61 18 64Q27 66 20 48Z"/><path d="M36 45Q25 63 34 66Q44 67 36 45Z"/><path d="M49 44Q40 55 47 58Q55 60 49 44Z"/></g><path d="M66 72Q74 84 86 76" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/></svg>`;
  }

  ns.WatersideArt = { fish, pond, reeds, stones, dock, bathBackdrop, bathPlant, bathTowels, sponge, shower };
})(window.MiftahGame || (window.MiftahGame = {}));

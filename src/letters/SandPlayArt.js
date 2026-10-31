// Small wordless tools and edge dressing for the Letter Garden sand table.
(function (ns) {
  const INK = "#4a3620";
  const WOOD = "#c69434";
  const WOOD_LIGHT = "#ffe49a";
  const WOOD_DARK = "#70501b";
  const CORAL = "#ee806f";
  const CORAL_LIGHT = "#ffa798";
  const CORAL_DARK = "#c25a49";
  const GREEN = "#7fce54";
  const GREEN_LIGHT = "#b7e779";
  const GREEN_DARK = "#4e9677";
  const PAPER = "#e5dcc8";
  const PAPER_LIGHT = "#fffaf0";
  const PAPER_DARK = "#c9bda4";

  function rake(size = 48) {
    return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true" focusable="false">
      <ellipse cx="33" cy="57" rx="21" ry="3" fill="${WOOD_DARK}" opacity=".14"/>
      <path d="M10 49L37 16Q40 13 43 16Q46 19 43 22L16 53Q13 56 10 53Z" fill="${WOOD}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M16 46L37 21" fill="none" stroke="${WOOD_LIGHT}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M34 15Q35 11 39 12L53 17Q56 18 55 22L52 31Q51 34 47 33L33 28Q30 27 31 23Z" fill="${CORAL}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M36 16Q38 14 41 15L51 19L49 23L35 19Z" fill="${CORAL_LIGHT}"/>
      <path d="M34 27L31 35M40 29L37 37M46 31L43 39M52 32L49 40" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
      <path d="M34 28L32 34M40 30L38 36M46 32L44 38M52 33L50 39" fill="none" stroke="${GREEN_DARK}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M35 27L34 31M41 29L40 33M47 31L46 35M53 32L52 36" fill="none" stroke="${GREEN_LIGHT}" stroke-width="2.4" stroke-linecap="round"/>
      <circle cx="14" cy="49" r="4" fill="${WOOD_LIGHT}" stroke="${INK}" stroke-width="2.4"/>
    </svg>`;
  }

  function setting() {
    return `<svg viewBox="0 0 640 400" aria-hidden="true" focusable="false">
      <!-- Left edge: pail and a small shell-like stone cluster. -->
      <ellipse cx="82" cy="373" rx="54" ry="8" fill="${GREEN_DARK}" opacity=".16"/>
      <path d="M48 291Q50 283 59 283H106Q115 283 117 291L109 356Q108 365 99 366H66Q57 365 56 356Z" fill="${CORAL}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M55 292Q81 286 110 292L108 302Q81 298 57 302Z" fill="${CORAL_DARK}"/>
      <path d="M61 291Q82 287 103 291L101 297Q81 294 62 298Z" fill="${CORAL_LIGHT}"/>
      <path d="M62 286Q63 263 82 263Q102 263 103 286" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
      <path d="M66 285Q68 269 82 269Q96 269 99 285" fill="none" stroke="${WOOD}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M64 307Q70 309 76 307M91 307Q97 309 103 307" fill="none" stroke="${CORAL_LIGHT}" stroke-width="2.4" stroke-linecap="round"/>
      <ellipse cx="137" cy="369" rx="22" ry="5" fill="${GREEN_DARK}" opacity=".14"/>
      <path d="M119 359Q121 349 134 348Q148 348 153 356Q156 363 147 366Q130 370 121 365Z" fill="${PAPER}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M124 357Q133 352 143 354" fill="none" stroke="${PAPER_LIGHT}" stroke-width="2.4" stroke-linecap="round"/>

      <!-- Right edge: three smooth stones and a tiny rooted sprout. -->
      <ellipse cx="555" cy="374" rx="55" ry="8" fill="${GREEN_DARK}" opacity=".16"/>
      <path d="M503 358Q505 345 520 344Q537 343 543 355Q546 365 533 368Q512 371 505 366Z" fill="${PAPER_DARK}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M510 354Q518 347 529 350" fill="none" stroke="${PAPER_LIGHT}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M541 364Q542 350 556 349Q572 348 577 360Q579 369 565 371Q548 373 543 369Z" fill="${PAPER}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M548 359Q555 352 565 355" fill="none" stroke="${PAPER_LIGHT}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M570 369Q572 359 583 359Q594 359 598 367Q599 374 589 376Q577 377 572 374Z" fill="${PAPER_DARK}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M550 357Q549 337 558 326" fill="none" stroke="${GREEN_DARK}" stroke-width="3" stroke-linecap="round"/>
      <path d="M555 341Q539 338 538 329Q548 324 556 337Z" fill="${GREEN}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M557 334Q560 320 572 320Q576 330 560 338Z" fill="${GREEN_LIGHT}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M544 358Q551 355 558 358" fill="none" stroke="${GREEN_LIGHT}" stroke-width="2.4" stroke-linecap="round"/>
    </svg>`;
  }

  ns.SandPlayArt = { rake, setting };
})(window.MiftahGame || (window.MiftahGame = {}));

// Field-guide page and quiet habitat ground for Letter Friends.
(function (ns) {
  function page() {
    return `<svg viewBox="0 0 480 560" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d="M36 9H444Q472 9 472 37V523Q472 551 444 551H36Q8 551 8 523V37Q8 9 36 9Z" fill="#4e9677" stroke="#4a3620" stroke-width="4" stroke-linejoin="round"/>
      <path d="M36 15H437Q463 15 463 41V515Q463 542 437 542H36Q17 542 17 523V36Q17 15 36 15Z" fill="#7fce54"/>
      <path d="M25 23H429Q450 23 450 44V524Q450 536 438 536H35Q25 536 25 526Z" fill="#c9bda4" stroke="#4a3620" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M22 19H424Q446 19 446 41V519Q446 532 433 532H31Q22 532 22 523Z" fill="#e5dcc8"/>
      <path d="M18 17H420Q440 17 440 37V514Q440 526 428 526H29Q18 526 18 515V34Q18 17 35 17Z" fill="#fffaf0" stroke="#4a3620" stroke-width="4" stroke-linejoin="round"/>
      <path d="M34 23Q200 17 411 23" fill="none" stroke="#fffdf7" stroke-width="3" stroke-linecap="round"/>
      <path d="M431 25Q454 34 454 56V512Q453 530 437 539" fill="none" stroke="#4a3620" stroke-width="4" stroke-linecap="round"/>
      <path d="M439 31Q450 39 450 57V508Q450 522 440 530" fill="none" stroke="#b7e779" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M450 30L468 30V84L459 76L450 84Z" fill="#c25a49" stroke="#4a3620" stroke-width="4" stroke-linejoin="round"/>
      <path d="M454 34H464V70" fill="none" stroke="#ffa798" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M26 29H407M26 514H407" fill="none" stroke="#b7e779" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="5 9"/>
      <path d="M27 43V493M424 53V493" fill="none" stroke="#b7e779" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="5 10"/>
    </svg>`;
  }

  function habitat() {
    // Same drawing box as LetterFriends.art: the ground meets its lower ink.
    return `<svg viewBox="-6 -6 112 112" aria-hidden="true" focusable="false">
      <ellipse cx="50" cy="96" rx="43" ry="6" fill="#e5dcc8"/>
      <path d="M9 96Q8 90 4 89M10 96Q13 90 16 91M91 96Q90 89 86 88M92 96Q96 91 99 92" fill="none" stroke="#4e9677" stroke-width="2.4" stroke-linecap="round"/>
    </svg>`;
  }

  ns.FriendBookArt = { page, habitat };
})(window.MiftahGame || (window.MiftahGame = {}));

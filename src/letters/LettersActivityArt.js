// Quiet, activity-specific scenery for the Letter Garden playfield.
// Learning glyphs stay in MiniGames as live DOM; this module only supplies the
// paper-diorama surface underneath them.
(function (ns) {
  const FAMILY = {
    pairs: "pairs",
    burst: "pairs",
    DotGarden: "potting",
    feed: "picnic",
    catch: "catch",
    build: "joinery",
    blend: "joinery",
    fuse: "joinery",
    unfuse: "joinery",
    chain: "joinery",
    parade: "parade",
  };

  const shadow = (cx, cy, rx, ry, opacity = ".16") =>
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#2f5c46" opacity="${opacity}"/>`;

  function pairs() {
    // A low seed tray: only the timber/mat planes stretch. Live cards and pots
    // retain fixed proportions in the game layer above the recessed surface.
    return `<svg class="activity-plane" viewBox="0 0 720 540" preserveAspectRatio="none" aria-hidden="true">
      <defs><linearGradient id="pairs-felt" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#7fce54"/><stop offset=".42" stop-color="#4e9677"/><stop offset=".85" stop-color="#2f5c46"/></linearGradient></defs>
      <ellipse cx="360" cy="509" rx="320" ry="23" fill="#2f5c46" opacity=".22"/>
      <path d="M21 58Q21 25 57 25H663Q699 25 699 58V471Q699 516 663 519H57Q21 516 21 471Z" fill="#4a3620"/>
      <rect x="24" y="22" width="672" height="466" rx="35" fill="#a89478"/>
      <rect x="25" y="20" width="670" height="449" rx="35" fill="#e5dcc8"/>
      <path d="M57 23H663Q691 23 692 55V70Q684 41 658 41H62Q36 41 28 70V56Q28 23 57 23Z" fill="#fffaf0"/>
      <rect x="51" y="53" width="618" height="377" rx="29" fill="#2f5c46"/>
      <rect x="59" y="65" width="602" height="355" rx="24" fill="url(#pairs-felt)"/>
      <path d="M84 77H636M79 88V389M641 88V389" fill="none" stroke="#b7e779" stroke-width="2.4" opacity=".45" stroke-dasharray="5 10"/>
      <path d="M60 447Q227 455 305 447M416 447Q505 456 659 447" fill="none" stroke="#c9bda4" stroke-width="2.4"/>
    </svg>`;
  }

  function orchardTree(side) {
    return prop('orchard-tree '+side, `<ellipse cx="70" cy="364" rx="43" ry="10" fill="#2f5c46" opacity=".2"/>
      <path d="M49 78Q43 218 39 348L28 362Q66 371 94 358L82 346Q71 204 83 80Z" fill="#a89478"/>
      <path d="M53 79Q50 218 48 347L43 357L61 358Q58 200 68 80Z" fill="#e5dcc8"/>
      <path d="M79 78Q71 211 82 346L94 358L71 361Q68 207 72 78Z" fill="#4a3620" opacity=".5"/>
      <path d="M0 40Q-10 1 31 9Q63-16 89 9Q144-5 147 40Q182 62 146 84Q154 122 115 123Q95 150 63 129Q15 153 12 116Q-25 111-11 79Q-25 52 0 40Z" fill="#2f5c46"/>
      <path d="M0 33Q5 4 33 17Q66-4 90 18Q133 6 139 40Q168 67 137 82Q139 108 112 108Q82 131 60 111Q25 131 19 102Q-15 98-4 74Q-17 50 0 33Z" fill="#4e9677"/>
      <path d="M5 34Q19 15 35 25Q64 9 86 29Q114 16 131 37Q100 28 87 43Q63 22 37 43Q22 33 5 48Z" fill="#b7e779"/>
      <path d="M34 354Q14 349 9 330Q36 328 43 347M83 352Q97 330 118 338Q113 356 83 360" fill="#4e9677"/>`, '0 0 150 380');
  }

  function catchOrchard() {
    return `<svg class="activity-plane" viewBox="0 0 720 540" preserveAspectRatio="none" aria-hidden="true">
      <defs><linearGradient id="orchard-air" x1="0" y1="0" x2="0" y2="1"><stop stop-color="var(--orchard-air-top,#96ecff)"/><stop offset=".64" stop-color="var(--orchard-air-mid,#ccfbef)"/><stop offset="1" stop-color="var(--orchard-air-ground,#fffaf0)"/></linearGradient></defs>
      <path d="M0 0H720V540H0Z" fill="url(#orchard-air)"/>
      <path d="M0 65Q166 16 349 60Q547 92 720 38V0H0Z" fill="#4e9677" opacity=".28"/>
      <path d="M0 300Q168 270 349 313Q547 338 720 294V540H0Z" fill="#4e9677" opacity=".45"/>
      <path d="M0 400Q194 353 365 402Q545 443 720 378V540H0Z" fill="#4e9677" opacity=".35"/>
      <path d="M0 462Q214 419 387 461Q589 502 720 436V540H0Z" fill="#4e9677"/>
      <path d="M0 463Q200 422 370 463Q562 504 720 442V540H0Z" fill="#2f5c46"/>
      <path d="M18 482Q90 435 172 459Q341 439 520 459Q630 432 702 483L681 518Q356 542 40 518Z" fill="#4a3620"/>
      <path d="M18 465Q90 418 172 442Q341 422 520 442Q630 415 702 466L681 506Q356 529 40 506Z" fill="#e5dcc8"/>
      <path d="M36 467Q104 427 174 449Q337 431 519 449Q628 427 684 466Q565 446 515 460Q348 447 175 460Q100 441 36 467Z" fill="#fffaf0"/>
    </svg>${orchardTree('is-left')}${orchardTree('is-right')}`;
  }

  // Only large planes stretch. Props have their own viewBox and ground anchor.
  const prop = (name, body, view = '0 0 120 140') =>
    `<svg class="activity-prop is-${name}" viewBox="${view}" preserveAspectRatio="xMidYMax meet" aria-hidden="true">${body}</svg>`;
  function pencilPot() {
    return prop('pencils', `
      <ellipse cx="60" cy="130" rx="45" ry="7" fill="#4a3620" opacity=".12"/>
      <g stroke="#4a3620" stroke-width="2.4" stroke-linejoin="round">
        <path d="M34 90L20 21L24 8L33 18L46 87Z" fill="#ee806f"/><path d="M25 22L37 84" stroke="#ffa798"/>
        <path d="M54 87L53 12L59 2L65 12L66 88Z" fill="#f3c955"/><path d="M58 16V82" stroke="#ffe49a"/>
        <path d="M73 89L88 24L97 14L100 29L86 93Z" fill="#4e9677"/><path d="M93 29L80 84" stroke="#b7e779"/>
        <path d="M25 73Q59 64 95 73L87 121Q59 134 33 121Z" fill="#e5dcc8"/>
        <path d="M32 78L38 118Q58 125 80 119L85 77" fill="#fffaf0" stroke="none"/>
        <path d="M25 74Q60 83 95 74" fill="none" stroke="#a89478"/>
        <path d="M59 110V93M58 102Q43 105 45 92Q57 92 58 102M60 99Q74 102 76 88Q65 88 60 99" fill="#7fce54" stroke="#4e9677"/>
      </g>`);
  }
  function paperRoll() {
    return prop('paper', `<ellipse cx="63" cy="124" rx="48" ry="7" fill="#4a3620" opacity=".12"/>
      <path d="M25 34Q17 15 38 15H87Q100 16 101 30L91 111Q67 125 20 115L31 37Z" fill="#e5dcc8" stroke="#a89478" stroke-width="2.4"/>
      <path d="M38 17Q50 21 45 37L33 109Q61 119 86 108L97 32Q99 20 87 18Z" fill="#fffdf7"/>
      <path d="M25 34Q45 45 45 30Q45 20 37 22Q29 23 33 29" fill="none" stroke="#a89478" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M45 62L87 67L84 83L42 78Z" fill="#4e9677"/><path d="M48 67L82 71" stroke="#b7e779" stroke-width="2.4"/>`);
  }
  function workbench() {
    return `<svg class="activity-plane" viewBox="0 0 720 540" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 0H720V540H0Z" fill="#fffaf0"/>
      <path d="M0 0H720V91Q526 66 360 91Q183 113 0 88Z" fill="#ccfbef" opacity=".55"/>
      <path d="M0 0H720V30Q572 59 418 31Q231 3 0 43Z" fill="#b7e779" opacity=".35"/>
      <path d="M0 75Q178 105 359 81Q546 56 720 79V98Q531 76 356 101Q160 123 0 96Z" fill="#e5dcc8"/>
      <path d="M0 435Q349 414 720 435V540H0Z" fill="#c9bda4"/>
      <path d="M0 435Q353 419 720 435V495Q369 512 0 495Z" fill="#e5dcc8"/>
      <path d="M0 437Q348 424 720 437V447Q365 435 0 449Z" fill="#fffdf7"/>
      <path d="M0 499Q365 516 720 499V519Q347 537 0 519Z" fill="#a89478"/>
      <path d="M0 472Q143 463 217 471M525 477Q629 465 720 473" fill="none" stroke="#c9bda4" stroke-width="2.4"/>
    </svg>${pencilPot()}${paperRoll()}`;
  }
  function picnic() {
    return `<svg class="activity-plane" viewBox="0 0 720 540" preserveAspectRatio="none" aria-hidden="true">
      <ellipse cx="360" cy="487" rx="320" ry="33" fill="#2f5c46" opacity=".22"/>
      <path d="M94 186Q360 160 626 186L688 472Q360 524 32 472Z" fill="#2f5c46"/>
      <path d="M101 183Q360 164 619 183L678 450Q360 493 42 450Z" fill="#a89478"/>
      <path d="M114 194Q360 180 606 194L656 433Q360 470 64 433Z" fill="#a89478"/>
      <path d="M114 210Q360 196 606 210L649 400Q360 437 71 400Z" fill="#fffaf0"/>
      <path d="M145 204L105 422M219 196L194 434M291 190L282 442M366 190V444M441 192L449 441M512 198L535 434M579 206L619 422M106 246Q360 231 614 246M94 296Q360 282 626 296M84 348Q360 334 637 348M71 400Q360 389 649 400" fill="none" stroke="#4e9677" stroke-width="8" opacity=".64"/>
      <path d="M104 184Q360 166 616 184M56 451Q360 489 672 451" fill="none" stroke="#fffdf7" stroke-width="3"/>
      <path d="M90 192L43 444M630 194L676 444M52 457Q360 502 667 457" fill="none" stroke="#a89478" stroke-width="2.4" stroke-dasharray="4 8"/>
    </svg>${prop('picnic-flowers', `<ellipse cx="60" cy="131" rx="45" ry="7" fill="#2f5c46" opacity=".16"/>
      <path d="M43 125V62M78 128V88" fill="none" stroke="#4e9677" stroke-width="4"/>
      <path d="M44 106Q12 106 16 85Q38 85 44 106M78 115Q104 113 108 93Q85 95 78 115" fill="#4e9677"/>
      <path d="M44 68Q20 67 24 49Q10 26 31 25Q44 7 55 25Q80 24 69 46Q75 68 44 68Z" fill="#ffa798" stroke="#a89478" stroke-width="2.4"/>
      <circle cx="44" cy="43" r="10" fill="#f3c955"/><circle cx="42" cy="40" r="4" fill="#ffe49a"/>
      <path d="M78 96Q56 93 59 77Q73 65 84 74Q101 73 96 87Q91 98 78 96Z" fill="#ffe49a"/><circle cx="79" cy="83" r="6" fill="#c69434"/>`)}`;
  }

  function parade() {
    // The upright cabinet shares the joinery desk's warm timber. Only these
    // broad planes resize; paper doors and live teaching tiles keep their ratio.
    return `<svg class="activity-plane" viewBox="0 0 720 540" preserveAspectRatio="none" aria-hidden="true">
      <defs><linearGradient id="parade-lining" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#7fce54"/><stop offset=".4" stop-color="#4e9677"/><stop offset=".76" stop-color="#2f5c46"/></linearGradient></defs>
      <ellipse cx="360" cy="526" rx="310" ry="12" fill="#2f5c46" opacity=".16"/>
      <path d="M75 428H145L135 519Q111 532 86 519ZM575 428H645L634 519Q609 532 585 519Z" fill="#4a3620"/>
      <path d="M88 439H131L124 516L98 516ZM589 439H632L622 516L598 516Z" fill="#a89478"/>
      <path d="M30 56Q30 29 56 27Q360 4 664 27Q690 29 690 56V468Q688 497 664 500H56Q32 497 30 468Z" fill="#4a3620"/>
      <path d="M30 42Q30 19 56 17Q360 0 664 17Q690 19 690 42V455Q688 480 664 482H56Q32 480 30 455Z" fill="#c9bda4"/>
      <path d="M38 40Q38 25 58 24Q360 8 662 24Q682 25 682 40V443Q682 463 662 464H58Q38 463 38 443Z" fill="#e5dcc8"/>
      <path d="M42 29Q360 12 678 29V42Q360 26 42 42Z" fill="#fffaf0"/>
      <path d="M63 55Q360 43 657 55V425Q360 445 63 425Z" fill="#2f5c46"/>
      <path d="M73 63Q360 52 647 63V409Q360 428 73 409Z" fill="url(#parade-lining)"/>
      <path d="M75 63Q360 53 645 63V75Q360 63 75 75Z" fill="#b7e779" opacity=".48"/>
      <path d="M52 440Q360 457 668 440V456Q360 475 52 456Z" fill="#fffaf0"/>
      <path d="M52 457Q360 476 668 457V472Q360 491 52 472Z" fill="#a89478"/>
      <path d="M48 75L49 414M670 75L671 414M66 447Q160 456 237 453M479 453Q570 456 654 447" fill="none" stroke="#a89478" stroke-width="2.4"/>
    </svg>`;
  }

  function potting(){
    return `<svg class="activity-plane" viewBox="0 0 720 540" preserveAspectRatio="none" aria-hidden="true">
      <path d="M43 24Q360 2 677 24Q698 25 699 46L704 443Q704 463 683 466Q360 498 37 466Q16 463 17 443L23 46Q23 25 43 24Z" fill="#a89478"/>
      <path d="M39 14Q360 0 681 14Q701 14 702 34L713 422Q714 442 692 445Q362 478 28 445Q6 442 7 422L18 34Q18 14 39 14Z" fill="#c9bda4"/>
      <path d="M39 14Q360 0 681 14Q701 14 702 34L708 406Q709 426 688 429Q364 457 32 429Q11 426 12 406L18 34Q18 14 39 14Z" fill="#e5dcc8"/>
      <path d="M24 20Q361 4 696 20L697 37Q362 18 23 36Z" fill="#fffaf0"/>
      <path d="M38 443L42 505Q56 516 73 503L82 447M638 446L648 503Q662 516 677 504L682 441" fill="#a89478"/>
      <path d="M43 49L38 393M678 49L681 391M48 403Q157 418 250 413M492 412Q604 418 671 401" fill="none" stroke="#c9bda4" stroke-width="2.4"/>
    </svg>${prop('seedling', `<ellipse cx="61" cy="132" rx="48" ry="7" fill="#4a3620" opacity=".15"/>
      <path d="M30 89H93L87 126Q64 138 36 126Z" fill="#b0501f"/><path d="M31 90H90L86 117Q59 128 35 119Z" fill="#e8743c"/>
      <path d="M37 97L43 119" stroke="#ffa06e" stroke-width="6" stroke-linecap="round"/>
      <path d="M25 81Q59 73 97 81L96 98Q58 106 26 98Z" fill="#ffa06e" stroke="#a89478" stroke-width="2.4"/>
      <ellipse cx="61" cy="82" rx="31" ry="6" fill="#70501b"/>
      <path d="M61 84Q62 55 57 40" fill="none" stroke="#2f5c46" stroke-width="4"/>
      <g class="potting-leaves"><path d="M58 61Q24 66 19 30Q47 28 58 61M60 55Q57 21 96 18Q101 49 60 55Z" fill="#4e9677"/>
      <path d="M60 52Q64 25 91 22Q85 44 60 52M51 55Q26 49 23 35Q43 36 51 55Z" fill="#b7e779"/></g>`)}
      ${prop('scoop', `<ellipse cx="61" cy="132" rx="44" ry="7" fill="#4a3620" opacity=".14"/>
      <path d="M60 77L77 26Q82 9 96 17Q109 24 101 37L76 84Z" fill="#4e9677" stroke="#4a3620" stroke-width="3"/>
      <path d="M83 36L87 23Q92 18 97 24Q102 28 95 37Z" fill="#ccfbef"/>
      <path d="M61 72L79 80L69 118Q52 140 30 116L44 82Z" fill="#c9bda4" stroke="#a89478" stroke-width="2.4"/>
      <path d="M60 79L70 84L60 118Q43 121 39 113L49 86Z" fill="#fffdf7"/>
      <path d="M51 105L59 83" fill="none" stroke="#e5dcc8" stroke-width="3"/>`)}`;
  }

  function joinery(){
    // A sibling of the potting table: the apron overlaps the legs, while the
    // floor shadow and fixed-size writing tools share one ground line.
    return `<svg class="activity-plane" viewBox="0 0 720 540" preserveAspectRatio="none" aria-hidden="true">
      <ellipse cx="360" cy="526" rx="332" ry="12" fill="#2f5c46" opacity=".16"/>
      <path d="M85 396H139L129 520Q107 534 87 522ZM579 396H633L631 522Q611 534 589 520Z" fill="#4a3620"/>
      <path d="M91 404H131L124 517Q108 526 94 517ZM587 404H625L624 517Q609 526 595 517Z" fill="#a89478"/>
      <path d="M94 408H104L107 516L97 513ZM591 408H601L604 516L597 513Z" fill="#c9bda4"/>
      <path d="M23 48Q360 18 697 48L704 448Q706 474 683 480Q360 524 37 480Q14 474 16 448Z" fill="#4a3620"/>
      <path d="M18 35Q360 3 702 35L708 409Q710 435 687 441Q360 480 33 441Q10 435 12 409Z" fill="#a89478"/>
      <path d="M36 15Q360 0 684 15Q703 16 704 37L707 393Q709 415 687 420Q360 456 33 420Q11 415 13 393L16 37Q17 16 36 15Z" fill="#e5dcc8"/>
      <path d="M24 21Q360 6 697 21L698 35Q360 22 23 36Z" fill="#fffaf0"/>
      <path d="M35 55L33 377M683 55L686 377M48 397Q146 411 223 406M497 406Q584 411 673 397" fill="none" stroke="#a89478" stroke-width="2.4"/>
    </svg>${pencilPot()}${paperRoll()}`;
  }
  const DRAW = { pairs, catch: catchOrchard, workbench, joinery, parade, picnic, potting };

  function fixedProps(markup) {
    const bounds = { 'pairs-leaves':'0 30 720 90', 'orchard-fruit':'20 35 680 110', 'parade-hangers':'48 88 625 78' };
    const props=[];
    for (const [name,view] of Object.entries(bounds)) {
      const pattern=new RegExp('<g class="activity-'+name+'"[^>]*>[\\s\\S]*?</g>');
      markup=markup.replace(pattern,group=>{props.push(prop(name,group,view));return '';});
    }
    return markup+props.join('');
  }

  function scene(activity) {
    const family = FAMILY[activity];
    if (!family) return "";
    return `<div class="lg-activity-art is-${family}" data-activity-art="${activity}" aria-hidden="true">${fixedProps(DRAW[family]())}</div>`;
  }

  // Mini-games replace stage.innerHTML between rounds. Keep one quiet scenery
  // node at the back without asking every game to know about presentation art.
  function mount(stage, activity) {
    if (!stage || !FAMILY[activity]) return () => {};
    let stopped = false;
    const ensure = () => {
      if (stopped || !stage.isConnected || stage.querySelector(":scope > .lg-activity-art")) return;
      stage.insertAdjacentHTML("afterbegin", scene(activity));
    };
    ensure();
    const observer = new MutationObserver(ensure);
    observer.observe(stage, { childList: true });
    return () => {
      stopped = true;
      observer.disconnect();
    };
  }

  ns.LettersActivityArt = { familyFor: (activity) => FAMILY[activity] || null, scene, mount };
})(window.MiftahGame || (window.MiftahGame = {}));

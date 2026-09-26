// Quiet, activity-specific scenery for the Letter Garden playfield.
// Learning glyphs stay in MiniGames as live DOM; this module only supplies the
// paper-diorama surface underneath them.
(function (ns) {
  const FAMILY = {
    pairs: "pairs",
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
    return `
      <svg viewBox="0 0 720 540" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 54Q76 25 150 50V492Q76 520 0 486ZM720 54Q644 25 570 50V492Q644 520 720 486Z" fill="#b7e779" opacity=".44"/>
        <path d="M0 94Q73 66 126 82V462Q62 482 0 450ZM720 94Q647 66 594 82V462Q658 482 720 450Z" fill="#7fce54" opacity=".38"/>
        <path d="M0 142Q50 119 92 128V426Q44 443 0 415ZM720 142Q670 119 628 128V426Q676 443 720 415Z" fill="#4e9677" opacity=".3"/>
        ${shadow(38, 474, 46, 10)}${shadow(682, 474, 46, 10)}
        <g class="activity-pairs-leaves" fill="#7fce54">
          <path d="M19 97Q10 65 40 57Q58 82 19 97Z"/><path d="M67 73Q65 38 98 42Q108 72 67 73Z"/>
          <path d="M701 97Q710 65 680 57Q662 82 701 97Z"/><path d="M653 73Q655 38 622 42Q612 72 653 73Z"/>
        </g>
        <g fill="none" stroke="#b7e779" stroke-width="3" stroke-linecap="round" opacity=".8">
          <path d="M18 414Q58 390 89 409M631 409Q662 390 702 414"/>
        </g>
      </svg>`;
  }

  function catchOrchard() {
    return `
      <svg viewBox="0 0 720 540" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 0H720V112Q596 84 482 111Q353 140 236 108Q116 77 0 111Z" fill="#b7e779" opacity=".34"/>
        <path d="M0 0H720V76Q596 54 478 78Q352 104 239 75Q116 47 0 77Z" fill="#7fce54" opacity=".46"/>
        <path d="M0 0H720V38Q568 21 444 43Q306 66 188 39Q97 19 0 39Z" fill="#4e9677" opacity=".58"/>
        <path d="M0 486Q157 445 316 480Q477 514 720 468V540H0Z" fill="#b7e779" opacity=".54"/>
        <path d="M0 510Q168 478 333 507Q509 536 720 495V540H0Z" fill="#7fce54" opacity=".58"/>
        <path d="M0 530Q204 506 356 527Q529 550 720 517V540H0Z" fill="#4e9677" opacity=".42"/>
        <g class="activity-orchard-fruit">
          ${shadow(62, 116, 18, 4, ".12")}<path d="M45 84Q42 61 62 57Q81 62 78 84Q74 105 61 108Q48 105 45 84Z" fill="#ee806f"/><path d="M47 77Q58 65 76 76" fill="none" stroke="#ffa798" stroke-width="3" stroke-linecap="round"/><path d="M62 58Q64 47 73 42" fill="none" stroke="#4e9677" stroke-width="3" stroke-linecap="round"/>
          ${shadow(656, 128, 18, 4, ".12")}<path d="M639 96Q636 73 656 69Q675 74 672 96Q668 117 655 120Q642 117 639 96Z" fill="#f3c955"/><path d="M641 89Q652 77 670 88" fill="none" stroke="#ffe49a" stroke-width="3" stroke-linecap="round"/><path d="M656 70Q658 59 667 54" fill="none" stroke="#4e9677" stroke-width="3" stroke-linecap="round"/>
        </g>
        <g class="activity-orchard-grass" fill="#4e9677" opacity=".7">
          <path d="M12 509Q17 477 23 509Q31 471 35 510Q47 483 48 515Z"/><path d="M672 514Q679 477 684 512Q693 469 697 512Q708 485 710 517Z"/>
        </g>
      </svg>`;
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
      <path d="M0 399Q172 353 359 386Q532 413 720 364V540H0Z" fill="#b7e779" opacity=".45"/>
      <path d="M0 455Q146 413 327 446Q539 473 720 412V540H0Z" fill="#4e9677" opacity=".2"/>
      <ellipse cx="360" cy="306" rx="213" ry="42" fill="#fffaf0" opacity=".65"/>
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
      <ellipse cx="360" cy="526" rx="310" ry="12" fill="#2f5c46" opacity=".16"/>
      <path d="M75 428H145L135 519Q111 532 86 519ZM575 428H645L634 519Q609 532 585 519Z" fill="#4a3620"/>
      <path d="M88 439H131L124 516L98 516ZM589 439H632L622 516L598 516Z" fill="#a89478"/>
      <path d="M30 56Q30 29 56 27Q360 4 664 27Q690 29 690 56V468Q688 497 664 500H56Q32 497 30 468Z" fill="#a89478"/>
      <path d="M30 42Q30 19 56 17Q360 0 664 17Q690 19 690 42V455Q688 480 664 482H56Q32 480 30 455Z" fill="#c9bda4"/>
      <path d="M38 40Q38 25 58 24Q360 8 662 24Q682 25 682 40V443Q682 463 662 464H58Q38 463 38 443Z" fill="#e5dcc8"/>
      <path d="M42 29Q360 12 678 29V42Q360 26 42 42Z" fill="#fffaf0"/>
      <path d="M63 55Q360 43 657 55V425Q360 445 63 425Z" fill="#2f5c46"/>
      <path d="M73 63Q360 52 647 63V409Q360 428 73 409Z" fill="#4e9677"/>
      <path d="M75 63Q360 53 645 63V75Q360 63 75 75Z" fill="#b7e779" opacity=".48"/>
      <path d="M52 440Q360 457 668 440V456Q360 475 52 456Z" fill="#fffaf0"/>
      <path d="M52 457Q360 476 668 457V472Q360 491 52 472Z" fill="#a89478"/>
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
      <path d="M23 48Q360 18 697 48L704 429Q706 455 683 461Q360 504 37 461Q14 455 16 429Z" fill="#a89478"/>
      <path d="M18 35Q360 3 702 35L708 409Q710 435 687 441Q360 480 33 441Q10 435 12 409Z" fill="#c9bda4"/>
      <path d="M36 15Q360 0 684 15Q703 16 704 37L707 393Q709 415 687 420Q360 456 33 420Q11 415 13 393L16 37Q17 16 36 15Z" fill="#e5dcc8"/>
      <path d="M24 21Q360 6 697 21L698 35Q360 22 23 36Z" fill="#fffaf0"/>
      <path d="M35 55L33 377M683 55L686 377M48 397Q146 411 223 406M497 406Q584 411 673 397" fill="none" stroke="#c9bda4" stroke-width="2.4"/>
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

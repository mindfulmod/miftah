// Quiet, activity-specific scenery for the Letter Garden playfield.
// Learning glyphs stay in MiniGames as live DOM; this module only supplies the
// paper-diorama surface underneath them.
(function (ns) {
  const FAMILY = {
    pairs: "pairs",
    feed: "picnic",
    catch: "catch",
    build: "workbench",
    blend: "workbench",
    fuse: "workbench",
    unfuse: "workbench",
    chain: "workbench",
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
    return `
      <svg viewBox="0 0 720 540" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 0H720V540H0Z" fill="#fffaf0" opacity=".48"/>
        <path d="M0 0H720V64Q546 46 357 66Q169 87 0 62Z" fill="#ffe49a" opacity=".38"/>
        <path d="M0 36Q170 62 355 42Q541 22 720 40V75Q543 57 363 76Q174 96 0 72Z" fill="#f3c955" opacity=".25"/>
        <path d="M34 92H686" fill="none" stroke="#4a3620" stroke-width="6" stroke-linecap="round"/>
        <path d="M49 92V438M671 92V438" fill="none" stroke="#a89478" stroke-width="6" stroke-linecap="round"/>
        <g class="activity-parade-hangers" fill="none" stroke="#a89478" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <path d="M82 92V121Q82 130 91 130Q100 130 100 121Q100 112 91 112M91 130L62 155H120Z"/>
          <path d="M638 92V121Q638 130 629 130Q620 130 620 121Q620 112 629 112M629 130L600 155H658Z"/>
        </g>
        ${shadow(360, 500, 258, 14)}
        <path d="M112 451Q360 430 608 451V502Q360 522 112 502Z" fill="#c9bda4" stroke="#4a3620" stroke-width="3"/>
        <path d="M117 450Q360 432 603 451V472Q360 488 117 471Z" fill="#e5dcc8"/>
        <path d="M145 499V528M575 499V528" fill="none" stroke="#4a3620" stroke-width="6" stroke-linecap="round"/>
        <path d="M157 492Q360 506 563 492" fill="none" stroke="#fffdf7" stroke-width="3" stroke-linecap="round" opacity=".72"/>
      </svg>`;
  }

  const DRAW = { pairs, catch: catchOrchard, workbench, parade, picnic };

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

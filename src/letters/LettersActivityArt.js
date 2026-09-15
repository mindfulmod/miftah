// Quiet, activity-specific scenery for the Letter Garden playfield.
// Learning glyphs stay in MiniGames as live DOM; this module only supplies the
// paper-diorama surface underneath them.
(function (ns) {
  const FAMILY = {
    pairs: "pairs",
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

  function workbench() {
    return `
      <svg viewBox="0 0 720 540" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 0H720V142Q561 126 409 145Q208 170 0 140Z" fill="#fffdf7" opacity=".66"/>
        <path d="M0 94Q182 122 371 99Q551 77 720 102V151Q552 126 391 148Q194 175 0 145Z" fill="#e5dcc8" opacity=".5"/>
        <path d="M0 444Q172 423 344 448Q531 475 720 437V540H0Z" fill="#c9bda4"/>
        <path d="M0 466Q181 442 352 469Q539 495 720 459V540H0Z" fill="#e5dcc8"/>
        <path d="M0 506Q177 482 366 505Q544 527 720 494V540H0Z" fill="#c9bda4" opacity=".72"/>
        <path d="M0 445Q178 422 349 448Q535 475 720 438" fill="none" stroke="#4a3620" stroke-width="3" opacity=".38"/>
        <g class="activity-workbench-tools" stroke="#4a3620" stroke-linejoin="round">
          ${shadow(66, 426, 49, 8, ".13")}
          <path d="M27 413L71 365L91 385L52 425Z" fill="#f3c955" stroke-width="3"/><path d="M72 365L83 350L106 373L91 385Z" fill="#e5dcc8" stroke-width="3"/><path d="M34 408L58 421" fill="none" stroke="#ffe49a" stroke-width="3" stroke-linecap="round"/>
          ${shadow(657, 427, 45, 8, ".13")}
          <path d="M620 421L645 354L665 361L650 426Z" fill="#ee806f" stroke-width="3"/><path d="M645 354L659 337L674 342L665 361Z" fill="#e5dcc8" stroke-width="3"/><path d="M676 422L687 371" fill="none" stroke-width="6" stroke-linecap="round"/><path d="M673 378L691 382" fill="none" stroke="#ffa06e" stroke-width="6" stroke-linecap="round"/>
        </g>
        <g fill="#a89478" opacity=".42">
          <circle cx="58" cy="52" r="4"/><circle cx="104" cy="52" r="4"/><circle cx="616" cy="52" r="4"/><circle cx="662" cy="52" r="4"/>
        </g>
      </svg>`;
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

  const DRAW = { pairs, catch: catchOrchard, workbench, parade };

  function scene(activity) {
    const family = FAMILY[activity];
    if (!family) return "";
    return `<div class="lg-activity-art is-${family}" data-activity-art="${activity}" aria-hidden="true">${DRAW[family]()}</div>`;
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

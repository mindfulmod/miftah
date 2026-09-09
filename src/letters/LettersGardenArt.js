// The Boat chapter's paper riverbank. All progress is derived from the live
// bests/completion records; this art owns no storage or learning state.
(function (ns) {
  let serial = 0;
  function growth(progress, bests) {
    if (progress.done.includes('pack-boat')) return 3;
    return ['pop', 'trace', 'feed'].filter(game => (bests[`pack-boat:${game}`] || 0) > 0).length;
  }
  function chapterGrowth(progress, bests, world) {
    if(!world)return 0;
    if((progress.done || []).includes(world.id))return 3;
    return Math.min(3,[...new Set(world.games || [])].filter(game=>(bests[`${world.id}:${game}`] || 0)>0).length);
  }
  function habitatReward({biome='meadow',stage=0,habitat=''}={}) {
    const flowers=flowerBed({size:100,count:stage});
    return `<svg class="garden-habitat-reward" viewBox="0 0 260 200" aria-hidden="true">
      <ellipse cx="130" cy="177" rx="107" ry="12" fill="#4e7156" opacity=".18"/>
      <path d="M23 146Q118 122 237 148L218 171Q130 192 43 169Z" fill="#b4cf8c"/>
      <path d="M24 149Q124 174 234 151L218 172Q127 192 43 170Z" fill="#86a76d"/>
      <path d="M38 147Q125 129 222 148" fill="none" stroke="#d1e3ab" stroke-width="4" stroke-linecap="round"/>
      ${biome==='meadow'||!habitat?`<svg x="40" y="25" width="180" height="144" viewBox="0 0 100 80">${flowerBed({size:100,count:stage})}</svg>`:
        `<svg x="28" y="5" width="190" height="143" viewBox="0 0 64 48">${habitat.replace('<svg ','<svg width="64" height="48" ')}</svg><svg x="139" y="103" width="90" height="72" viewBox="0 0 100 80">${flowers}</svg>`}
    </svg>`;
  }
  function boat({ stage = 0 } = {}) {
    const id = `garden-boat-${serial++}`;
    const flowers = [[55, 130, .86], [166, 139, 1.1], [205, 124, .72]];
    return `<svg class="garden-boat" viewBox="0 0 260 200" aria-hidden="true">
      <defs><linearGradient id="${id}" x2="0" y2="1"><stop stop-color="#fffdf7"/><stop offset=".55" stop-color="#fffaf0"/><stop offset="1" stop-color="#e5dcc8"/></linearGradient></defs>
      <ellipse cx="130" cy="174" rx="110" ry="15" fill="#4e9677" opacity=".22"/>
      <path d="M24 147Q130 119 236 147L220 165Q128 185 40 165Z" fill="#b7e779"/>
      <path d="M30 152Q126 173 231 151L220 166Q128 185 40 165Z" fill="#4e9677" opacity=".45"/>
      <g stroke="#4a3620" stroke-width="3" stroke-linejoin="round">
        <path d="M62 110L178 107L153 147L90 146Z" fill="url(#${id})"/>
        <path d="M62 110L111 122L153 147L90 146Z" fill="#e5dcc8"/>
        <path d="M111 122L131 46L131 109L178 107Z" fill="#fffdf7"/>
        <path d="M131 46L75 108L111 122Z" fill="#fffaf0"/>
        <path d="M131 46V109L111 122" fill="none"/>
        <path d="M127 60L83 107L108 117" fill="none" stroke="#fffdf7" stroke-width="3" stroke-linecap="round"/>
        <path d="M69 115L93 141L140 142L108 124Z" fill="#d4c7ad" stroke="none"/>
        <path d="M76 120L96 139L125 139" fill="none" stroke="#f8f0dc" stroke-width="2" stroke-linecap="round"/>
        <path d="M135 112L166 112L153 133Z" fill="#eae0c9" stroke="none"/>
      </g>
      ${flowers.map(([x,y,scale],i)=>`<g class="garden-flower ${i < stage ? 'is-grown' : ''}" transform="translate(${x} ${y}) scale(${scale})">
        <ellipse cy="28" rx="17" ry="5" fill="#2f5c46" opacity=".18"/>
        <path d="M0 27V${i < stage ? '-4' : '15'}" stroke="#4e9677" stroke-width="3" stroke-linecap="round"/>
        <path d="M0 23Q-18 25-15 12Q-3 10 0 23M0 21Q15 21 14 8Q2 8 0 21" fill="#7fce54"/>
        ${i < stage ? `<g class="garden-petals">
          ${[0,72,144,216,288].map(a=>`<ellipse cy="-8" rx="5.4" ry="9" transform="rotate(${a})" fill="${['#ed8ca6','#f3ce63','#b19bd5'][i]}" stroke="#725a39" stroke-width="1.4"/>`).join('')}
          <circle r="5" fill="#fff0b5" stroke="#947446" stroke-width="1.2"/><circle cx="-1.5" cy="-2" r="1.4" fill="#fffaf0"/></g>` : ''}
      </g>`).join('')}
    </svg>`;
  }
  function backdrop(stage) {
    return `<div class="garden-scenery" aria-hidden="true">
      <svg class="garden-land" viewBox="0 0 1200 900" preserveAspectRatio="none">
        <path d="M0 550Q230 425 480 565T1200 490V900H0Z" fill="#b7e779" opacity=".24"/>
        <path d="M0 688Q240 590 560 658T1200 616V900H0Z" fill="#b7e779"/>
        <path d="M0 740Q250 650 570 721T1200 664V900H0Z" fill="#7fce54" opacity=".32"/>
        <path d="M1200 700Q640 688 722 803Q745 850 370 900H1200Z" fill="#e5dcc8"/>
        <path d="M1200 719Q700 705 763 811Q798 853 505 900H1200Z" fill="#96ecff"/>
        <path d="M1200 749Q785 715 810 815Q840 851 674 900H1200Z" fill="#62cdf4" opacity=".45"/>
        <path d="M936 779Q1030 763 1135 780M880 842Q1010 822 1170 846" fill="none" stroke="#ccfbef" stroke-width="4" stroke-linecap="round"/>
        <path d="M0 850Q180 783 440 851L630 900H0Z" fill="#4e9677" opacity=".34"/>
      </svg>
      <div class="garden-shore-boat">${boat({stage})}</div>
      <svg class="garden-reeds" viewBox="0 0 140 180">
        <ellipse cx="72" cy="165" rx="62" ry="11" fill="#2f5c46" opacity=".16"/>
        <g fill="none" stroke="#4e9677" stroke-width="6" stroke-linecap="round"><path d="M55 160L40 40M77 160L84 22M97 160L116 58"/></g>
        <g fill="#c9bda4"><rect x="31" y="22" width="15" height="43" rx="7" transform="rotate(-7 40 40)"/><rect x="78" y="8" width="15" height="43" rx="7"/><rect x="110" y="39" width="15" height="43" rx="7" transform="rotate(8 116 58)"/></g>
        <path d="M70 158Q-2 133 10 95Q48 107 70 158M82 159Q90 103 134 100Q142 139 82 159" fill="#4e9677"/>
        <path d="M70 158Q19 121 10 95M82 159Q113 116 134 100" fill="none" stroke="#b7e779" stroke-width="3"/>
      </svg>
    </div>`;
  }
  // Each menu picture shows the actual action, for children who cannot read.
  function practicePicture(kind, {petArt = ""} = {}) {
    const common = `<ellipse cx="100" cy="118" rx="83" ry="12" fill="#b7e779"/><ellipse cx="100" cy="123" rx="69" ry="6" fill="#4e9677" opacity=".2"/>`;
    const basket = `<path d="M102 80H177L167 116H112Z" fill="#d9a75c" stroke="#4a3620" stroke-width="3"/><path d="M107 91H173M110 103H169M126 81L129 114M151 81L148 114" stroke="#aa763c" stroke-width="2"/>`;
    let scene;
    if(kind==='Feed')scene=`${petArt ? '' : `<circle cx="54" cy="65" r="35" fill="#73b9dc" stroke="#4a3620" stroke-width="3"/><path d="M52 30Q39 12 48 9Q61 12 54 29" fill="#4e9677"/><g fill="#fffdf7" stroke="#4a3620" stroke-width="2"><ellipse cx="43" cy="59" rx="10" ry="13"/><ellipse cx="67" cy="59" rx="10" ry="13"/></g><g fill="#4a3620"><circle cx="47" cy="61" r="5"/><circle cx="70" cy="61" r="5"/></g><path d="M45 80Q56 94 69 79Z" fill="#4a3620"/>`}${basket}<rect x="121" y="34" width="34" height="39" rx="9" fill="#fffdf7" stroke="#4a3620" stroke-width="2"/><path d="M138 43V61" stroke="#4a3620" stroke-width="5" stroke-linecap="round"/><path d="M162 46Q181 53 169 72L176 68M169 72L166 64" fill="none" stroke="#4e9677" stroke-width="3" stroke-linecap="round"/>`;
    else if(kind==='Workshop')scene=`<path d="M26 101H174V114H26Z" fill="#bb9763" stroke="#826b48" stroke-width="2"/><rect x="42" y="17" width="116" height="51" rx="13" fill="#fff8e7" stroke="#947a52" stroke-width="3"/><path d="M58 31H86V54H58ZM99 31H142V54H99Z" fill="#e6d8b8" stroke="#b99e70" stroke-width="2" stroke-dasharray="3 4"/><g fill="#fff8e7" stroke="#947a52" stroke-width="2.5"><rect x="35" y="77" width="46" height="39" rx="9" transform="rotate(-8 58 96)"/><rect x="110" y="76" width="52" height="39" rx="9" transform="rotate(7 136 95)"/></g><path d="M57 87V103M125 91Q121 101 136 101Q149 101 146 91" fill="none" stroke="#4a3620" stroke-width="4" stroke-linecap="round"/><circle cx="136" cy="107" r="2.5" fill="#4a3620"/><path d="M86 87Q101 80 103 64L98 69M103 64L108 70" fill="none" stroke="#719b77" stroke-width="3" stroke-linecap="round"/>`;
    else if(kind==='DotGarden')scene=`<rect x="34" y="23" width="129" height="85" rx="22" fill="#fffdf7" stroke="#4a3620" stroke-width="3"/><path d="M60 56Q51 83 97 82Q146 82 139 56" fill="none" stroke="#4a3620" stroke-width="8" stroke-linecap="round"/><circle cx="99" cy="96" r="6" fill="#c9bda4"/><circle cx="167" cy="109" r="10" fill="#e8743c" stroke="#4a3620" stroke-width="2"/><path d="M151 114Q126 123 111 104L113 113M111 104L120 105" fill="none" stroke="#4e9677" stroke-width="3" stroke-linecap="round"/>`;
    else scene=`<rect x="30" y="21" width="138" height="92" rx="22" fill="#fffdf7" stroke="#4a3620" stroke-width="3"/><path d="M61 47Q52 84 103 82Q145 82 141 50" fill="none" stroke="#c9bda4" stroke-width="8" stroke-linecap="round" stroke-dasharray="2 12"/><path d="M61 47Q52 84 100 82" fill="none" stroke="#4e9677" stroke-width="8" stroke-linecap="round"/><circle cx="102" cy="98" r="5" fill="#4e9677"/><g transform="translate(114 72) rotate(35)"><path d="M-7 -47H7V0L0 15L-7 0Z" fill="#f3c955" stroke="#4a3620" stroke-width="2.5"/><path d="M-7 0H7L0 15Z" fill="#e5dcc8"/><path d="M-3 9L0 15L3 9" fill="#4a3620"/><path d="M-3 -41V-5" stroke="#fff8db" stroke-width="3"/></g>`;
    const picture = `<svg class="practice-picture" viewBox="0 0 200 140" aria-hidden="true">${common}${scene}</svg>`;
    return kind === "Feed" && petArt ? `<span class="practice-friend-picture" aria-hidden="true">${picture}<span class="practice-friend">${petArt}</span></span>` : picture;
  }
  // Placement belongs to the wrapper; the petals have their own motion layer.
  function flowerBed({size=90,count=3}={}) {
    const flowers=[[24,33,.72,'#ed8ca6'],[48,23,1,'#f3ce63'],[74,38,.68,'#b19bd5']];
    return `<svg class="garden-flower-bed" viewBox="0 0 100 80" width="${size}" height="${size*.8}" aria-hidden="true">
      <ellipse cx="50" cy="71" rx="43" ry="6" fill="#315942" opacity=".16"/>
      <path d="M8 65Q24 54 47 60Q77 51 93 65Q83 75 48 73Q18 76 8 65Z" fill="#9bc977"/>
      <path d="M12 64Q31 57 48 63Q70 55 89 65" fill="none" stroke="#c6e6a5" stroke-width="3" stroke-linecap="round"/>
      ${flowers.slice(0,Math.max(0,Math.min(3,count))).map(([x,y,k,c])=>`<g transform="translate(${x} ${y}) scale(${k})">
        <path d="M0 39Q3 19 0 0" fill="none" stroke="#537a46" stroke-width="4" stroke-linecap="round"/>
        <path d="M1 28Q-15 29 -14 15Q-3 16 1 28M2 20Q15 21 17 8Q6 10 2 20" fill="#719c56"/>
        <path d="M-10 20L0 27M12 13L2 20" stroke="#a7c883" stroke-width="1.3" stroke-linecap="round"/>
        <g class="garden-flower-head">${[0,72,144,216,288].map(a=>`<ellipse cy="-8" rx="5.4" ry="9" transform="rotate(${a})" fill="${c}" stroke="#725a39" stroke-width="1.4"/>`).join('')}
        <circle r="5" fill="#fff0b5" stroke="#947446" stroke-width="1.2"/><circle cx="-1.5" cy="-2" r="1.4" fill="#fffaf0"/></g>
      </g>`).join('')}
    </svg>`;
  }
  function pond() {
    return `<svg class="garden-pond-detail" viewBox="0 0 600 420" preserveAspectRatio="none" aria-hidden="true">
      <g fill="none" stroke="#f5fff7" stroke-width="3" stroke-linecap="round" opacity=".75">
        <path d="M30 83Q51 78 72 82M517 102Q540 96 564 102M28 328Q49 323 70 328M516 365Q539 358 568 363"/>
      </g>
      <g fill="#fffdf1" opacity=".46"><ellipse cx="34" cy="345" rx="8" ry="2"/><ellipse cx="555" cy="122" rx="7" ry="2"/></g>
    </svg>`;
  }
  // Shared seed-picnic prop; the dark opening remains visible above the weave.
  function seedBasket() {
    return `<svg viewBox="0 0 180 112" aria-hidden="true">
      <ellipse cx="90" cy="103" rx="72" ry="7" fill="#4a3620" opacity=".13"/>
      <path d="M42 53C39 3 139 3 138 53" fill="none" stroke="#59452e" stroke-width="12"/>
      <path d="M42 51C42 11 136 11 138 51" fill="none" stroke="#e4be77" stroke-width="5"/>
      <ellipse cx="90" cy="52" rx="74" ry="17" fill="#78563b" stroke="#59452e" stroke-width="4"/>
      <path d="M18 53L30 91Q90 110 150 91L162 53Q90 76 18 53Z" fill="#dab477" stroke="#59452e" stroke-width="4" stroke-linejoin="round"/>
      <g fill="none" stroke="#ad804b" stroke-width="3"><path d="M25 68Q90 88 155 68M28 81Q90 101 152 81M46 63L51 98M74 68L76 102M105 68L103 102M134 63L129 98"/></g>
      <path d="M20 52Q90 76 160 52" fill="none" stroke="#f4d79c" stroke-width="7" stroke-linecap="round"/>
      <path d="M85 83Q65 67 64 81Q65 94 87 92Q104 69 115 79Q113 93 91 94" fill="#80a46a" stroke="#526c45" stroke-width="2"/>
    </svg>`;
  }
  ns.LettersGardenArt = { growth, chapterGrowth, habitatReward, boat, backdrop, practicePicture, flowerBed, pond, seedBasket };
})(window.MiftahGame || (window.MiftahGame = {}));

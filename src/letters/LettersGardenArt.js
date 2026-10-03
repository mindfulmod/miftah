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
  // A chapter with no growth yet still has something planted: three seedlings
  // in dark soil, so the first reward is never a bare planter.
  function seedlings() {
    return `<g class="garden-seedlings">${[[84,150],[130,146],[176,150]].map(([x,y])=>`<ellipse cx="${x}" cy="${y}" rx="17" ry="6" fill="#70501b"/><path d="M${x} ${y-2}Q${x+2} ${y-12} ${x} ${y-20}" fill="none" stroke="#4e9677" stroke-width="3" stroke-linecap="round"/><path d="M${x} ${y-12}Q${x-12} ${y-12} ${x-12} ${y-22}Q${x-2} ${y-21} ${x} ${y-12}M${x} ${y-16}Q${x+11} ${y-17} ${x+12} ${y-27}Q${x+2} ${y-26} ${x} ${y-16}" fill="#7fce54" stroke="#4e9677" stroke-width="1.6"/>`).join('')}</g>`;
  }
  function habitatReward({biome='meadow',stage=0,habitat='',terrain=true}={}) {
    const flowers=flowerBed({size:100,count:stage,terrain});
    return `<svg class="garden-habitat-reward" viewBox="0 0 260 200" aria-hidden="true">
      ${terrain ? `<ellipse cx="130" cy="177" rx="107" ry="12" fill="#2f5c46" opacity=".18"/>
      <path d="M23 146Q118 122 237 148L218 171Q130 192 43 169Z" fill="#b7e779"/>
      <path d="M24 149Q124 174 234 151L218 172Q127 192 43 170Z" fill="#4e9677"/>
      <path d="M38 147Q125 129 222 148" fill="none" stroke="#e5dcc8" stroke-width="4" stroke-linecap="round"/>` : ''}
      ${!stage ? seedlings() : ''}
      ${biome==='meadow'||!habitat?`<svg x="40" y="25" width="180" height="144" viewBox="0 0 100 80">${flowers}</svg>`:
        `<svg x="28" y="5" width="190" height="143" viewBox="0 0 64 48">${habitat.replace('<svg ','<svg width="64" height="48" ')}</svg><svg x="139" y="103" width="90" height="72" viewBox="0 0 100 80">${flowers}</svg>`}
    </svg>`;
  }
  function boat({ stage = 0, terrain = true } = {}) {
    const id = `garden-boat-${serial++}`;
    const flowers = [[55, 130, .86], [166, 139, 1.1], [205, 124, .72]];
    return `<svg class="garden-boat" viewBox="0 0 260 200" aria-hidden="true">
      <defs><linearGradient id="${id}" x2="0" y2="1"><stop stop-color="#fffdf7"/><stop offset=".55" stop-color="#fffaf0"/><stop offset="1" stop-color="#e5dcc8"/></linearGradient></defs>
      ${terrain ? `<ellipse cx="130" cy="174" rx="110" ry="15" fill="#4e9677" opacity=".22"/>
      <path d="M24 147Q130 119 236 147L220 165Q128 185 40 165Z" fill="#b7e779"/>
      <path d="M30 152Q126 173 231 151L220 166Q128 185 40 165Z" fill="#4e9677" opacity=".45"/>` : '<ellipse cx="130" cy="160" rx="86" ry="11" fill="#2f5c46" opacity=".13"/>'}
      <g stroke="#4a3620" stroke-width="3" stroke-linejoin="round">
        <path d="M62 110L178 107L153 147L90 146Z" fill="url(#${id})"/>
        <path d="M62 110L111 122L153 147L90 146Z" fill="#e5dcc8"/>
        <path d="M111 122L131 46L131 109L178 107Z" fill="#fffdf7"/>
        <path d="M131 46L75 108L111 122Z" fill="#fffaf0"/>
        <path d="M131 46V109L111 122" fill="none"/>
        <path d="M127 60L83 107L108 117" fill="none" stroke="#fffdf7" stroke-width="3" stroke-linecap="round"/>
        <path d="M69 115L93 141L140 142L108 124Z" fill="#c9bda4" stroke="none"/>
        <path d="M76 120L96 139L125 139" fill="none" stroke="#fffaf0" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M135 112L166 112L153 133Z" fill="#e5dcc8" stroke="none"/>
      </g>
      ${flowers.map(([x,y,scale],i)=>`<g class="garden-flower ${i < stage ? 'is-grown' : ''}" transform="translate(${x} ${y}) scale(${scale})">
        <ellipse cy="28" rx="17" ry="5" fill="#2f5c46" opacity=".18"/>
        <path d="M0 27V${i < stage ? '-4' : '15'}" stroke="#4e9677" stroke-width="3" stroke-linecap="round"/>
        <path d="M0 23Q-18 25-15 12Q-3 10 0 23M0 21Q15 21 14 8Q2 8 0 21" fill="#7fce54"/>
        ${i < stage ? `<g class="garden-petals">
          ${[0,72,144,216,288].map(a=>`<ellipse cy="-8" rx="5.4" ry="9" transform="rotate(${a})" fill="${['#ffa798','#f3c955','#b49fcf'][i]}" stroke="#70501b" stroke-width="1.6"/>`).join('')}
          <circle r="5" fill="#ffe49a" stroke="#a89478" stroke-width="1.6"/><circle cx="-1.5" cy="-2" r="1.4" fill="#fffaf0"/></g>` : ''}
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
        <path d="M0 820Q160 752 446 834Q561 866 700 900H0Z" fill="#2f5c46"/>
        <path d="M0 818Q178 757 444 831Q529 853 613 880Q365 825 190 841Q73 850 0 864Z" fill="#4e9677"/>
        <path d="M0 816Q151 765 319 800Q155 785 41 833Z" fill="#b7e779"/>
      </svg>
      <svg class="garden-life" viewBox="0 0 800 600" preserveAspectRatio="xMidYMax slice" aria-hidden="true">${(()=>{const A=ns.LettersArt,night=A?.dayPhase?.()==='night';return A?.landLife?A.landLife('meadow',night,night?'#4a4d84':'#a89478'):'';})()}</svg>
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
    const basket = `<path d="M102 80H177L167 116H112Z" fill="#c69434" stroke="#4a3620" stroke-width="3"/><path d="M107 91H173M110 103H169M126 81L129 114M151 81L148 114" stroke="#c69434" stroke-width="2.4"/>`;
    let scene;
    if(kind==='Feed')scene=`${petArt ? '' : `<circle cx="54" cy="65" r="35" fill="#62cdf4" stroke="#4a3620" stroke-width="3"/><path d="M52 30Q39 12 48 9Q61 12 54 29" fill="#4e9677"/><g fill="#fffdf7" stroke="#4a3620" stroke-width="2.4"><ellipse cx="43" cy="59" rx="10" ry="13"/><ellipse cx="67" cy="59" rx="10" ry="13"/></g><g fill="#4a3620"><circle cx="47" cy="61" r="5"/><circle cx="70" cy="61" r="5"/></g><path d="M45 80Q56 94 69 79Z" fill="#4a3620"/>`}${basket}<rect x="121" y="34" width="34" height="39" rx="9" fill="#fffdf7" stroke="#4a3620" stroke-width="2.4"/><path d="M138 43V61" stroke="#4a3620" stroke-width="4" stroke-linecap="round"/><path d="M162 46Q181 53 169 72L176 68M169 72L166 64" fill="none" stroke="#4e9677" stroke-width="3" stroke-linecap="round"/>`;
    else if(kind==='Burst')scene=`<circle cx="100" cy="60" r="43" fill="#fffaf0" stroke="#4a3620" stroke-width="3"/><path d="M100 18A42 42 0 0 1 142 60" fill="none" stroke="#f3c955" stroke-width="8"/><path d="M100 35V60L121 72" fill="none" stroke="#4a3620" stroke-width="4" stroke-linecap="round"/><path d="M92 9H108M100 9V17" fill="none" stroke="#4a3620" stroke-width="3"/><rect x="131" y="76" width="37" height="40" rx="10" fill="#fffaf0" stroke="#4a3620" stroke-width="3"/><path d="M150 85V105" stroke="#4a3620" stroke-width="4" stroke-linecap="round"/><path d="M41 82L62 98 41 114Z" fill="#4e9677"/>`;
    else if(kind==='LivingBooks'){
      const F=ns.LetterFriends, at=(c,x,y,sz)=>(F?.art(c,{size:sz})||'').replace('<svg ',`<svg x="${x}" y="${y}" `);
      scene=`${[[30,'#ee806f'],[66,'#62cdf4'],[102,'#7fce54'],[138,'#f3c955']].map(([x,c],i)=>`<rect x="${x}" y="${18+i%2*6}" width="32" height="${88-i%2*6}" rx="5" fill="${c}" stroke="#4a3620" stroke-width="3"/>`).join('')}${at('د',34,40,30)}${at('ب',106,44,30)}<path d="M20 108H180" stroke="#70501b" stroke-width="6" stroke-linecap="round"/>`;
    }
    else if(kind==='BuildLetter')scene=`<rect x="60" y="12" width="80" height="80" rx="14" fill="#fffdf7" stroke="#4a3620" stroke-width="3"/><path d="M124 46Q126 70 106 72H94Q74 70 76 46" fill="none" stroke="#4a3620" stroke-width="8" stroke-linecap="round"/><circle cx="92" cy="30" r="5" fill="none" stroke="#c9bda4" stroke-width="2.4" stroke-dasharray="2 2"/><circle cx="108" cy="30" r="5" fill="none" stroke="#c9bda4" stroke-width="2.4" stroke-dasharray="2 2"/><rect x="152" y="70" width="34" height="34" rx="8" fill="#ffe49a" stroke="#4a3620" stroke-width="2.4"/><circle cx="163" cy="84" r="4" fill="#4a3620"/><circle cx="175" cy="84" r="4" fill="#4a3620"/>`;
    else if(kind==='FillGap'){
      const pic=(ns.LettersArt?.stickerMotif?.('egg',56)||'').replace('<svg ','<svg x="72" y="6" ');
      scene=`${pic}<text x="118" y="96" text-anchor="end" font-family="'Amiri Quran', serif" font-size="30" fill="#4a3620">يْضَة</text><rect x="122" y="70" width="32" height="34" rx="8" fill="#ccfbef" stroke="#62cdf4" stroke-width="3" stroke-dasharray="4 3"/>`;
    }
    else if(kind==='HatShop'){
      // Vowel Hats (v33): Batta in her snail cap, a feather and a board on the shelf.
      const V=ns.VowelGames;
      scene=`${(V?.wearing('ب','ُ',86)||'').replace('<svg ','<svg x="16" y="16" ')}<path d="M112 70H184" stroke="#70501b" stroke-width="6" stroke-linecap="round"/>${(V?.accessory('َ',40)||'').replace('<svg ','<svg x="116" y="40" ')}${(V?.accessory('ِ',40)||'').replace('<svg ','<svg x="146" y="78" ')}`;
    }
    else if(kind==='LanternHunt')scene=`<rect x="24" y="12" width="152" height="100" rx="18" fill="#34375f" stroke="#4a3620" stroke-width="3"/><circle cx="92" cy="62" r="34" fill="#4a4d84"/><circle cx="92" cy="66" r="14" fill="#fffdf7" stroke="#a89478" stroke-width="2.4"/><path d="M86 70Q92 76 98 70" fill="none" stroke="#4a3620" stroke-width="3" stroke-linecap="round"/><circle cx="92" cy="60" r="2.4" fill="#4a3620"/><path d="M118 30H134L136 36H116Z" fill="#c69434" stroke="#4a3620" stroke-width="2.4"/><path d="M117 36H135V56H117Z" fill="#ffe49a" stroke="#4a3620" stroke-width="2.4"/>${[[44,30],[150,90],[52,96]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="2.4" fill="#ffe49a"/>`).join('')}`;
    else if(kind==='LetterShadows'){
      const F=ns.LetterFriends;
      scene=`<rect x="30" y="12" width="140" height="96" rx="16" fill="#ffa06e" stroke="#8a3a2d" stroke-width="4"/><ellipse cx="100" cy="58" rx="56" ry="38" fill="#ffe49a"/><g style="filter:brightness(0) opacity(.75)">${(F?.art('د',{size:70})||'').replace('<svg ','<svg x="64" y="24" ')}</g>`;
    }
    else if(['PuzzleTree','EchoParade','DotsLast','LetterTrain','SameLetter'].includes(kind)){
      // The Puzzle Tree (v31).
      const F=ns.LetterFriends, at=(c,x,y,sz,mode,extra='')=>(F?.art(c,{size:sz,mode})||'').replace('<svg ',`<svg x="${x}" y="${y}" ${extra}`);
      if(kind==='PuzzleTree')scene=`<path d="M96 116V70" stroke="#70501b" stroke-width="8" stroke-linecap="round"/><circle cx="100" cy="48" r="40" fill="#7fce54" stroke="#4a3620" stroke-width="3"/>${[[78,36],[112,30],[118,60],[84,64]].map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="9" fill="${['#ffa798','#ffe49a','#96ecff','#b49fcf'][i]}" stroke="#4a3620" stroke-width="2.4"/>`).join('')}<path d="M96 40Q100 32 106 38Q104 46 98 46" fill="none" stroke="#4a3620" stroke-width="2.4" stroke-linecap="round"/>`;
      else if(kind==='EchoParade')scene=`${at('ب',18,36,56)}${at('ت',72,26,56)}${at('ث',126,36,56)}<path d="M40 22q6-8 12 0M96 12q6-8 12 0M150 22q6-8 12 0" fill="none" stroke="#3a8fc4" stroke-width="3" stroke-linecap="round"/>`;
      else if(kind==='DotsLast')scene=`<rect x="56" y="14" width="88" height="88" rx="18" fill="#fffdf7" stroke="#4a3620" stroke-width="3"/><path d="M128 52Q130 80 106 82L94 82Q70 80 72 52" fill="none" stroke="#4a3620" stroke-width="8" stroke-linecap="round"/><circle cx="92" cy="36" r="5" fill="#4a3620"/><circle cx="108" cy="36" r="5" fill="#4a3620" opacity=".35"/>`;
      else if(kind==='LetterTrain')scene=`${[[40,'#ffa798'],[84,'#96ecff'],[128,'#b7e779']].map(([x,c])=>`<ellipse cx="${x}" cy="32" rx="18" ry="22" fill="${c}" stroke="#4a3620" stroke-width="3"/><path d="M${x} 54v12" stroke="#a89478" stroke-width="2.4"/>`).join('')}<path d="M24 100H176" stroke="#a89478" stroke-width="6"/><rect x="120" y="74" width="48" height="22" rx="4" fill="#62cdf4" stroke="#4a3620" stroke-width="3"/><rect x="66" y="78" width="46" height="18" rx="4" fill="#ee806f" stroke="#4a3620" stroke-width="3"/><rect x="14" y="78" width="46" height="18" rx="4" fill="#ee806f" stroke="#4a3620" stroke-width="3"/>`;
      else scene=`${at('ب',20,24,64,'plain')}${at('ب',110,24,64,'plain','transform="rotate(90 142 56)"')}`;
    }
    else if(kind==='SandTable')scene=`<rect x="34" y="20" width="132" height="90" rx="18" fill="#c69434" stroke="#4a3620" stroke-width="3"/><rect x="44" y="28" width="112" height="72" rx="12" fill="#e5dcc8"/>${[[56,40],[90,36],[130,44],[70,80],[118,86],[146,70]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="1.6" fill="#c9bda4"/>`).join('')}<path d="M128 56Q130 76 112 78H86Q68 76 70 56" fill="none" stroke="#a89478" stroke-width="8" stroke-linecap="round"/><circle cx="99" cy="90" r="4" fill="#a89478"/><path d="M150 18Q156 34 140 48" fill="none" stroke="#ffa798" stroke-width="8" stroke-linecap="round"/><circle cx="150" cy="16" r="6" fill="#ffa798" stroke="#4a3620" stroke-width="2.4"/>`;
    else if(['PeekFlaps','SoundSort','HoopoeTrip','FriendShapes','BusyMarket','BookCorner'].includes(kind)){
      // The picture-book games (v27): drawn from the friends and stickers.
      const F=ns.LetterFriends, A=ns.LettersArt, at=(c,x,y,sz,mode)=>(F?.art(c,{size:sz,mode})||'').replace('<svg ',`<svg x="${x}" y="${y}" `);
      const pic=(id,x,y,sz)=>(A?.stickerMotif?.(id,sz)||'').replace('<svg ',`<svg x="${x}" y="${y}" `);
      if(kind==='PeekFlaps')scene=`${pic('elephant',22,30,74)}<path d="M100 112V44Q100 20 136 20Q172 20 172 44V112Z" fill="#7fce54" stroke="#4a3620" stroke-width="3"/>${at('ف',108,40,58,'plain')}<path d="M60 112V58Q60 40 84 40" fill="none" stroke="#4e9677" stroke-width="4" stroke-linecap="round"/>`;
      else if(kind==='SoundSort')scene=`${pic('egg',40,4,46)}${pic('fig',114,4,46)}<path d="M24 66H90L82 110H32Z" fill="#c69434" stroke="#4a3620" stroke-width="3"/><path d="M110 66H176L168 110H118Z" fill="#c69434" stroke="#4a3620" stroke-width="3"/>${at('ب',36,52,40,'plain')}${at('ت',122,52,40,'plain')}`;
      else if(kind==='HoopoeTrip')scene=`${at('ه',112,14,76)}${at('ب',58,38,60)}<path d="M36 60V112" stroke="#70501b" stroke-width="6" stroke-linecap="round"/><path d="M14 34H58V62H14Z" fill="#fffaf0" stroke="#4a3620" stroke-width="3"/>${at('ب',22,34,28,'plain')}`;
      else if(kind==='FriendShapes')scene=`${(F?.art('ق',{size:90})||'').replace('class="lf"','class="lf is-bodiless"').replace('<svg ','<svg x="20" y="14" ')}<path d="M110 34H178V100H110Z" fill="#fffaf0" stroke="#4a3620" stroke-width="3" stroke-linejoin="round"/>${at('ق',116,36,58,'plain')}`;
      else if(kind==='BusyMarket')scene=`<path d="M30 30H170V112H30Z" fill="#fffaf0" stroke="#4a3620" stroke-width="3"/><path d="M24 30L36 10H164L176 30Z" fill="#ee806f" stroke="#4a3620" stroke-width="3" stroke-linejoin="round"/>${pic('moon',38,36,40)}${pic('cat',80,36,40)}${pic('fig',122,36,40)}${pic('egg',58,72,36)}${pic('fish',104,72,36)}<circle cx="150" cy="86" r="16" fill="#ccfbef" stroke="#4a3620" stroke-width="4"/><path d="M162 98L174 110" stroke="#70501b" stroke-width="6" stroke-linecap="round"/>`;
      else scene=`<path d="M22 24Q60 12 100 26Q140 12 178 24V112Q140 102 100 114Q60 102 22 112Z" fill="#fffdf7" stroke="#4a3620" stroke-width="3" stroke-linejoin="round"/><path d="M100 26V114" stroke="#c9bda4" stroke-width="3"/>${at('ب',30,30,62)}${at('ق',108,30,62)}`;
    }
    else if(kind==='FriendFind'||kind==='FriendBook'){
      // Letter Friends (v26): the friends themselves are the picture.
      const F=ns.LetterFriends, at=(c,x,y,sz,mode)=>(F?.art(c,{size:sz,mode})||'').replace('<svg ',`<svg x="${x}" y="${y}" `);
      scene=kind==='FriendFind'
        ? `${at('ب',22,18,82)}${at('ق',98,18,82)}<circle cx="100" cy="22" r="15" fill="#ffe49a" stroke="#4a3620" stroke-width="3"/><path d="M95 18Q96 12 101 12Q107 13 106 18Q105 22 100 23V26" fill="none" stroke="#4a3620" stroke-width="3" stroke-linecap="round"/>`
        : `<path d="M26 26Q62 16 100 28Q138 16 174 26V110Q138 100 100 112Q62 100 26 110Z" fill="#fffdf7" stroke="#4a3620" stroke-width="3" stroke-linejoin="round"/><path d="M100 28V112" stroke="#c9bda4" stroke-width="3"/>${at('ب',108,30,66)}<text x="62" y="82" text-anchor="middle" font-family="'Amiri Quran', serif" font-size="44" fill="#4a3620">ب</text>`;
    }
    else if(kind==='LetterBalloons')scene=`${[[62,52,'#ffa798','ب'],[100,40,'#96ecff','ت'],[138,56,'#b7e779','ا']].map(([x,y,c,l])=>`<path d="M${x} ${y+28}Q${x-4} ${y+44} ${x+2} ${y+60}" fill="none" stroke="#a89478" stroke-width="2.4"/><ellipse cx="${x}" cy="${y}" rx="20" ry="25" fill="${c}" stroke="#4a3620" stroke-width="3"/><text x="${x}" y="${y+2}" text-anchor="middle" dominant-baseline="central" font-family="'Amiri Quran', serif" font-size="20" fill="#4a3620">${l}</text>`).join('')}`;
    else if(kind==='GardenTogether')scene=`<circle cx="60" cy="66" r="26" fill="#62cdf4" stroke="#4a3620" stroke-width="3"/><circle cx="140" cy="66" r="26" fill="#ffa798" stroke="#4a3620" stroke-width="3"/><circle cx="52" cy="60" r="4" fill="#4a3620"/><circle cx="68" cy="60" r="4" fill="#4a3620"/><circle cx="132" cy="60" r="4" fill="#4a3620"/><circle cx="148" cy="60" r="4" fill="#4a3620"/><path d="M52 74Q60 80 68 74M132 74Q140 80 148 74" fill="none" stroke="#4a3620" stroke-width="2.4" stroke-linecap="round"/><rect x="84" y="78" width="32" height="30" rx="6" fill="#fffaf0" stroke="#4a3620" stroke-width="2.4"/><path d="M80 30Q100 14 120 30" fill="none" stroke="#ee806f" stroke-width="4" stroke-linecap="round"/>`;
    else if(kind==='LetterStudio')scene=`<rect x="40" y="18" width="120" height="90" rx="10" fill="#96ecff" stroke="#4a3620" stroke-width="3"/><path d="M40 78Q80 66 120 74Q140 78 160 72V98Q160 108 150 108H50Q40 108 40 98Z" fill="#7fce54"/><text x="82" y="54" text-anchor="middle" dominant-baseline="central" font-family="'Amiri Quran', serif" font-size="30" fill="#c25a49">ب</text><circle cx="128" cy="44" r="10" fill="#f3c955" stroke="#4a3620" stroke-width="2.4"/><path d="M150 96L176 70L184 78L158 104Z" fill="#ee806f" stroke="#4a3620" stroke-width="2.4" stroke-linejoin="round"/>`;
    else if(kind==='SoundLab')scene=`<path d="M46 52H154V108Q154 116 146 116H54Q46 116 46 108Z" fill="#62cdf4" stroke="#4a3620" stroke-width="3" stroke-linejoin="round"/><path d="M56 60H144V80H56Z" fill="#ccfbef" stroke="#4a3620" stroke-width="2.4"/><path d="M60 52L76 28H96L100 52M140 52L124 28H104L100 52" fill="#f3c955" stroke="#4a3620" stroke-width="3" stroke-linejoin="round"/><circle cx="100" cy="98" r="11" fill="#c69434" stroke="#4a3620" stroke-width="2.4"/><text x="100" y="72" text-anchor="middle" dominant-baseline="central" font-family="'Amiri Quran', serif" font-size="22" fill="#4a3620">بَ</text>`;
    else if(kind==='LetterHunt')scene=`<path d="M20 112Q60 88 100 100Q140 112 180 96V120H20Z" fill="#7fce54"/><path d="M40 70Q38 50 58 50Q66 34 86 44Q104 40 104 60Q110 72 96 74H48Q38 74 40 70Z" fill="#fffdf7" stroke="#c9bda4" stroke-width="2.4"/><path d="M142 30L162 58L142 86L122 58Z" fill="#ffa798" stroke="#4a3620" stroke-width="2.4" stroke-linejoin="round"/><circle cx="104" cy="74" r="26" fill="#ccfbef" fill-opacity=".6" stroke="#4a3620" stroke-width="4"/><path d="M122 92L144 114" stroke="#4a3620" stroke-width="8" stroke-linecap="round"/><path d="M122 92L144 114" stroke="#c69434" stroke-width="4" stroke-linecap="round"/><text x="104" y="76" text-anchor="middle" dominant-baseline="central" font-family="'Amiri Quran', serif" font-size="24" fill="#4a3620">ب</text>`;
    else if(kind==='Workshop')scene=`<path d="M26 101H174V114H26Z" fill="#a89478" stroke="#70501b" stroke-width="2.4"/><rect x="42" y="17" width="116" height="51" rx="13" fill="#fffaf0" stroke="#a89478" stroke-width="3"/><path d="M58 31H86V54H58ZM99 31H142V54H99Z" fill="#e5dcc8" stroke="#a89478" stroke-width="2.4" stroke-dasharray="3 4"/><g fill="#fffaf0" stroke="#a89478" stroke-width="2.4"><rect x="35" y="77" width="46" height="39" rx="9" transform="rotate(-8 58 96)"/><rect x="110" y="76" width="52" height="39" rx="9" transform="rotate(7 136 95)"/></g><path d="M57 87V103M125 91Q121 101 136 101Q149 101 146 91" fill="none" stroke="#4a3620" stroke-width="4" stroke-linecap="round"/><circle cx="136" cy="107" r="2.5" fill="#4a3620"/><path d="M86 87Q101 80 103 64L98 69M103 64L108 70" fill="none" stroke="#4e9677" stroke-width="3" stroke-linecap="round"/>`;
    else if(kind==='WaterGarden')scene=`<ellipse cx="100" cy="26" rx="62" ry="12" fill="#a89478"/><ellipse cx="100" cy="24" rx="54" ry="8" fill="#62cdf4"/><rect x="34" y="38" width="132" height="12" rx="6" fill="#62cdf4" stroke="#a89478" stroke-width="3"/>${[56,100,144].map((x,i)=>`<rect x="${x-5}" y="50" width="10" height="42" rx="3" fill="${i===1?'#62cdf4':'#c9bda4'}"/><rect x="${x-12}" y="${i===1?30:40}" width="24" height="18" rx="4" fill="#fffdf7" stroke="#4a3620" stroke-width="2.4"/><path d="M${x} 108Q${x+2} 100 ${x} 92" stroke="#4e9677" stroke-width="3" fill="none"/>${[0,72,144,216,288].map(a=>`<ellipse cx="${x}" cy="${i===1?84:88}" rx="${i===1?5:3}" ry="${i===1?8:5}" transform="rotate(${a} ${x} 92)" fill="${['#ee806f','#f3c955','#ffa798'][i]}" stroke="#4a3620" stroke-width="1.6"/>`).join('')}`).join('')}`;
    else if(kind==='DotGarden')scene=`<rect x="34" y="23" width="129" height="85" rx="22" fill="#fffdf7" stroke="#4a3620" stroke-width="3"/><path d="M60 56Q51 83 97 82Q146 82 139 56" fill="none" stroke="#4a3620" stroke-width="8" stroke-linecap="round"/><circle cx="99" cy="96" r="6" fill="#c9bda4"/><circle cx="167" cy="109" r="10" fill="#e8743c" stroke="#4a3620" stroke-width="2.4"/><path d="M151 114Q126 123 111 104L113 113M111 104L120 105" fill="none" stroke="#4e9677" stroke-width="3" stroke-linecap="round"/>`;
    else scene=`<rect x="30" y="21" width="138" height="92" rx="22" fill="#fffdf7" stroke="#4a3620" stroke-width="3"/><path d="M61 47Q52 84 103 82Q145 82 141 50" fill="none" stroke="#c9bda4" stroke-width="8" stroke-linecap="round" stroke-dasharray="2 12"/><path d="M61 47Q52 84 100 82" fill="none" stroke="#4e9677" stroke-width="8" stroke-linecap="round"/><circle cx="102" cy="98" r="5" fill="#4e9677"/><g transform="translate(114 72) rotate(35)"><path d="M-7 -47H7V0L0 15L-7 0Z" fill="#f3c955" stroke="#4a3620" stroke-width="2.4"/><path d="M-7 0H7L0 15Z" fill="#e5dcc8"/><path d="M-3 9L0 15L3 9" fill="#4a3620"/><path d="M-3 -41V-5" stroke="#fffaf0" stroke-width="3"/></g>`;
    const picture = `<svg class="practice-picture" viewBox="0 0 200 140" aria-hidden="true">${common}${scene}</svg>`;
    return kind === "Feed" && petArt ? `<span class="practice-friend-picture" aria-hidden="true">${picture}<span class="practice-friend">${petArt}</span></span>` : picture;
  }
  // Placement belongs to the wrapper; the petals have their own motion layer.
  function flowerBed({size=90,count=3,centered=false,terrain=true}={}) {
    const flowers=centered&&count===1?[[50,23,1,'#ffa798']]:centered&&count===2?[[33,29,.86,'#ffa798'],[67,29,.86,'#f3c955']]:[[24,33,.72,'#ffa798'],[48,23,1,'#f3c955'],[74,38,.68,'#b49fcf']];
    return `<svg class="garden-flower-bed" viewBox="0 0 100 80" width="${size}" height="${size*.8}" aria-hidden="true">
      ${terrain ? `<ellipse cx="50" cy="71" rx="43" ry="6" fill="#2f5c46" opacity=".16"/>
      <path d="M8 65Q24 54 47 60Q77 51 93 65Q83 75 48 73Q18 76 8 65Z" fill="#7fce54"/>
      <path d="M12 64Q31 57 48 63Q70 55 89 65" fill="none" stroke="#b7e779" stroke-width="3" stroke-linecap="round"/>` : ''}
      ${flowers.slice(0,Math.max(0,Math.min(3,count))).map(([x,y,k,c])=>`<g transform="translate(${x} ${y}) scale(${k})">
        <path d="M0 39Q3 19 0 0" fill="none" stroke="#4e9677" stroke-width="4" stroke-linecap="round"/>
        <path d="M1 28Q-15 29 -14 15Q-3 16 1 28M2 20Q15 21 17 8Q6 10 2 20" fill="#4e9677"/>
        <path d="M-10 20L0 27M12 13L2 20" stroke="#b7e779" stroke-width="1.6" stroke-linecap="round"/>
        <g class="garden-flower-head">${[0,72,144,216,288].map(a=>`<ellipse cy="-8" rx="5.4" ry="9" transform="rotate(${a})" fill="${c}" stroke="#70501b" stroke-width="1.6"/>`).join('')}
        <circle r="5" fill="#ffe49a" stroke="#a89478" stroke-width="1.6"/><circle cx="-1.5" cy="-2" r="1.4" fill="#fffaf0"/></g>
      </g>`).join('')}
    </svg>`;
  }
  function pond() {
    const lily = `<ellipse cx="46" cy="50" rx="40" ry="12" fill="#ccfbef" opacity=".7"/><path d="M43 43L64 58Q93 50 76 31Q60 15 30 28Q5 44 24 56Q38 65 52 58Z" fill="#4e9677"/><path d="M43 43L62 54Q81 48 70 33Q50 22 31 32Q17 41 29 49Z" fill="#7fce54"/><path d="M37 34Q51 28 65 34" fill="none" stroke="#b7e779" stroke-width="2.4" stroke-linecap="round"/>`;
    return `<div class="garden-pond-detail" aria-hidden="true"><svg class="pond-water" viewBox="0 0 600 420" preserveAspectRatio="none">
      <path d="M0 0H600V50Q491 27 365 40Q188 60 0 34Z" fill="#ccfbef" opacity=".65"/>
      <path d="M0 264Q93 222 172 264Q322 309 424 261Q510 228 600 276V420H0Z" fill="#3a8fc4" opacity=".12"/>
      <path d="M0 355Q97 320 193 364Q387 428 600 339V420H0Z" fill="#2f5c46"/>
      <path d="M0 352Q97 317 193 361Q387 425 600 336V347Q394 436 190 372Q83 335 0 366Z" fill="#4e9677"/>
      <g fill="none" stroke="#fffdf7" stroke-width="2.4" stroke-linecap="round" opacity=".65"><path d="M30 83Q51 78 72 82M517 102Q540 96 564 102M28 328Q49 323 70 328M516 365Q539 358 568 363"/></g>
      <path d="M8 178Q20 161 35 165M550 210Q575 207 590 214M20 385Q50 376 66 381" fill="none" stroke="#4e9677" stroke-width="3" opacity=".3" stroke-linecap="round"/>
    </svg><svg class="pond-lily is-near" viewBox="0 0 92 72">${lily}</svg><svg class="pond-lily is-far" viewBox="0 0 92 72">${lily}</svg></div>`;
  }
  // Fixed-proportion floating leaf: a contact plane beneath the learning card.
  function pondFloat() {
    return `<svg viewBox="0 0 160 56" aria-hidden="true"><ellipse cx="80" cy="37" rx="74" ry="15" fill="#2f5c46" opacity=".18"/><path d="M9 36Q28 49 69 49M105 48Q136 44 150 36" fill="none" stroke="#fffaf0" stroke-width="3" stroke-linecap="round"/><path d="M16 25Q70 1 146 22Q140 35 117 40L88 33L103 43Q43 47 16 25Z" fill="#2f5c46"/><path d="M17 22Q70 0 145 19Q141 31 117 36L89 28L103 38Q43 42 17 22Z" fill="#4e9677"/><path d="M26 21Q78 4 134 19Q81 9 42 26Z" fill="#b7e779"/><path d="M40 29Q67 34 87 28" fill="none" stroke="#7fce54" stroke-width="2.4" stroke-linecap="round"/></svg>`;
  }
  // Shared seed-picnic prop; the dark opening remains visible above the weave.
  function seedBasket() {
    return `<svg viewBox="0 0 180 112" aria-hidden="true">
      <ellipse cx="90" cy="103" rx="72" ry="7" fill="#4a3620" opacity=".13"/>
      <path d="M42 53C39 3 139 3 138 53" fill="none" stroke="#4a3620" stroke-width="12" data-ribbon/>
      <path d="M42 51C42 11 136 11 138 51" fill="none" stroke="#f3c955" stroke-width="4"/>
      <ellipse cx="90" cy="52" rx="74" ry="17" fill="#70501b" stroke="#4a3620" stroke-width="4"/>
      <path d="M18 53L30 91Q90 110 150 91L162 53Q90 76 18 53Z" fill="#c9bda4" stroke="#4a3620" stroke-width="4" stroke-linejoin="round"/>
      <g fill="none" stroke="#a89478" stroke-width="3"><path d="M25 68Q90 88 155 68M28 81Q90 101 152 81M46 63L51 98M74 68L76 102M105 68L103 102M134 63L129 98"/></g>
      <path d="M20 52Q90 76 160 52" fill="none" stroke="#ffe49a" stroke-width="6" stroke-linecap="round"/>
      <path d="M85 83Q65 67 64 81Q65 94 87 92Q104 69 115 79Q113 93 91 94" fill="#4e9677" stroke="#2f5c46" stroke-width="2.4"/>
    </svg>`;
  }
  // One packet material follows the child from the pond to the drawing table
  // and picnic. Callers supply trusted fitted glyphs or validated local ink.
  function seedPacket(ink = '') {
    return `<svg class="garden-seed-packet" viewBox="-52 -66 104 132" aria-hidden="true">
      <ellipse cy="60" rx="43" ry="5" fill="#4a3620" opacity=".15"/>
      <path d="M-43-58Q0-66 43-58L46 52Q0 65-46 52Z" fill="#e5dcc8" stroke="#4a3620" stroke-width="3"/>
      <path d="M-40-56Q0-64 40-56L40-45Q0-52-40-45Z" fill="#fffaf0"/>
      <path d="M-43 44Q0 54 43 44L43 51Q0 61-43 51Z" fill="#c9bda4"/>
      <path d="M-40-48Q0-53 40-48M-41 47Q0 54 41 47" fill="none" stroke="#a89478" stroke-width="1.6" stroke-dasharray="3 3"/>
      <rect x="-39" y="-38" width="78" height="78" rx="16" fill="#fffaf0"/>
      <path d="M-29-33H27" stroke="#fffdf7" stroke-width="3" stroke-linecap="round"/>
      ${ink}<path d="M0-48Q-15-60-17-51Q-15-44 0-46Q14-60 18-53Q18-45 0-46" fill="#4e9677"/>
    </svg>`;
  }
  ns.LettersGardenArt = { growth, chapterGrowth, habitatReward, boat, backdrop, practicePicture, flowerBed, pond, pondFloat, seedBasket, seedPacket };
})(window.MiftahGame || (window.MiftahGame = {}));

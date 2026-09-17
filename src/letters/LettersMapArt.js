// The home trail shares the miniature landscape materials of the activity scenes.
// Artwork is decorative: curriculum, unlocks and rewards stay in LettersGame.
(function(ns){
  const ink='#4a3620', paper='#fffaf0';
  let landscapeId=0;

  // One topographic drawing spans the whole journey. Shore points share their
  // tangents; a chapter never starts a new waterline or a horizontal ground slab.
  function contour(points, dx=0) {
    let d=`M${points[0][0]+dx} ${points[0][1]}`;
    for(let i=1;i<points.length;i++) {
      const a=points[i-1],b=points[i],middle=(a[1]+b[1])/2;
      d+=`C${a[0]+dx} ${middle} ${b[0]+dx} ${middle} ${b[0]+dx} ${b[1]}`;
    }
    return d;
  }

  function landscape({width=800,height=4000,pathWidth=780,stops=[],night=false}={}) {
    const id=`map-land-${++landscapeId}`;
    const w=Math.max(1,width),h=Math.max(1,height),lane=Math.min(w,pathWidth);
    const ordered=stops.slice().sort((a,b)=>a.y-b.y);
    const shore=ordered.map((stop,i)=>[w/2+lane*((stop.left ? .30 : .53)+.025*Math.sin(i*2.3)),stop.y]);
    if(!shore.length)shore.push([w*.86,h/2]);
    shore.unshift([shore[0][0],-100]);
    shore.push([shore[shore.length-1][0],h+100]);
    const water=(dx=0)=>`${contour(shore,dx)}L${w+120} ${h+100}V-100Z`;
    const edge=shore.map((p,i)=>[Math.max(0,(w-lane)/2)+lane*(.065+.055*Math.sin(i*1.7)),p[1]]);
    const verge=(dx=0)=>`${contour(edge,dx)}L-100 ${h+100}V-100Z`;
    const soil=night?'#4e9677':'#b7e779';
    const grass=night?'#2f5c46':'#7fce54';
    const glints=[];
    // Current marks follow the river, independent of chapter count/row edges.
    for(let i=1;i<shore.length-1;i++) {
      const [x,y]=shore[i];
      glints.push(`<path d="M${x+40} ${y-22}q28-7 57-2m-30 32q31-6 64-1"/>`);
    }
    const habitat={meadow:paper,orchard:'#e5dcc8',lagoon:'#ccfbef',night:'#2f5c46',peaks:'#e5dcc8',river:'#ccfbef'};
    const habitatDefs=Object.entries(habitat).map(([biome,color])=>`<radialGradient id="${id}-${biome}"><stop stop-color="${color}" stop-opacity="${night ? .13 : biome==='peaks' ? .65 : .3}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`).join('');
    const patches=ordered.filter((stop,i)=>stop.biome!=='meadow'||i%2===0).map((stop,i)=>{
      const x=w/2+lane*(stop.left ? .20 : -.24),y=stop.y+35;
      const rx=Math.min(lane*.40,270),ry=(ordered[1]?.y-ordered[0]?.y||200)*.9;
      return `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="url(#${id}-${habitat[stop.biome]?stop.biome:'meadow'})" transform="rotate(${i%2?-24:18} ${x} ${y})"/>`;
    }).join('');
    const undergrowth=ordered.map((stop,i)=>{
      // Quiet edge clusters use the same perspective as the landmarks. They
      // never enter the central route, a star plaque, or the pet's space.
      const x=Math.max(8,(w-lane)/2)+lane*(.025+(i%3)*.012);
      const y=stop.y+(i%2?-52:62),scale=[.65,.85,1][i%3];
      return `<g transform="translate(${x} ${y}) scale(${scale})" opacity="${night ? .65 : .8}">
        <ellipse cx="10" cy="14" rx="25" ry="6" fill="#2f5c46" opacity=".16"/>
        <path d="M9 13Q-13 9-9-9Q4-10 9 13Q10-17 24-20Q32-3 9 13Q30-4 39 5Q31 16 9 13Z" fill="#4e9677"/>
        <path d="M8 12Q-5-1-7-6M12 11Q18-6 24-13" fill="none" stroke="#b7e779" stroke-width="1.6" stroke-linecap="round"/>
        <ellipse cx="-16" cy="20" rx="8" ry="4" fill="#a89478"/><ellipse cx="-17" cy="18" rx="7" ry="3" fill="#e5dcc8"/>
      </g>`;
    }).join('');
    return `<svg class="map-landscape-art" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="${id}-ground" x1="0" x2="1" y1="0" y2="0"><stop stop-color="${grass}"/><stop offset=".4" stop-color="${soil}"/><stop offset="1" stop-color="${grass}"/></linearGradient>
        <linearGradient id="${id}-water" x1="0" x2="1" y1="0" y2="0"><stop stop-color="${night?'#3a8fc4':'#96ecff'}"/><stop offset=".65" stop-color="${night?'#34375f':'#62cdf4'}"/><stop offset="1" stop-color="${night?'#4a4d84':'#3a8fc4'}"/></linearGradient>
        ${habitatDefs}
        <linearGradient id="${id}-light" x1="0" x2="1" y1="0" y2="0"><stop stop-color="${paper}" stop-opacity="0"/><stop offset=".4" stop-color="${paper}" stop-opacity="${night ? .04 : .23}"/><stop offset="1" stop-color="${paper}" stop-opacity="0"/></linearGradient>
      </defs>
      <path class="map-ground-plane" d="M0 0H${w}V${h}H0Z" fill="url(#${id}-ground)"/>
      <path d="M0 0H${w}V${h}H0Z" fill="url(#${id}-light)"/>
      <path d="${verge(38)}" fill="#4e9677" opacity="${night ? .22 : .12}"/>
      <path d="${verge()}" fill="#2f5c46" opacity="${night ? .25 : .12}"/>
      ${patches}${undergrowth}
      <path d="${water(-30)}" fill="#4e9677" opacity=".22"/>
      <path d="${water(-17)}" fill="${night?'#a89478':'#e5dcc8'}"/>
      <path d="${water(-10)}" fill="${night?'#c9bda4':paper}" opacity=".65"/>
      <path class="map-river" d="${water()}" fill="url(#${id}-water)"/>
      <path d="${water(22)}" fill="#62cdf4" opacity="${night ? .15 : .3}"/>
      <g fill="none" stroke="#ccfbef" stroke-width="3" stroke-linecap="round" opacity="${night ? .2 : .5}">${glints.join('')}</g>
    </svg>`;
  }
  function orchard(){return `<ellipse cx="85" cy="145" rx="67" ry="13" fill="#2f5c46" opacity=".18"/><path d="M20 132Q81 112 149 133Q147 149 86 151Q24 152 20 132Z" fill="#b7e779"/><path d="M75 134L78 64H94L100 134Z" fill="#c9bda4"/><path d="M85 131L87 71H94L100 134Z" fill="#a89478"/><path d="M83 105L60 82M90 100L114 74" fill="none" stroke="#a89478" stroke-width="6" stroke-linecap="round"/><path d="M29 78Q12 55 32 41Q31 17 60 20Q79-3 100 19Q134 11 137 39Q164 54 145 81Q119 103 90 88Q54 107 29 78Z" fill="#4e9677"/><path d="M29 64Q18 43 40 35Q43 15 67 27Q81 9 101 28Q127 20 132 44Q148 50 140 66Q117 81 88 68Q58 87 29 64Z" fill="#7fce54"/><path d="M39 42Q55 24 71 37Q83 21 100 37" fill="none" stroke="#b7e779" stroke-width="6" stroke-linecap="round"/><g fill="#ee806f" stroke="${ink}" stroke-width="1.6"><circle cx="48" cy="64" r="9"/><circle cx="105" cy="74" r="10"/><circle cx="120" cy="43" r="7"/></g><g fill="#ffa798"><circle cx="45" cy="61" r="3"/><circle cx="102" cy="70" r="3"/><circle cx="118" cy="41" r="2"/></g><path d="M23 134Q28 119 40 125L42 140M118 141Q123 123 133 128L136 143" fill="#4e9677"/>`;}
  function reeds(){return `<ellipse cx="90" cy="145" rx="67" ry="10" fill="#2f5c46" opacity=".18"/><path d="M14 130Q39 118 87 127Q129 113 157 132Q156 149 87 150Q23 150 14 130Z" fill="#96ecff"/><path d="M35 139Q69 130 116 138" fill="none" stroke="#ccfbef" stroke-width="4" stroke-linecap="round"/><g fill="none" stroke="#4e9677" stroke-width="4" stroke-linecap="round"><path d="M68 140L49 46M78 140L89 24M89 140L116 56"/></g><g fill="#c9bda4" stroke="${ink}" stroke-width="1.6"><rect x="40" y="29" width="13" height="39" rx="6" transform="rotate(-10 47 46)"/><rect x="85" y="12" width="13" height="40" rx="6" transform="rotate(5 91 32)"/><rect x="113" y="43" width="12" height="32" rx="6" transform="rotate(16 119 59)"/></g><path d="M73 140Q20 119 29 80Q55 83 73 140M86 141Q102 87 140 87Q142 122 86 141Z" fill="#4e9677"/><path d="M72 136Q50 114 31 85M90 136Q120 113 137 92" fill="none" stroke="#b7e779" stroke-width="2.4"/><ellipse cx="131" cy="140" rx="20" ry="7" fill="#7fce54"/><path d="M129 133Q112 122 126 119Q133 107 138 120Q149 121 139 132Z" fill="#ee806f"/><circle cx="134" cy="128" r="4" fill="#ffe49a"/>`;}
  function lantern(){return `<ellipse cx="89" cy="147" rx="65" ry="10" fill="#2f5c46" opacity=".25"/><path d="M19 139Q80 118 151 137L139 151H34Z" fill="#4e9677"/><path d="M45 141V48Q44 25 68 24H112" fill="none" stroke="#a89478" stroke-width="6" stroke-linecap="round"/><path d="M103 26V44" stroke="#4a3620" stroke-width="3"/><path d="M84 50L103 38L122 50L119 107Q103 118 87 107Z" fill="#c69434" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/><path d="M91 55H115L112 101H94Z" fill="#ffe49a"/><path d="M98 57H110L108 95H99Z" fill="#fffaf0"/><path d="M86 51H121M88 108H119" stroke="${ink}" stroke-width="3"/><path d="M104 88C83 76 101 63 110 64Q98 78 112 81Z" fill="#f3c955"/><path d="M26 142Q17 121 33 112Q46 119 42 140M127 142Q132 117 146 125Q154 139 127 142Z" fill="#b7e779"/><g fill="#ffe49a"><circle cx="67" cy="104" r="2"/><circle cx="143" cy="79" r="2"/><circle cx="27" cy="71" r="2"/></g>`;}
  function peaks(){return `<ellipse cx="87" cy="149" rx="73" ry="9" fill="#2f5c46" opacity=".18"/><path d="M9 145L61 40L107 145Z" fill="#c9bda4"/><path d="M61 40L70 144H107Z" fill="#a89478"/><path d="M45 72L61 40L76 71L61 65Z" fill="#fffaf0"/><path d="M62 145L115 10L165 145Z" fill="#e5dcc8"/><path d="M115 10L118 144H165Z" fill="#c9bda4"/><path d="M95 62L115 10L136 66L119 52L109 65Z" fill="#fffdf7"/><path d="M10 144Q56 129 84 141Q125 132 163 144L153 154H22Z" fill="#b7e779"/><path d="M28 141L41 107L54 141M128 144L141 113L154 144" fill="#4e9677"/><path d="M39 144V132M141 147V136" stroke="#a89478" stroke-width="3"/>`;}
  function landing(){return `<ellipse cx="80" cy="137" rx="66" ry="9" fill="#2f5c46" opacity=".18"/><path d="M8 132Q41 114 72 127L70 145Q31 151 8 132Z" fill="#b7e779"/><path d="M62 125L157 105V124L64 144Z" fill="#a89478"/><path d="M60 111L159 91L166 112L63 135Z" fill="#e5dcc8" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"/><path d="M74 109L79 128M94 105L99 124M114 101L119 120M135 96L141 115" stroke="#c9bda4" stroke-width="3"/><path d="M65 112V91M154 94V75M66 95L153 78" fill="none" stroke="#a89478" stroke-width="4" stroke-linecap="round"/><path d="M70 135V147M155 116V132" stroke="#a89478" stroke-width="6" stroke-linecap="round"/><path d="M32 135Q12 126 16 109Q32 116 32 135M39 137Q39 111 53 103Q60 121 39 137Z" fill="#4e9677"/><path d="M51 134Q58 119 68 126L70 138Z" fill="#7fce54"/><path d="M146 144L169 139" stroke="#ccfbef" stroke-width="2.4" stroke-linecap="round"/>`;}
  function landmark(biome='meadow',variant=0){
    if(biome==='meadow'&&variant===1)return ns.LettersGardenArt.seedBasket();
    const content=biome==='orchard'?orchard():biome==='lagoon'?reeds():biome==='night'?lantern():biome==='peaks'?peaks():biome==='river'?(variant%2?orchard():landing()):variant%2?orchard():`<g transform="translate(0 7)">${reeds()}</g>`;
    return `<svg viewBox="0 0 176 166" aria-hidden="true">${content}</svg>`;
  }
  ns.LettersMapArt={landscape,landmark};
})(window.MiftahGame||(window.MiftahGame={}));

// The home trail shares the miniature landscape materials of the activity scenes.
// Artwork is decorative: curriculum, unlocks and rewards stay in LettersGame.
(function(ns){
  const ink='#4a3620', paper='#fffaf0';
  const palettes={
    meadow:['#b7e779','#7fce54','#4e9677'],orchard:['#ffe49a','#b7e779','#4e9677'],
    lagoon:['#ccfbef','#b7e779','#4e9677'],night:['#6064a0','#4e9677','#2f5c46'],
    peaks:['#e5dcc8','#b7e779','#4e9677'],river:['#ccfbef','#b7e779','#4e9677']
  };
  let bankId=0;
  function ground(biome='meadow',side=0,night=false){
    const [light,base,shade]=night?['#4e9677','#2f5c46','#34375f']:(palettes[biome]||palettes.meadow);
    const clip=`map-bank-${++bankId}`;
    return `<svg viewBox="0 0 800 280" preserveAspectRatio="none" aria-hidden="true"><g ${side?'transform="translate(800 0) scale(-1 1)"':''}>
      <path d="M-20 85Q132 26 333 65Q588 12 820 83V271Q548 240 391 260Q172 242-20 264Z" fill="${shade}" opacity=".2"/>
      <path d="M-20 73Q132 14 333 53Q588 0 820 71V246Q548 215 391 235Q172 217-20 239Z" fill="${light}"/>
      <path d="M-20 92Q144 33 338 70Q590 19 820 88V246Q548 215 391 235Q172 217-20 239Z" fill="${base}"/>
      <path d="M-20 192Q166 153 342 196Q595 148 820 197V246Q548 215 391 235Q172 217-20 239Z" fill="${shade}" opacity=".18"/>
      <g clip-path="url(#${clip})"><defs><clipPath id="${clip}"><path d="M-20 73Q132 14 333 53Q588 0 820 71V246Q548 215 391 235Q172 217-20 239Z"/></clipPath></defs><path d="M589 69Q492 107 610 136Q704 158 596 219L599 250H820V70Z" fill="#e5dcc8"/>
      <path d="M626 72Q529 109 645 139Q735 169 630 226L633 249H820V71Z" fill="${night?'#3a8fc4':'#96ecff'}"/>
      <path d="M646 82Q573 112 669 133Q784 170 674 221L674 249H820V71Z" fill="#62cdf4" opacity=".45"/>
      <g fill="none" stroke="#ccfbef" stroke-width="3" stroke-linecap="round" opacity=".7"><path d="M661 107Q704 101 740 109M707 180Q751 171 796 179"/></g>
      </g><g fill="${shade}" opacity=".38"><path d="M44 172Q18 155 29 148Q42 148 44 166Q47 139 60 144Q64 155 44 172Z"/><path d="M450 229Q428 208 438 205Q450 204 451 220Q455 199 464 205Q471 216 450 229Z"/></g>
    </g></svg>`;
  }
  function orchard(){return `<ellipse cx="85" cy="145" rx="67" ry="13" fill="#2f5c46" opacity=".18"/><path d="M20 132Q81 112 149 133Q147 149 86 151Q24 152 20 132Z" fill="#b7e779"/><path d="M75 134L78 64H94L100 134Z" fill="#c9bda4"/><path d="M85 131L87 71H94L100 134Z" fill="#a89478"/><path d="M83 105L60 82M90 100L114 74" fill="none" stroke="#a89478" stroke-width="6" stroke-linecap="round"/><path d="M29 78Q12 55 32 41Q31 17 60 20Q79-3 100 19Q134 11 137 39Q164 54 145 81Q119 103 90 88Q54 107 29 78Z" fill="#4e9677"/><path d="M29 64Q18 43 40 35Q43 15 67 27Q81 9 101 28Q127 20 132 44Q148 50 140 66Q117 81 88 68Q58 87 29 64Z" fill="#7fce54"/><path d="M39 42Q55 24 71 37Q83 21 100 37" fill="none" stroke="#b7e779" stroke-width="6" stroke-linecap="round"/><g fill="#ee806f" stroke="${ink}" stroke-width="1.6"><circle cx="48" cy="64" r="9"/><circle cx="105" cy="74" r="10"/><circle cx="120" cy="43" r="7"/></g><g fill="#ffa798"><circle cx="45" cy="61" r="3"/><circle cx="102" cy="70" r="3"/><circle cx="118" cy="41" r="2"/></g><path d="M23 134Q28 119 40 125L42 140M118 141Q123 123 133 128L136 143" fill="#4e9677"/>`;}
  function reeds(){return `<ellipse cx="90" cy="145" rx="67" ry="10" fill="#2f5c46" opacity=".18"/><path d="M14 130Q39 118 87 127Q129 113 157 132Q156 149 87 150Q23 150 14 130Z" fill="#96ecff"/><path d="M35 139Q69 130 116 138" fill="none" stroke="#ccfbef" stroke-width="4" stroke-linecap="round"/><g fill="none" stroke="#4e9677" stroke-width="4" stroke-linecap="round"><path d="M68 140L49 46M78 140L89 24M89 140L116 56"/></g><g fill="#c9bda4" stroke="${ink}" stroke-width="1.6"><rect x="40" y="29" width="13" height="39" rx="6" transform="rotate(-10 47 46)"/><rect x="85" y="12" width="13" height="40" rx="6" transform="rotate(5 91 32)"/><rect x="113" y="43" width="12" height="32" rx="6" transform="rotate(16 119 59)"/></g><path d="M73 140Q20 119 29 80Q55 83 73 140M86 141Q102 87 140 87Q142 122 86 141Z" fill="#4e9677"/><path d="M72 136Q50 114 31 85M90 136Q120 113 137 92" fill="none" stroke="#b7e779" stroke-width="2.4"/><ellipse cx="131" cy="140" rx="20" ry="7" fill="#7fce54"/><path d="M129 133Q112 122 126 119Q133 107 138 120Q149 121 139 132Z" fill="#ee806f"/><circle cx="134" cy="128" r="4" fill="#ffe49a"/>`;}
  function lantern(){return `<ellipse cx="89" cy="147" rx="65" ry="10" fill="#2f5c46" opacity=".25"/><path d="M19 139Q80 118 151 137L139 151H34Z" fill="#4e9677"/><path d="M45 141V48Q44 25 68 24H112" fill="none" stroke="#a89478" stroke-width="6" stroke-linecap="round"/><path d="M103 26V44" stroke="#4a3620" stroke-width="3"/><path d="M84 50L103 38L122 50L119 107Q103 118 87 107Z" fill="#c69434" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/><path d="M91 55H115L112 101H94Z" fill="#ffe49a"/><path d="M98 57H110L108 95H99Z" fill="#fffaf0"/><path d="M86 51H121M88 108H119" stroke="${ink}" stroke-width="3"/><path d="M104 88C83 76 101 63 110 64Q98 78 112 81Z" fill="#f3c955"/><path d="M26 142Q17 121 33 112Q46 119 42 140M127 142Q132 117 146 125Q154 139 127 142Z" fill="#b7e779"/><g fill="#ffe49a"><circle cx="67" cy="104" r="2"/><circle cx="143" cy="79" r="2"/><circle cx="27" cy="71" r="2"/></g>`;}
  function peaks(){return `<ellipse cx="87" cy="149" rx="73" ry="9" fill="#2f5c46" opacity=".18"/><path d="M9 145L61 40L107 145Z" fill="#c9bda4"/><path d="M61 40L70 144H107Z" fill="#a89478"/><path d="M45 72L61 40L76 71L61 65Z" fill="#fffaf0"/><path d="M62 145L115 10L165 145Z" fill="#e5dcc8"/><path d="M115 10L118 144H165Z" fill="#c9bda4"/><path d="M95 62L115 10L136 66L119 52L109 65Z" fill="#fffdf7"/><path d="M10 144Q56 129 84 141Q125 132 163 144L153 154H22Z" fill="#b7e779"/><path d="M28 141L41 107L54 141M128 144L141 113L154 144" fill="#4e9677"/><path d="M39 144V132M141 147V136" stroke="#a89478" stroke-width="3"/>`;}
  function bridge(){return `<ellipse cx="87" cy="146" rx="71" ry="12" fill="#2f5c46" opacity=".18"/><path d="M4 118Q68 140 168 107V149Q74 166 4 140Z" fill="#96ecff"/><path d="M15 135Q53 146 84 139M117 137L153 128" fill="none" stroke="#ccfbef" stroke-width="3" stroke-linecap="round"/><path d="M18 122Q84 58 155 110L150 130Q85 91 24 140Z" fill="#a89478"/><path d="M18 113Q82 50 155 101L150 119Q83 83 23 131Z" fill="#e5dcc8" stroke="${ink}" stroke-width="2.4"/><path d="M43 94L47 112M64 80L67 99M88 75V94M112 79L108 97M136 89L129 107" stroke="#c9bda4" stroke-width="3"/><path d="M22 125V89M154 113V78M22 93Q81 38 154 81" fill="none" stroke="#a89478" stroke-width="4" stroke-linecap="round"/><path d="M14 141Q3 124 11 114Q21 125 22 138M147 143Q151 126 164 121Q165 137 147 143Z" fill="#4e9677"/>`;}
  function landmark(biome='meadow',variant=0){
    if(biome==='meadow'&&variant%3===1)return ns.LettersGardenArt.seedBasket();
    const content=biome==='orchard'?orchard():biome==='lagoon'?reeds():biome==='night'?lantern():biome==='peaks'?peaks():biome==='river'?bridge():variant%3===2?orchard():`<g transform="translate(0 7)">${reeds()}</g>`;
    return `<svg viewBox="0 0 176 166" aria-hidden="true">${content}</svg>`;
  }
  function bank({biome='meadow',side=0,night=false}={}){return ground(biome,side,night);}
  ns.LettersMapArt={bank,landmark};
})(window.MiftahGame||(window.MiftahGame={}));

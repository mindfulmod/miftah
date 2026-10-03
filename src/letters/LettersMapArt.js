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

  // Brooks connect the habitats (update 2): one wherever the trail passes into
  // a new habitat, plus a rhythm brook in long single-habitat stretches so the
  // first bridge arrives early. Stops are in world order.
  function brookIndices(stops=[]){
    const boundary=[];
    for(let i=0;i<stops.length-1;i++)if(stops[i].biome!==stops[i+1].biome)boundary.push(i);
    const rhythm=[];
    for(let i=0;i<stops.length-1;i++)if((i+1)%4===3&&!boundary.some(b=>Math.abs(b-i)<=2))rhythm.push(i);
    return [...new Set([...boundary,...rhythm])].sort((a,b)=>a-b);
  }
  function shorePoints(w,lane,stops){
    return stops.slice().sort((a,b)=>a.y-b.y).map((stop,i)=>[w/2+lane*((stop.left ? .30 : .53)+.025*Math.sin(i*2.3)),stop.y]);
  }
  // Brook geometry in landscape coordinates: spring (x0) to river shore (x1).
  function brooks({width=800,pathWidth=780,stops=[]}={}){
    const w=Math.max(1,width),lane=Math.min(w,pathWidth),shore=shorePoints(w,lane,stops);
    const shoreX=y=>{
      for(let k=1;k<shore.length;k++){const a=shore[k-1],b=shore[k];if(y>=a[1]&&y<=b[1])return a[0]+(b[0]-a[0])*((y-a[1])/((b[1]-a[1])||1));}
      return shore.length?shore[shore.length-1][0]:w*.86;
    };
    // The brook runs level across the trail, then falls toward the river. When
    // the lower stop sits on the left, it falls toward that stop's open bank.
    return brookIndices(stops).map(i=>{
      const y=(stops[i].y+stops[i+1].y)/2,gap=Math.abs(stops[i].y-stops[i+1].y);
      const y2=y+(stops[i].left?gap*.28:0);
      return {after:i,y,y2,x0:w/2-lane*.2,x1:shoreX(y2)};
    });
  }
  // The brook is drawn as filled bands (no wide strokes): a centreline runs
  // level across the trail, then eases down to its river mouth.
  function brookArt(b,night){
    const {x0,x1,y}=b,y2=b.y2??y,xc=(x0+x1)/2+20,end=x1+50,n=28;
    const pts=[];
    for(let k=0;k<=n;k++){
      const x=x0+(end-x0)*k/n,t=Math.max(0,Math.min(1,(x-xc)/((x1-xc)||1)));
      const ease=t*t*(3-2*t);
      pts.push([x,y+(y2-y)*ease+5*Math.sin((x-x0)/38),7+4*k/n]);
    }
    const band=(grow,dy=0)=>{
      const top=[],bottom=[];
      pts.forEach(([x,cy,hw],k)=>{
        const [px,py]=pts[Math.max(0,k-1)],[nx,ny]=pts[Math.min(n,k+1)];
        const len=Math.hypot(nx-px,ny-py)||1,ox=-(ny-py)/len,oy=(nx-px)/len,h=hw+grow;
        top.push(`${(x+ox*h).toFixed(1)} ${(cy+oy*h+dy).toFixed(1)}`);bottom.unshift(`${(x-ox*h).toFixed(1)} ${(cy-oy*h+dy).toFixed(1)}`);
      });
      return `M${top.join('L')}L${bottom.join('L')}Z`;
    };
    const line=pts.map(([x,cy],k)=>`${k?'L':'M'}${x.toFixed(1)} ${cy.toFixed(1)}`).join('');
    const water=night?'#3a8fc4':'#62cdf4',light=night?'#62cdf4':'#96ecff',bank=night?'#a89478':'#e5dcc8';
    return `<g class="map-brook">
      <path d="${band(8,3)}" fill="#2f5c46" opacity=".14"/>
      <path d="${band(4)}" fill="${bank}"/>
      <path d="${band(0)}" fill="${water}"/>
      <path d="${line}" fill="none" stroke="${light}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" opacity=".8"/>
      <path d="${line}" fill="none" stroke="#ccfbef" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="10 28" opacity="${night?.3:.8}"/>
      <ellipse cx="${x0-6}" cy="${y+2}" rx="24" ry="13" fill="${bank}"/>
      <ellipse cx="${x0-6}" cy="${y+1}" rx="17" ry="8" fill="${water}"/>
      <ellipse cx="${x0-10}" cy="${y-1}" rx="7" ry="3" fill="${light}"/>
      <ellipse cx="${x0-28}" cy="${y+9}" rx="7" ry="5" fill="#c9bda4"/><ellipse cx="${x0-29}" cy="${y+7}" rx="5" ry="3" fill="#e5dcc8"/>
    </g>`;
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
    // Moonlit grass keeps its green identity. Reserve the darkest foliage for
    // small banks and contact shadows, never the whole walkable landscape.
    const soil=night?'#7fce54':'#b7e779';
    const grass=night?'#4e9677':'#7fce54';
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
    // Land bands (2026-10-02 overworld pass): each land's stretch of the map
    // gets its own ground — golden orchard grass, teal lagoon, dusky night
    // garden, stony peaks, sandy riverlands — feathered into its neighbours,
    // so walking up the map reads as travelling between places.
    const LAND={orchard:['#f3c955',.24],lagoon:['#62cdf4',.18],night:['#4a4d84',night?.18:.32],peaks:['#e5dcc8',.6],river:['#ccfbef',.28]};
    const runs=[];
    ordered.forEach(stop=>{const last=runs[runs.length-1];if(last&&last.biome===stop.biome){last.top=Math.min(last.top,stop.y);last.bottom=Math.max(last.bottom,stop.y);}else runs.push({biome:stop.biome,top:stop.y,bottom:stop.y});});
    const gap=ordered.length>1?Math.abs(ordered[1].y-ordered[0].y):220;
    const bandDefs=[],bands=[],scenery=[];
    runs.forEach((run,k)=>{
      const tint=LAND[run.biome];if(!tint)return;
      const y0=run.top-gap*.75,y1=run.bottom+gap*.75,gid=`${id}-band${k}`;
      bandDefs.push(`<linearGradient id="${gid}" x1="0" x2="0" y1="0" y2="1"><stop stop-color="${tint[0]}" stop-opacity="0"/><stop offset=".18" stop-color="${tint[0]}" stop-opacity="${tint[1]}"/><stop offset=".82" stop-color="${tint[0]}" stop-opacity="${tint[1]}"/><stop offset="1" stop-color="${tint[0]}" stop-opacity="0"/></linearGradient>`);
      bands.push(`<rect class="map-land-band" data-land="${run.biome}" x="0" y="${y0.toFixed(0)}" width="${w}" height="${(y1-y0).toFixed(0)}" fill="url(#${gid})"/>`);
      // Edge scenery, in the left margin and between stops — never on the route.
      const left=Math.max(8,(w-lane)/2);
      for(let y=y0+gap*.5;y<y1-gap*.3;y+=gap*.5){
        const x=left+lane*(.03+((y/gap)%3)*.02),j=Math.round(y)%3;
        if(run.biome==='orchard')scenery.push(`<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)})" opacity=".6"><path d="M-10 0H34M-6 9H38M-2 18H42" stroke="#c69434" stroke-width="3" stroke-linecap="round" stroke-dasharray="6 6"/></g>`);
        else if(run.biome==='lagoon')scenery.push(`<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)})"><ellipse rx="${22+j*6}" ry="${8+j*2}" fill="#96ecff" opacity=".85"/><path d="M-8 -1q8-4 16 0" stroke="#ccfbef" stroke-width="2.4" fill="none" stroke-linecap="round"/></g>`);
        else if(run.biome==='night')scenery.push(`<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)})"><circle r="10" fill="#ffe49a" opacity=".22"/><circle r="3" fill="#ffe49a"/><circle cx="22" cy="12" r="2.4" fill="#ffe49a" opacity=".8"/></g>`);
        else if(run.biome==='peaks')scenery.push(`<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)})"><path d="M-14 8Q-16-6-2-10Q14-12 18 2Q18 10 8 10H-8Q-14 10-14 8Z" fill="#c9bda4"/><path d="M-6-6Q2-9 10-6" stroke="#e5dcc8" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M-14 8H18" stroke="#a89478" stroke-width="2.4" stroke-linecap="round"/></g>`);
        else if(run.biome==='river')scenery.push(`<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)})"><ellipse rx="26" ry="8" fill="#e5dcc8"/><path d="M-12 -2l4-8M2 -3l2-9M12 -2l5-7" stroke="#4e9677" stroke-width="2.4" stroke-linecap="round"/></g>`);
      }
    });
    const undergrowth=ordered.map((stop,i)=>{
      // Quiet edge clusters use the same perspective as the landmarks. They
      // never enter the central route, a star plaque, or the pet's space.
      const x=Math.max(8,(w-lane)/2)+lane*(.025+(i%3)*.012);
      const y=stop.y+(i%2?-52:62),scale=[.65,.85,1][i%3];
      return `<g transform="translate(${x} ${y}) scale(${scale})" opacity="${night ? .85 : .8}">
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
        ${habitatDefs}${bandDefs.join('')}
        <linearGradient id="${id}-light" x1="0" x2="1" y1="0" y2="0"><stop stop-color="${paper}" stop-opacity="0"/><stop offset=".4" stop-color="${paper}" stop-opacity="${night ? .08 : .12}"/><stop offset="1" stop-color="${paper}" stop-opacity="0"/></linearGradient>
      </defs>
      <path class="map-ground-plane" d="M0 0H${w}V${h}H0Z" fill="url(#${id}-ground)"/>
      <path d="M0 0H${w}V${h}H0Z" fill="url(#${id}-light)"/>
      <path d="${verge(38)}" fill="#4e9677" opacity="${night ? .22 : .12}"/>
      <path d="${verge()}" fill="#2f5c46" opacity="${night ? .25 : .12}"/>
      ${bands.join('')}${patches}${scenery.join('')}${undergrowth}
      ${brooks({width:w,pathWidth,stops}).map(b=>brookArt(b,night)).join('')}
      <path d="${water(-30)}" fill="#4e9677" opacity=".22"/>
      <path d="${water(-17)}" fill="${night?'#a89478':'#e5dcc8'}"/>
      <path d="${water(-10)}" fill="${night?'#c9bda4':paper}" opacity=".65"/>
      <path class="map-river" d="${water()}" fill="url(#${id}-water)"/>
      <path d="${water(22)}" fill="#62cdf4" opacity="${night ? .15 : .3}"/>
      <g fill="none" stroke="#ccfbef" stroke-width="3" stroke-linecap="round" opacity="${night ? .2 : .5}">${glints.join('')}</g>
    </svg>`;
  }
  function orchard(){return `<ellipse cx="85" cy="145" rx="67" ry="13" fill="#2f5c46" opacity=".18"/><path d="M20 132Q81 112 149 133Q147 149 86 151Q24 152 20 132Z" fill="#b7e779"/><path d="M75 134L78 64H94L100 134Z" fill="#c9bda4"/><path d="M85 131L87 71H94L100 134Z" fill="#a89478"/><path d="M83 105L60 82M90 100L114 74" fill="none" stroke="#a89478" stroke-width="6" stroke-linecap="round"/><g class="lm-canopy"><path d="M29 78Q12 55 32 41Q31 17 60 20Q79-3 100 19Q134 11 137 39Q164 54 145 81Q119 103 90 88Q54 107 29 78Z" fill="#4e9677"/><path d="M29 64Q18 43 40 35Q43 15 67 27Q81 9 101 28Q127 20 132 44Q148 50 140 66Q117 81 88 68Q58 87 29 64Z" fill="#7fce54"/><path d="M39 42Q55 24 71 37Q83 21 100 37" fill="none" stroke="#b7e779" stroke-width="6" stroke-linecap="round"/></g>${[[48,64,9],[105,74,10],[120,43,7]].map(([x,y,r])=>`<g class="lm-fruit" data-y="${y}"><circle cx="${x}" cy="${y}" r="${r}" fill="#ee806f" stroke="${ink}" stroke-width="1.6"/><circle cx="${x-3}" cy="${y-3}" r="${Math.max(2,r/3)}" fill="#ffa798"/></g>`).join('')}<path d="M23 134Q28 119 40 125L42 140M118 141Q123 123 133 128L136 143" fill="#4e9677"/>`;}
  function reeds(){return `<ellipse cx="90" cy="145" rx="67" ry="10" fill="#2f5c46" opacity=".18"/><path d="M14 130Q39 118 87 127Q129 113 157 132Q156 149 87 150Q23 150 14 130Z" fill="#96ecff"/><path d="M35 139Q69 130 116 138" fill="none" stroke="#ccfbef" stroke-width="4" stroke-linecap="round"/><g class="lm-reeds"><g fill="none" stroke="#4e9677" stroke-width="4" stroke-linecap="round"><path d="M68 140L49 46M78 140L89 24M89 140L116 56"/></g><g fill="#c9bda4" stroke="${ink}" stroke-width="1.6"><rect x="40" y="29" width="13" height="39" rx="6" transform="rotate(-10 47 46)"/><rect x="85" y="12" width="13" height="40" rx="6" transform="rotate(5 91 32)"/><rect x="113" y="43" width="12" height="32" rx="6" transform="rotate(16 119 59)"/></g></g><g class="lm-bug"><ellipse cx="47" cy="128" rx="9" ry="7" fill="#ee806f" stroke="${ink}" stroke-width="1.6"/><path d="M47 121V135" stroke="${ink}" stroke-width="1.6"/><circle cx="38" cy="126" r="3.5" fill="${ink}"/><circle cx="43" cy="126" r="1.6" fill="${ink}"/><circle cx="51" cy="131" r="1.6" fill="${ink}"/></g><g class="lm-leaf"><path d="M73 140Q20 119 29 80Q55 83 73 140Z" fill="#4e9677"/><path d="M72 136Q50 114 31 85" fill="none" stroke="#b7e779" stroke-width="2.4"/></g><path d="M86 141Q102 87 140 87Q142 122 86 141Z" fill="#4e9677"/><path d="M90 136Q120 113 137 92" fill="none" stroke="#b7e779" stroke-width="2.4"/><ellipse cx="131" cy="140" rx="20" ry="7" fill="#7fce54"/><path d="M129 133Q112 122 126 119Q133 107 138 120Q149 121 139 132Z" fill="#ee806f"/><circle cx="134" cy="128" r="4" fill="#ffe49a"/>`;}
  function lantern(){return `<ellipse cx="89" cy="147" rx="65" ry="10" fill="#2f5c46" opacity=".25"/><path d="M19 139Q80 118 151 137L139 151H34Z" fill="#4e9677"/><path d="M45 141V48Q44 25 68 24H112" fill="none" stroke="#a89478" stroke-width="6" stroke-linecap="round"/><path d="M103 26V44" stroke="#4a3620" stroke-width="3"/><circle class="lm-glow" cx="103" cy="80" r="44" fill="#ffe49a" opacity="0"/><path d="M84 50L103 38L122 50L119 107Q103 118 87 107Z" fill="#c69434" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/><path d="M91 55H115L112 101H94Z" fill="#ffe49a"/><path d="M98 57H110L108 95H99Z" fill="#fffaf0"/><path d="M86 51H121M88 108H119" stroke="${ink}" stroke-width="3"/><path d="M104 88C83 76 101 63 110 64Q98 78 112 81Z" fill="#f3c955"/><path d="M26 142Q17 121 33 112Q46 119 42 140M127 142Q132 117 146 125Q154 139 127 142Z" fill="#b7e779"/><g fill="#ffe49a">${[[67,104],[143,79],[27,71],[88,124],[124,118]].map(([x,y],i)=>`<circle class="lm-fly" cx="${x}" cy="${y}" r="2" opacity="${i<3?1:0}"/>`).join('')}</g>`;}
  function peaks(){return `<ellipse cx="87" cy="149" rx="73" ry="9" fill="#2f5c46" opacity=".18"/><path d="M9 145L61 40L107 145Z" fill="#c9bda4"/><path d="M61 40L70 144H107Z" fill="#a89478"/><path d="M45 72L61 40L76 71L61 65Z" fill="#fffaf0"/><path d="M62 145L115 10L165 145Z" fill="#e5dcc8"/><path d="M115 10L118 144H165Z" fill="#c9bda4"/><path d="M95 62L115 10L136 66L119 52L109 65Z" fill="#fffdf7"/><path d="M10 144Q56 129 84 141Q125 132 163 144L153 154H22Z" fill="#b7e779"/><path d="M28 141L41 107L54 141M128 144L141 113L154 144" fill="#4e9677"/><path d="M39 144V132M141 147V136" stroke="#a89478" stroke-width="3"/>`;}
  // The meadow's own landmark: a wildflower patch with a little skep hive.
  function wildflowers(){return `<ellipse cx="88" cy="146" rx="70" ry="10" fill="#2f5c46" opacity=".18"/><path d="M16 138Q84 112 158 136Q150 152 86 152Q24 152 16 138Z" fill="#b7e779"/><g class="lm-hive"><path d="M110 132Q108 92 132 88Q156 92 154 132Z" fill="#f3c955" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/><path d="M112 118Q132 112 152 118M111 104Q132 98 153 104" fill="none" stroke="#c69434" stroke-width="2.4"/><path d="M127 132Q127 122 132 122Q137 122 137 132Z" fill="${ink}"/></g>${[[34,96,'#ffa798'],[58,84,'#b49fcf'],[80,100,'#f3c955'],[46,116,'#ee806f'],[96,118,'#ffa798']].map(([x,y,c])=>`<path d="M${x} 138Q${x+2} ${y+20} ${x} ${y+6}" fill="none" stroke="#4e9677" stroke-width="3" stroke-linecap="round"/><g transform="translate(${x} ${y})">${[0,72,144,216,288].map(a=>`<ellipse cy="-6" rx="4.5" ry="7" transform="rotate(${a})" fill="${c}" stroke="${ink}" stroke-width="1.6"/>`).join('')}<circle r="3.5" fill="#ffe49a" stroke="${ink}" stroke-width="1.6"/></g>`).join('')}<path d="M24 138Q30 124 38 132M64 140Q70 126 78 134" fill="#7fce54"/>`;}
  function landing(){return `<ellipse cx="80" cy="137" rx="66" ry="9" fill="#2f5c46" opacity=".18"/><path d="M8 132Q41 114 72 127L70 145Q31 151 8 132Z" fill="#b7e779"/><path d="M62 125L157 105V124L64 144Z" fill="#a89478"/><path d="M60 111L159 91L166 112L63 135Z" fill="#e5dcc8" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"/><path d="M74 109L79 128M94 105L99 124M114 101L119 120M135 96L141 115" stroke="#c9bda4" stroke-width="3"/><path d="M65 112V91M154 94V75M66 95L153 78" fill="none" stroke="#a89478" stroke-width="4" stroke-linecap="round"/><path d="M70 135V147M155 116V132" stroke="#a89478" stroke-width="6" stroke-linecap="round"/><path d="M32 135Q12 126 16 109Q32 116 32 135M39 137Q39 111 53 103Q60 121 39 137Z" fill="#4e9677"/><path d="M51 134Q58 119 68 126L70 138Z" fill="#7fce54"/><path d="M146 144L169 139" stroke="#ccfbef" stroke-width="2.4" stroke-linecap="round"/>`;}
  // Which landmark a chapter shows. Orchard trees, pond reeds and lanterns are toys.
  function kind(biome='meadow',variant=0){
    if(biome==='meadow'&&variant===1)return'basket';
    if(biome==='orchard')return'orchard';
    if(biome==='lagoon')return'reeds';
    if(biome==='night')return'lantern';
    if(biome==='peaks')return'peaks';
    // Each land keeps its own signature (2026-10-02 overworld pass): fruit
    // trees only in the orchard; the meadow has wildflowers and ponds; the
    // river has jetties and reeds.
    if(biome==='river')return variant%2?'reeds':'landing';
    return variant%2?'reeds':'meadow';
  }
  const TOYS={orchard:'Shake the tree',reeds:'Lift the leaf',lantern:'Light the lantern',waterwheel:'Turn the waterwheel'};

  // A footbridge laid along the trail's direction where it crosses a brook.
  // Centered on the crossing; planks run across the path, rails along it.
  function bridge(){
    const planks=[-22,-14,-6,2,10,18].map(x=>`<path d="M${x} -11V11"/>`).join('');
    return `<ellipse cx="0" cy="10" rx="38" ry="7" fill="#2f5c46" opacity=".2"/>
      <rect x="-31" y="-14" width="62" height="28" rx="6" fill="#c9bda4" stroke="${ink}" stroke-width="2.4"/>
      <g stroke="#a89478" stroke-width="2.4">${planks}</g>
      <path d="M-27 -9H27" stroke="#e5dcc8" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M-31 -15H31M-31 15H31" stroke="#a89478" stroke-width="4" stroke-linecap="round"/>
      <g fill="#a89478" stroke="${ink}" stroke-width="1.6"><circle cx="-31" cy="-15" r="3.5"/><circle cx="31" cy="-15" r="3.5"/><circle cx="-31" cy="15" r="3.5"/><circle cx="31" cy="15" r="3.5"/></g>`;
  }

  // A wooden waterwheel standing in a brook. It turns slowly on its own.
  function waterwheel(){
    const spokes=[0,45,90,135].map(a=>`<path d="M60 18V98" transform="rotate(${a} 60 58)"/>`).join('');
    const paddles=[0,45,90,135,180,225,270,315].map(a=>`<rect x="53" y="10" width="14" height="13" rx="2" transform="rotate(${a} 60 58)"/>`).join('');
    const drops=[[24,96],[36,88],[86,90],[98,98]].map(([x,y])=>`<circle class="lm-drop" cx="${x}" cy="${y}" r="3" fill="#96ecff" opacity="0"/>`).join('');
    return `<svg viewBox="0 0 120 130" aria-hidden="true">
      <ellipse cx="60" cy="112" rx="54" ry="12" fill="#2f5c46" opacity=".16"/>
      <path d="M22 108L44 50M98 108L76 50" stroke="#a89478" stroke-width="8" stroke-linecap="round"/>
      <path d="M24 106L44 52" stroke="#c9bda4" stroke-width="2.4" stroke-linecap="round"/>
      <g class="lm-spin"><g class="lm-wheel">
        <circle cx="60" cy="58" r="41" fill="none" stroke="${ink}" stroke-width="3"/>
        <circle cx="60" cy="58" r="38" fill="none" stroke="#a89478" stroke-width="6"/>
        <g stroke="#a89478" stroke-width="4" stroke-linecap="round">${spokes}</g>
        <g fill="#c9bda4" stroke="${ink}" stroke-width="1.6">${paddles}</g>
        <circle cx="60" cy="58" r="9" fill="#c9bda4" stroke="${ink}" stroke-width="2.4"/><circle cx="58" cy="56" r="3" fill="#e5dcc8"/>
      </g></g>
      <path d="M8 106Q60 92 112 106Q112 122 60 124Q8 122 8 106Z" fill="#62cdf4"/>
      <path d="M22 106Q60 98 98 106" fill="none" stroke="#96ecff" stroke-width="4" stroke-linecap="round"/>
      <path d="M30 114Q60 109 88 114" fill="none" stroke="#ccfbef" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>
      ${drops}
    </svg>`;
  }

  // Touch toys on the home map. Pure decoration: nothing here is saved,
  // scored or rewarded, and every toy returns to its resting state.
  function play(button,toy,{reduced=false,onLand}={}){
    const svg=button?.querySelector('svg');
    if(!svg||button.dataset.playing)return false;
    button.dataset.playing='1';
    const done=ms=>setTimeout(()=>{delete button.dataset.playing;},ms);
    const anim=(el,frames,opts)=>el?.animate?.(frames,{fill:'forwards',easing:'ease-out',...opts});
    const at=(el,x,y)=>{if(el){el.style.transformBox='view-box';el.style.transformOrigin=`${x}px ${y}px`;}};
    if(toy==='orchard'){
      const canopy=svg.querySelector('.lm-canopy');at(canopy,88,120);
      if(!reduced)anim(canopy,[{transform:'rotate(0)'},{transform:'rotate(-5deg)'},{transform:'rotate(4deg)'},{transform:'rotate(-3deg)'},{transform:'rotate(0)'}],{duration:620,easing:'ease-in-out'});
      svg.querySelectorAll('.lm-fruit').forEach((fruit,i)=>{
        const fall=136-Number(fruit.dataset.y),roll=[-14,10,18][i]||0;
        const keep=reduced?[{transform:`translate(${roll}px,${fall}px)`}]:[
          {transform:'translate(0,0)',offset:0},{transform:'translate(0,0)',offset:.25},
          {transform:`translate(${roll*.5}px,${fall}px)`,offset:.6,easing:'ease-in'},
          {transform:`translate(${roll*.7}px,${fall-12}px)`,offset:.75},{transform:`translate(${roll}px,${fall}px)`,offset:1}];
        anim(fruit,keep,{duration:reduced?1:900+i*120,easing:'linear'});
        if(i===0&&!reduced)setTimeout(()=>onLand?.(),560);
        // The fruit fades and grows back on its branch.
        setTimeout(()=>{if(!fruit.isConnected)return;anim(fruit,[{opacity:1,transform:`translate(${roll}px,${fall}px)`},{opacity:0,transform:`translate(${roll}px,${fall}px)`}],{duration:reduced?1:300}).finished?.then(()=>{anim(fruit,[{opacity:0,transform:'translate(0,0) scale(.3)'},{opacity:1,transform:'translate(0,0) scale(1)'}],{duration:reduced?1:380,easing:'cubic-bezier(.2,.8,.2,1)'});});},2600);
      });
      done(3400);
    }else if(toy==='reeds'){
      const leaf=svg.querySelector('.lm-leaf'),reeds=svg.querySelector('.lm-reeds');at(leaf,73,140);at(reeds,80,140);
      if(!reduced)anim(reeds,[{transform:'rotate(0)'},{transform:'rotate(3deg)'},{transform:'rotate(-2deg)'},{transform:'rotate(0)'}],{duration:900,easing:'ease-in-out'});
      anim(leaf,[{transform:'rotate(0)'},{transform:'rotate(38deg)',offset:.18},{transform:'rotate(38deg)',offset:.82},{transform:'rotate(0)'}],{duration:reduced?2600:2800,easing:reduced?'steps(1,end)':'ease-in-out'});
      const bug=svg.querySelector('.lm-bug');at(bug,47,128);
      if(!reduced)anim(bug,[{transform:'translate(0,0)'},{transform:'translate(0,0)',offset:.25},{transform:'translate(3px,-2px)',offset:.4},{transform:'translate(-2px,0)',offset:.55},{transform:'translate(0,0)'}],{duration:2800});
      done(2900);
    }else if(toy==='lantern'){
      const glow=svg.querySelector('.lm-glow');
      anim(glow,reduced?[{opacity:.35},{opacity:0}]:[{opacity:0},{opacity:.55,offset:.2},{opacity:.35,offset:.6},{opacity:0}],{duration:reduced?1500:2200});
      svg.querySelectorAll('.lm-fly').forEach((fly,i)=>{
        if(reduced)return;
        const dx=[-10,14,8,-16,6][i]||0;
        anim(fly,[{opacity:fly.getAttribute('opacity'),transform:'translate(0,0)'},{opacity:1,transform:`translate(${dx}px,-30px)`,offset:.5},{opacity:Number(fly.getAttribute('opacity')),transform:'translate(0,0)'}],{duration:2000+i*180,easing:'ease-in-out'});
      });
      done(2400);
    }else if(toy==='waterwheel'){
      const spin=svg.querySelector('.lm-spin');at(spin,60,58);
      anim(spin,[{transform:'rotate(0)'},{transform:`rotate(${reduced?45:540}deg)`}],{duration:reduced?1:1600,easing:'cubic-bezier(.2,.8,.2,1)',fill:'none'});
      if(!reduced)svg.querySelectorAll('.lm-drop').forEach((drop,i)=>{
        const dx=[-10,-6,6,10][i]||0;
        anim(drop,[{opacity:0,transform:'translate(0,0)'},{opacity:1,transform:`translate(${dx}px,-22px)`,offset:.4},{opacity:0,transform:`translate(${dx*1.6}px,2px)`}],{duration:700,delay:150+i*120,easing:'ease-out'});
      });
      done(1700);
    }else{delete button.dataset.playing;return false;}
    return true;
  }

  function landmark(biome='meadow',variant=0){
    if(biome==='meadow'&&variant===1)return ns.LettersGardenArt.seedBasket();
    const content=biome==='orchard'?orchard():biome==='lagoon'?reeds():biome==='night'?lantern():biome==='peaks'?peaks():biome==='river'?(variant%2?reeds():landing()):variant%2?`<g transform="translate(0 7)">${reeds()}</g>`:wildflowers();
    return `<svg viewBox="0 0 176 166" aria-hidden="true">${content}</svg>`;
  }
  // Land gates (2026-10-01): a wooden arch where the trail crosses into a new
  // land, past that boundary's bridge. Its banner carries the land's sign —
  // rolled up until the child reaches the land, unfurled after; the first
  // unfurl is the arrival ceremony. Drawn upright, centred on the trail.
  const LAND_SIGNS={
    orchard:`<circle cx="0" cy="2" r="9" fill="#ee806f" stroke="${ink}" stroke-width="1.6"/><path d="M0-7Q2-12 6-13" fill="none" stroke="#4e9677" stroke-width="2.4" stroke-linecap="round"/><path d="M1-9Q7-12 9-7Q4-6 1-9Z" fill="#7fce54"/>`,
    lagoon:`<path d="M-11 6Q-5 1 0 6Q5 11 11 6" fill="none" stroke="#3a8fc4" stroke-width="2.4" stroke-linecap="round"/><path d="M-2 4V-12M3 4V-8" stroke="#4e9677" stroke-width="2.4" stroke-linecap="round"/><path d="M-2-12Q-5-16-2-19Q1-16-2-12Z" fill="#70501b"/>`,
    night:`<path d="M4-11A11 11 0 1 0 6 9A8 8 0 1 1 4-11Z" fill="#ffe49a" stroke="${ink}" stroke-width="1.6"/><circle cx="9" cy="-8" r="1.6" fill="#f3c955"/>`,
    peaks:`<path d="M-12 9L-3-8L2 0L6-6L13 9Z" fill="#c9bda4" stroke="${ink}" stroke-width="1.6" stroke-linejoin="round"/><path d="M-3-8L0-3L-6-3Z" fill="#fffdf7"/>`,
    river:`<path d="M-12-3Q-6-8 0-3Q6 2 12-3M-12 5Q-6 0 0 5Q6 10 12 5" fill="none" stroke="#3a8fc4" stroke-width="2.4" stroke-linecap="round"/>`,
  };
  function gate(biome='orchard',open=false,dir=1){
    // A banner pole on the bank: narrow enough to stand beside a bridge on a
    // phone map. dir=1 hangs the banner to the right of the pole.
    const d=dir<0?-1:1;
    return `<g class="map-gate${open?' is-open':''}" data-land="${biome}">
      <ellipse cx="${d*8}" cy="3" rx="22" ry="5" fill="#2f5c46" opacity=".2"/>
      <path d="M0 2V-82" stroke="${ink}" stroke-width="8" stroke-linecap="round"/>
      <path d="M0 2V-82" stroke="#a89478" stroke-width="4" stroke-linecap="round"/>
      <circle cy="-86" r="6" fill="#f3c955" stroke="${ink}" stroke-width="2.4"/>
      <path d="M0-74H${d*40}" stroke="${ink}" stroke-width="6" stroke-linecap="round"/>
      <path d="M0-74H${d*40}" stroke="#c69434" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M-6-10Q-14-4-16 2M6-10Q14-4 16 2" fill="none" stroke="#4e9677" stroke-width="2.4" stroke-linecap="round"/>
      <g class="map-gate-banner" transform="translate(${d*22} 0)"><path d="M-15-72H15V-34L0-27L-15-34Z" fill="#fffaf0" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"/><g transform="translate(0 -51) scale(.9)">${LAND_SIGNS[biome]||''}</g></g>
      <g class="map-gate-roll" transform="translate(${d*22} 0)"><rect x="-16" y="-75" width="32" height="9" rx="4.5" fill="#fffaf0" stroke="${ink}" stroke-width="2.4"/><path d="M-12-70.5H12" stroke="#e5dcc8" stroke-width="1.6"/></g>
    </g>`;
  }
  ns.LettersMapArt={gate,LAND_SIGNS,landscape,landmark,kind,TOYS,play,brooks,brookIndices,waterwheel,bridge};
})(window.MiftahGame||(window.MiftahGame={}));

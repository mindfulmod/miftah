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
      const tint=LAND[run.biome];if(!tint&&run.biome!=='meadow')return;
      const y0=run.top-gap*.75,y1=run.bottom+gap*.75,gid=`${id}-band${k}`;
      if(tint)bandDefs.push(`<linearGradient id="${gid}" x1="0" x2="0" y1="0" y2="1"><stop stop-color="${tint[0]}" stop-opacity="0"/><stop offset=".18" stop-color="${tint[0]}" stop-opacity="${tint[1]}"/><stop offset=".82" stop-color="${tint[0]}" stop-opacity="${tint[1]}"/><stop offset="1" stop-color="${tint[0]}" stop-opacity="0"/></linearGradient>`);
      if(tint)bands.push(`<rect class="map-land-band" data-land="${run.biome}" x="0" y="${y0.toFixed(0)}" width="${w}" height="${(y1-y0).toFixed(0)}" fill="url(#${gid})"/>`);
      // Edge scenery, in the left margin and between stops — never on the route.
      const left=Math.max(8,(w-lane)/2);
      for(let y=y0+gap*.5;y<y1-gap*.3;y+=gap*.5){
        const x=left+lane*(.03+((y/gap)%3)*.02),j=Math.round(y)%3;
        // v115: land scenery in the pet language (round, inked, one shine).
        if(run.biome==='orchard')scenery.push(`<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)})"><ellipse cx="2" cy="13" rx="22" ry="4.5" fill="#2f5c46" opacity=".18"/>${[[-8,-6],[0,-9],[8,-6],[-3,-3],[5,-3]].map(([ax,ay],k)=>`<circle cx="${ax}" cy="${ay}" r="4.5" fill="${k%3===1?'#f3c955':'#ee806f'}" stroke="#4a3620" stroke-width="1.6"/>`).join('')}<rect x="-16" y="-3" width="32" height="15" rx="4" fill="#c69434" stroke="#4a3620" stroke-width="2.4"/><path d="M-12 2H12M-12 7H12" stroke="#70501b" stroke-width="1.6" stroke-linecap="round"/><rect x="-18" y="-5" width="36" height="5" rx="2.5" fill="#ffe49a" stroke="#4a3620" stroke-width="1.6"/>${j?`<circle cx="24" cy="10" r="4" fill="#ee806f" stroke="#4a3620" stroke-width="1.6"/>`:''}</g>`);
        // v207: the meadow had no edge scenery (empty green between stops); it gets grass tufts with small flowers, same safe margin.
        else if(run.biome==='meadow')scenery.push(`<g transform="translate(${(x+34).toFixed(0)} ${(y-18).toFixed(0)})"><path d="M-8 6Q-8 -2 -4 -4M0 6Q0 -4 3 -7M8 6Q9 0 12 -1" fill="none" stroke="#4e9677" stroke-width="3" stroke-linecap="round"/>${[0,72,144,216,288].map(a=>`<circle cx="3" cy="${-12}" r="3" fill="${['#ffa798','#e6d6f0','#ffe49a'][j]}" stroke="${['#ee806f','#b49fcf','#c69434'][j]}" stroke-width="1.6" transform="rotate(${a} 3 -9)"/>`).join('')}<circle cx="3" cy="-9" r="2.4" fill="#f3c955" stroke="#c69434" stroke-width="1.6"/></g>`);
        else if(run.biome==='lagoon')scenery.push(`<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)})"><ellipse rx="${22+j*6}" ry="${8+j*2}" fill="#96ecff" opacity=".85"/><path d="M-8 -1q8-4 16 0" stroke="#ccfbef" stroke-width="2.4" fill="none" stroke-linecap="round"/></g>`);
        else if(run.biome==='night')scenery.push(`<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)})"><circle r="10" fill="#ffe49a" opacity=".22"/><circle r="3" fill="#ffe49a"/><circle cx="22" cy="12" r="2.4" fill="#ffe49a" opacity=".8"/></g>`);
        else if(run.biome==='peaks')scenery.push(`<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)})"><ellipse cx="4" cy="11" rx="20" ry="4" fill="#2f5c46" opacity=".18"/><path d="M-14 8Q-16-6-2-10Q14-12 18 2Q18 10 8 10H-8Q-14 10-14 8Z" fill="#c9bda4" stroke="#4a3620" stroke-width="2.4" stroke-linejoin="round"/><path d="M-4 2Q2 0 8 3" stroke="#a89478" stroke-width="2.4" fill="none" stroke-linecap="round"/><ellipse cx="-4" cy="-4" rx="5" ry="2" fill="#fffdf7" opacity=".7"/><ellipse cx="22" cy="9" rx="5" ry="3.5" fill="#e5dcc8" stroke="#a89478" stroke-width="1.6"/></g>`);
        else if(run.biome==='river')scenery.push(`<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)})"><ellipse rx="26" ry="8" fill="#e5dcc8" stroke="#a89478" stroke-width="1.6"/><path d="M-10 0Q-14 -10 -10 -16Q-6 -8 -8 0ZM2 -1Q0 -14 4 -20Q8 -10 6 -1ZM12 0Q16 -9 20 -12Q20 -4 14 0Z" fill="#7fce54" stroke="#4e9677" stroke-width="1.6" stroke-linejoin="round"/></g>`);
      }
    });
    const undergrowth=ordered.map((stop,i)=>{
      // Quiet edge clusters use the same perspective as the landmarks. They
      // never enter the central route, a star plaque, or the pet's space.
      const x=Math.max(8,(w-lane)/2)+lane*(.025+(i%3)*.012);
      const y=stop.y+(i%2?-52:62),scale=[.65,.85,1][i%3];
      // v113: the pet language — a round chunky bush (three soft lobes, ink
      // edge, one shine, a colour-matched fold), a tiny flower and two pebbles.
      const fl=['#ffa798','#e6d6f0','#ffe49a'][i%3], fd=['#ee806f','#b49fcf','#c69434'][i%3];
      return `<g transform="translate(${x} ${y}) scale(${scale})">
        <ellipse cx="10" cy="15" rx="26" ry="6" fill="#2f5c46" opacity=".18"/>
        <path d="M-12 14Q-18 2 -8 -4Q-6 -16 8 -16Q20 -20 26 -8Q38 -4 34 8Q34 15 24 15H-6Q-12 15 -12 14Z" fill="#7fce54" stroke="#4a3620" stroke-width="2.4" stroke-linejoin="round"/>
        <path d="M-2 8Q0 2 4 0M10 10Q12 4 16 2M22 8Q24 2 28 0" fill="none" stroke="#4e9677" stroke-width="2.4" stroke-linecap="round"/>
        <ellipse cx="2" cy="-8" rx="6" ry="3" fill="#fffdf7" opacity=".55"/>
        ${[0,72,144,216,288].map(a=>`<circle cx="30" cy="-12" r="3" fill="${fl}" stroke="${fd}" stroke-width="1.6" transform="rotate(${a} 30 -9)"/>`).join('')}<circle cx="30" cy="-9" r="2.4" fill="#f3c955"/>
        <ellipse cx="-18" cy="18" rx="7" ry="4.5" fill="#e5dcc8" stroke="#a89478" stroke-width="1.6"/><ellipse cx="-8" cy="20" rx="4" ry="3" fill="#c9bda4" stroke="#a89478" stroke-width="1.6"/>
      </g>`;
    }).join('');
    // v226: ambient life along the map's edge margin (never on the route): a
    // butterfly every third stop by day, a firefly at night. Untappable; the
    // v225 village classes animate them and reduced motion holds them still.
    const ambient=ordered.filter((_,i)=>i%3===1).map((stop,i)=>{
      const x=Math.max(8,(w-lane)/2)+lane*(.14+(i%2)*.04),y=stop.y-96;
      if(night)return `<g class="vg-amb vg-firefly" style="--d:${(i%3)*1.1}s" pointer-events="none" transform="translate(${x.toFixed(0)} ${y.toFixed(0)})"><circle r="9" fill="#ffe49a" opacity=".25"/><circle r="3" fill="#ffe49a"/></g>`;
      const [c,d]=[['#ffa798','#ee806f'],['#62cdf4','#3a8fc4'],['#ffe49a','#c69434']][i%3];
      return `<g pointer-events="none" transform="translate(${x.toFixed(0)} ${y.toFixed(0)}) scale(1.6)"><g class="vg-amb vg-butterfly" style="--d:${(i%3)*.9}s"><path d="M0 0Q-8 -10 -11 -3Q-11 4 0 1ZM0 0Q8 -10 11 -3Q11 4 0 1Z" fill="${c}" stroke="#4a3620" stroke-width="1.6" stroke-linejoin="round"/><path d="M0 1Q-6 7 -4 9Q0 8 0 2ZM0 1Q6 7 4 9Q0 8 0 2Z" fill="${d}" stroke="#4a3620" stroke-width="1.6" stroke-linejoin="round"/><path d="M0 -3V6" stroke="#4a3620" stroke-width="2.4" stroke-linecap="round"/></g></g>`;
    }).join('');
    // v65 (art system): soft hill terraces between stops — a lighter rise and
    // a shaded fold — give the long map depth like the village's banded hills,
    // instead of the left-right grass/soil gradient that read as stripes.
    const terraces=ordered.map((stop,i)=>{
      const y=stop.y+(ordered[1]?.y-ordered[0]?.y||220)*0.5*(i%2?1:-1)*0.0+90, a=i%2?-1:1;
      return `<path d="M-20 ${y}Q${w*0.3} ${y-36*a} ${w*0.62} ${y-6}Q${w*0.85} ${y+18*a} ${w+20} ${y-10}V${y+70}H-20Z" fill="${soil}" opacity="${night ? .14 : .32}"/><path d="M-20 ${y+70}Q${w*0.35} ${y+54} ${w*0.7} ${y+72}Q${w*0.9} ${y+80} ${w+20} ${y+66}V${y+84}H-20Z" fill="#4e9677" opacity="${night ? .1 : .14}"/>`;
    }).join('');
    return `<svg class="map-landscape-art" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="${id}-ground" x1="0" x2="1" y1="0" y2="0"><stop stop-color="${grass}"/><stop offset="1" stop-color="${grass}"/></linearGradient>
        <linearGradient id="${id}-water" x1="0" x2="1" y1="0" y2="0"><stop stop-color="${night?'#3a8fc4':'#96ecff'}"/><stop offset=".65" stop-color="${night?'#34375f':'#62cdf4'}"/><stop offset="1" stop-color="${night?'#4a4d84':'#3a8fc4'}"/></linearGradient>
        ${habitatDefs}${bandDefs.join('')}
        <linearGradient id="${id}-light" x1="0" x2="1" y1="0" y2="0"><stop stop-color="${paper}" stop-opacity="0"/><stop offset=".4" stop-color="${paper}" stop-opacity="${night ? .08 : .12}"/><stop offset="1" stop-color="${paper}" stop-opacity="0"/></linearGradient>
      </defs>
      <path class="map-ground-plane" d="M0 0H${w}V${h}H0Z" fill="url(#${id}-ground)"/>
      ${terraces}
      <path d="M0 0H${w}V${h}H0Z" fill="url(#${id}-light)"/>
      <path d="${verge()}" fill="#2f5c46" opacity="${night ? .14 : .06}"/>
      ${bands.join('')}${patches}${scenery.join('')}${undergrowth}${ambient}
      ${brooks({width:w,pathWidth,stops}).map(b=>brookArt(b,night)).join('')}
      <path d="${water(-30)}" fill="#4e9677" opacity=".22"/>
      <path d="${water(-17)}" fill="${night?'#a89478':'#e5dcc8'}"/>
      <path d="${water(-10)}" fill="${night?'#c9bda4':paper}" opacity=".65"/>
      <path class="map-river" d="${water()}" fill="url(#${id}-water)"/>
      <path d="${water(22)}" fill="#62cdf4" opacity="${night ? .15 : .3}"/>
      <g fill="none" stroke="#ccfbef" stroke-width="3" stroke-linecap="round" opacity="${night ? .2 : .5}">${glints.join('')}</g>
    </svg>`;
  }
  function orchardClassic(){return `<ellipse cx="85" cy="145" rx="67" ry="13" fill="#2f5c46" opacity=".18"/><path d="M20 132Q81 112 149 133Q147 149 86 151Q24 152 20 132Z" fill="#b7e779"/><path d="M75 134L78 64H94L100 134Z" fill="#c69434" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/><path d="M88 131L89 71H94L100 134Z" fill="#70501b" opacity=".45"/><path d="M83 105L60 82M90 100L114 74" fill="none" stroke="#a89478" stroke-width="6" stroke-linecap="round"/><g class="lm-canopy"><path d="M29 78Q12 55 32 41Q31 17 60 20Q79-3 100 19Q134 11 137 39Q164 54 145 81Q119 103 90 88Q54 107 29 78Z" fill="#4e9677" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/><path d="M29 64Q18 43 40 35Q43 15 67 27Q81 9 101 28Q127 20 132 44Q148 50 140 66Q117 81 88 68Q58 87 29 64Z" fill="#7fce54"/><path d="M39 42Q55 24 71 37Q83 21 100 37" fill="none" stroke="#b7e779" stroke-width="6" stroke-linecap="round"/></g>${[[48,64,9],[105,74,10],[120,43,7]].map(([x,y,r])=>`<g class="lm-fruit" data-y="${y}"><circle cx="${x}" cy="${y}" r="${r}" fill="#ee806f" stroke="${ink}" stroke-width="1.6"/><circle cx="${x-3}" cy="${y-3}" r="${Math.max(2,r/3)}" fill="#ffa798"/></g>`).join('')}<path d="M23 134Q28 119 40 125L42 140M118 141Q123 123 133 128L136 143" fill="#4e9677"/>`;}
  function reedsClassic(){return `<ellipse cx="90" cy="145" rx="67" ry="10" fill="#2f5c46" opacity=".18"/><path d="M14 130Q39 118 87 127Q129 113 157 132Q156 149 87 150Q23 150 14 130Z" fill="#96ecff" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/><path d="M35 139Q69 130 116 138" fill="none" stroke="#ccfbef" stroke-width="4" stroke-linecap="round"/><g class="lm-reeds"><g fill="none" stroke="#4e9677" stroke-width="4" stroke-linecap="round"><path d="M68 140L49 46M78 140L89 24M89 140L116 56"/></g><g fill="#c9bda4" stroke="${ink}" stroke-width="1.6"><rect x="40" y="29" width="13" height="39" rx="6" transform="rotate(-10 47 46)"/><rect x="85" y="12" width="13" height="40" rx="6" transform="rotate(5 91 32)"/><rect x="113" y="43" width="12" height="32" rx="6" transform="rotate(16 119 59)"/></g></g><g class="lm-bug"><ellipse cx="47" cy="128" rx="9" ry="7" fill="#ee806f" stroke="${ink}" stroke-width="1.6"/><path d="M47 121V135" stroke="${ink}" stroke-width="1.6"/><circle cx="38" cy="126" r="3.5" fill="${ink}"/><circle cx="43" cy="126" r="1.6" fill="${ink}"/><circle cx="51" cy="131" r="1.6" fill="${ink}"/></g><g class="lm-leaf"><path d="M73 140Q20 119 29 80Q55 83 73 140Z" fill="#4e9677"/><path d="M72 136Q50 114 31 85" fill="none" stroke="#b7e779" stroke-width="2.4"/></g><path d="M86 141Q102 87 140 87Q142 122 86 141Z" fill="#4e9677"/><path d="M90 136Q120 113 137 92" fill="none" stroke="#b7e779" stroke-width="2.4"/><ellipse cx="131" cy="140" rx="20" ry="7" fill="#7fce54"/><path d="M129 133Q112 122 126 119Q133 107 138 120Q149 121 139 132Z" fill="#ee806f"/><circle cx="134" cy="128" r="4" fill="#ffe49a"/>`;}
  function lanternClassic(){return `<ellipse cx="89" cy="147" rx="65" ry="10" fill="#2f5c46" opacity=".25"/><path d="M19 139Q80 118 151 137L139 151H34Z" fill="#4e9677"/><path d="M45 141V48Q44 25 68 24H112" fill="none" stroke="#a89478" stroke-width="6" stroke-linecap="round"/><path d="M103 26V44" stroke="#4a3620" stroke-width="3"/><circle class="lm-glow" cx="103" cy="80" r="44" fill="#ffe49a" opacity="0"/><path d="M84 50L103 38L122 50L119 107Q103 118 87 107Z" fill="#c69434" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/><path d="M91 55H115L112 101H94Z" fill="#ffe49a"/><path d="M98 57H110L108 95H99Z" fill="#fffaf0"/><path d="M86 51H121M88 108H119" stroke="${ink}" stroke-width="3"/><path d="M104 88C83 76 101 63 110 64Q98 78 112 81Z" fill="#f3c955"/><path d="M26 142Q17 121 33 112Q46 119 42 140M127 142Q132 117 146 125Q154 139 127 142Z" fill="#b7e779"/><g fill="#ffe49a">${[[67,104],[143,79],[27,71],[88,124],[124,118]].map(([x,y],i)=>`<circle class="lm-fly" cx="${x}" cy="${y}" r="2" opacity="${i<3?1:0}"/>`).join('')}</g>`;}
  function peaksClassic(){return `<ellipse cx="87" cy="149" rx="73" ry="9" fill="#2f5c46" opacity=".18"/><path d="M9 145L61 40L107 145Z" fill="#c9bda4"/><path d="M61 40L70 144H107Z" fill="#a89478"/><path d="M45 72L61 40L76 71L61 65Z" fill="#fffaf0"/><path d="M62 145L115 10L165 145Z" fill="#e5dcc8"/><path d="M115 10L118 144H165Z" fill="#c9bda4"/><path d="M95 62L115 10L136 66L119 52L109 65Z" fill="#fffdf7"/><path d="M10 144Q56 129 84 141Q125 132 163 144L153 154H22Z" fill="#b7e779"/><path d="M28 141L41 107L54 141M128 144L141 113L154 144" fill="#4e9677"/><path d="M39 144V132M141 147V136" stroke="#a89478" stroke-width="3"/>`;}
  // The meadow's own landmark: a wildflower patch with a little skep hive.
  function wildflowersClassic(){return `<ellipse cx="88" cy="146" rx="70" ry="10" fill="#2f5c46" opacity=".18"/><path d="M16 138Q84 112 158 136Q150 152 86 152Q24 152 16 138Z" fill="#b7e779"/><g class="lm-hive"><path d="M110 132Q108 92 132 88Q156 92 154 132Z" fill="#f3c955" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/><path d="M112 118Q132 112 152 118M111 104Q132 98 153 104" fill="none" stroke="#c69434" stroke-width="2.4"/><path d="M127 132Q127 122 132 122Q137 122 137 132Z" fill="${ink}"/></g>${[[34,96,'#ffa798'],[58,84,'#b49fcf'],[80,100,'#f3c955'],[46,116,'#ee806f'],[96,118,'#ffa798']].map(([x,y,c])=>`<path d="M${x} 138Q${x+2} ${y+20} ${x} ${y+6}" fill="none" stroke="#4e9677" stroke-width="3" stroke-linecap="round"/><g transform="translate(${x} ${y})">${[0,72,144,216,288].map(a=>`<ellipse cy="-6" rx="4.5" ry="7" transform="rotate(${a})" fill="${c}" stroke="${ink}" stroke-width="1.6"/>`).join('')}<circle r="3.5" fill="#ffe49a" stroke="${ink}" stroke-width="1.6"/></g>`).join('')}<path d="M24 138Q30 124 38 132M64 140Q70 126 78 134" fill="#7fce54"/>`;}
  function landingClassic(){return `<ellipse cx="80" cy="137" rx="66" ry="9" fill="#2f5c46" opacity=".18"/><path d="M8 132Q41 114 72 127L70 145Q31 151 8 132Z" fill="#b7e779"/><path d="M62 125L157 105V124L64 144Z" fill="#a89478"/><path d="M60 111L159 91L166 112L63 135Z" fill="#e5dcc8" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"/><path d="M74 109L79 128M94 105L99 124M114 101L119 120M135 96L141 115" stroke="#c9bda4" stroke-width="3"/><path d="M65 112V91M154 94V75M66 95L153 78" fill="none" stroke="#a89478" stroke-width="4" stroke-linecap="round"/><path d="M70 135V147M155 116V132" stroke="#a89478" stroke-width="6" stroke-linecap="round"/><path d="M32 135Q12 126 16 109Q32 116 32 135M39 137Q39 111 53 103Q60 121 39 137Z" fill="#4e9677"/><path d="M51 134Q58 119 68 126L70 138Z" fill="#7fce54"/><path d="M146 144L169 139" stroke="#ccfbef" stroke-width="2.4" stroke-linecap="round"/>`;}
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
  function bridgeClassic(){
    const planks=[-22,-14,-6,2,10,18].map(x=>`<path d="M${x} -11V11"/>`).join('');
    return `<ellipse cx="0" cy="10" rx="38" ry="7" fill="#2f5c46" opacity=".2"/>
      <rect x="-31" y="-14" width="62" height="28" rx="6" fill="#c9bda4" stroke="${ink}" stroke-width="2.4"/>
      <g stroke="#a89478" stroke-width="2.4">${planks}</g>
      <path d="M-27 -9H27" stroke="#e5dcc8" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M-31 -15H31M-31 15H31" stroke="#a89478" stroke-width="4" stroke-linecap="round"/>
      <g fill="#a89478" stroke="${ink}" stroke-width="1.6"><circle cx="-31" cy="-15" r="3.5"/><circle cx="31" cy="-15" r="3.5"/><circle cx="-31" cy="15" r="3.5"/><circle cx="31" cy="15" r="3.5"/></g>`;
  }

  // A wooden waterwheel standing in a brook. It turns slowly on its own.
  function waterwheelClassic(){
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


  // ---------- v104: map landmarks in the pet's language (same as the
  // village, v103): flat colour + one shine, chunky round low-and-wide
  // shapes, one ink weight (4, small parts 3), fewer bigger parts. Same
  // colours. Every animated hook (lm-canopy, lm-fruit[data-y], lm-reeds,
  // lm-leaf, lm-bug, lm-glow, lm-fly, lm-hive, lm-spin/lm-wheel, lm-drop)
  // and its pivot is kept, so the toys behave as before. Classic versions
  // above stay for A/B. ----------
  const K=(w=4)=>`stroke="${ink}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const SH=(cx,cy,rx,ry=rx*.5,rot=-20)=>`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${cx} ${cy})" fill="#fffdf7" opacity=".75"/>`;
  const GR=(cx,cy,rx)=>`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${(rx*.17).toFixed(1)}" fill="#2f5c46" opacity=".2"/>`;
  const MOUND=(c='#b7e779')=>`<path d="M14 146Q16 124 88 122Q160 124 162 146Q88 154 14 146Z" fill="${c}"/>`;
  // v104b (owner: "increase the level of detail"): same round silhouettes,
  // richer insides — detail strokes are thin (2.4) in a deeper shade of the
  // object's own colour (colour-matched lines), plus small charming parts.
  const DL=(c,w=2.4)=>`fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
  const TUFT=(x,y,c='#4e9677')=>`<path d="M${x-6} ${y}Q${x-6} ${y-8} ${x-2} ${y-10}M${x} ${y}Q${x} ${y-10} ${x+3} ${y-13}M${x+6} ${y}Q${x+7} ${y-7} ${x+10} ${y-8}" ${DL(c,3)}/>`;
  const PETALS=(x,y,c,d,r=5)=>`${[0,72,144,216,288].map(a=>`<circle cx="${x}" cy="${y-r}" r="${r}" fill="${c}" stroke="${d}" stroke-width="1.6" transform="rotate(${a} ${x} ${y})"/>`).join('')}<circle cx="${x}" cy="${y}" r="${r*.75}" fill="#f3c955" stroke="#c69434" stroke-width="1.6"/>`;
  // v209: each orchard stop gets its own tree (seed from the landmark variant), per the art rule "variety via seeds".
  function orchard(variant=0){const D=ns.DetailKit;if(D)return `${GR(88,150,60)}${MOUND()}${TUFT(30,142)}${TUFT(140,144)}<g transform="translate(88 146) scale(${[.95,.86,1.02][variant%3]})">${D.tree({seed:3+(variant%5)*2,hooks:true})}</g>`;return orchardV104();}
  function orchardV104(){return `${GR(88,148,66)}${MOUND()}${TUFT(36,140)}${TUFT(136,142)}
    <path d="M76 140Q70 146 62 146M100 140Q106 146 114 146" ${DL('#70501b',3)}/>
    <path d="M78 140Q80 116 80 92H96Q96 116 98 140Z" fill="#c69434" ${K()}/>
    <path d="M84 132Q86 118 84 104M92 124Q90 114 92 102" ${DL('#70501b')}/>
    <g class="lm-canopy">
      <path d="M44 84Q32 62 48 46Q50 24 74 22Q88 8 104 20Q128 18 132 42Q148 58 136 80Q134 100 112 102Q98 112 84 104Q66 112 54 100Q40 98 44 84Z" fill="#4e9677" ${K()}/>
      <path d="M56 50Q66 36 82 38M104 36Q118 38 124 50M58 84Q66 92 78 90M108 88Q120 86 126 76" ${DL('#2f5c46')}/>
      <path d="M62 44Q70 30 86 30" fill="none" stroke="#7fce54" stroke-width="4" stroke-linecap="round" opacity=".8"/>
      ${SH(70,40,10,5)}
    </g>
    ${[[64,74],[104,58],[100,90]].map(([x,y])=>`<g class="lm-fruit" data-y="${y}"><path d="M${x} ${y-10}Q${x+2} ${y-15} ${x+5} ${y-16}" ${DL('#70501b',2.4)}/><path d="M${x+2} ${y-12}Q${x+10} ${y-16} ${x+12} ${y-10}Q${x+6} ${y-8} ${x+2} ${y-12}Z" fill="#7fce54" stroke="#4e9677" stroke-width="1.6"/><circle cx="${x}" cy="${y}" r="10" fill="#ee806f" ${K(3)}/><circle cx="${x-3}" cy="${y-3}" r="3" fill="#fffdf7" opacity=".75"/></g>`).join('')}
    <circle cx="44" cy="142" r="4" fill="#ee806f" stroke="#c25a49" stroke-width="1.6"/>`;}
  // v211: reed stops vary (cattail heights and the lily flower's colour); the toy hooks are untouched.
  function reeds(variant=0){return `${GR(90,148,68)}<path d="M12 144Q14 122 90 120Q166 122 168 144Q90 154 12 144Z" fill="#96ecff"/>
    <path d="M30 134Q44 130 58 134M104 140Q120 136 138 140M120 130Q130 127 140 130" ${DL('#62cdf4')}/>${SH(46,128,14,3,0)}
    <path d="M14 144Q12 136 22 132M164 144Q168 136 158 132" ${DL('#4e9677',3)}/>
    <g class="lm-reeds">
      ${[[[110,42],[126,30],[142,48]],[[110,34],[126,46],[142,30]],[[110,48],[126,36],[142,40]]][variant%3].map(([x,t])=>`<path d="M${x} 128V${t+20}" ${DL('#2f5c46',4)}/><rect x="${x-7}" y="${t}" width="14" height="30" rx="7" fill="#a89478" ${K(3)}/><path d="M${x-3} ${t+8}V${t+22}" ${DL('#70501b',2.4)}/><path d="M${x} ${t}V${t-6}" ${DL('#2f5c46',2.4)}/>`).join('')}
      <path d="M104 128Q92 104 96 84Q104 104 110 126Z" fill="#7fce54" stroke="#4e9677" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M148 128Q162 108 160 88Q150 106 144 126Z" fill="#7fce54" stroke="#4e9677" stroke-width="2.4" stroke-linejoin="round"/>
    </g>
    <g class="lm-bug"><ellipse cx="47" cy="122" rx="7" ry="6" fill="#ee806f" ${K(3)}/><path d="M47 116V128" ${DL('#8a3a2d',1.6)}/><circle cx="44" cy="120" r="1.6" fill="#4a3620"/><circle cx="50" cy="124" r="1.6" fill="#4a3620"/></g>
    <g class="lm-leaf"><path d="M36 134Q36 124 62 124Q88 124 88 134Q88 144 62 144Q48 144 42 140L62 134Z" fill="#7fce54" ${K(3)}/><path d="M62 134L46 130M62 134L74 128M62 134L80 138" ${DL('#4e9677',1.6)}/>
      ${PETALS(78,128,...[['#ffa798','#ee806f'],['#e6d6f0','#b49fcf'],['#ffe49a','#c69434']][variant%3],4)}</g>`;}
  function lantern(){return `${GR(90,148,64)}${MOUND('#4e9677')}${TUFT(40,142,'#2f5c46')}${TUFT(132,144,'#2f5c46')}
    <circle class="lm-glow" cx="103" cy="80" r="44" fill="#ffe49a" opacity="0"/>
    <rect x="52" y="132" width="24" height="12" rx="6" fill="#a89478" ${K(3)}/>
    <rect x="58" y="38" width="12" height="100" rx="6" fill="#a89478" ${K()}/><path d="M62 52V126" ${DL('#c9bda4',2.4)}/>
    <path d="M64 42Q90 26 104 44" fill="none" ${K()}/><path d="M74 34Q70 26 76 24Q82 26 78 32" ${DL('#4a3620',3)}/>
    <path d="M103 44V50" ${DL('#4a3620',3)}/>
    <rect x="86" y="52" width="34" height="44" rx="14" fill="#ffe49a" ${K()}/>
    <path d="M103 54V94M88 74H118" ${DL('#c69434')}/>
    <path d="M103 84Q96 78 100 70Q103 66 103 62Q108 70 106 78Q106 82 103 84Z" fill="#ffa06e" stroke="#e8743c" stroke-width="1.6"/>
    <rect x="88" y="44" width="30" height="12" rx="6" fill="#70501b" ${K(3)}/><rect x="92" y="92" width="22" height="8" rx="4" fill="#70501b" ${K(3)}/>${SH(94,64,3,8,0)}
    ${[[30,70],[140,60],[150,100],[24,104],[120,30]].map(([x,y],i)=>`<g class="lm-fly" opacity="${i<3?1:0}"><circle cx="${x}" cy="${y}" r="5" fill="#ffe49a" opacity=".35"/><circle cx="${x}" cy="${y}" r="2.4" fill="#ffe49a"/></g>`).join('')}`;}
  function peaksV104(){const pine=(x,y,s=1)=>`<g transform="translate(${x} ${y}) scale(${s})"><rect x="-3" y="-4" width="6" height="10" rx="3" fill="#70501b"/><path d="M0 -30Q10 -16 12 -6Q0 -2 -12 -6Q-10 -16 0 -30Z" fill="#4e9677" stroke="#2f5c46" stroke-width="2.4" stroke-linejoin="round"/></g>`;
    return `${GR(88,150,72)}
    <path d="M12 144Q36 70 60 50Q72 40 84 52Q108 76 126 144Z" fill="#c9bda4" ${K()}/>
    <path d="M60 50Q72 40 84 52Q92 62 94 70Q88 64 82 72Q76 62 70 70Q62 62 56 70Q52 64 50 66Q54 56 60 50Z" fill="#fffdf7" ${K(3)}/>
    <path d="M36 112Q48 96 52 84M70 124Q74 104 82 94" ${DL('#a89478')}/>
    <path d="M90 144Q110 96 126 84Q134 78 142 86Q158 104 170 144Z" fill="#a89478" ${K()}/>
    <path d="M126 84Q134 78 142 86Q148 94 150 100Q144 96 140 102Q134 94 128 100Q122 94 118 98Q120 90 126 84Z" fill="#fffdf7" ${K(3)}/>
    <path d="M116 126Q124 114 130 108" ${DL('#70501b')}/>${SH(44,96,8,14,20)}
    <path d="M6 150Q8 136 88 134Q168 136 170 150Q88 156 6 150Z" fill="#b7e779"/>
    ${pine(22,146,.9)}${pine(34,148,.7)}${pine(150,148,.85)}${TUFT(96,148)}`;}
  // v163: the mountain is built like one. Tiered pines, rock ledges, and a
  // dotted trail that zig-zags up to a little flag on the summit, so the
  // peak reads as a climb a kid can make, not a wall.
  // v212: alternate mountain stops are mirrored in landmark() so the peaks don't repeat one picture.
  function peaks(){const pine=(x,y,s=1)=>`<g transform="translate(${x} ${y}) scale(${s})"><rect x="-3" y="-4" width="6" height="10" rx="3" fill="#70501b" ${K(2.4)}/>${[[0,13],[-9,10],[-18,7]].map(([t,w])=>`<path d="M0 ${t-14}Q${w*.6} ${t-6} ${w} ${t-1}Q0 ${t+2} ${-w} ${t-1}Q${-w*.6} ${t-6} 0 ${t-14}Z" fill="#4e9677" stroke="#2f5c46" stroke-width="2.4" stroke-linejoin="round"/>`).join('')}<path d="M-4 -22Q-2 -26 0 -28" ${DL('#7fce54',1.6)}/></g>`;
    return `${GR(88,150,72)}
    <path d="M12 144Q36 70 60 50Q72 40 84 52Q108 76 126 144Z" fill="#c9bda4" ${K()}/>
    <path d="M60 50Q72 40 84 52Q92 62 94 70Q88 64 82 72Q76 62 70 70Q62 62 56 70Q52 64 50 66Q54 56 60 50Z" fill="#fffdf7" ${K(3)}/>
    <path d="M28 120Q34 116 40 118M84 104Q92 100 98 104M44 92Q50 88 56 90" ${DL('#a89478',3)}/>
    <path d="M66 140Q50 130 62 118Q78 108 64 98Q54 88 70 80" fill="none" stroke="#fffaf0" stroke-width="3" stroke-dasharray="1 7" stroke-linecap="round"/>
    <path d="M71 78V58" ${DL(ink,3)}/><path d="M71 58L86 63L71 68Z" fill="#ee806f" ${K(2.4)}/>
    <path d="M90 144Q110 96 126 84Q134 78 142 86Q158 104 170 144Z" fill="#a89478" ${K()}/>
    <path d="M126 84Q134 78 142 86Q148 94 150 100Q144 96 140 102Q134 94 128 100Q122 94 118 98Q120 90 126 84Z" fill="#fffdf7" ${K(3)}/>
    <path d="M116 126Q124 114 130 108" ${DL('#70501b')}/><path d="M140 120Q148 116 154 120" ${DL('#70501b',3)}/>${SH(44,96,8,14,20)}
    <path d="M6 150Q8 136 88 134Q168 136 170 150Q88 156 6 150Z" fill="#b7e779"/>
    <ellipse cx="112" cy="146" rx="9" ry="5" fill="#c9bda4" ${K(2.4)}/><ellipse cx="122" cy="148" rx="6" ry="3.5" fill="#e5dcc8" ${K(2.4)}/>
    ${pine(22,146,.9)}${pine(36,149,.7)}${pine(150,148,.85)}${pine(162,151,.6)}${TUFT(96,148)}`;}
  // v210: wildflower stops vary (flower colours and heights rotate, the bees shift) instead of repeating one picture.
  function wildflowers(variant=0){const bee=(x,y)=>`<g transform="translate(${x} ${y})"><ellipse cx="-3" cy="-6" rx="4" ry="5" fill="#fffdf7" opacity=".85" stroke="#a89478" stroke-width="1.6"/><ellipse cx="3" cy="-6" rx="4" ry="5" fill="#fffdf7" opacity=".85" stroke="#a89478" stroke-width="1.6"/><ellipse rx="7" ry="5" fill="#f3c955" stroke="#4a3620" stroke-width="2.4"/><path d="M-2 -4V4M2 -4V4" stroke="#4a3620" stroke-width="2.4"/></g>`;
    return `${GR(88,148,70)}${MOUND()}${TUFT(24,142)}${TUFT(96,144)}
    <g class="lm-hive"><rect x="98" y="124" width="58" height="8" rx="4" fill="#c69434" stroke="${ink}" stroke-width="2.4"/><rect x="104" y="128" width="8" height="14" rx="4" fill="#70501b"/><rect x="142" y="128" width="8" height="14" rx="4" fill="#70501b"/>
      ${[[127,120,27,9],[127,108,25,8.5],[127,96,21,8],[127,85,16,7],[127,76,10,6]].map(([cx,cy,rx,ry])=>`<rect x="${cx-rx}" y="${cy-ry}" width="${rx*2}" height="${ry*2}" rx="${ry}" fill="#f3c955" stroke="${ink}" stroke-width="2.4"/><path d="M${cx-rx+5} ${cy}H${cx+rx-5}" fill="none" stroke="#c69434" stroke-width="1.6" stroke-linecap="round" stroke-dasharray="3 4"/>`).join('')}
      <path d="M118 124V116Q118 108 127 108Q136 108 136 116V124Z" fill="#70501b" stroke="${ink}" stroke-width="2.4"/><rect x="114" y="121" width="26" height="5" rx="2.5" fill="#c69434" stroke="${ink}" stroke-width="1.6"/>
      <ellipse cx="117" cy="82" rx="5" ry="2.4" fill="#fffdf7" opacity=".7"/></g>
    ${[[bee(150,70),bee(92,58)],[bee(146,62),bee(98,72)],[bee(154,76),bee(88,52)]][variant%3].join('')}
    ${(()=>{const C=[['#ffa798','#ee806f'],['#b49fcf','#8c74b0'],['#ffe49a','#c69434']],v=variant%3;return [36,60,82].map((x,i)=>{const [c,d]=C[(i+v)%3],k=(i+v)%3;return `<path d="M${x} 128V${94-k*6}" ${DL('#4e9677',4)}/><path d="M${x} ${116-k*4}Q${x-12} ${110-k*4} ${x-14} ${102-k*4}Q${x-4} ${104-k*4} ${x} ${114-k*4}Z" fill="#7fce54" stroke="#4e9677" stroke-width="1.6"/>${PETALS(x,88-k*6,c,d,6)}`;}).join('');})()}`;}
  function landingV115(){return `${GR(84,144,68)}<path d="M8 142Q10 122 50 120Q90 122 92 142Q50 150 8 142Z" fill="#b7e779"/>${TUFT(22,138)}
    <path d="M86 150Q110 146 130 150M140 146Q154 143 166 146" ${DL('#62cdf4')}/>
    <rect x="70" y="116" width="12" height="32" rx="6" fill="#70501b" ${K(3)}/><rect x="138" y="116" width="12" height="32" rx="6" fill="#70501b" ${K(3)}/>
    <rect x="58" y="102" width="104" height="24" rx="12" fill="#c69434" ${K()}/>
    <path d="M82 104V124M104 104V124M126 104V124M146 104V124" ${DL('#70501b')}/>${SH(78,108,10,3,0)}
    <path d="M70 128Q76 134 82 128M138 128Q144 134 150 128" ${DL('#ffe49a',2.4)}/>
    <rect x="98" y="72" width="6" height="32" rx="3" fill="#a89478" ${K(3)}/>
    <path d="M104 74Q120 78 120 86Q112 90 104 90Z" fill="#ee806f" ${K(3)}/>`;}
  // v178: the jetty is built from parts: separate planks with nails on a
  // beam, posts standing in water with rings, a mooring post with a coiled
  // rope, and a little rowboat tied alongside.
  function landing(){const rope=(d)=>`<path d="${d}" fill="none" ${K(6)}/><path d="${d}" ${DL('#e5dcc8',3)}/>`;
    return `${GR(92,150,76)}<ellipse cx="120" cy="146" rx="54" ry="12" fill="#96ecff"/><path d="M80 150Q90 146 100 150M142 152Q152 148 162 152" ${DL('#fffdf7')}/>
    <path d="M6 144Q8 120 44 118Q74 120 76 144Q40 152 6 144Z" fill="#b7e779"/>${TUFT(20,140)}${TUFT(66,142)}
    ${[66,118].map(x=>`<ellipse cx="${x}" cy="146" rx="11" ry="3.5" fill="none" stroke="#62cdf4" stroke-width="2.4"/><rect x="${x-6}" y="108" width="12" height="40" rx="6" fill="#70501b" ${K(3)}/>`).join('')}
    <rect x="48" y="116" width="116" height="9" rx="4.5" fill="#70501b" ${K(3)}/>
    ${[0,1,2,3,4,5,6].map(i=>{const x=48+i*16.6;return `<rect x="${x.toFixed(1)}" y="98" width="15" height="21" rx="4" fill="#c69434" ${K(3)}/><circle cx="${(x+7.5).toFixed(1)}" cy="102.5" r="1.6" fill="#70501b"/><circle cx="${(x+7.5).toFixed(1)}" cy="114" r="1.6" fill="#70501b"/>`;}).join('')}${SH(58,104,6,2.4,0)}
    <path d="M128 140H172Q168 156 150 157H140Q130 154 128 140Z" fill="#ee806f" ${K(3)}/><path d="M132 144H168" ${DL('#ffa798')}/><rect x="144" y="140" width="12" height="5" rx="2.5" fill="#c69434" ${K(2.4)}/>
    <rect x="146" y="82" width="12" height="18" rx="5" fill="#a89478" ${K(3)}/>${rope('M146 92Q152 96 158 92')}${rope('M146 88Q152 92 158 88')}${rope('M158 94Q172 114 162 140')}
    <rect x="56" y="64" width="6" height="36" rx="3" fill="#a89478" ${K(3)}/><path d="M62 66Q78 70 78 78Q70 82 62 82Z" fill="#ee806f" ${K(3)}/>`;}
  function bridge(){return `${GR(0,18,44)}
    <rect x="-36" y="-14" width="72" height="28" rx="12" fill="#c9bda4" ${K()}/>${SH(-18,-6,9,3,0)}
    ${[-24,-12,0,12,24].map(x=>`<rect x="${x-5}" y="-12" width="10" height="24" rx="4" fill="#e5dcc8" stroke="#a89478" stroke-width="1.6"/><circle cx="${x}" cy="-8" r="1.2" fill="#70501b"/><circle cx="${x}" cy="8" r="1.2" fill="#70501b"/>`).join('')}
    <path d="M-40 -18Q-20 -10 0 -18Q20 -10 40 -18M-40 18Q-20 26 0 18Q20 26 40 18" fill="none" stroke="#4a3620" stroke-width="6" stroke-linecap="round"/><path d="M-40 -18Q-20 -10 0 -18Q20 -10 40 -18M-40 18Q-20 26 0 18Q20 26 40 18" fill="none" stroke="#c69434" stroke-width="3" stroke-linecap="round"/>
    ${[[-40,-18],[0,-18],[40,-18],[-40,18],[0,18],[40,18]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="5.5" fill="#a89478" ${K(3)}/><circle cx="${x-1.5}" cy="${y-1.5}" r="1.6" fill="#e5dcc8"/>`).join('')}`;}
  function waterwheel(){
    const drops=[[24,96],[36,88],[86,90],[98,98]].map(([x,y])=>`<circle class="lm-drop" cx="${x}" cy="${y}" r="3" fill="#96ecff" opacity="0"/>`).join('');
    return `<svg viewBox="0 0 120 130" aria-hidden="true">
      ${GR(60,116,54)}
      <rect x="16" y="54" width="14" height="58" rx="7" fill="#a89478" ${K()}/><rect x="90" y="54" width="14" height="58" rx="7" fill="#a89478" ${K()}/>
      <path d="M20 66V104M94 66V104" ${DL('#70501b',2.4)}/>
      <rect x="6" y="18" width="9" height="94" rx="4.5" fill="#70501b" ${K(3)}/>
      <g class="lm-spin"><g class="lm-wheel">
        <circle cx="60" cy="58" r="40" fill="#c9bda4" ${K()}/>
        <circle cx="60" cy="58" r="32" fill="#e5dcc8" stroke="#a89478" stroke-width="2.4"/>
        ${[0,45,90,135].map(a=>`<rect x="57" y="28" width="6" height="60" rx="3" fill="#a89478" transform="rotate(${a} 60 58)"/>`).join('')}
        ${[0,45,90,135,180,225,270,315].map(a=>`<rect x="51" y="11" width="18" height="14" rx="6" fill="#a89478" ${K(3)} transform="rotate(${a} 60 58)"/>`).join('')}
        <circle cx="60" cy="58" r="10" fill="#c9bda4" ${K(3)}/><circle cx="60" cy="58" r="3.5" fill="#70501b"/>${SH(40,36,8,4)}
      </g></g>
      <path d="M44 14Q52 15 54 23Q55 28 52 33" fill="none" stroke="#62cdf4" stroke-width="8" stroke-linecap="round"/><path d="M47 15Q52 17 52 24" ${DL('#ccfbef',2.4)}/>
      <path d="M0 9H46Q49 9 49 12V17Q49 20 46 20H0Z" fill="#c69434" ${K(3)}/><path d="M4 14H42" ${DL('#70501b',1.6)}/><path d="M2 9H46" fill="none" stroke="#62cdf4" stroke-width="2.4"/>
      <path d="M4 120Q6 100 60 98Q114 100 116 120Q60 128 4 120Z" fill="#62cdf4"/>
      <path d="M20 108Q30 102 40 108M78 106Q90 100 100 106" ${DL('#ccfbef',3)}/>
      <path d="M44 100Q48 92 54 96M66 96Q72 92 76 100" ${DL('#fffdf7',2.4)}/>
      <ellipse cx="10" cy="114" rx="9" ry="6" fill="#a89478" stroke="#70501b" stroke-width="2.4"/><ellipse cx="110" cy="116" rx="8" ry="5" fill="#c9bda4" stroke="#a89478" stroke-width="2.4"/>
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
    const content=biome==='orchard'?orchard(variant):biome==='lagoon'?reeds(variant):biome==='night'?lantern():biome==='peaks'?(variant%2?`<g transform="translate(176 0) scale(-1 1)">${peaks()}</g>`:peaks()):biome==='river'?(variant%2?reeds(variant):landing()):variant%2?`<g transform="translate(0 7)">${reeds(variant)}</g>`:wildflowers(Math.floor(variant/2));
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
    // v107: the pet language — a chunky rounded pole with a stone foot and a
    // gold knob, a soft rounded banner with a scalloped hem, tufts at the base.
    const d=dir<0?-1:1;
    return `<g class="map-gate${open?' is-open':''}" data-land="${biome}">
      ${GR(d*8,4,24)}
      <path d="M-14 2Q-14 -6 -8 -10M14 2Q14 -6 8 -10" ${DL('#4e9677',3)}/>
      <rect x="-6" y="-84" width="12" height="86" rx="6" fill="#a89478" ${K(3)}/><path d="M-1 -76V-6" ${DL('#c9bda4')}/>
      <rect x="-12" y="-4" width="24" height="10" rx="5" fill="#c9bda4" ${K(3)}/>
      ${/* v208: a vine climbs the pole (leaves and a flower), the crossbar gets an end knob, the foot a peg. Still narrow. */''}<path d="M-6 -6Q8 -16 -6 -28Q8 -40 -6 -52Q6 -60 0 -66" ${DL('#4e9677',2.4)}/>${[[6,-16,1],[-7,-30,-1],[6,-42,1],[-6,-54,-1]].map(([x,y,f])=>`<path d="M${x} ${y}Q${x+f*8} ${y-2} ${x+f*9} ${y-8}Q${x+f*2} ${y-7} ${x} ${y}Z" fill="#7fce54" stroke="#4e9677" stroke-width="1.6" stroke-linejoin="round"/>`).join('')}${[0,72,144,216,288].map(a=>`<circle cx="7" cy="-26" r="2.4" fill="#ffa798" stroke="#ee806f" stroke-width="1.6" transform="rotate(${a} 7 -23.5)"/>`).join('')}<circle cx="7" cy="-23.5" r="1.6" fill="#f3c955"/>
      <rect x="${d>0?-2:-42}" y="-78" width="44" height="9" rx="4.5" fill="#c69434" ${K(3)}/><circle cx="${d*44}" cy="-73.5" r="4" fill="#f3c955" ${K(2.4)}/><circle cy="1" r="2.4" fill="#a89478"/>
      <circle cy="-88" r="7" fill="#f3c955" ${K(3)}/>${SH(-2,-91,2.4,1.4,0)}
      <g class="map-gate-banner" transform="translate(${d*22} 0)"><path d="M-16 -70H16V-36Q12 -30 8 -36Q4 -30 0 -36Q-4 -30 -8 -36Q-12 -30 -16 -36Z" fill="#fffaf0" ${K(3)}/><path d="M-11 -64H11" ${DL('#e5dcc8')}/><g transform="translate(0 -51) scale(.9)">${LAND_SIGNS[biome]||''}</g></g>
      <g class="map-gate-roll" transform="translate(${d*22} 0)"><rect x="-17" y="-76" width="34" height="11" rx="5.5" fill="#fffaf0" ${K(3)}/><path d="M-12 -70.5H12" ${DL('#e5dcc8',1.6)}/></g>
    </g>`;
  }
ns.LettersMapArt={gate,LAND_SIGNS,landscape,landmark,kind,TOYS,play,brooks,brookIndices,waterwheel,bridge,classic:{orchard:orchardClassic,reeds:reedsClassic,lantern:lanternClassic,peaks:peaksClassic,wildflowers:wildflowersClassic,landing:landingClassic,bridge:bridgeClassic,waterwheel:waterwheelClassic}};
})(window.MiftahGame||(window.MiftahGame={}));

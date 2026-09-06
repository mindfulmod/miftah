// Native pet anatomy and wardrobe ported from pet-character-lab; no lab UI or storage.
(function(ns){
const colorways=[
  {id:'sky',label:'Sky blue',hue:220},{id:'berry',label:'Berry pink',hue:338},{id:'honey',label:'Honey gold',hue:29},
  {id:'leaf',label:'Leaf green',hue:112},{id:'plum',label:'Plum purple',hue:278}
];
const selectedHue={lumi:220,mina:338,rafi:29};
function petPalette(id,hue=selectedHue[id]){
  const h=hue,mammal=id!=='lumi';
  return {body:`hsl(${h} ${mammal?58:62}% 60%)`,overlay:`hsl(${h} ${mammal?46:49}% 43%)`,inner:`hsl(${h} 62% 77%)`,highlight:`hsl(${h} 62% 74%)`,muzzle:mammal?'#fff0dc':'#f7f4e8',accent:id==='lumi'?'#ffc54a':'#56362e',accentDark:id==='lumi'?'#ef8d37':'#925044'};
}
const characters={
  lumi:{name:'Lumi',species:'Garden bird',mark:'✦',note:'One continuous bird body, crown feathers, leaf wings and a beak-led face.',fit:'Bird envelope: crown-sensitive headwear, 108-unit neck wrap, shared eye line.'},
  mina:{name:'Mina',species:'Meadow rabbit',mark:'⌇',note:'Long ears lead into a soft cheeked head, tucked forepaws, a pear-shaped chest and powerful haunches with long hind feet.',fit:'Rabbit envelope: ear-channel headwear, narrow 90-unit neck wrap, cheek-side attachment.'},
  rafi:{name:'Rafi',species:'Cedar bear cub',mark:'●',note:'Small round ears frame a broad cub head; sloped shoulders, a barrel belly and heavy planted paws create the bear silhouette.',fit:'Bear envelope: between-ear headwear, 104-unit neck wrap, round-ear attachment.'}
};

const catalog=[
  {id:'cap',label:'Cap',slot:'headwear',color:'#f0503f'},{id:'taqiyah',label:'Taqiyah',slot:'headwear',color:'#fffaf0'},
  {id:'crown',label:'Crown',slot:'headwear',color:'#ffc22e'},{id:'sprout',label:'Sprout',slot:'headwear',color:'#5cc23e'},
  {id:'bow',label:'Bow',slot:'head-side',color:'#ff7d96'},{id:'flower',label:'Flower',slot:'head-side',color:'#ff7d96'},
  {id:'glasses',label:'Glasses',slot:'eyes',color:'#4a3620'},{id:'scarf',label:'Scarf',slot:'neck',color:'#2fc487'},
  {id:'cape',label:'Cape',slot:'back',color:'#f0503f'},{id:'medal',label:'Medal',slot:'chest',color:'#ffc22e'},
  {id:'moonpin',label:'Moon pin',slot:'body-pin',color:'#ffedb0'},{id:'balloon',label:'Balloon',slot:'hand-right',color:'#54c6ff'},
  {id:'kite',label:'Kite',slot:'hand-right',color:'#54c6ff'},{id:'wand',label:'Wand',slot:'hand-left',color:'#c47f12'}
];

const eyes=()=>`<g class="eyes-open"><ellipse class="eye-white" cx="165" cy="178" rx="43" ry="57"/><ellipse class="eye-white" cx="255" cy="178" rx="43" ry="57"/><g class="pupils"><ellipse class="pupil" cx="171" cy="188" rx="20" ry="29"/><ellipse class="pupil" cx="249" cy="188" rx="20" ry="29"/><circle class="eye-shine" cx="178" cy="177" r="7"/><circle class="eye-shine" cx="256" cy="177" r="7"/></g></g><g class="eyes-happy"><path d="M127 183q38-46 76 0"/><path d="M217 183q38-46 76 0"/></g>`;
const birdFace=()=>`<path class="face-patch" d="M101 161c6-48 42-70 82-57 10 3 19 9 27 17 8-8 17-14 27-17 40-13 76 9 82 57 8 66-28 126-109 126S93 227 101 161Z"/>${eyes()}<path class="brow" d="M130 119q35-25 71 3M219 122q36-28 71-3"/><path class="nose" d="M176 229c0-17 15-30 34-30 20 0 35 13 35 30-20 17-50 17-69 0Z"/><path class="mouth-fill beak-bottom" d="M181 230c12 7 45 7 58 0-4 31-18 42-29 42-12 0-25-11-29-42Z"/><path class="tongue" d="M195 254q15-11 30 0-6 15-15 15t-15-15Z"/>`;
const mammalEyes=()=>`<g class="eyes-open mammal-eyes"><ellipse class="eye-white" cx="162" cy="181" rx="40" ry="48"/><ellipse class="eye-white" cx="258" cy="181" rx="40" ry="48"/><g class="pupils"><ellipse class="pupil" cx="166" cy="188" rx="21" ry="26"/><ellipse class="pupil" cx="254" cy="188" rx="21" ry="26"/><circle class="eye-shine" cx="173" cy="178" r="8"/><circle class="eye-shine" cx="261" cy="178" r="8"/><circle class="eye-shine" cx="157" cy="198" r="4"/><circle class="eye-shine" cx="245" cy="198" r="4"/></g></g><g class="eyes-happy"><path d="M126 184q36-38 72 0"/><path d="M222 184q36-38 72 0"/></g>`;
const mammalFace=()=>`<ellipse class="cheek-glow" cx="120" cy="222" rx="22" ry="11"/><ellipse class="cheek-glow" cx="300" cy="222" rx="22" ry="11"/>${mammalEyes()}<path class="muzzle" d="M157 224q18-28 53-10 35-18 53 10 11 37-25 55-28 13-56 0-36-18-25-55Z"/><path class="nose" d="M191 220q19-14 38 0-2 20-19 22-17-2-19-22Z"/><path class="mouth-fill" d="M180 247q30 28 60 0-4 39-30 41-26-2-30-41Z"/><path class="tongue" d="M194 271q16-13 32 0-5 14-16 15-11-1-16-15Z"/>`;

const worn=new Set(['scarf']);
const has=id=>worn.has(id);
const item=(id,svg)=>has(id)?`<g class="accessory" data-accessory="${id}">${svg}</g>`:'';
const neck={lumi:{x:210,y:289,rx:108},mina:{x:210,y:286,rx:90},rafi:{x:210,y:290,rx:104}};
const fits={
  lumi:{crownY:53,hat:{left:134,right:286,top:36,base:101},taq:{left:145,right:275,top:45,base:100},crown:{left:148,right:272,base:92,peak:29},side:{x:138,y:91},eye:{left:165,right:255,rx:48,ry:60},cape:{left:126,right:294,outerL:48,outerR:372,top:251,bottom:418},handR:{x:330,y:306},handL:{x:90,y:298},chest:{x:210,y:350},pin:{x:166,y:366}},
  mina:{crownY:78,hat:{left:157,right:263,top:55,base:108},taq:{left:164,right:256,top:62,base:106},crown:{left:162,right:258,base:101,peak:45},side:{x:132,y:104},eye:{left:162,right:258,rx:44,ry:52},cape:{left:139,right:281,outerL:58,outerR:362,top:278,bottom:425},handR:{x:267,y:342},handL:{x:153,y:342},chest:{x:210,y:354},pin:{x:174,y:368}},
  rafi:{crownY:47,hat:{left:137,right:283,top:29,base:91},taq:{left:147,right:273,top:36,base:88},crown:{left:149,right:271,base:82,peak:23},side:{x:126,y:113},eye:{left:162,right:258,rx:44,ry:52},cape:{left:116,right:304,outerL:38,outerR:382,top:270,bottom:425},handR:{x:324,y:364},handL:{x:96,y:364},chest:{x:210,y:355},pin:{x:168,y:370}}
};

function worldBack(id){
  const f=fits[id],c=f.cape,h=f.handR,propX=390;
  const cape=item('cape',`<path class="prod-acc" d="M${c.left} ${c.top}Q${c.outerL} ${c.top+48} ${c.outerL+18} ${c.bottom}L${c.left+24} ${c.bottom-38}Q${c.left+2} ${c.top+60} ${c.left+20} ${c.top+13}ZM${c.right} ${c.top}Q${c.outerR} ${c.top+48} ${c.outerR-18} ${c.bottom}L${c.right-24} ${c.bottom-38}Q${c.right-2} ${c.top+60} ${c.right-20} ${c.top+13}Z" fill="#f0503f"/><path d="M${c.left+10} ${c.top+18}Q210 ${c.top+37} ${c.right-10} ${c.top+18}" fill="none" stroke="#8f2f2a" stroke-width="7" stroke-linecap="round"/>`);
  const balloon=item('balloon',`<path d="M${propX} 147Q374 238 ${h.x} ${h.y}" fill="none" stroke="#4a3620" stroke-width="5"/><path class="prod-acc" d="M${propX} 147l-8 13h16Z" fill="#54c6ff"/><ellipse class="prod-acc" cx="${propX}" cy="98" rx="34" ry="46" fill="#54c6ff"/><ellipse cx="${propX-12}" cy="81" rx="9" ry="13" fill="#fff" opacity=".72"/><circle cx="${h.x}" cy="${h.y}" r="7" fill="#4a3620"/>`);
  const kite=item('kite',`<path d="M${propX} 147Q372 246 ${h.x} ${h.y}" fill="none" stroke="#4a3620" stroke-width="5"/><path class="prod-acc" d="M${propX} 47l36 50-36 50-36-50Z" fill="#54c6ff"/><path d="M${propX} 47v100m-36-50h72" stroke="#4a3620" stroke-width="5"/><path d="M${propX} 147q-14 17 0 34t0 34" fill="none" stroke="#4a3620" stroke-width="5"/><path d="M${propX-7} 173l-13 8 15 5m7 13 14 6-13 9" fill="none" stroke="#f0503f" stroke-width="6" stroke-linecap="round"/><circle cx="${h.x}" cy="${h.y}" r="7" fill="#4a3620"/>`);
  return cape+balloon+kite;
}
function scarfBack(id){if(!has('scarf'))return'';const n=neck[id];return `<g class="accessory" data-accessory="scarf"><ellipse class="prod-acc" cx="${n.x}" cy="${n.y}" rx="${n.rx}" ry="36" fill="#208f68"/></g>`}
function scarfFront(id){if(!has('scarf'))return'';const n=neck[id],l=n.x-n.rx,r=n.x+n.rx,y=n.y;return `<g class="accessory" data-accessory="scarf"><path class="prod-acc" d="M${l} ${y-7}Q210 ${y+29} ${r} ${y-7}L${r-8} ${y+28}Q210 ${y+59} ${l+8} ${y+28}Z" fill="#2fc487"/><path d="M${l+5} ${y-1}q10 17 24 23M${r-5} ${y-1}q-10 17-24 23" fill="none" stroke="#208f68" stroke-width="8" stroke-linecap="round"/><path class="prod-acc scarf-tail" d="M${r-30} ${y+30}l24 6-7 58-24-19Z" fill="#2fc487"/><path d="M${r-28} ${y+44}l20 5" stroke="#208f68" stroke-width="7"/></g>`}

function headwear(id){
  const f=fits[id],h=f.hat,t=f.taq,c=f.crown,mid=210;
  const cap=`<g class="fitted-cap"><path class="prod-acc" d="M${h.left} ${h.base-8}C${h.left+8} ${h.top+14} ${mid-35} ${h.top} ${mid} ${h.top}C${mid+35} ${h.top} ${h.right-8} ${h.top+14} ${h.right} ${h.base-8}L${h.right-8} ${h.base+4}Q${mid} ${h.base-9} ${h.left+8} ${h.base+4}Z" fill="#f0503f"/><path d="M${mid} ${h.top+8}V${h.base-13}" fill="none" stroke="#c73530" stroke-width="5"/><circle cx="${mid}" cy="${h.top+3}" r="8" fill="#ffd23e"/><path class="prod-acc cap-visor" d="M${h.left-14} ${h.base-8}Q${mid} ${h.base-27} ${h.right+12} ${h.base-8}Q${h.right+37} ${h.base+1} ${h.right+10} ${h.base+13}Q${mid} ${h.base+1} ${h.left-15} ${h.base+13}Q${h.left-34} ${h.base+4} ${h.left-14} ${h.base-8}Z" fill="#dc4037"/></g>`;
  const taq=`<path class="prod-acc" d="M${t.left} ${t.base}C${t.left+6} ${t.top+12} ${mid-31} ${t.top} ${mid} ${t.top}C${mid+31} ${t.top} ${t.right-6} ${t.top+12} ${t.right} ${t.base}L${t.right-3} ${t.base+10}Q${mid} ${t.base-2} ${t.left+3} ${t.base+10}Z" fill="#fffaf0"/><path d="M${t.left+18} ${t.base-12}Q${mid} ${t.top+15} ${t.right-18} ${t.base-12}M${mid} ${t.top+8}V${t.base-13}" fill="none" stroke="#a89478" stroke-width="5" stroke-linecap="round"/>`;
  const crown=`<path class="prod-acc" d="M${c.left} ${c.base}V${c.base-42}l${Math.round((c.right-c.left)*.25)} 22L${mid} ${c.peak}l${Math.round((c.right-c.left)*.25)} ${c.base-42-c.peak+22} ${Math.round((c.right-c.left)*.25)}-22V${c.base}Z" fill="#ffc22e"/><path d="M${c.left+8} ${c.base-10}Q${mid} ${c.base-2} ${c.right-8} ${c.base-10}" fill="none" stroke="#d89b19" stroke-width="6"/><circle cx="${mid}" cy="${c.base-17}" r="8" fill="#f0503f"/>`;
  const root=f.crownY,stemTop=root-34;
  const sprout=`<ellipse class="prod-acc" cx="210" cy="${root}" rx="17" ry="8" fill="#7a4b2f"/><path d="M210 ${root-3}Q207 ${root-18} 211 ${stemTop}" stroke="#397c2c" stroke-width="7" fill="none" stroke-linecap="round"/><path class="prod-acc" d="M211 ${stemTop+2}q-27-2-31-24 24 0 31 24Z" fill="#5cc23e"/><path class="prod-acc" d="M211 ${stemTop+2}q28-5 32-27-25 2-32 27Z" fill="#98dc74"/>`;
  return item('cap',cap)+item('taqiyah',taq)+item('crown',crown)+item('sprout',sprout);
}
function foregroundAccessories(id){
  const f=fits[id],sideX=f.side.x,sideY=f.side.y,e=f.eye,ch=f.chest,pin=f.pin,hand=f.handL,capeFit=f.cape;
  const bow=item('bow',`<g transform="translate(${sideX} ${sideY}) rotate(-18)"><path class="prod-acc" d="M0 0l-38-24v48Zm0 0 38-24v48Z" fill="#ff7d96"/><circle r="12" fill="#cf3f60"/></g>`);
  const petals=[0,60,120,180,240,300].map(a=>`<ellipse rx="12" ry="21" transform="rotate(${a} ${sideX} ${sideY}) translate(${sideX} ${sideY-20})" fill="#ff7d96"/>`).join('');
  const flower=item('flower',`${petals}<circle class="prod-acc" cx="${sideX}" cy="${sideY}" r="14" fill="#ffd23e"/>`);
  const glasses=item('glasses',`<g fill="none" stroke="#4a3620" stroke-width="8"><rect x="${e.left-e.rx}" y="${180-e.ry}" width="${e.rx*2}" height="${e.ry*2}" rx="${Math.round(e.rx*.68)}"/><rect x="${e.right-e.rx}" y="${180-e.ry}" width="${e.rx*2}" height="${e.ry*2}" rx="${Math.round(e.rx*.68)}"/><path d="M${e.left+e.rx} 177Q210 169 ${e.right-e.rx} 177M${e.left-e.rx} 168l-18-7m${e.right+e.rx} 168 18-7"/></g>`);
  const capeClasp=item('cape',`<path class="prod-acc" d="M${capeFit.left+9} ${capeFit.top+4}Q210 ${capeFit.top+31} ${capeFit.right-9} ${capeFit.top+4}L${capeFit.right-18} ${capeFit.top+24}Q210 ${capeFit.top+45} ${capeFit.left+18} ${capeFit.top+24}Z" fill="#f0503f"/><circle class="prod-acc" cx="210" cy="${capeFit.top+28}" r="12" fill="#ffc22e"/>`);
  const medal=item('medal',`<path d="M${ch.x-18} ${ch.y-45}l18 29 18-29" fill="none" stroke="#4a3620" stroke-width="11"/><circle class="prod-acc" cx="${ch.x}" cy="${ch.y}" r="28" fill="#ffc22e"/><path d="M${ch.x} ${ch.y-17}l6 12 14 2-10 10 2 14-12-7-12 7 2-14-10-10 14-2Z" fill="#fff6da"/>`);
  const moon=item('moonpin',`<path class="prod-acc" d="M${pin.x} ${pin.y-25}a28 28 0 1 0 0 52 21 21 0 1 1 0-52" fill="#ffedb0"/><circle cx="${pin.x+11}" cy="${pin.y-24}" r="7" fill="#ffd23e" stroke="#c47f12" stroke-width="4"/>`);
  const wand=item('wand',`<g transform="rotate(-24 ${hand.x} ${hand.y})"><rect x="${hand.x-7}" y="${hand.y-18}" width="14" height="96" rx="7" fill="#c47f12"/><circle cx="${hand.x}" cy="${hand.y}" r="8" fill="#4a3620"/><path class="prod-acc" d="M${hand.x} ${hand.y-51}l12 28 30 2-23 19 7 29-26-16-26 16 7-29-23-19 30-2Z" fill="#ffd23e"/></g>`);
  return headwear(id)+bow+flower+glasses+capeClasp+scarfFront(id)+medal+moon+wand;
}

const anchors=()=>`<g class="rig-anchors" aria-hidden="true"><path d="M210 45v377M95 180h230"/><circle cx="210" cy="95" r="8"/><text x="222" y="92">headwear</text><circle cx="165" cy="180" r="7"/><circle cx="255" cy="180" r="7"/><text x="269" y="178">eye line</text><circle cx="210" cy="294" r="8"/><text x="222" y="290">neck</text><circle cx="210" cy="340" r="8"/><text x="222" y="338">body</text><circle cx="210" cy="420" r="8"/><text x="222" y="437">pivot</text></g>`;
const feedback=()=>`<g class="attention"><circle cx="340" cy="127" r="8"/><circle cx="360" cy="104" r="12"/><circle cx="383" cy="71" r="17"/></g><g class="success-stars"><path d="M69 101l8 17 19 3-14 13 3 19-16-9-17 9 4-19-14-13 19-3Z"/><path d="M348 145l6 13 15 2-11 10 3 15-13-7-13 7 3-15-11-10 15-2Z"/></g>`;
const feet=()=>`<path class="foot" d="M126 389c-27 4-43 19-36 34 8 17 43 13 66-3 9-6 5-36-30-31Z"/><path class="foot" d="M294 389c27 4 43 19 36 34-8 17-43 13-66-3-9-6-5-36 30-31Z"/>`;
const limbs=()=>`<g class="limb limb-left"><path d="M100 249q-50 18-42 67 5 30 39 20 26-8 44-50Z"/></g><g class="limb limb-right"><path d="M320 249q50 18 42 67-5 30-39 20-26-8-44-50Z"/></g>`;

const rabbitBody=()=>`<circle class="muzzle rabbit-tail" cx="328" cy="340" r="39"/><path class="species-torso" d="M210 255C161 255 139 286 139 326c-31 12-50 39-45 69 5 31 36 44 68 27 17-9 31-13 48-13s31 4 48 13c32 17 63 4 68-27 5-30-14-57-45-69 0-40-22-71-71-71Z"/><path class="rabbit-belly" d="M210 293c-31 0-52 25-52 65 0 35 18 55 52 55s52-20 52-55c0-40-21-65-52-65Z"/><g class="limb limb-left rabbit-forepaw"><path d="M154 281c-23 7-31 38-19 66 9 22 31 28 48 10 14-15 16-45 4-65-8-13-20-15-33-11Z"/><ellipse class="rabbit-paw-pad" cx="170" cy="345" rx="18" ry="14"/><path class="paw-line" d="M155 325q16 10 30 0"/></g><g class="limb limb-right rabbit-forepaw"><path d="M266 281c23 7 31 38 19 66-9 22-31 28-48 10-14-15-16-45-4-65 8-13 20-15 33-11Z"/><ellipse class="rabbit-paw-pad" cx="250" cy="345" rx="18" ry="14"/><path class="paw-line" d="M265 325q-16 10-30 0"/></g><path class="rabbit-foot" d="M151 382c-33-4-57 13-54 35 4 27 43 29 79 3 16-11 3-34-25-38Z"/><path class="rabbit-foot" d="M269 382c33-4 57 13 54 35-4 27-43 29-79 3-16-11-3-34 25-38Z"/><path class="toe-line" d="M118 406q19 8 35-8m149 8q-19 8-35-8"/>`;

const bearBody=()=>`<path class="species-torso" d="M210 253c-60 0-101 29-106 78-4 39 8 69 38 84 21 11 44 8 68-3 24 11 47 14 68 3 30-15 42-45 38-84-5-49-46-78-106-78Z"/><g class="limb limb-left bear-arm"><path d="M140 274c-37-8-66 19-69 57-3 38 18 67 47 65 28-2 44-32 42-69-2-31-7-49-20-53Z"/><ellipse class="bear-paw-pad" cx="96" cy="364" rx="25" ry="20"/></g><g class="limb limb-right bear-arm"><path d="M280 274c37-8 66 19 69 57 3 38-18 67-47 65-28-2-44-32-42-69 2-31 7-49 20-53Z"/><ellipse class="bear-paw-pad" cx="324" cy="364" rx="25" ry="20"/></g><path class="bear-belly" d="M210 291c-42 0-70 29-70 70 0 38 27 62 70 62s70-24 70-62c0-41-28-70-70-70Z"/><path class="bear-foot" d="M154 380c-35-4-58 13-55 36 4 27 43 27 77 5 18-12 8-38-22-41Z"/><path class="bear-foot" d="M266 380c35-4 58 13 55 36-4 27-43 27-77 5-18-12-8-38 22-41Z"/><ellipse class="bear-paw-pad" cx="132" cy="406" rx="22" ry="14"/><ellipse class="bear-paw-pad" cx="288" cy="406" rx="22" ry="14"/>`;

function anatomy(id){
  if(id==='lumi')return `${feet()}<path class="species-torso" d="M210 45c-86 0-142 61-142 151v111c0 79 54 112 142 112s142-33 142-112V196c0-90-56-151-142-151Z"/><path class="species-fore" d="M72 137c2-43 22-79 56-103 7-5 15-1 17 7 6 22 18 38 36 47 7-31 17-56 29-73 13 17 23 42 30 73 18-9 30-25 36-47 2-8 10-12 17-7 34 24 54 60 56 103-39-25-85-37-139-37S111 112 72 137Z"/>${scarfBack(id)}<g class="limb limb-left"><path d="M83 192c-50 22-68 83-36 122 18 22 48 5 63-18 12-18 22-51 19-83-2-20-27-29-46-21Z"/></g><g class="limb limb-right"><path d="M337 192c50 22 68 83 36 122-18 22-48 5-63-18-12-18-22-51-19-83 2-20 27-29 46-21Z"/></g>${birdFace()}<g class="belly-mark"><path d="M159 347q17 24 34 0"/><path d="M193 347q17 24 34 0"/><path d="M227 347q17 24 34 0"/></g>`;
  if(id==='mina')return `<g class="rabbit-ear rabbit-ear-left"><ellipse class="overlay" cx="137" cy="80" rx="34" ry="82"/><ellipse class="ear-inner" cx="137" cy="75" rx="17" ry="60"/></g><g class="rabbit-ear rabbit-ear-right"><ellipse class="overlay" cx="283" cy="80" rx="34" ry="82"/><ellipse class="ear-inner" cx="283" cy="75" rx="17" ry="60"/></g>${rabbitBody()}${scarfBack(id)}<path class="species-head" d="M210 72c-72 0-119 43-119 110 0 72 50 115 119 115s119-43 119-115c0-67-47-110-119-110Z"/>${mammalFace()}`;
  return `<g class="bear-ear bear-ear-left"><circle class="overlay" cx="118" cy="104" r="55"/><circle class="ear-inner" cx="118" cy="104" r="29"/></g><g class="bear-ear bear-ear-right"><circle class="overlay" cx="302" cy="104" r="55"/><circle class="ear-inner" cx="302" cy="104" r="29"/></g>${bearBody()}${scarfBack(id)}<path class="species-head" d="M96 143C96 88 132 52 178 43q16-12 32 2 16-14 32-2c46 9 82 45 82 100v67c0 58-44 91-114 94-70-3-114-36-114-94Z"/>${mammalFace()}`;
}

function petSvg(id){return `<svg viewBox="0 0 420 470" role="img" aria-label="${characters[id].name}, ${characters[id].species}"><ellipse class="ground" cx="210" cy="423" rx="118" ry="20"/><g class="rig">${worldBack(id)}${anatomy(id)}${foregroundAccessories(id)}${feedback()}</g></svg>`}

function labPetMarkup(id,{hue=selectedHue[id],items=[],size=140,stage=1,mood='happy'}={}){
  const state=({open:'success',delighted:'success',proud:'success',listening:'listen',thinking:'think',curious:'think'})[mood] || 'idle';
  const previous=[...worn];
  worn.clear();
  items.forEach(accessory=>worn.add(accessory));
  const p=petPalette(id,hue);
  const markup=`<span class="lg-animal pet-${id}" data-state="${state}" data-stage="${stage}" style="width:${size}px;height:${size*1.119}px;--body:${p.body};--overlay:${p.overlay};--inner:${p.inner};--highlight:${p.highlight};--muzzle:${p.muzzle};--accent:${p.accent};--accent-dark:${p.accentDark}">${petSvg(id)}</span>`;
  worn.clear();
  previous.forEach(accessory=>worn.add(accessory));
  return markup;
}


ns.LettersAnimalArt={render:labPetMarkup,characters};
})(window.MiftahGame || (window.MiftahGame={}));

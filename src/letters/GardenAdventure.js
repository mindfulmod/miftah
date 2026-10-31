// A small, resumable story around existing toys. Curriculum and earned progress
// stay in their original stores; this save owns only projects and their route.
(function (ns) {
  const KEY = 'quran-trainer:letters:garden-adventure';
  const PROJECTS = ['butterfly', 'bird'];
  const ROUTES = {
    grow: ['LetterDelivery', 'GardenPaths', 'WaterGarden'],
    picnic: ['LetterHunt', 'GardenPaths', 'Feed'],
    pond: ['LetterFishing', 'GardenPaths', 'WaterGarden'],
  };
  const LABELS = { LetterDelivery:'deliver seeds', GardenPaths:'draw a garden sign', WaterGarden:'water the plants', LetterHunt:'find letters in the garden', Feed:'feed your friend', LetterFishing:'catch letter fish' };
  const routeId = value => typeof value==='string' && Object.hasOwn(ROUTES,value) ? value : 'grow';
  const routeSteps = active => ROUTES[routeId(active?.route)];
  function nextRoute(state, items) {
    const recent = normalize(state).recentRoutes;
    if (!recent.length || items.length < 2) return 'grow';
    const eligible = ['grow','picnic'];
    if (items.every(item => ns.LetterFriends?.FRIENDS?.[item.display])) eligible.push('pond');
    // Least recently completed, with a stable tie break. Opening, cancelling,
    // reloading or changing projects cannot burn through the route rotation.
    return eligible.sort((a,b)=>recent.lastIndexOf(a)-recent.lastIndexOf(b))[0];
  }
  const emptyWater = () => ({ open: [false,false,false], away: [false,false,false], bloomed: [false,false,false] });
  const cleanWater = value => ns.WaterGardenState?.normalize(value) || emptyWater();
  const word = value => typeof value === 'string' && value.length <= 8 ? value : '';
  const esc = value => String(value || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const INKS = new Set(['#4a3620','#e8743c','#ee806f','#f3c955','#4e9677','#3a8fc4','#b49fcf','#c25a49','#7fce54','#62cdf4','hsl(95 62% 54%)','hsl(200 62% 54%)','hsl(268 62% 54%)','hsl(320 62% 54%)','hsl(28 62% 54%)']);
  function drawing(value) {
    if (!value || !Array.isArray(value.strokes)) return null;
    let left = 1800;
    const strokes = value.strokes.slice(0,60).filter(s=>s&&typeof s==='object').map(s => {
      const points = (Array.isArray(s.points) ? s.points : []).filter(p => Array.isArray(p) && p.length===2 && p.every(Number.isFinite)).slice(0,Math.min(200,left)).map(([x,y]) => [Math.round(Math.max(0,Math.min(800,x))),Math.round(Math.max(0,Math.min(500,y)))]);
      left -= points.length;
      return { color: INKS.has(s.color) ? s.color : '#3a8fc4', points };
    }).filter(s => s.points.length > 1);
    return strokes.length ? { letter:word(value.letter), strokes } : null;
  }
  function normalize(value) {
    const source = value && typeof value === 'object' ? value : {};
    const projects = Object.fromEntries(PROJECTS.map(id => {
      const p = source.projects?.[id] || {};
      return [id,{ water:cleanWater(p.water), drawing:drawing(p.drawing), complete:p.complete===true }];
    }));
    const a = source.active;
    const active = a && PROJECTS.includes(a.project) && typeof a.id==='string' && /^[\w-]{1,80}$/.test(a.id) && Array.isArray(a.letters)
      ? { id:a.id, project:a.project, route:routeId(a.route), letters:[...new Set(a.letters.map(word).filter(Boolean))].slice(0,3), step:Number.isInteger(a.step)?Math.max(0,Math.min(3,a.step)):0, help:[...new Set((Array.isArray(a.help)?a.help:[]).map(word).filter(Boolean))].slice(0,3), stamped:a.stamped===true } : null;
    const recentRoutes = Array.isArray(source.recentRoutes)
      ? source.recentRoutes.filter(id=>typeof id==='string' && Object.hasOwn(ROUTES,id)).slice(-3)
      : (active?.step===3 || PROJECTS.some(id=>projects[id].complete)) ? [routeId(active?.route)] : [];
    // Least-recently completed letter IDs, deduplicated and bounded to the
    // alphabet. Older completed saves can seed their last known cast; opening
    // a chooser or resuming an unfinished trip never consumes a turn.
    const letterHistory = Array.isArray(source.recentLetters) ? source.recentLetters
      : active?.step === 3 ? active.letters : [];
    const recentLetters = [...new Set(letterHistory.map(word).filter(Boolean).reverse())].reverse().slice(-28);
    return { version:4, projects, recentRoutes, recentLetters, active:active?.letters.length ? active : null };
  }
  function begin(state, project, items, id) {
    const next=normalize(state);
    if (!PROJECTS.includes(project) || next.active && next.active.step<3) return next;
    next.active={id,project,route:nextRoute(next,items),letters:items.map(i=>i.id).slice(0,3),step:0,help:[],stamped:false};
    return normalize(next);
  }
  function advance(state,id,step) {
    const next=normalize(state),a=next.active;
    if (!a || a.id!==id || a.step!==step || step>=3) return null;
    a.step++;
    if(a.step===3) {
      next.projects[a.project].complete=true;
      next.recentRoutes=[...next.recentRoutes,a.route].slice(-3);
      next.recentLetters=[...next.recentLetters.filter(id=>!a.letters.includes(id)),...a.letters].slice(-28);
    }
    return next;
  }
  function ink(value) {
    const d=drawing(value);
    if(!d)return '';
    const points=d.strokes.flatMap(s=>s.points),xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
    const x=Math.min(...xs)-28,y=Math.min(...ys)-28,w=Math.max(80,Math.max(...xs)-x+28),h=Math.max(80,Math.max(...ys)-y+28);
    return `<svg x="-42" y="-29" width="84" height="52" viewBox="${x} ${y} ${w} ${h}" aria-hidden="true">${d.strokes.map(s=>`<path d="M${s.points.map(p=>p.join(',')).join('L')}" fill="none" stroke="${s.color}" stroke-width="2.4" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}</svg>`;
  }
  function visitor(project) {
    return project==='bird'
      ? '<path d="M-24 5Q-28-25 2-21Q26-20 25 3L36 13L20 11Q2 28-17 16Z" fill="#62cdf4" stroke="#4a3620" stroke-width="3"/><path d="M-14 2Q0-9 12 8Q-4 19-14 2" fill="#96ecff"/><circle cx="12" cy="-8" r="3" fill="#4a3620"/><path d="M24-5L35 0L24 4" fill="#f3c955" stroke="#4a3620" stroke-width="2.4"/><path d="M-9 20V26M4 20V26" stroke="#4a3620" stroke-width="3" stroke-linecap="round"/>'
      : '<g stroke="#4a3620" stroke-width="3"><path d="M0 0C-45-48-45 22-6 12C-30 44 9 39 0 0" fill="#ee806f"/><path d="M0 0C45-48 45 22 6 12C30 44-9 39 0 0" fill="#f3c955"/><path d="M-2-9L-9-18M2-9L9-18" fill="none" stroke-linecap="round"/><path d="M0-7Q-8 8 0 21Q8 8 0-7" fill="#4a3620"/></g>';
  }
  function sceneClassic(project,step=0,sign=null) {
    const bird=project==='bird';
    return `<svg class="ga-landscape" viewBox="0 0 560 320" aria-hidden="true">
      <path d="M0 0H560V320H0Z" fill="#ccfbef"/>
      <circle cx="452" cy="54" r="27" fill="#ffe49a"/>
      <path d="M0 117Q85 43 170 115Q271 55 354 116Q460 44 560 100V320H0" fill="#b7e779"/>
      <path d="M0 182Q142 131 280 188Q443 125 560 171V320H0" fill="#7fce54"/>
      <path d="M560 161Q405 161 415 205T278 320H560Z" fill="#e5dcc8"/>
      <path d="M560 174Q429 173 435 206T311 320H560Z" fill="#62cdf4"/>
      <path d="M500 213Q463 206 451 223M402 282Q440 268 494 279" fill="none" stroke="#96ecff" stroke-width="4" stroke-linecap="round"/>
      <path d="M0 300Q150 260 290 320H0" fill="#4e9677"/>
      <g stroke="#4a3620" stroke-width="4" stroke-linejoin="round">
        <path d="M51 242Q158 212 339 239L343 264Q175 292 51 269Z" fill="#a89478"/>
        <path d="M51 242Q186 213 339 239Q181 267 51 242Z" fill="#4a3620"/>
        ${[105,192,279].map((x,i)=>`<g><ellipse cx="${x}" cy="248" rx="18" ry="5" fill="#2b1e12" stroke="none"/>${step>=3?`<path d="M${x} 245V177" fill="none" stroke="#2f5c46" stroke-width="4"/><path d="M${x} 227Q${x-29} 228 ${x-25} 205Q${x-2} 204 ${x} 227M${x} 218Q${x+28} 217 ${x+22} 199Q${x+3} 198 ${x} 218" fill="#b7e779"/>${[0,60,120,180,240,300].map(a=>`<ellipse cx="${x}" cy="158" rx="12" ry="22" transform="rotate(${a} ${x} 177)" fill="${bird?'#f3c955':['#ee806f','#f3c955','#b49fcf'][i]}"/>`).join('')}<circle cx="${x}" cy="177" r="13" fill="${bird?'#70501b':'#ffe49a'}"/>`:step>=1?`<path d="M${x} 247V226M${x} 235Q${x-18} 234 ${x-13} 223Q${x} 222 ${x} 235Q${x+13} 215 ${x+19} 225Q${x+16} 237 ${x} 235" fill="#b7e779"/>`:''}</g>`).join('')}
        <path d="M366 230V283" fill="none" stroke="#70501b" stroke-width="8"/>
        <g transform="translate(366 201)"><rect x="-50" y="-38" width="100" height="74" rx="12" fill="#fffaf0"/>${step>=2&&sign?ink(sign):'<path d="M-20 13Q-25-18 21-16Q26 18-20 13Z" fill="#b7e779"/><path d="M-22 19L13-9" fill="none" stroke="#4e9677"/>'}</g>
      </g>
      <g fill="#4e9677"><path d="M0 194Q9 129 31 155Q45 107 57 154Q84 128 89 189Z"/><path d="M496 299Q474 249 490 230Q509 252 506 288Q515 235 530 243Q543 265 517 304Z"/></g>
      ${step>=3?`<g class="ga-scene-visitor" transform="translate(190 92)">${visitor(project)}</g>`:''}
      <g fill="#fffdf7" opacity=".7"><ellipse cx="107" cy="52" rx="36" ry="9"/><ellipse cx="135" cy="57" rx="28" ry="7"/></g>
    </svg>`;
  }
  const scene=(project,step=0,sign=null)=>ns.GardenAdventurePlayArt?.scene(project,step,drawing(sign))||sceneClassic(project,step,sign);
  const visitorArt=project=>ns.GardenAdventurePlayArt?.visitor(project)||visitor(project);
  const picture = kind => kind==='LetterDelivery' ? ns.LetterDelivery.icon(80) : ns.LettersGardenArt.practicePicture(kind);
  function steps(step,active) { return `<div class="ga-steps" role="progressbar" aria-label="Garden adventure" aria-valuemin="0" aria-valuemax="3" aria-valuenow="${step}">${routeSteps(active).map((kind,i)=>`<span class="ga-step${i<step?' is-done':i===step?' is-current':''}" aria-hidden="true">${picture(kind)}${i<step?`<i>${ns.LettersArt.icon('check',20)}</i>`:''}</span>`).join('')}</div>`; }

  class GardenAdventure {
    constructor(game) { this.g=game; this.draft=null; this.pendingCommit=null; }
    read() { return normalize(this.draft || this.g.loadJSON(KEY,null)); }
    save(state) {
      try {
        if(this.g.saveJSON(KEY,normalize(state))!==true)return false;
        this.draft=null;return true;
      } catch { return false; }
    }
    // Keep drawings and water in memory during a failed write. Finishing or
    // leaving the toy must save this same snapshot before claiming progress.
    retain(state) { if(this.save(state))return true;this.draft=normalize(state);return false; }
    returnToGarden() {
      if(this.pendingCommit)return this.retrySave(this.pendingCommit);
      if(this.draft&&!this.save(this.draft))return this.retrySave({state:this.read(),after:()=>this.render()});
      return this.render();
    }
    retrySave(commit) {
      this.pendingCommit=commit;
      const a=commit.state.active,project=a?.project||'butterfly',p=commit.state.projects[project];
      const el=this.shell(`<div class="ga-story ga-save-story">${scene(project,Math.min(a?.step||0,2),p.drawing)}<div class="ga-companion">${this.g.petSVG(110,'curious')}</div></div><button type="button" class="ga-go ga-save-retry" aria-label="Your garden could not be saved. Try saving again">${picture('GardenPaths')}<span>${ns.LettersArt.icon('next',36)}</span></button>`);
      const button=el.querySelector('.ga-save-retry');
      button.onclick=()=>{
        if(!el.isConnected||this.pendingCommit!==commit||button.disabled)return;
        button.disabled=true;
        if(!this.save(commit.state)){button.disabled=false;button.focus?.({preventScroll:true});return;}
        this.pendingCommit=null;commit.after();
      };
      button.focus?.({preventScroll:true});
      return false;
    }
    available() { return this.g.knownItems(); }
    status() { const a=this.read().active; return this.available().length ? {stops:routeSteps(a),done:Array.from({length:a?.step||0},(_,i)=>i)} : null; }
    shell(content,back) {
      const g=this.g;g.session=null;
      const el=g.screen('lg-adventure',`${g.topBar()}<div class="ga-stage">${content}</div>`);
      g.wireTopBar(el,back||(()=>g.renderVillage()));return el;
    }
    render() {
      if(this.pendingCommit)return this.retrySave(this.pendingCommit);
      const state=this.read(),a=state.active;
      if(!this.available().length)return this.g.renderVillage();
      if(!a)return this.choose();
      if(a.step===3)return this.finish();
      const p=state.projects[a.project],g=this.g;
      const el=this.shell(`<div class="ga-story">${scene(a.project,a.step,p.drawing)}<div class="ga-companion">${g.petSVG(110,'delighted')}</div></div>${steps(a.step,a)}<button type="button" class="ga-go" aria-label="Continue adventure: ${LABELS[routeSteps(a)[a.step]]}">${picture(routeSteps(a)[a.step])}<span>${ns.LettersArt.icon('next',36)}</span></button><div class="ga-revisits">${PROJECTS.filter(id=>state.projects[id].complete).map(id=>`<button type="button" class="ga-revisit" data-revisit="${id}" aria-label="Visit your ${id} garden"><svg viewBox="-45 -40 90 80" aria-hidden="true">${visitorArt(id)}</svg></button>`).join('')}</div>`);
      el.querySelector('.ga-go').onclick=()=>{if(el.isConnected)this.start(a.id,a.step);};
      el.querySelectorAll('[data-revisit]').forEach(b=>b.onclick=()=>{if(el.isConnected)this.visit(b.dataset.revisit);});
      return el;
    }
    choose() {
      const state=this.read();
      if(state.active?.step<3)return this.render();
      const legacy=this.g.todaysWalk();
      const items=ns.GardenLearning.plan(ns.LettersStrength,this.available(),{recentIds:state.recentLetters});
      const route=nextRoute(state,items), itinerary=ROUTES[route];
      const preview=`<span class="ga-route-preview" aria-hidden="true">${itinerary.map(kind=>`<span>${picture(kind)}</span>`).join('')}</span>`;
      const el=this.shell(`<div class="ga-welcome">${this.g.petSVG(112,'curious')}</div><div class="ga-choices">${PROJECTS.map(id=>`<div class="ga-project-option"><button type="button" class="ga-project" data-project="${id}" aria-label="Grow a ${id==='bird'?'bird garden':'butterfly garden'}: ${itinerary.map(kind=>LABELS[kind]).join(', ')}">${scene(id,3)}<span class="ga-project-badge"><svg viewBox="-45 -40 90 80" aria-hidden="true">${visitorArt(id)}</svg>${ns.LettersArt.icon('next',28)}</span>${preview}</button>${state.projects[id].complete?`<button type="button" class="ga-revisit" data-revisit="${id}" aria-label="Visit your ${id} garden"><svg viewBox="-45 -40 90 80" aria-hidden="true">${visitorArt(id)}</svg></button>`:''}</div>`).join('')}</div>${legacy?.done?.length&&legacy.done.length<legacy.stops.length?`<button class="ga-legacy" aria-label="Continue your previous walk">${ns.LettersArt.icon('next',26)}</button>`:''}`);
      el.querySelectorAll('[data-project]').forEach(b=>b.onclick=()=>{
        if(!el.isConnected)return;
        if(!items.length)return;
        const next=begin(this.read(),b.dataset.project,items,`${Date.now()}-${Math.random().toString(36).slice(2,8)}`);
        const after=()=>{this.g.sound.play('seed');this.render();};
        if(!this.save(next))return this.retrySave({state:next,after});
        after();
      });
      el.querySelectorAll('[data-revisit]').forEach(b=>b.onclick=()=>{if(el.isConnected)this.visit(b.dataset.revisit);});
      el.querySelector('.ga-legacy')?.addEventListener('click',()=>this.g.renderLegacyWalk());
      return el;
    }
    start(id,step) {
      const state=this.read(),a=state.active,g=this.g;
      if(!a||a.id!==id||a.step!==step)return this.render();
      const known=new Map(this.available().map(i=>[i.id,i]));
      const items=a.letters.map(c=>known.get(c)).filter(Boolean);
      if(!items.length)return g.renderVillage();
      // Carry a letter that needed help across a different motor activity.
      const focus=items.find(i=>a.help.includes(i.id))||items[1]||items[0];
      const rows=ns.GardenLearning.support(ns.LettersStrength,items,{beginner:!!g.sprout});
      const supported=a.help.length>0||rows.some(r=>!r.allowRecall);
      const targets=[items[0],focus,items[2]||items[0],focus].map(i=>i.id);
      const kind=routeSteps(a)[step];
      g.session={world:g.worlds.worlds.find(w=>w.id==='pack-boat'),items:step===1?[focus]:items};
      const options={directDone:true,learningSessionId:a.id,chrome:steps(step,a),context:{
        adventure:true,targets,allowPartial:(ns.LettersStrength.skillProfile(focus.id,'drawing').motor?.participation||0)>=3,choiceCount:supported?2:Math.min(...rows.map(r=>r.choiceCount)),allowRecall:!supported,beginner:!!g.sprout||supported,known:items,supportedItemIds:a.help.slice(),
        waterState:state.projects[a.project].water,
        saveWaterState:patch=>this.patchProject(a.project,{water:patch}),
        keepDrawing:value=>this.patchProject(a.project,{drawing:value}),
        returnLabel:'Finish your adventure',
        onGuidedDone:kind==='WaterGarden'?()=>{if(this.complete(id,step,false)){const trail=g.root.querySelector('.ga-steps');if(trail)trail.outerHTML=steps(3,a);}}:undefined,
      },onOutcome:outcome=>{
        if(!outcome||outcome.baseEvidence==='motor_assembly_participation'||outcome.evidence==='motor_assembly_participation')return;
        if(outcome.correct!==false&&!outcome.assisted)return;
        const current=this.read();if(current.active?.id!==id)return;
        current.active.help=[...new Set([...current.active.help,outcome.itemId])].slice(0,3);this.retain(current);
      }};
      g.startPractice(kind,()=>this.returnToGarden(),()=>{if(kind==='WaterGarden'&&step===2){if(items.length<2&&!this.complete(id,step,false))return;if(this.pendingCommit)return;this.returnToGarden();}else this.complete(id,step,true);},options);
    }
    patchProject(project,patch) {
      const state=this.read(),p=state.projects[project];if(!p)return false;
      if(patch.water)p.water=cleanWater({...p.water,...patch.water});
      if(patch.drawing)p.drawing=drawing(patch.drawing);
      return this.retain(state);
    }
    complete(id,step,render) {
      if(this.pendingCommit)return false;
      const next=advance(this.read(),id,step);if(!next)return false;
      if(step===2){next.active.stamped=true;}
      const after=()=>{this.g.payPractice(routeSteps(next.active)[step]);if(step===2)this.g.stampToday?.();};
      if(!this.save(next))return this.retrySave({state:next,after:()=>{after();this.render();}});
      after();if(render)this.render();return true;
    }
    finish() {
      const state=this.read(),a=state.active;
      if(!a||a.step<3)return this.render();
      if(ns.GardenHabitat)return this.habitat(a.project,a);
      const g=this.g,p=state.projects[a.project],v=ns.GardenAdventurePlayArt?.visitorPlacement(a.project)||{x:190,y:92};
      const el=this.shell(`<div class="ga-story is-finished">${scene(a.project,3,p.drawing)}<button class="ga-visitor" style="--ga-visitor-x:${v.x/560*100}%;--ga-visitor-y:${v.y/320*100}%" aria-label="Play with your ${a.project}" type="button"><svg viewBox="-45 -40 90 80" aria-hidden="true">${visitorArt(a.project)}</svg></button><div class="ga-companion">${g.petSVG(110,'proud')}</div></div>${steps(3,a)}<div class="ga-finish-actions"><button type="button" class="ga-action" data-home aria-label="All done, go home">${ns.LettersArt.icon('home',48)}</button><button type="button" class="ga-action" data-garden aria-label="Play in your garden">${picture('WaterGarden')}</button><button type="button" class="ga-action" data-next aria-label="Choose another adventure">${ns.LettersArt.icon('next',42)}</button></div>`);
      el.querySelector('[data-home]').onclick=()=>g.renderVillage();
      el.querySelector('[data-garden]').onclick=()=>this.visit(a.project);
      el.querySelector('[data-next]').onclick=()=>{this.choose();};
      const friend=g.sceneRig?.(el.querySelector('.ga-companion'));
      let bounce=null;
      el.querySelector('.ga-visitor').onclick=e=>{
        if(!el.isConnected)return;
        g.sound.play('seed');friend?.cheer();bounce?.cancel();
        const art=e.currentTarget.querySelector('svg');
        if(!g.prefersReducedMotion())bounce=art?.animate([{transform:'translateY(0) rotate(0)'},{transform:'translateY(-14px) rotate(-6deg)'},{transform:'translateY(0) rotate(0)'}],{duration:420,easing:'ease-out'});
      };
      return el;
    }
    visit(project) {
      const state=this.read(),g=this.g,items=this.available();
      if(!PROJECTS.includes(project)||!items.length||!state.projects[project].complete)return this.render();
      if(ns.GardenHabitat)return this.habitat(project);
      return this.water(project);
    }
    habitat(project,completed=null) {
      const state=this.read(),g=this.g,p=state.projects[project];
      if(!p?.complete)return this.render();
      const el=this.shell(`<div class="ga-story is-finished gh-host">${scene(project,3,p.drawing)}<div class="ga-companion">${g.petSVG(110,'proud')}</div></div>${completed?steps(3,completed):''}<div class="ga-finish-actions"><button type="button" class="ga-action" data-home aria-label="All done, go home">${ns.LettersArt.icon('home',48)}</button><button type="button" class="ga-action" data-water aria-label="Play with the water channels">${picture('WaterGarden')}</button><button type="button" class="ga-action" data-next aria-label="${completed?'Choose another adventure':'Back to your adventures'}">${ns.LettersArt.icon('next',42)}</button></div>`);
      el.querySelector('.ga-stage').classList.add('is-habitat');
      const rig=g.sceneRig?.(el.querySelector('.ga-companion'));
      g.game=new ns.GardenHabitat({root:el.querySelector('.gh-host'),project,art:visitorArt(project),reducedMotion:()=>g.prefersReducedMotion(),react:()=>rig?.inspect?.(el.querySelector('.gh-visitor'),500),play:name=>g.sound.play(name)});
      el.querySelector('[data-home]').onclick=()=>{if(el.isConnected)g.renderVillage();};
      el.querySelector('[data-water]').onclick=()=>{if(el.isConnected)this.water(project);};
      el.querySelector('[data-next]').onclick=()=>{if(el.isConnected)(completed?this.choose():this.returnToGarden());};
      return el;
    }
    water(project) {
      const state=this.read(),g=this.g,items=this.available();
      if(!PROJECTS.includes(project)||!items.length||!state.projects[project].complete)return this.render();
      g.session={world:g.worlds.worlds.find(w=>w.id==='pack-boat'),items};
      const back=()=>this.draft||this.pendingCommit||!ns.GardenHabitat?this.returnToGarden():this.visit(project);
      g.startPractice('WaterGarden',back,back,{directDone:true,chrome:`<div class="ga-keepsake">${scene(project,3,state.projects[project].drawing)}</div>`,context:{freePlay:true,returnLabel:'Back to your garden',waterState:state.projects[project].water,saveWaterState:patch=>this.patchProject(project,{water:patch})}});
    }
  }
  ns.GardenAdventure=GardenAdventure;
  ns.GardenAdventureState={normalize,begin,advance,drawing,nextRoute,routeSteps,KEY};
  ns.GardenAdventureArt={scene,visitor:visitorArt,steps,classic:{scene:sceneClassic,visitor}};
})(window.MiftahGame||(window.MiftahGame={}));

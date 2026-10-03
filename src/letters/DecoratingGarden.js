// A small, wordless home for earned rewards. Layout never changes ownership.
(function(ns){
  const icon = (size=48) => `<svg width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true"><path d="M8 40Q32 29 56 40L50 54Q32 61 14 54Z" fill="#b7e779"/><path d="M11 47Q31 56 53 47L50 54Q32 61 14 54Z" fill="#4e9677"/><path d="M26 43V23M26 37Q12 37 15 27Q25 26 26 37" fill="#7fce54" stroke="#4a3620" stroke-width="2.4"/><g fill="#ee806f" stroke="#4a3620" stroke-width="1.6"><circle cx="26" cy="14" r="7"/><circle cx="19" cy="20" r="7"/><circle cx="33" cy="20" r="7"/><circle cx="26" cy="26" r="7"/></g><circle cx="26" cy="20" r="5" fill="#f3c955"/><path d="M42 42L52 16Q56 12 58 17L48 45Z" fill="#fffaf0" stroke="#4a3620" stroke-width="2.4"/><path d="M42 41Q32 45 38 53Q48 53 48 44" fill="#ee806f" stroke="#4a3620" stroke-width="2.4"/></svg>`;
  const landscape = () => `<svg class="decorate-land" viewBox="0 0 600 480" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="decorate-soil" x2="0" y2="1"><stop stop-color="#b7e779"/><stop offset="1" stop-color="#4e9677"/></linearGradient></defs><ellipse cx="300" cy="428" rx="274" ry="37" fill="#2f5c46" opacity=".22"/><path d="M24 175Q37 116 160 109Q280 85 416 111Q569 121 579 190L574 377Q565 438 302 449Q40 438 28 382Z" fill="#e5dcc8"/><path d="M30 175Q39 121 161 116Q281 91 417 118Q562 128 572 190L567 371Q557 425 302 437Q46 426 35 376Z" fill="url(#decorate-soil)"/><path d="M39 194Q136 134 256 171Q405 209 566 154" fill="none" stroke="#b7e779" stroke-width="8" opacity=".65"/><path d="M564 257Q497 235 491 313Q484 362 539 390L567 371Z" fill="#e5dcc8"/><path d="M562 271Q510 253 506 312Q499 345 553 376L564 365Z" fill="#62cdf4"/><path d="M518 294Q541 288 562 298M518 325Q541 319 563 330" stroke="#ccfbef" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M44 309Q24 287 42 270Q51 284 47 303M45 310Q62 281 77 293Q73 309 45 310" fill="#2f5c46" opacity=".6"/></svg>`;
  const plus = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 14V34M14 24H34" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>';
  const removeIcon = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M9 34Q24 25 39 34L35 41H13Z" fill="#e5dcc8" stroke="currentColor" stroke-width="3"/><path d="M24 30V8M15 17L24 8 33 17" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function decorationArt(item,size=100){
    if(!item)return '';
    if(item.kind==='sticker')return ns.LettersArt.sticker({id:item.stickerId,size});
    if(item.kind==='boat')return ns.LettersGardenArt.boat({stage:0});
    if(item.kind==='blanket')return `<svg viewBox="0 0 120 96" aria-hidden="true"><ellipse cx="60" cy="82" rx="56" ry="8" fill="#2f5c46" opacity=".18"/><path d="M8 72H112L110 79Q60 84 10 79Z" fill="#c25a49" stroke="#4a3620" stroke-width="2.4" stroke-linejoin="round"/><path d="M8 72L28 42H94L112 72Z" fill="#ee806f" stroke="#4a3620" stroke-width="2.4" stroke-linejoin="round"/><path d="M22 52H100M14 63H107M48 42L42 72M73 42L77 72" stroke="#fffdf7" stroke-width="6" opacity=".75"/><g class="blanket-cup"><path d="M84 40H98L96 54Q91 57 86 54Z" fill="#fffdf7" stroke="#4a3620" stroke-width="2.4" stroke-linejoin="round"/><path d="M98 44Q104 45 97 51" fill="none" stroke="#4a3620" stroke-width="2.4"/></g></svg>`;
    if(item.kind==='can')return `<svg viewBox="0 0 100 96" aria-hidden="true"><ellipse cx="46" cy="84" rx="34" ry="6" fill="#2f5c46" opacity=".18"/><path d="M30 42Q44 16 58 42" fill="none" stroke="#4a3620" stroke-width="4" stroke-linecap="round"/><path d="M62 58L86 36" stroke="#4a3620" stroke-width="8" stroke-linecap="round"/><path d="M62 58L86 36" stroke="#62cdf4" stroke-width="4" stroke-linecap="round"/><circle cx="88" cy="34" r="7" fill="#96ecff" stroke="#4a3620" stroke-width="2.4"/><rect x="22" y="40" width="44" height="42" rx="9" fill="#62cdf4" stroke="#4a3620" stroke-width="2.4"/><path d="M30 48V72" stroke="#96ecff" stroke-width="4" stroke-linecap="round"/></svg>`;
    if(item.kind==='keepsake'&&item.story!=='parcel'&&item.story!=='picnic'){const art=ns.LettersJourney?.keepsakeArt?.(item.story);if(art)return art;}
    if(item.kind==='keepsake'&&item.story==='parcel')return `<svg viewBox="0 0 120 96" aria-hidden="true"><ellipse cx="60" cy="88" rx="48" ry="6" fill="#2f5c46" opacity=".18"/>${[[14,46],[58,46],[36,10]].map(([x,y])=>`<g transform="translate(${x} ${y})"><rect x="0" y="6" width="46" height="34" rx="5" fill="#e5dcc8" stroke="#4a3620" stroke-width="2.4"/><path d="M23 6V40M0 20H46" stroke="#c69434" stroke-width="2.4"/><path d="M23 6Q16 -1 13 4Q18 8 23 6Q30 -1 33 4Q28 8 23 6" fill="none" stroke="#c69434" stroke-width="2.4"/></g>`).join('')}</svg>`;
    if(item.kind==='keepsake')return ns.LettersGardenArt.seedBasket();
    if(item.kind==='sign')return `<svg viewBox="0 0 80 100" aria-hidden="true"><ellipse cx="40" cy="94" rx="24" ry="5" fill="#2f5c46" opacity=".18"/><path d="M40 92V54" stroke="#a89478" stroke-width="6" stroke-linecap="round"/><rect x="6" y="8" width="68" height="52" rx="8" fill="#fffdf7" stroke="#4a3620" stroke-width="3"/><image href="${item.drawing}" x="12" y="12" width="56" height="44" preserveAspectRatio="xMidYMid meet"/></svg>`;
    return ns.LettersGardenArt.flowerBed({size,count:item.count,centered:true});
  }

  class DecoratingGarden {
    constructor(ctx){
      this.ctx=ctx;this.alive=true;this.layout=ns.LettersDecorations.normalize(ctx.layout);
      this.catalog=ctx.catalog;this.items=new Map(this.catalog.map(item=>[item.id,item]));
      this.selected=null;this.selectedSlot=null;this.undo=[];this.dragResets=[];
      const stage=ctx.stage;
      stage.innerHTML=`<div class="decorate-board" aria-label="Your decorating garden">
        ${landscape()}<button type="button" class="decorate-pet" aria-label="Play with your garden pet">${ctx.petArt()}</button><span class="decorate-pet-reaction" aria-hidden="true"></span>
        ${Array.from({length:4},(_,i)=>`<button class="decorate-slot" type="button" data-slot="${i}" aria-label="Garden space ${i+1}"></button>`).join('')}
        </div><div class="decorate-selection" hidden aria-live="polite"><span class="decorate-selection-preview"></span><span class="decorate-selection-arrow" aria-hidden="true">${ns.LettersArt.icon('arrow',24)}</span></div><div class="decorate-shelf"><button type="button" class="decorate-prev" aria-label="Previous decorations">${ns.LettersArt.icon('next',22)}</button><div class="decorate-tray" role="group" aria-label="Your earned decorations">${this.catalog.length?this.catalog.map(item=>`<button type="button" class="decorate-choice" data-decoration="${item.id}" aria-label="Place ${item.label}" aria-pressed="false">${decorationArt(item,76)}<span class="decorate-used" aria-hidden="true">${ns.LettersArt.icon('check',18)}</span></button>`).join(''):`<button type="button" class="decorate-earn" aria-label="Play a lesson to grow garden flowers">${ns.LettersGardenArt.practicePicture('DotGarden')}${ns.LettersArt.icon('next',28)}</button>`}</div><button type="button" class="decorate-more" aria-label="More decorations">${ns.LettersArt.icon('next',22)}</button></div>
        <div class="decorate-tools"><button type="button" class="decorate-undo practice-button" aria-label="Undo garden change" disabled>${ns.LettersArt.icon('undo',30)}</button><button type="button" class="decorate-remove practice-button" aria-label="Return selected decoration to the tray" disabled>${removeIcon}</button><button type="button" class="decorate-done practice-button" aria-label="Finish decorating">${ns.LettersArt.icon('check',32)}</button></div>`;
      this.tray=stage.querySelector('.decorate-tray');
      const prev=stage.querySelector('.decorate-prev'),more=stage.querySelector('.decorate-more');
      this.refreshShelf=()=>{if(!this.alive)return;prev.disabled=this.tray.scrollLeft<=1;more.disabled=this.tray.scrollLeft+this.tray.clientWidth>=this.tray.scrollWidth-1;};
      prev.onclick=()=>{if(this.alive)this.tray.scrollBy({left:-180,behavior:ctx.reducedMotion?.()?'auto':'smooth'});};
      more.onclick=()=>{if(this.alive)this.tray.scrollBy({left:180,behavior:ctx.reducedMotion?.()?'auto':'smooth'});};
      this.tray.addEventListener('scroll',this.refreshShelf);
      if(typeof ResizeObserver!=='undefined'){this.shelfObserver=new ResizeObserver(this.refreshShelf);this.shelfObserver.observe(this.tray);}
      this.refreshShelf();
      this.slots=[...stage.querySelectorAll('.decorate-slot')];
      this.choices=[...stage.querySelectorAll('.decorate-choice')];
      this.slots.forEach((button,i)=>{
        button.onclick=()=>{
          if(!this.alive)return;
          const id=this.visible()[i];
          // Tapping toy after toy plays them; it never swaps one onto another.
          // Moves go to empty spaces (or come from the tray).
          if(this.selected&&!(id&&this.selectedSlot!==null)){this.place(i,this.selected);return;}
          if(!id)return;
          // Paint first: painting redraws the slot, so the toy animates the fresh art.
          this.selected=id;this.selectedSlot=i;this.paint();
          this.playToy(i,this.items.get(id));
        };
        this.wireDrag(button,()=>this.visible()[i]);
      });
      this.choices.forEach(button=>{
        const id=button.dataset.decoration;
        button.onclick=()=>{if(!this.alive)return;this.selected=this.selected===id?null:id;this.selectedSlot=null;this.paint();};
        this.wireDrag(button,()=>id);
      });
      stage.querySelector('.decorate-undo').onclick=()=>{
        if(!this.alive||!this.undo.length)return;
        this.layout=this.undo.pop();this.selected=null;this.selectedSlot=null;this.petHome();this.save();this.react('undo');
      };
      stage.querySelector('.decorate-remove').onclick=()=>{
        if(!this.alive||this.selectedSlot===null)return;
        this.commit(ns.LettersDecorations.remove(this.layout,this.selectedSlot),'remove');
      };
      stage.querySelector('.decorate-done').onclick=()=>{if(this.alive)ctx.onDone();};
      stage.querySelector('.decorate-earn')?.addEventListener('click',()=>{if(this.alive)ctx.onDone();});
      this.pet=stage.querySelector('.decorate-pet');this.board=stage.querySelector('.decorate-board');this.petOffset={x:0,y:0};
      this.petReaction=stage.querySelector('.decorate-pet-reaction');
      this.pet.onclick=()=>{if(!this.alive)return;if(this.petOffset?.x||this.petOffset?.y){this.petHome();return;}this.react('place');this.rig?.wave();};
      this.rig=ctx.petRig?.(this.pet);
      this.selection=stage.querySelector('.decorate-selection');this.selectionPreview=stage.querySelector('.decorate-selection-preview');
      this.onKey=e=>{if(e.key==='Escape'&&this.alive){this.dragResets.forEach(reset=>reset());this.selected=null;this.selectedSlot=null;this.paint();}};
      stage.addEventListener('keydown',this.onKey);
      this.paint();
    }
    visible(){return ns.LettersDecorations.visibleSlots(this.layout,this.catalog);}
    // Pet travel for toys. Offsets are measured from the pet's home spot, so
    // a walk can start wherever the pet already is (on the blanket, say).
    later(fn,ms){const t=setTimeout(()=>{this.toyTimers.delete(t);if(this.alive)fn();},ms);(this.toyTimers||=new Set()).add(t);}
    clearToys(){this.toyTimers?.forEach(clearTimeout);this.toyTimers?.clear();this.board?.querySelectorAll('.decorate-drops').forEach(el=>el.remove());}
    toward(slot,{share=1,sit=false,seat=.76,across=.5}={}){
      const a=this.pet.getBoundingClientRect(),b=slot.getBoundingClientRect(),o=this.petOffset||{x:0,y:0};
      const hx=a.left+a.width/2-o.x,hy=a.top+a.height/2-o.y,hb=a.bottom-o.y;
      return sit?{x:b.left+b.width*across-hx,y:b.top+b.height*seat-hb}:{x:(b.left+b.width/2-hx)*share,y:(b.top+b.height/2-hy)*share*.64};
    }
    petTo(x,y,ms=700,{sit=false}={}){
      const from=this.petOffset||{x:0,y:0},reduced=this.ctx.reducedMotion?.();
      this.pet.getAnimations?.().forEach(anim=>anim.cancel());
      this.pet.style.translate=x||y?`${x}px ${y}px`:'';
      this.pet.classList.toggle('is-sitting',sit);if(!sit)this.pet.classList.remove('is-riding');this.pet.classList.toggle('is-out',!!(x||y));
      this.petOffset={x,y};
      if(reduced||!this.pet.animate)return;
      this.pet.animate([{translate:`${from.x}px ${from.y}px`},{translate:`${x}px ${y}px`}],{duration:ms,easing:'ease-in-out'});
      const dir=Math.sign(x-from.x);
      if(dir){this.rig?.walk(dir);this.later(()=>this.rig?.walk(0),ms);}
    }
    petHome(){if(!this.pet||!(this.petOffset?.x||this.petOffset?.y)){this.pet?.classList.remove('is-sitting');return;}this.clearToys();this.petTo(0,0,600);}
    // Water drops are a short-lived overlay on the board, positioned over a slot.
    pour(slot){
      if(!this.board||!slot)return;
      const b=this.board.getBoundingClientRect(),r=slot.getBoundingClientRect(),drops=document.createElement('span');
      drops.className='decorate-drops';drops.setAttribute('aria-hidden','true');
      drops.style.left=`${r.left-b.left+r.width*.5}px`;drops.style.top=`${r.top-b.top+r.height*.05}px`;
      drops.innerHTML='<i></i><i></i><i></i>';
      this.board.appendChild(drops);
      this.later(()=>drops.remove(),1100);
    }
    // Update 5: placed rewards are toys. The pet walks over, looks, and joins
    // in. Playing never moves, removes or changes ownership of anything.
    playToy(i,item){
      if(!this.alive||!item)return;
      const slot=this.slots[i],art=slot?.querySelector?.('svg'),reduced=this.ctx.reducedMotion?.();
      if(!art)return;
      this.clearToys();
      const rig=this.rig,measurable=!!slot.getBoundingClientRect&&!!this.pet?.getBoundingClientRect;
      art.style.transformBox='fill-box';art.style.transformOrigin='50% 100%';
      // Blanket: the pet is invited over and sits until tapped or called away.
      if(item.kind==='blanket'){
        this.ctx.play?.('rustle');
        if(measurable){const to=this.toward(slot,{sit:true});this.petTo(to.x,to.y,reduced?0:900,{sit:true});}
        this.later(()=>{rig?.settle();rig?.cheer();if(!reduced)art.querySelector('.blanket-cup')?.animate?.([{transform:'none'},{transform:'translateY(-4px) rotate(-8deg)'},{transform:'none'}],{duration:600});},reduced?0:900);
        return;
      }
      // Boat: the pet hops in and they sail a little loop together, then the
      // pet hops out and walks home. Both move by the same pixels.
      if(item.kind==='boat'&&!reduced&&measurable&&art.animate){
        this.ctx.play?.('splash');
        // The paper boat's hull sits a little left of its space's centre.
        const seat=this.toward(slot,{sit:true,seat:.68,across:.4}),w=art.getBoundingClientRect().width||0;
        this.petTo(seat.x,seat.y,900,{sit:true});this.pet.classList.add('is-riding');
        this.later(()=>{
          slot.classList.add('is-playing');this.ctx.play?.('creak');
          const sail=[[0,0,0],[.18,-3,-4],[-.1,0,3],[0,0,0]],at=[0,.4,.75,1];
          art.animate(sail.map(([dx,,r],k)=>({transform:dx||r?`translateX(${dx*100}%) rotate(${r}deg)`:'none',offset:at[k]})),{duration:1800,easing:'ease-in-out'});
          this.pet.animate?.(sail.map(([dx,dy,r],k)=>({translate:`${seat.x+dx*w}px ${seat.y+dy}px`,rotate:`${r}deg`,offset:at[k]})),{duration:1800,easing:'ease-in-out'});
          rig?.watch?.(art);
        },920);
        this.later(()=>{slot.classList.remove('is-playing');rig?.cheer();},2740);
        this.later(()=>{this.pet.classList.remove('is-riding');this.petTo(0,0,800);},3500);
        return;
      }
      // Watering can: it floats to each placed flower bed, tips and pours; the
      // pet follows to look. With nothing to water it waters the grass.
      if(item.kind==='can'){
        this.ctx.play?.('clink');
        const ids=this.visible();
        const thirsty=this.slots.filter((s,k)=>{const it=this.items.get(ids[k]);return k!==i&&(it?.kind==='flower'||(it?.kind==='keepsake'&&['bed','harvest'].includes(it.story)));}).slice(0,3);
        const targets=thirsty.length?thirsty:[slot];
        targets.forEach((target,n)=>this.later(()=>{
          const tArt=target.querySelector('svg'),r=slot.getBoundingClientRect?.(),t=target.getBoundingClientRect?.();
          if(!reduced&&r&&t&&art.animate){
            // The spout is on the can's right, so it hovers up-left of the bed and tips clockwise.
            const dx=target===slot?0:t.left-r.left-t.width*.32,dy=target===slot?0:t.top-r.top-t.height*.5;
            slot.classList.add('is-playing');this.later(()=>slot.classList.remove('is-playing'),1500);
            art.animate([{transform:'none'},{transform:`translate(${dx}px,${dy}px)`,offset:.3},{transform:`translate(${dx}px,${dy}px) rotate(34deg)`,offset:.45},{transform:`translate(${dx}px,${dy}px) rotate(34deg)`,offset:.8},{transform:'none'}],{duration:1500,easing:'ease-in-out'});
            this.later(()=>{this.pour(target);this.ctx.play?.('pour');},560);
          }
          if(target!==slot){
            this.later(()=>{tArt?.animate?.([{transform:'none'},{transform:'scale(1.08) translateY(-4%)',offset:.5},{transform:'none'}],{duration:reduced?1:520});target.classList.add('is-watered');this.later(()=>target.classList.remove('is-watered'),900);},reduced?0:900);
            if(measurable){const to=this.toward(target,{share:.55});this.petTo(to.x,to.y,reduced?0:700);}
          }
          this.later(()=>rig?.inspect(target,500,()=>rig?.cheer()),reduced?0:760);
        },n*(reduced?0:1600)));
        this.later(()=>this.petTo(0,0,reduced?0:700),reduced?0:targets.length*1600+400);
        return;
      }
      if(!reduced){
        const moves={
          boat:[{transform:'none'},{transform:'translateX(14%) rotate(-5deg)',offset:.35},{transform:'translateX(-8%) rotate(4deg)',offset:.7},{transform:'none'}],
          flower:[{transform:'none'},{transform:'rotate(-6deg) scale(1.04)',offset:.3},{transform:'rotate(5deg)',offset:.6},{transform:'none'}],
          sticker:[{transform:'none'},{transform:'rotate(-10deg) scale(1.08)',offset:.4},{transform:'rotate(8deg)',offset:.7},{transform:'none'}],
          sign:[{transform:'none'},{transform:'rotate(-7deg)',offset:.4},{transform:'rotate(5deg)',offset:.75},{transform:'none'}],
          keepsake:[{transform:'none'},{transform:'translateY(-8%) scale(1.04)',offset:.4},{transform:'none'}],
        };
        art.animate?.(moves[item.kind]||moves.keepsake,{duration:item.kind==='boat'?1600:900,easing:'ease-in-out'});
      }
      // Each toy sounds like its material: cloth, paper, wood, glass, water.
      this.ctx.play?.({flower:'rustle',sticker:'boing',sign:'dock',keepsake:'chime',boat:'splash'}[item.kind]||'seed');
      // The pet comes over to the toy, looks at it, celebrates, then goes home.
      if(!reduced&&measurable){
        const to=this.toward(slot,{share:.55});
        this.petTo(to.x,to.y,720);
        this.later(()=>rig?.inspect(slot,700,()=>rig?.cheer()),720);
        this.later(()=>this.petTo(0,0,700),1700);
      }else rig?.inspect(slot,600,()=>rig?.cheer());
    }
    wireDrag(button,idOf){
      let suppressUntil=0;
      const end=(e,cancel=false)=>{
        const drag=this.drag;
        if(!drag||drag.button!==button||(e&&e.pointerId!==drag.id))return;
        this.drag=null;
        button.classList.remove('is-drag-source');
        this.ghost?.remove();this.ghost=null;
        if(button.hasPointerCapture(drag.id))button.releasePointerCapture(drag.id);
        if(drag.moved){
          suppressUntil=performance.now()+500;
          this.selected=drag.previous;this.selectedSlot=drag.previousSlot;
          const i=!cancel&&e?this.slots.findIndex(slot=>ns.GardenPractice.inside(slot,e.clientX,e.clientY)):-1;
          if(i>=0)this.place(i,drag.asset);
          this.paint();
        }
      };
      button.addEventListener('pointerdown',e=>{
        const asset=idOf();
        if(!this.alive||this.drag||!asset||e.button>0||e.isPrimary===false)return;
        this.drag={id:e.pointerId,button,asset,x:e.clientX,y:e.clientY,moved:false,previous:this.selected,previousSlot:this.selectedSlot};
        button.setPointerCapture(e.pointerId);
      });
      button.addEventListener('pointermove',e=>{
        const drag=this.drag;
        if(!this.alive||!drag||drag.button!==button||e.pointerId!==drag.id)return;
        if(!drag.moved&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>8){
          drag.moved=true;this.selected=drag.asset;this.selectedSlot=null;
          const bounds=button.getBoundingClientRect();
          this.ghost=document.createElement('div');this.ghost.className='decorate-drag';
          this.ghost.setAttribute('aria-hidden','true');this.ghost.innerHTML=decorationArt(this.items.get(drag.asset));
          this.ghost.style.width=`${bounds.width}px`;this.ghost.style.height=`${bounds.height}px`;
          document.body.appendChild(this.ghost);button.classList.add('is-drag-source');this.paint();
        }
        if(this.ghost){this.ghost.style.left=`${e.clientX}px`;this.ghost.style.top=`${e.clientY}px`;}
      });
      button.addEventListener('pointerup',e=>end(e));
      button.addEventListener('pointercancel',e=>end(e,true));
      button.addEventListener('lostpointercapture',e=>end(e,true));
      button.addEventListener('click',e=>{if(performance.now()<suppressUntil){e.preventDefault();e.stopImmediatePropagation();}},true);
      this.dragResets.push(()=>end(null,true));
    }
    place(slot,id){
      if(!this.alive)return;
      this.commit(ns.LettersDecorations.place(this.layout,slot,id,this.catalog),'place');
    }
    commit(next,reaction='place'){
      if(!this.alive||!next)return;
      this.undo.push(this.layout);if(this.undo.length>20)this.undo.shift();
      this.layout=next;this.selected=null;this.selectedSlot=null;
      this.petHome();this.save();this.react(reaction);
    }
    save(){
      this.dragResets.forEach(reset=>reset());
      this.ctx.onChange(this.layout);this.paint();
    }
    paint(){
      if(!this.alive)return;
      const ids=this.visible();
      this.slots.forEach((button,i)=>{
        const item=this.items.get(ids[i]);button.innerHTML=item?decorationArt(item):plus;
        button.classList.toggle('is-filled',!!item);button.classList.toggle('is-target',!!this.selected);
        button.classList.toggle('is-picked',this.selectedSlot===i);
        button.disabled=!this.catalog.length;
        button.setAttribute('aria-pressed',String(this.selectedSlot===i));
        button.setAttribute('aria-label',`Garden space ${i+1}${item?', '+item.label:', empty'}${this.selected?', place '+this.items.get(this.selected).label:''}`);
      });
      this.choices.forEach(button=>{
        button.setAttribute('aria-pressed',String(this.selected===button.dataset.decoration));
        button.classList.toggle('is-placed',ids.includes(button.dataset.decoration));
      });
      const selectedItem=this.items.get(this.selected);
      this.selection.hidden=!selectedItem;
      this.selectionPreview.innerHTML=selectedItem?decorationArt(selectedItem,48):'';
      this.selection.setAttribute('aria-label',selectedItem?`${selectedItem.label} selected. Choose a garden space.`:'');
      this.ctx.stage.querySelector('.decorate-undo').disabled=!this.undo.length;
      this.ctx.stage.querySelector('.decorate-remove').disabled=this.selectedSlot===null;
    }
    react(kind='place'){
      this.ctx.play('correct');
      ['is-happy','is-place','is-remove','is-undo'].forEach(name=>this.pet.classList.remove(name));
      if(!this.ctx.reducedMotion?.())void this.pet.offsetWidth;
      this.pet.classList.add('is-happy','is-'+kind);
      this.petReaction.innerHTML=ns.LettersArt.icon(kind==='undo'?'replay':kind==='remove'?'arrow':'flower',22);
      clearTimeout(this.reactTimer);this.reactTimer=setTimeout(()=>{if(this.alive)['is-happy','is-place','is-remove','is-undo'].forEach(name=>this.pet.classList.remove(name));},450);
    }
    destroy(){this.alive=false;this.clearToys();this.rig?.destroy();this.shelfObserver?.disconnect();this.tray.removeEventListener('scroll',this.refreshShelf);clearTimeout(this.reactTimer);this.dragResets.forEach(reset=>reset());this.ctx.stage.removeEventListener('keydown',this.onKey);}
  }
  ns.DecoratingGarden=DecoratingGarden;
  ns.DecoratingGarden.icon=icon;
})(window.MiftahGame||(window.MiftahGame={}));

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
        <div class="decorate-tools"><button type="button" class="decorate-undo practice-button" aria-label="Undo garden change" disabled>${ns.LettersArt.icon('replay',30)}</button><button type="button" class="decorate-remove practice-button" aria-label="Return selected decoration to the tray" disabled>${removeIcon}</button><button type="button" class="decorate-done practice-button" aria-label="Finish decorating">${ns.LettersArt.icon('check',32)}</button></div>`;
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
          if(this.selected){this.place(i,this.selected);return;}
          const id=this.visible()[i];if(!id)return;
          this.selected=id;this.selectedSlot=i;this.paint();
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
        this.layout=this.undo.pop();this.selected=null;this.selectedSlot=null;this.save();this.react('undo');
      };
      stage.querySelector('.decorate-remove').onclick=()=>{
        if(!this.alive||this.selectedSlot===null)return;
        this.commit(ns.LettersDecorations.remove(this.layout,this.selectedSlot),'remove');
      };
      stage.querySelector('.decorate-done').onclick=()=>{if(this.alive)ctx.onDone();};
      stage.querySelector('.decorate-earn')?.addEventListener('click',()=>{if(this.alive)ctx.onDone();});
      this.pet=stage.querySelector('.decorate-pet');
      this.petReaction=stage.querySelector('.decorate-pet-reaction');
      this.pet.onclick=()=>{if(this.alive)this.react('place');};
      this.selection=stage.querySelector('.decorate-selection');this.selectionPreview=stage.querySelector('.decorate-selection-preview');
      this.onKey=e=>{if(e.key==='Escape'&&this.alive){this.dragResets.forEach(reset=>reset());this.selected=null;this.selectedSlot=null;this.paint();}};
      stage.addEventListener('keydown',this.onKey);
      this.paint();
    }
    visible(){return ns.LettersDecorations.visibleSlots(this.layout,this.catalog);}
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
      this.save();this.react(reaction);
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
    destroy(){this.alive=false;this.shelfObserver?.disconnect();this.tray.removeEventListener('scroll',this.refreshShelf);clearTimeout(this.reactTimer);this.dragResets.forEach(reset=>reset());this.ctx.stage.removeEventListener('keydown',this.onKey);}
  }
  ns.DecoratingGarden=DecoratingGarden;
  ns.DecoratingGarden.icon=icon;
})(window.MiftahGame||(window.MiftahGame={}));

// Optional free play after standalone feeding. Sharing consumes collected snacks,
// never answers another question, changes learning evidence or pays a reward.
(function(ns){
  const esc=value=>String(value||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const snack=item=>{
    const shift=ns.LettersArt.inkShift?.(item.display,42,false)||{dx:0,dy:0};
    return ns.LettersGardenArt.seedPacket(`<text x="${shift.dx}" y="${shift.dy}" text-anchor="middle" direction="rtl" font-family="Amiri Quran,serif" font-size="42" fill="#4a3620" data-fit-box="0,0,68,64,42">${esc(item.display)}</text>`);
  };
  class FeedPicnic {
    constructor(ctx,deliveries,done){
      this.ctx=ctx;this.done=done;this.alive=true;this.selected=null;this.shared=new Set();this.animations=new Map();this.resets=[];
      const valid=(deliveries||[]).filter(d=>d?.item?.id&&d.item.display&&['friend','basket'].includes(d.destination)).slice(0,12);
      this.snacks=valid.filter(d=>d.destination==='basket').map(d=>d.item);
      const familiar=[...new Map(valid.map(d=>[d.item.id,d.item])).values()].filter(item=>ns.LetterFriends?.FRIENDS?.[item.display]).slice(0,2);
      this.friends=[{name:'your pet',art:ctx.petArt?.()||ns.LettersArt.creature({hue:200})},...familiar.map(item=>({name:ns.LetterFriends.get(item.display).en,art:ns.LetterFriends.art(item.display,{size:130})}))];
      this.plates=this.friends.map((_,i)=>i===0?valid.filter(d=>d.destination==='friend').map(d=>d.item):[]);
      ctx.onFreePlay?.();
      ctx.stage.innerHTML=`<section class="feed-picnic" aria-label="Your picnic, free play"><div class="fp-table"><div class="fp-friends" style="--fp-friends:${this.friends.length}">${this.friends.map((friend,i)=>`<button type="button" class="fp-friend" data-friend="${i}" aria-label="Share a snack with ${esc(friend.name)}"><span class="fp-portrait" aria-hidden="true">${friend.art}</span><span class="fp-plate" aria-hidden="true"></span></button>`).join('')}</div><div class="fp-snacks" role="group" aria-label="Picnic snacks to share"${this.snacks.length?'':' hidden'}>${this.snacks.map((item,i)=>`<button type="button" class="fp-snack" data-snack="${i}" aria-label="Pick up snack ${esc(item.display)}" aria-pressed="false">${snack(item)}</button>`).join('')}</div></div><button type="button" class="fp-finish" aria-label="Finish your picnic">${ns.LettersArt.icon('next',42)}</button></section>`;
      this.root=ctx.stage.querySelector('.feed-picnic');
      this.receivers=[...this.root.querySelectorAll('.fp-friend')];
      this.receivers.forEach((button,i)=>{if(!this.snacks.length)button.setAttribute('aria-label',`Play with ${this.friends[i].name}`);button.onclick=()=>{if(!this.active())return;if(this.selected===null)this.react(i);else this.share(this.selected,i);};this.drawPlate(i);});
      this.root.querySelectorAll('.fp-snack').forEach(button=>{
        const i=Number(button.dataset.snack),enabled=()=>this.active()&&!this.shared.has(i);
        button.onclick=()=>{if(enabled())this.select(this.selected===i?null:i);};
        this.resets.push(ns.GardenPractice.draggable(button,{enabled,onDragStart:()=>this.select(i),drop:(x,y)=>{
          const to=this.receivers.findIndex(receiver=>ns.GardenPractice.inside(receiver,x,y));
          return to>=0?this.share(i,to):false;
        }}));
      });
      this.root.querySelector('.fp-finish').onclick=()=>{if(!this.active())return;this.destroy();this.done();};
      ns.LettersArt.fitGlyphs?.(this.root);
    }
    active(){return this.alive&&this.root?.isConnected!==false;}
    select(i){
      if(!this.active()||i!==null&&(!Number.isInteger(i)||!this.snacks[i]||this.shared.has(i)))return false;
      this.selected=i;
      this.root.querySelectorAll('.fp-snack').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.snack)===i)));
      this.receivers.forEach(button=>button.classList.toggle('is-ready',i!==null));
      if(i!==null){try{Promise.resolve(this.ctx.say?.(this.snacks[i])).catch(()=>{});}catch{}}
      return true;
    }
    share(from,to){
      if(!this.active()||!Number.isInteger(from)||!Number.isInteger(to)||!this.snacks[from]||!this.friends[to]||this.shared.has(from))return false;
      this.shared.add(from);this.plates[to].push(this.snacks[from]);this.select(null);
      const button=this.root.querySelector(`.fp-snack[data-snack="${from}"]`);button.disabled=true;button.classList.add('is-shared');
      this.drawPlate(to);this.react(to);this.ctx.sfx?.('turn');
      if(this.shared.size===this.snacks.length){this.receivers.forEach((receiver,i)=>receiver.setAttribute('aria-label',`Play with ${this.friends[i].name}`));this.root.classList.add('is-shared-all');this.root.querySelector('.fp-finish').focus?.({preventScroll:true});}
      else this.root.querySelector('.fp-snack:not(:disabled)')?.focus?.({preventScroll:true});
      return true;
    }
    drawPlate(i){
      const plate=this.receivers[i].querySelector('.fp-plate'),items=this.plates[i];
      plate.innerHTML=items.length?`<span class="fp-portion">${snack(items.at(-1))}</span><span class="fp-portions">${items.map(()=>'<i></i>').join('')}</span>`:'<span class="fp-empty-plate"></span>';
      this.receivers[i].classList.toggle('has-snack',items.length>0);
      ns.LettersArt.fitGlyphs?.(plate);
    }
    react(i){
      const art=this.receivers[i].querySelector('.fp-portrait');this.animations.get(i)?.cancel();
      if(this.ctx.reducedMotion?.())return;
      const motion=art.animate?.([{transform:'translateY(0) rotate(0)'},{transform:'translateY(-9px) rotate(-4deg)'},{transform:'translateY(0) rotate(0)'}],{duration:380,easing:'ease-out'});
      if(motion)this.animations.set(i,motion);
    }
    destroy(){if(!this.alive)return;this.alive=false;this.selected=null;this.resets.forEach(reset=>reset());this.resets=[];this.animations.forEach(motion=>motion.cancel());this.animations.clear();}
  }
  ns.FeedPicnic=FeedPicnic;
})(window.MiftahGame||(window.MiftahGame={}));

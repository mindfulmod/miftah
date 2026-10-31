// Child-authored pictures for standalone jigsaw play. No scores or save writes.
(function(ns){
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  class PicturePlan {
    constructor(items,layout=[]){
      this.items=[...new Map(items.filter(i=>i?.id!=null&&ns.LetterFriends?.FRIENDS?.[i.display]).map(i=>[String(i.id),i])).values()].slice(0,4);
      this.layout=[null,null];this.selected=null;
      layout.slice(0,2).forEach((i,slot)=>{if(i&&this.select(i.id))this.place(slot);});
    }
    select(id){const item=this.items.find(i=>String(i.id)===String(id));if(!item)return false;this.selected=this.selected===item?null:item;return true;}
    place(slot){
      if(![0,1].includes(slot)||!this.selected)return false;
      const from=this.layout.indexOf(this.selected),previous=this.layout[slot];
      this.layout[slot]=this.selected;if(from>=0&&from!==slot)this.layout[from]=previous;
      this.selected=null;return true;
    }
    clear(slot){if(![0,1].includes(slot)||!this.layout[slot])return false;this.layout[slot]=null;this.selected=null;return true;}
    snapshot(){return this.layout.slice();}
    ready(){return this.layout.some(Boolean);}
  }
  function scenery(){return '<path d="M-6-6H106V106H-6Z" fill="#ccfbef"/><circle cx="87" cy="12" r="9" fill="#f3c955"/><path d="M-6 70Q20 60 50 74T106 67V106H-6Z" fill="#b7e779"/><path d="M-6 92Q55 76 106 91V106H-6Z" fill="#7fce54"/><path d="M-6 103Q42 83 65 92T106 103" fill="none" stroke="#e5dcc8" stroke-width="8"/>';}
  function picture(layout,size=240){
    const art=layout.map((item,i)=>item?ns.LetterFriends.art(item.display,{size:50}).replace('<svg ',`<svg x="${i?52:-2}" y="25" `):'').join('');
    return `<svg viewBox="-6 -6 112 112" width="${size}" height="${size}" aria-hidden="true">${scenery()}${art}<g fill="#ffa798" stroke="#4a3620" stroke-width="1.6"><circle cx="10" cy="89" r="3"/><circle cx="95" cy="86" r="3"/></g></svg>`;
  }
  class JigsawPicture {
    constructor(ctx,root,items,layout,onBuild,onBack){this.ctx=ctx;this.root=root;this.plan=new PicturePlan(items,layout);this.onBuild=onBuild;this.onBack=onBack;this.alive=true;this.resets=[];this.render();}
    active(token=this.token){return this.alive&&token===this.token&&this.panel?.isConnected!==false&&this.root.contains(this.panel);}
    render(){
      this.resets.forEach(reset=>reset());this.resets=[];const token=this.token=(this.token||0)+1;
      this.root.innerHTML=`<div class="jp-editor" aria-label="Make your own puzzle"><div class="jp-picture"><span class="jp-land" aria-hidden="true">${picture([null,null])}</span>${this.plan.layout.map((item,i)=>`<button type="button" class="jp-place${item?' is-filled':''}" data-place="${i}" aria-label="${item?'Move '+esc(ns.LetterFriends.get(item.display).en):'Place a friend'} ${i?'on the right':'on the left'}" aria-pressed="false">${item?ns.LetterFriends.art(item.display,{size:100}):'<span class="jp-empty" aria-hidden="true">+</span>'}</button>${item?`<button type="button" class="jp-remove" data-remove="${i}" aria-label="Remove ${esc(ns.LetterFriends.get(item.display).en)} from picture">${ns.LettersArt.icon('undo',22)}</button>`:''}`).join('')}</div><div class="jp-friends" role="group" aria-label="Choose a familiar friend">${this.plan.items.map((item,i)=>`<button type="button" class="jp-friend" data-item="${i}" aria-label="Choose ${esc(ns.LetterFriends.get(item.display).en)}" aria-pressed="false">${ns.LetterFriends.art(item.display,{size:80})}</button>`).join('')}</div><div class="jp-actions"><button type="button" class="jp-back" aria-label="Back to puzzle choice">${ns.LettersArt.icon('undo',30)}</button><button type="button" class="jp-build" aria-label="Make this picture into a puzzle"${this.plan.ready()?'':' disabled'}>${ns.LettersGardenArt.practicePicture('FriendJigsaw',{size:60})}</button></div></div>`;
      this.panel=this.root.querySelector('.jp-editor');
      const sources=[...this.root.querySelectorAll('.jp-friend')],places=[...this.root.querySelectorAll('.jp-place')];
      sources.forEach(button=>{
        const item=this.plan.items[Number(button.dataset.item)];
        button.onclick=()=>{if(!this.active(token))return;this.plan.select(item.id);this.paintSelection();try{Promise.resolve(this.ctx.say?.(item)).catch(()=>{});}catch{}};
        const reset=ns.GardenPractice.draggable(button,{enabled:()=>this.active(token),onDragStart:()=>{if(!this.active(token))return;this.plan.selected=item;this.paintSelection();},drop:(x,y)=>{
          if(!this.active(token))return false;const slot=places.findIndex(p=>ns.GardenPractice.inside(p,x,y));return this.place(slot);
        }});if(reset)this.resets.push(reset);
      });
      places.forEach((button,i)=>button.onclick=()=>{if(!this.active(token))return;if(this.plan.selected)this.place(i);else if(this.plan.layout[i]){this.plan.select(this.plan.layout[i].id);this.paintSelection();}});
      this.root.querySelectorAll('.jp-remove').forEach(button=>button.onclick=()=>{if(this.active(token)&&this.plan.clear(Number(button.dataset.remove)))this.render();});
      this.root.querySelector('.jp-build').onclick=()=>{if(!this.active(token)||!this.plan.ready())return;const layout=this.plan.snapshot();this.destroy();this.onBuild(layout);};
      this.root.querySelector('.jp-back').onclick=()=>{if(!this.active(token))return;this.destroy();this.onBack();};
    }
    place(slot){if(!this.active()||!this.plan.place(slot))return false;this.ctx.sfx?.('click');this.render();this.root.querySelector('.jp-build')?.focus?.({preventScroll:true});return true;}
    paintSelection(){this.root.querySelectorAll('.jp-friend').forEach(b=>b.setAttribute('aria-pressed',String(this.plan.items[Number(b.dataset.item)]===this.plan.selected)));this.root.querySelectorAll('.jp-place').forEach(b=>{b.classList.toggle('is-ready',!!this.plan.selected);b.setAttribute('aria-pressed',String(!!this.plan.selected&&this.plan.layout[Number(b.dataset.place)]===this.plan.selected));});}
    destroy(){if(!this.alive)return;this.alive=false;this.resets.forEach(reset=>reset());this.resets=[];}
  }
  JigsawPicture.Plan=PicturePlan;JigsawPicture.picture=picture;ns.JigsawPicture=JigsawPicture;
})(window.MiftahGame||(window.MiftahGame={}));

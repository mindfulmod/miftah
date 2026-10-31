// The garden a child grew is a place to play, not another assessment.
// This component owns only ephemeral visitor movement. It has no save,
// progression, reward or learning callbacks.
(function (ns) {
  const PLACES = {
    bird: [
      { x:100, y:168, at:[100,140], name:'branch', effect:'rest' },
      { x:286, y:112, at:[286,84], name:'sunflower', effect:'seeds' },
      { x:500, y:246, at:[500,220], name:'stream', effect:'water' },
    ],
    butterfly: [
      { x:84, y:215, at:[84,184], name:'leaf', effect:'rest' },
      { x:207, y:156, at:[207,125], name:'coral flower', effect:'petals' },
      { x:365, y:156, at:[365,125], name:'purple flower', effect:'petals' },
    ],
  };
  const landing = '<svg viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="32" cy="36" rx="24" ry="13" fill="#fffaf0" fill-opacity=".25" stroke="#fffaf0" stroke-width="4"/><ellipse cx="32" cy="36" rx="20" ry="9" fill="none" stroke="#4a3620" stroke-width="2.4" stroke-dasharray="2 7" stroke-linecap="round"/></svg>';
  const response = '<svg viewBox="-44 -44 88 88" aria-hidden="true"><ellipse class="gh-ripple" cy="18" rx="32" ry="9" fill="none" stroke="#ccfbef" stroke-width="3"/>'+[-1,0,1].map((d,i)=>`<path class="gh-drop" transform="translate(${d*22} ${i===1?-24:-12})" d="M0-8Q-11 4 0 9Q11 4 0-8Z" fill="#96ecff" stroke="#3a8fc4" stroke-width="1.6"/><ellipse class="gh-petal" cx="${d*22}" cy="${i===1?-28:-14}" rx="5" ry="9" transform="rotate(${d*28} ${d*22} ${i===1?-28:-14})" fill="${i===1?'#ffe49a':'#ffa798'}" stroke="#c25a49" stroke-width="1.6"/>`).join('')+'</svg>';

  class GardenHabitat {
    constructor(ctx) {
      this.ctx=ctx;this.alive=true;this.index=0;this.token=0;
      this.project=ctx.project==='bird'?'bird':'butterfly';
      this.places=PLACES[this.project];this.root=ctx.root;
      this.root.classList.add('gh-habitat');
      this.root.dataset.project=this.project;
      this.root.insertAdjacentHTML('beforeend',`<div class="gh-places">${this.places.map((p,i)=>`<button type="button" class="gh-place" data-place="${i}" style="left:${p.x/560*100}%;top:${p.y/320*100}%" aria-label="Invite the ${this.project} to the ${p.name}" aria-pressed="${i===0}">${landing}</button>`).join('')}</div><span class="gh-response" aria-hidden="true">${response}</span><button type="button" class="gh-visitor" aria-label="Move your ${this.project} to the next place"><svg viewBox="-45 -40 90 80" aria-hidden="true">${ctx.art}</svg></button><span class="gh-status" role="status" aria-live="polite"></span>`);
      this.buttons=[...this.root.querySelectorAll('.gh-place')];
      this.visitor=this.root.querySelector('.gh-visitor');this.art=this.visitor.querySelector('svg');
      this.effect=this.root.querySelector('.gh-response');this.status=this.root.querySelector('.gh-status');
      this.position(this.places[0].at);
      this.buttons.forEach((b,i)=>b.onclick=()=>this.move(i));
      this.visitor.onclick=e=>{if(this.ignoreClick&&e.detail!==0){this.ignoreClick=false;return;}this.ignoreClick=false;this.move((this.index+1)%this.places.length);};
      this.visitor.onpointerdown=e=>this.pick(e);
      this.visitor.onpointermove=e=>this.drag(e);
      this.visitor.onpointerup=e=>this.drop(e);
      this.visitor.onpointercancel=e=>this.cancelDrag(e);
      this.visitor.onlostpointercapture=e=>this.cancelDrag(e);
    }
    position([x,y]) { this.visitor.style.left=`${x/560*100}%`;this.visitor.style.top=`${y/320*100}%`; }
    point() {
      const b=this.root.getBoundingClientRect(),v=this.visitor.getBoundingClientRect();
      return [(v.left+v.width/2-b.left)/b.width*560,(v.top+v.height/2-b.top)/b.height*320];
    }
    stopFlight() {
      this.token++;this.flight?.cancel();this.flight=null;
      this.art.getAnimations?.().forEach(a=>a.cancel());
      this.effect.getAnimations?.().forEach(a=>a.cancel());
      this.effect.classList.remove('is-visible');
    }
    move(index,from=this.point()) {
      if(!this.alive||!Number.isInteger(index)||!this.places[index])return;
      this.stopFlight();this.index=index;
      const p=this.places[index],token=this.token;
      this.position(p.at);
      this.buttons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));
      this.status.textContent=`Your ${this.project} is visiting the ${p.name}`;
      this.ctx.react?.();
      if(this.ctx.reducedMotion?.()||!this.visitor.animate){this.arrive(p);return;}
      const b=this.root.getBoundingClientRect(),dx=(from[0]-p.at[0])/560*b.width,dy=(from[1]-p.at[1])/320*b.height;
      this.flight=this.visitor.animate([{transform:`translate(${dx}px,${dy}px)`},{transform:`translate(${dx*.42}px,${dy*.42-24}px)`},{transform:'translate(0,0)'}],{duration:Math.min(650,320+Math.hypot(dx,dy)),easing:'ease-out'});
      this.art.animate?.([{transform:'rotate(-7deg) scaleX(.9)'},{transform:'rotate(5deg) scaleX(1)'},{transform:'rotate(0) scaleX(.9)'}],{duration:180,iterations:3});
      this.flight.onfinish=()=>{if(this.alive&&token===this.token){this.flight=null;this.arrive(p);}};
    }
    arrive(place) {
      if(!this.alive)return;
      this.effect.dataset.effect=place.effect;
      this.effect.style.left=`${place.x/560*100}%`;this.effect.style.top=`${place.y/320*100}%`;
      this.effect.classList.toggle('is-visible',place.effect!=='rest');
      this.ctx.play?.(place.effect==='water'?'splash':place.effect==='rest'?'seed':'rustle');
      if(this.ctx.reducedMotion?.())return;
      this.art.animate?.(place.effect==='water'?[{transform:'rotate(0)'},{transform:'rotate(-9deg) translateY(5px)'},{transform:'rotate(8deg)'},{transform:'rotate(0)'}]:[{transform:'rotate(0)'},{transform:'rotate(12deg) translateY(3px)'},{transform:'rotate(0)'}],{duration:420,easing:'ease-out'});
      if(place.effect!=='rest')this.effect.animate?.([{opacity:0,transform:'translateY(8px) scale(.65)'},{opacity:1,transform:'translateY(0) scale(1)',offset:.4},{opacity:.7,transform:'translateY(-5px) scale(1)'}],{duration:540,easing:'ease-out'});
    }
    pick(e) {
      if(!this.alive||e.button>0||e.isPrimary===false||this.pointer)return;
      const from=this.point();this.stopFlight();this.position(from);
      this.ignoreClick=false;
      this.pointer={id:e.pointerId,x:e.clientX,y:e.clientY,from,moved:false};
      this.visitor.setPointerCapture?.(e.pointerId);
    }
    drag(e) {
      const p=this.pointer;if(!this.alive||!p||p.id!==e.pointerId)return;
      if(Math.hypot(e.clientX-p.x,e.clientY-p.y)<6&&!p.moved)return;
      p.moved=true;this.visitor.classList.add('is-held');
      const b=this.root.getBoundingClientRect();
      // Keep the friend in the habitat even if a small hand leaves its edge.
      this.position([Math.max(45,Math.min(515,(e.clientX-b.left)/b.width*560)),Math.max(44,Math.min(276,(e.clientY-b.top)/b.height*320))]);
    }
    release() {
      const p=this.pointer;this.pointer=null;this.visitor.classList.remove('is-held');
      if(p&&this.visitor.hasPointerCapture?.(p.id))this.visitor.releasePointerCapture(p.id);
      return p;
    }
    drop(e) {
      if(!this.alive||this.pointer?.id!==e.pointerId)return;
      const p=this.release();if(!p.moved)return;
      this.ignoreClick=true;
      const b=this.root.getBoundingClientRect(),x=(e.clientX-b.left)/b.width*560,y=(e.clientY-b.top)/b.height*320;
      // Every drop has a destination. No precision demand, wrong answer or timer.
      const nearest=this.places.reduce((best,place,i)=>Math.hypot(place.x-x,place.y-y)<Math.hypot(this.places[best].x-x,this.places[best].y-y)?i:best,0);
      this.move(nearest);
    }
    cancelDrag(e) {
      if(!this.alive||this.pointer?.id!==e.pointerId)return;
      this.ignoreClick=true;this.release();this.move(this.index);
    }
    destroy() {
      if(!this.alive)return;this.alive=false;this.release();this.stopFlight();
      this.buttons.forEach(b=>b.onclick=null);
      for(const key of ['onclick','onpointerdown','onpointermove','onpointerup','onpointercancel','onlostpointercapture'])this.visitor[key]=null;
    }
  }
  ns.GardenHabitat=GardenHabitat;
})(window.MiftahGame||(window.MiftahGame={}));

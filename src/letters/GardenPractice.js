// Optional live practice. No currency, mastery or progression writes.
(function(ns) {
  // One pointer lifecycle for drag and tap alternatives. A cancelled or missed
  // drop is a motor action, not an incorrect learning response.
  function draggable(el, {enabled=()=>true, drop}) {
    let pointer=null, moved=false, start=null, suppressUntil=0;
    const reset=()=>{ const id=pointer; pointer=null; el.style.transform=''; el.classList.remove('is-dragging'); if(id!==null && el.hasPointerCapture?.(id)) el.releasePointerCapture(id); };
    el.addEventListener('pointerdown',e=>{
      if(!enabled() || (e.pointerType==='mouse' && e.button!==0) || pointer!==null) return;
      pointer=e.pointerId; start=[e.clientX,e.clientY]; moved=false; el.setPointerCapture(pointer);
    });
    el.addEventListener('pointermove',e=>{
      if(e.pointerId!==pointer)return;
      const dx=e.clientX-start[0],dy=e.clientY-start[1];
      if(Math.hypot(dx,dy)>8)moved=true;
      if(moved){el.classList.add('is-dragging');el.style.transform=`translate(${dx}px,${dy}px)`;}
    });
    el.addEventListener('pointerup',e=>{
      if(e.pointerId!==pointer)return;
      const dragged=moved; reset();
      if(dragged){suppressUntil=performance.now()+500; if(enabled())drop(e.clientX,e.clientY);}
    });
    el.addEventListener('pointercancel',reset);
    el.addEventListener('lostpointercapture',()=>{if(pointer!==null)reset();});
    el.addEventListener('click',e=>{if(performance.now()<suppressUntil){e.preventDefault();e.stopImmediatePropagation();}},true);
    return reset;
  }
  const inside=(el,x,y)=>{const r=el.getBoundingClientRect();return x>=r.left && x<=r.right && y>=r.top && y<=r.bottom;};
  const button=(label,content,cls='')=>`<button type="button" aria-label="${label}" class="practice-button ${cls}">${content}</button>`;

  const tool = name => ns.LettersArt.icon(name,30);
  const eye = `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M3 20Q20 1 37 20Q20 39 3 20Z" fill="#dce8c3" stroke="#617b50" stroke-width="3"/><circle cx="20" cy="20" r="7" fill="#617b50"/><circle cx="18" cy="17" r="2" fill="#fffaf0"/></svg>`;
  const seedDot = `<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="10" fill="#4a3620"/><circle cx="17" cy="16" r="2.5" fill="#c9b28b"/></svg>`;
  const eraser=`<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M6 25L23 8Q26 5 29 8L35 14Q38 17 35 20L19 35H15Z" fill="#ee806f" stroke="#4a3620" stroke-width="3"/><path d="M6 25L13 18 26 28 19 35H15Z" fill="#fffaf0" stroke="#4a3620" stroke-width="3"/><path d="M25 35H36" stroke="#4a3620" stroke-width="3"/></svg>`;
  const recallGlyph=display=>{const shift=ns.LettersArt.inkShift(display,44,false);return `<svg class="dot-recall-glyph" viewBox="-50 -50 100 100" aria-hidden="true"><text data-fit-box="0,0,72,62,44" x="${shift.dx}" y="${shift.dy}" text-anchor="middle" font-family="'Amiri Quran',serif" font-size="44" fill="#4a3620" direction="rtl">${display}</text></svg>`;};
  const validDots=(display,above,below)=>display==='ب' ? above===0&&below===1 : (display==='ت'||display==='ث') && below===0&&above===(display==='ت'?2:3);
  const dots=count=>`<span class="dot-cluster dots-${count}">${Array.from({length:count},()=>'<i>●</i>').join('')}</span>`;
  class DotGarden {
    constructor(ctx){
      this.ctx=ctx;this.alive=true;this.index=0;
      this.targets=['ب','ت','ث'].map(display=>ctx.items.find(i=>i.display===display)).filter(Boolean);
      this.show();
    }
    show(){
      if(!this.alive)return;
      const view=this.view=(this.view||0)+1;
      const active=()=>this.alive&&this.view===view;
      this.resetDrag?.();this.busy=false;this.above=0;this.below=0;
      const recall=this.index>=this.targets.length;
      this.target=this.targets[this.index%this.targets.length];
      if(!this.target){this.alive=false;this.ctx.done();return;}
      this.ctx.prompt(recall ? null : this.target);this.ctx.say(this.target);
      if(recall){
        const other=this.targets[(this.index+1)%this.targets.length];
        const options=[...new Map((this.index%2 ? [this.target,other] : [other,this.target]).map(i=>[i.id,i])).values()];
        this.ctx.stage.innerHTML=`<div class="dot-garden"><div class="practice-listen" aria-hidden="true">${tool("speaker")}</div><div class="dot-answers">${options.map(i=>button(i.display,recallGlyph(i.display))).join('')}</div></div>`;
        this.ctx.stage.querySelectorAll('.dot-answers button').forEach((b,i)=>b.onclick=()=>{
          if(!active()||this.busy)return;
          if(options[i].id===this.target.id)this.advance();
          else {this.ctx.say(this.target); b.disabled=true;this.ctx.stage.querySelectorAll('.dot-answers button').forEach((choice,j)=>{if(options[j].id===this.target.id)choice.classList.add('is-help');});}
        });
        return;
      }
      this.ctx.stage.innerHTML=`<div class="dot-garden"><div class="dot-bed">
        ${button('Place a dot above','<span class="dot-hint" aria-hidden="true"></span><span class="dot-placed"></span>','dot-zone dot-above')}
        <span class="dot-base" lang="ar">ٮ</span>
        ${button('Place a dot below','<span class="dot-hint" aria-hidden="true"></span><span class="dot-placed"></span>','dot-zone dot-below')}
        </div><div class="practice-tools">${button('Take a seed dot',seedDot,'dot-seed')}${button('Remove last dot',tool('replay'),'dot-undo')}${button('Check letter',tool('check'),'dot-check')}</div>
        <div class="practice-status" role="status" aria-live="polite"></div></div>`;
      const source=this.ctx.stage.querySelector('.dot-seed');
      this.zones=['above','below'].map(name=>this.ctx.stage.querySelector('.dot-'+name));
      const guidedCount=this.target.display==='ب'?1:this.target.display==='ت'?2:3;
      const guidedZone=this.target.display==='ب'?1:0;
      this.zones[guidedZone].querySelector('.dot-hint').innerHTML=dots(guidedCount);
      this.history=[];this.ctx.stage.querySelector('.dot-undo').disabled=true;
      const add=name=>{if(!active()||this.busy || this.above+this.below>=3)return;this[name]++;this.history.push(name);source.classList.remove("is-selected");source.setAttribute("aria-pressed","false");this.paint();};
      this.zones.forEach((el,i)=>el.onclick=()=>add(i?'below':'above'));
      source.setAttribute('aria-pressed','false');
      source.onclick=()=>{if(!active()||this.busy)return;source.classList.toggle('is-selected');source.setAttribute('aria-pressed',String(source.classList.contains('is-selected')));};
      this.resetDrag=draggable(source,{enabled:()=>active()&&!this.busy,drop:(x,y)=>this.zones.forEach((z,i)=>{if(inside(z,x,y))add(i?'below':'above');})});
      this.ctx.stage.querySelector('.dot-undo').onclick=()=>{if(!active()||this.busy)return;const last=this.history.pop();if(last)this[last]--;this.paint();};
      this.ctx.stage.querySelector('.dot-check').onclick=()=>{
        if(!active()||this.busy)return;
        const correct=validDots(this.target.display,this.above,this.below);
        if(correct){this.ctx.stage.querySelector('.dot-base').textContent=this.target.display;this.zones.forEach(z=>z.style.visibility='hidden');this.advance();}
        else {this.ctx.say(this.target);this.ctx.stage.querySelector('.practice-status').innerHTML=tool('replay');this.zones[this.target.display==='ب'?1:0].classList.add('is-help');}
      };
    }
    paint(){
      this.ctx.stage.querySelector('.dot-undo').disabled=this.history.length===0;
      this.ctx.stage.querySelector('.practice-status').innerHTML='';
      this.zones.forEach((z,i)=>{const count=i?this.below:this.above;z.querySelector('.dot-placed').innerHTML=dots(count);z.classList.remove('is-help');z.disabled=this.above+this.below>=3;z.setAttribute('aria-label',`Place a dot ${i?'below':'above'}; ${count} placed`);});
    }

    advance(){if(this.busy||!this.alive)return;this.busy=true;this.ctx.stage.querySelectorAll('button').forEach(b=>b.disabled=true);this.ctx.correct();this.ctx.say(this.target);setTimeout(()=>{if(!this.alive)return;this.index++;if(this.index>=this.targets.length*2){this.alive=false;this.ctx.done();}else this.show();},800);}
    destroy(){this.alive=false;this.resetDrag?.();}
  }

  class GardenPaths {
    constructor(ctx){this.ctx=ctx;this.alive=true;this.index=0;this.copy=false;this.targets=ctx.items.filter(i=>['ا','ب','ت'].includes(i.display));this.show();}
    show(){
      if(!this.alive)return;
      const view=this.view=(this.view||0)+1;
      const active=()=>this.alive&&this.view===view;
      const target=this.targets[this.index];if(!target){this.alive=false;this.ctx.done();return;}
      this.ctx.prompt(target);this.ctx.say(target);this.hasInk=false;this.pointer=null;
      this.ctx.stage.innerHTML=`<div class="garden-paths"><div class="path-progress" aria-label="Drawing ${this.index+1} of ${this.targets.length}, ${this.copy?'copy':'guided'}">${Array.from({length:this.targets.length*2},(_,i)=>`<i class="${i<=this.index*2+Number(this.copy)?'is-on':''}"></i>`).join('')}</div><div class="path-paper"><span class="path-guide" lang="ar">${target.display}</span><canvas aria-label="Draw ${target.display} here"></canvas></div><div class="practice-tools">${button('Clear drawing',eraser,'path-clear')}${button('Show or hide guide',eye,'path-guide-toggle')}${button(this.copy?'Finish this drawing':'Try without the guide',tool('check'),'path-next')}</div></div>`;
      const canvas=this.ctx.stage.querySelector('canvas'),guide=this.ctx.stage.querySelector('.path-guide'),next=this.ctx.stage.querySelector('.path-next');
      const g=canvas.getContext('2d');canvas.width=800;canvas.height=500;
      guide.hidden=this.copy;next.disabled=true;
      const clear=this.ctx.stage.querySelector(".path-clear");clear.disabled=true;
      const toggle=this.ctx.stage.querySelector('.path-guide-toggle');toggle.setAttribute('aria-pressed',String(!guide.hidden));toggle.setAttribute('aria-label',guide.hidden?'Show guide':'Hide guide');
      toggle.onclick=()=>{if(!active())return;guide.hidden=!guide.hidden;toggle.setAttribute('aria-pressed',String(!guide.hidden));toggle.setAttribute('aria-label',guide.hidden?'Show guide':'Hide guide');};
      this.ctx.stage.querySelector('.path-clear').onclick=()=>{if(!active())return;this.release?.();g.clearRect(0,0,800,500);this.hasInk=false;next.disabled=true;clear.disabled=true;};
      const point=e=>{const r=canvas.getBoundingClientRect();if(r.width<=0||r.height<=0)return null;return [Math.max(0,Math.min(800,(e.clientX-r.left)*800/r.width)),Math.max(0,Math.min(500,(e.clientY-r.top)*500/r.height))];};
      canvas.onpointerdown=e=>{if(!active()||this.pointer!==null||e.button>0||e.isPrimary===false)return;const pos=point(e);if(!pos)return;this.pointer=e.pointerId;canvas.setPointerCapture(e.pointerId);const [x,y]=pos;g.beginPath();g.moveTo(x,y);g.lineTo(Math.min(800,x+.1),Math.min(500,y+.1));g.strokeStyle='#4e9677';g.lineWidth=14;g.lineCap=g.lineJoin='round';g.stroke();this.hasInk=true;next.disabled=false;clear.disabled=false;};
      canvas.onpointermove=e=>{if(!active()||e.pointerId!==this.pointer)return;const pos=point(e);if(!pos)return;g.lineTo(...pos);g.stroke();};
      const release=()=>{const id=this.pointer;this.pointer=null;if(id!==null&&canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);};
      canvas.onpointerup=release;canvas.onpointercancel=release;canvas.onlostpointercapture=()=>{this.pointer=null;};this.release=release;
      next.onclick=()=>{if(!active()||!this.hasInk||this.pointer!==null)return;this.ctx.correct();this.release();if(this.copy){this.index++;this.copy=false;}else this.copy=true;this.show();};
    }
    destroy(){this.alive=false;this.release?.();}
  }
  ns.GardenPractice={DotGarden,GardenPaths,draggable,inside,validDots};
})(window.MiftahGame || (window.MiftahGame={}));

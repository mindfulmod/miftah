// Optional live practice. No currency, mastery or progression writes.
(function(ns){
  function draggable(el,{enabled=()=>true,drop,onDragStart=()=>{},onDragMove=()=>{},onDragEnd=()=>{}}){
    let pointer=null,moved=false,start=null,suppressUntil=0;
    const reset=()=>{const id=pointer;pointer=null;el.style.transform='';el.classList.remove('is-dragging');if(id!==null){onDragEnd();if(el.hasPointerCapture?.(id))el.releasePointerCapture(id);}};
    el.addEventListener('pointerdown',e=>{if(!enabled()||e.isPrimary===false||(e.pointerType==='mouse'&&e.button!==0)||pointer!==null)return;pointer=e.pointerId;start=[e.clientX,e.clientY];moved=false;el.setPointerCapture?.(pointer);});
    el.addEventListener('pointermove',e=>{if(e.pointerId!==pointer||e.isPrimary===false)return;if(!enabled()){reset();return;}const dx=e.clientX-start[0],dy=e.clientY-start[1];if(!moved&&Math.hypot(dx,dy)>8){moved=true;onDragStart();}if(moved){el.classList.add('is-dragging');el.style.transform=`translate(${dx}px,${dy}px)`;onDragMove(e.clientX,e.clientY);}});
    el.addEventListener('pointerup',e=>{if(e.pointerId!==pointer||e.isPrimary===false)return;const dragged=moved;const released=dragged?el.getBoundingClientRect():null;reset();if(dragged){suppressUntil=performance.now()+500;if(enabled())drop(e.clientX,e.clientY,released);}});
    el.addEventListener('pointercancel',e=>{if(!e||e.pointerId===pointer){if(moved)suppressUntil=performance.now()+500;reset();}});
    el.addEventListener('lostpointercapture',e=>{if(pointer!==null&&(!e||e.pointerId===undefined||e.pointerId===pointer)){if(moved)suppressUntil=performance.now()+500;reset();}});
    el.addEventListener('click',e=>{if(performance.now()<suppressUntil){e.preventDefault();e.stopImmediatePropagation();}},true);
    return reset;
  }
  const inside=(el,x,y)=>{const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom;};
  const button=(label,content,cls='')=>`<button type="button" aria-label="${label}" class="practice-button ${cls}">${content}</button>`;
  const drawingColors=[
    {id:'green',name:'Green',value:'#4e9677'},
    {id:'ink',name:'Brown',value:'#4a3620'},
    {id:'coral',name:'Coral',value:'#c25a49'},
    {id:'blue',name:'Blue',value:'#3a8fc4'},
    {id:'purple',name:'Purple',value:'#6064a0'}
  ];
  let selectedDrawingColor=drawingColors[0].value;
  const DrawingPalette={
    colors:drawingColors,
    current:()=>selectedDrawingColor,
    markup:()=>`<div class="drawing-palette" role="group" aria-label="Choose a pencil color">${drawingColors.map(color=>`<button type="button" class="drawing-color" data-color="${color.value}" aria-label="Color ${color.name}" aria-pressed="${color.value===selectedDrawingColor}" style="--drawing-color:${color.value}"><span aria-hidden="true"></span></button>`).join('')}</div>`,
    wire:(root,{active=()=>true,release=()=>{},onChange=()=>{}}={})=>{
      const choices=[...(root?.querySelectorAll?.('.drawing-color')||[])];
      choices.forEach(choice=>choice.setAttribute?.('aria-pressed',String(choice.dataset?.color===selectedDrawingColor)));
      choices.forEach(choice=>choice.onclick=()=>{
        if(!active()||choice.disabled||!drawingColors.some(color=>color.value===choice.dataset?.color))return;
        release();selectedDrawingColor=choice.dataset.color;
        choices.forEach(other=>other.setAttribute?.('aria-pressed',String(other===choice)));
        onChange(selectedDrawingColor);
      });
      return choices;
    }
  };
  ns.DrawingPalette=DrawingPalette;
  const tool=name=>ns.LettersArt.icon(name,30);
  const eye='<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M3 20Q20 1 37 20Q20 39 3 20Z" fill="#dce8c3" stroke="#617b50" stroke-width="3"/><circle cx="20" cy="20" r="7" fill="#617b50"/><circle cx="18" cy="17" r="2" fill="#fffaf0"/></svg>';
  const seedDot='<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="10" fill="#4a3620"/><circle cx="17" cy="16" r="2.5" fill="#c9b28b"/></svg>';
  const eraser='<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M6 25L23 8Q26 5 29 8L35 14Q38 17 35 20L19 35H15Z" fill="#ee806f" stroke="#4a3620" stroke-width="3"/><path d="M6 25L13 18 26 28 19 35H15Z" fill="#fffaf0" stroke="#4a3620" stroke-width="3"/><path d="M25 35H36" stroke="#4a3620" stroke-width="3"/></svg>';
  const glyph=display=>{const s=ns.LettersArt.inkShift(display,44,false);return `<svg class="dot-recall-glyph" viewBox="-50 -50 100 100" aria-hidden="true"><text data-fit-box="0,0,72,62,44" x="${s.dx}" y="${s.dy}" text-anchor="middle" font-family="'Amiri Quran',serif" font-size="44" fill="#4a3620" direction="rtl">${display}</text></svg>`;};
  const dots=count=>`<span class="dot-cluster dots-${count}" aria-hidden="true">${Array.from({length:count},()=>'<i aria-hidden="true">●</i>').join('')}</span>`;

  // Explicit isolated-letter families. Each entry owns its shared
  // undotted body and valid dot arrangement.
  const repairFamilies=[
    {id:'boat',body:'ٮ',members:[['ب',0,1],['ت',2,0],['ث',3,0]]},
    {id:'bowl',body:'ح',members:[['ج',0,1],['ح',0,0],['خ',1,0]]},
    {id:'door',body:'د',members:[['د',0,0],['ذ',1,0]]},
    {id:'curve',body:'ر',members:[['ر',0,0],['ز',1,0]]},
    {id:'teeth',body:'س',members:[['س',0,0],['ش',3,0]]}
  ];
  const dotSpec=display=>{for(const family of repairFamilies){const m=family.members.find(x=>x[0]===display);if(m)return {family,above:m[1],below:m[2]};}return null;};
  const validDots=(display,above,below)=>{const s=dotSpec(display);return !!s&&s.above===above&&s.below===below;};
  const key=item=>item?.id||item?.display;
  const outcome=(ctx,item,values)=>ctx.reportOutcome?.({item,itemId:key(item),activity:'DotGarden',...values});
  let repairCursor=0,pathCursor=0;

  function repairPlan(items){
    const byGlyph=new Map((items||[]).filter(x=>x?.display).map(x=>[x.display,x]));
    const groups=repairFamilies.map(family=>({family,items:family.members.map(m=>byGlyph.get(m[0])).filter(Boolean)})).filter(g=>g.items.length);
    if(!groups.length)return [];
    const picked=Array.from({length:Math.min(2,groups.length)},(_,i)=>groups[(repairCursor+i)%groups.length]);
    repairCursor=(repairCursor+picked.length)%groups.length;
    const plan=[];
    for(const group of picked){
      const members=group.items;
      plan.push({kind:'repair',mode:'guided',target:members[0],family:group.family});
      if(members.length>1){
        let pair;
        for(const target of members){
          const a=dotSpec(target.display);
          const source=members.find(candidate=>{const b=dotSpec(candidate.display);return Math.abs(a.above-b.above)+Math.abs(a.below-b.below)===1;});
          if(source){pair={target,source};break;}
        }
        pair=pair||{target:members[1],source:members[0]};
        plan.push({kind:'repair',mode:'repair',target:pair.target,source:pair.source,family:group.family});
      }
      plan.push({kind:'recognition',target:members[members.length>1?1:0],choices:members,family:group.family});
    }
    return plan.slice(0,6);
  }

  // Exploration contains only taught isolated members of one verified body family.
  function explorationItems(items,family){
    if(!family)return [];
    const known=new Map((items||[]).filter(item=>item?.display).map(item=>[item.display,item]));
    return family.members.map(([display])=>known.get(display)).filter(Boolean);
  }
  const pottingScene=()=>ns.LettersActivityArt?.scene('DotGarden')||'';
  const patternPicture=item=>{
    const spec=dotSpec(item.display);
    return `<span class="dot-pattern" aria-hidden="true"><span class="pattern-above">${dots(spec.above)}</span><span class="pattern-body">${spec.family.body}</span><span class="pattern-below">${dots(spec.below)}</span></span>`;
  };

  class DotGarden{
    constructor(ctx){
      this.ctx=ctx;this.alive=true;this.index=0;this.busy=false;this.plan=repairPlan(ctx.items);this.targets=this.plan.map(x=>x.target);
      this.exploreItems=explorationItems(ctx.items,this.plan[0]?.family);this.exploring=this.exploreItems.length>1;this.exploreHistory=[];
      this.keyboardFocus=false;ctx.stage.addEventListener?.('keydown',()=>{this.keyboardFocus=true;});ctx.stage.addEventListener?.('pointerdown',()=>{this.keyboardFocus=false;});this.show();
    }
    progress(){return `<div class="dot-progress" role="progressbar" aria-valuemin="0" aria-valuemax="${this.plan.length}" aria-valuenow="${this.index}" aria-label="Letter repair progress">${Array.from({length:this.plan.length},(_,i)=>`<i class="${i<this.index?'is-on':''}" aria-hidden="true"></i>`).join('')}</div>`;}
    show(){
      if(!this.alive)return;const view=this.view=(this.view||0)+1,active=()=>this.alive&&this.view===view;
      this.resetDrag?.();this.busy=false;this.round=this.plan[this.index];this.target=this.round?.target;
      if(!this.round||!this.target){this.finish();return;}
      if(this.exploring)this.showExplore(active);else if(this.round.kind==='recognition')this.showRecognition(active);else this.showRepair(active);
    }
    showExplore(active){
      this.exploreIndex=0;this.exploreHistory=[];this.exploreSeen=new Set([0]);
      this.ctx.stage.innerHTML=`<div class="dot-garden is-exploring">${pottingScene()}<div class="dot-discoveries" aria-label="Letters explored">${this.exploreItems.map((item,i)=>`<i data-discovery="${i}" aria-label="${item.display}"></i>`).join('')}</div>
        ${button('Hear the discovered letter',glyph(this.exploreItems[0].display),'dot-discovery-card')}
        <div class="dot-explore-tray" role="group" aria-label="Try another dot pattern">${this.exploreItems.map(item=>button(`Try ${item.display}`,patternPicture(item),'dot-pattern-choice')).join('')}</div>
        <div class="practice-tools dot-explore-tools">${button('Undo dot change',tool('replay'),'dot-explore-undo')}${button('Start repairing letters',tool('next'),'dot-explore-next')}</div></div>`;
      const card=this.ctx.stage.querySelector('.dot-discovery-card'),choices=[...this.ctx.stage.querySelectorAll('.dot-pattern-choice')],undo=this.ctx.stage.querySelector('.dot-explore-undo');
      const paint=(speak=true)=>{
        const item=this.exploreItems[this.exploreIndex];this.target=item;card.innerHTML=glyph(item.display)+(this.ctx.canListen?.()!==false?`<span class="dot-discovery-speaker" aria-hidden="true">${tool('speaker')}</span>`:'');card.setAttribute('aria-label',`Hear ${item.display}`);
        choices.forEach((choice,i)=>choice.setAttribute('aria-pressed',String(i===this.exploreIndex)));
        this.ctx.stage.querySelectorAll('[data-discovery]').forEach((bud,i)=>bud.classList.toggle('is-found',this.exploreSeen.has(i)));
        undo.disabled=this.exploreHistory.length===0;this.ctx.stage.querySelector('.dot-garden')?.style.setProperty('--potting-growth',String(.78+Math.min(2,this.exploreSeen.size-1)*.11));this.ctx.prompt?.(item);ns.LettersArt.fitGlyphs?.(card);
        if(speak&&this.ctx.canListen?.()!==false)this.ctx.say?.(item);
      };
      const choose=i=>{if(!active()||!this.exploring||i===this.exploreIndex)return;this.exploreHistory.push(this.exploreIndex);this.exploreIndex=i;this.exploreSeen.add(i);paint();};
      const releases=choices.map((choice,i)=>{
        choice.onclick=()=>choose(i);
        return draggable(choice,{enabled:()=>active()&&this.exploring,drop:(x,y)=>{if(inside(card,x,y))choose(i);},onDragStart:()=>card.classList.add('is-receiving'),onDragEnd:()=>card.classList.remove('is-receiving')});
      });
      this.resetDrag=()=>releases.forEach(release=>release());
      card.onclick=()=>{if(active()&&this.ctx.canListen?.()!==false)this.ctx.say?.(this.target);};
      undo.onclick=()=>{if(!active()||!this.exploring||!this.exploreHistory.length)return;this.resetDrag();this.exploreIndex=this.exploreHistory.pop();paint();};
      this.ctx.stage.querySelector('.dot-explore-next').onclick=()=>{if(!active()||!this.exploring)return;this.resetDrag();this.exploring=false;this.show();};
      paint();
    }
    showRecognition(active){
      const pool=[...new Map(this.round.choices.map(item=>[key(item),item])).values()];
      const count=ns.LettersLearning?.profile(this.target,{...this.ctx,activity:'DotGarden',skill:'letter-name'})?.choiceCount || 2;
      const offered=[this.target,...pool.filter(item=>key(item)!==key(this.target)).slice(0,count-1)];
      const options=this.index%2?offered:offered.slice().reverse();
      this.assisted=options.length===1;this.speechConfirmed=false;this.listening=this.ctx.canListen?.()!==false;this.waitingForSpeech=this.listening;this.ctx.prompt?.(this.listening?null:this.target);
      const support=(label,content,cls)=>`<button type="button" aria-label="${label}" class="${cls} practice-button">${content}</button>`;
      this.ctx.stage.innerHTML=`<div class="dot-garden">${pottingScene()}${this.progress()}<div class="practice-tools">${support('Hear the letter again',tool('speaker'),'dot-listen')}${support('Show the matching letter',eye,'dot-help')}</div><div class="dot-answers">${options.map(item=>button(item.display,glyph(item.display))).join('')}</div></div>`;
      const choices=[...this.ctx.stage.querySelectorAll('.dot-answers button')];
      if(this.waitingForSpeech)choices.forEach(choice=>choice.disabled=true);
      const reveal=()=>{if(!active())return;if(this.waitingForSpeech){this.waitingForSpeech=false;choices.forEach(choice=>choice.disabled=false);}this.assisted=true;this.ctx.prompt?.(this.target);choices.find((c,i)=>key(options[i])===key(this.target))?.classList.add('is-help');};
      this.revealRecognition=reveal;
      let attempt=0;
      const speak=()=>{
        const ticket=++attempt;
        let result;try{result=this.ctx.say?.(this.target);}catch(_){result=false;}
        const finish=heard=>{if(!active()||ticket!==attempt||this.busy)return;if(heard===true){this.waitingForSpeech=false;this.speechConfirmed=true;choices.forEach(choice=>choice.disabled=false);}else reveal();};
        if(result&&typeof result.then==='function')result.then(finish,()=>finish(false));else finish(false);
      };
      this.replayRecognition=speak;
      if(this.listening)speak();else reveal();
      const listen=this.ctx.stage.querySelector?.('.dot-listen'),help=this.ctx.stage.querySelector?.('.dot-help');
      if(listen){listen.disabled=!this.listening;listen.onclick=()=>{if(active()&&!this.busy&&this.listening)speak();};}
      if(help)help.onclick=reveal;
      if(this.keyboardFocus)choices[0]?.focus?.();
      choices.forEach((choice,i)=>choice.onclick=()=>{
        if(!active()||this.busy||choice.disabled)return;
        const selected=options[i],correct=key(selected)===key(this.target);
        const independent=this.speechConfirmed&&!this.assisted;
        outcome(this.ctx,this.target,{correct,evidence:independent?'independent_listening':'supported_visible_matching',skill:'letter-name',selectedId:key(selected),choiceIds:options.map(key),assisted:!independent,affectsStrength:true});
        if(correct)this.advance();else{choice.disabled=true;reveal();if(this.listening)this.ctx.say?.(this.target);}
      });
    }
    onSoundChange(){if(this.alive&&this.round?.kind==='recognition'&&this.ctx.canListen?.()===false)this.revealRecognition?.();}
    replayPrompt(){if(!this.alive||this.busy)return;if(this.round?.kind==='recognition'&&this.ctx.canListen?.()!==false)this.replayRecognition?.();else this.ctx.say?.(this.target);}
    showRepair(active){
      const targetSpec=dotSpec(this.target.display),sourceSpec=this.round.source&&dotSpec(this.round.source.display);
      this.above=sourceSpec?.above||0;this.below=sourceSpec?.below||0;this.ctx.prompt?.(this.target);this.ctx.say?.(this.target);
      this.ctx.stage.innerHTML=`<div class="dot-garden">${pottingScene()}${this.progress()}<div class="dot-bed">
        ${button('Place a dot above','<span class="dot-hint" aria-hidden="true"></span><span class="dot-placed"></span>','dot-zone dot-above')}
        <span class="dot-base" lang="ar">${this.round.family.body}</span>
        ${button('Place a dot below','<span class="dot-hint" aria-hidden="true"></span><span class="dot-placed"></span>','dot-zone dot-below')}
        </div><div class="practice-tools">${button('Take a seed dot',seedDot,'dot-seed')}${button('Remove last dot',tool('replay'),'dot-undo')}${button('Check letter',tool('check'),'dot-check')}</div><div class="practice-status" role="status" aria-live="polite"></div></div>`;
      const source=this.ctx.stage.querySelector('.dot-seed');this.zones=['above','below'].map(name=>this.ctx.stage.querySelector('.dot-'+name));
      if(this.round.mode==='guided'){const hint=this.zones[targetSpec.below?1:0]?.querySelector?.('.dot-hint');if(hint)hint.innerHTML=dots(targetSpec.below||targetSpec.above);}
      this.history=[];if(sourceSpec){for(let i=0;i<this.above;i++)this.history.push('above');for(let i=0;i<this.below;i++)this.history.push('below');}
      const add=name=>{if(!active()||this.busy||source.disabled||this.above+this.below>=3)return;this[name]++;this.history.push(name);source.classList.remove('is-selected');source.setAttribute('aria-pressed','false');this.paint();};
      this.zones.forEach((zone,i)=>zone.onclick=()=>{if(!zone.disabled)add(i?'below':'above');});
      source.setAttribute('aria-pressed','false');source.onclick=()=>{if(!active()||this.busy||source.disabled)return;source.classList.toggle('is-selected');source.setAttribute('aria-pressed',String(source.classList.contains('is-selected')));};
      this.resetDrag=draggable(source,{enabled:()=>active()&&!this.busy&&!source.disabled,drop:(x,y)=>this.zones.forEach((zone,i)=>{if(inside(zone,x,y))add(i?'below':'above');})});
      this.ctx.stage.querySelector('.dot-undo').onclick=()=>{if(!active()||this.busy)return;const last=this.history.pop();if(last)this[last]--;source.classList.remove('is-selected');source.setAttribute('aria-pressed','false');this.paint();};
      this.ctx.stage.querySelector('.dot-check').onclick=()=>{
        if(!active()||this.busy)return;
        if(validDots(this.target.display,this.above,this.below)){
          this.ctx.stage.querySelector('.dot-base').textContent=this.target.display;this.zones.forEach(z=>z.style.visibility='hidden');
          outcome(this.ctx,this.target,{correct:undefined,evidence:'motor_assembly_participation',skill:'construction',selectedId:key(this.target),choiceIds:[key(this.target)],assisted:true,affectsStrength:false});this.advance();
        }else{this.ctx.say?.(this.target);this.ctx.stage.querySelector('.practice-status').innerHTML=tool('replay');this.zones[targetSpec.below?1:0]?.classList.add('is-help');}
      };
      this.paint();if(this.keyboardFocus)source.focus?.();
    }
    paint(){
      const total=this.above+this.below,undo=this.ctx.stage.querySelector('.dot-undo'),check=this.ctx.stage.querySelector('.dot-check'),source=this.ctx.stage.querySelector('.dot-seed'),status=this.ctx.stage.querySelector('.practice-status');
      if(undo)undo.disabled=this.history.length===0;if(check)check.disabled=false;if(source)source.disabled=total>=3;if(status)status.innerHTML='';
      this.zones?.forEach((zone,i)=>{const count=i?this.below:this.above;const placed=zone.querySelector?.('.dot-placed');if(placed)placed.innerHTML=dots(count);zone.classList.remove('is-help');zone.disabled=total>=3;zone.setAttribute('aria-label',`Place a dot ${i?'below':'above'}; ${count} placed`);});
    }
    advance(){if(this.busy||!this.alive)return;this.busy=true;this.resetDrag?.();this.ctx.stage.querySelectorAll?.('button').forEach(b=>b.disabled=true);this.ctx.correct?.();if(this.ctx.canListen?.()!==false)this.ctx.say?.(this.target);setTimeout(()=>{if(!this.alive)return;this.index++;const total=this.plan?.length??this.targets.length*2;if(this.index>=total)this.finish();else this.show();},800);}
    finish(){if(!this.alive)return;this.resetDrag?.();this.alive=false;this.ctx.done?.();}
    destroy(){this.alive=false;this.resetDrag?.();}
  }

  const isolated=item=>item?.display&&Array.from(item.display).length===1&&/[\u0621-\u064A]/.test(item.display);
  // A session sketchbook, not a handwriting recognizer: ink is participation,
  // never correctness or mastery. Keep the child's own marks until they turn the page.
  // Recorded brush width matches the canvas ink; it is not a prop contour.
  const inkPicture=(strokes,width,height)=>`<svg viewBox="0 0 ${width} ${height}" aria-hidden="true"><svg width="${width}" height="${height}" viewBox="0 0 800 500" preserveAspectRatio="none">${strokes.map(stroke=>`<path d="M${stroke.points.map(point=>point.join(',')).join('L')}" fill="none" stroke="${stroke.color}" style="stroke-width:14px" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}</svg></svg>`;
  const pathUndo='<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M10 14H24A10 10 0 1 1 24 34M10 14L17 7M10 14L17 21" fill="none" stroke="#4a3620" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  class GardenPaths{
    constructor(ctx){
      this.ctx=ctx;this.alive=true;this.index=0;this.busy=false;this.drawings=[];this.inkColor=DrawingPalette.current();
      const eligible=[...new Map((ctx.items||[]).filter(isolated).map(item=>[key(item),item])).values()],count=Math.min(3,eligible.length),offset=eligible.length?pathCursor%eligible.length:0;
      this.targets=Array.from({length:count},(_,i)=>eligible[(offset+i)%eligible.length]);this.rounds=this.targets.flatMap(target=>[{target,mode:'guided'},{target,mode:'partial'}]);if(eligible.length)pathCursor=(pathCursor+count)%eligible.length;this.show();
    }
    show(){
      if(!this.alive)return;this.release?.();const view=this.view=(this.view||0)+1,active=()=>this.alive&&this.view===view;
      const round=this.rounds[this.index],target=round?.target;if(!target){if(this.drawings.length)this.showGallery();else this.finish();return;}const mode=round.mode;
      this.ctx.prompt?.(target);this.ctx.say?.(target);this.hasInk=false;this.pointer=null;this.busy=false;this.reviewing=false;this.strokes=[];
      const guideShift=ns.LettersArt.inkShift(target.display,84,false);
      this.ctx.stage.innerHTML=`<div class="garden-paths"><div class="path-progress" role="progressbar" aria-valuemin="0" aria-valuemax="${this.rounds.length}" aria-valuenow="${this.index}" aria-label="Drawing ${this.index+1} of ${this.rounds.length}, ${mode}">${Array.from({length:this.rounds.length},(_,i)=>`<i class="${i<=this.index?'is-on':''}" aria-hidden="true"></i>`).join('')}</div><div class="path-workbook"><div class="path-paper"><div class="path-guide${mode==='partial'?' path-guide-partial':''}"${mode==='partial'?' style="clip-path:inset(0 48% 0 0)"':''}><svg class="path-guide-glyph" viewBox="0 0 100 100" aria-hidden="true"><text data-fit-box="50,50,78,74,84" x="${50+guideShift.dx}" y="${50+guideShift.dy}" text-anchor="middle" font-size="84" font-family="'Amiri Quran',serif" fill="#c9bda4" direction="rtl">${target.display}</text></svg></div><canvas aria-label="Draw ${target.display} here"></canvas></div><span class="path-made" role="status" aria-label="Your drawing is ready" hidden><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M10 29Q5 8 30 7Q36 29 10 29Z" fill="#4e9677"/><path d="M13 25Q14 12 27 10Q22 22 13 25Z" fill="#b7e779"/><path d="M9 33L25 14" stroke="#2f5c46" stroke-width="3" stroke-linecap="round"/></svg></span></div>${DrawingPalette.markup()}<div class="practice-tools path-editing-tools">${button('Undo last stroke',pathUndo,'path-undo')}${button('Clear drawing',eraser,'path-clear')}${button('Show or hide guide',eye,'path-guide-toggle')}${button('Finish this drawing',tool('check'),'path-next')}</div><div class="practice-tools path-review-tools" hidden>${button('Keep drawing','<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M9 29L27 5L35 11L17 35L6 37Z" fill="#f3c955" stroke="#4a3620" stroke-width="3" stroke-linejoin="round"/><path d="M9 29L17 35L6 37Z" fill="#fffaf0"/><path d="M14 28L28 10" stroke="#ffe49a" stroke-width="3"/></svg>','path-edit')}${button('Turn the page',tool('next'),'path-continue')}</div></div>`;
      ns.LettersArt.fitGlyphs?.(this.ctx.stage);
      const find=s=>this.ctx.stage.querySelector(s),canvas=find('canvas'),guide=find('.path-guide'),next=find('.path-next'),clear=find('.path-clear'),toggle=find('.path-guide-toggle'),undo=find('.path-undo'),g=canvas.getContext('2d');
      canvas.width=800;canvas.height=500;guide.hidden=false;next.disabled=true;clear.disabled=true;if(undo)undo.disabled=true;
      const sync=()=>{this.hasInk=this.strokes.length>0;next.disabled=clear.disabled=!this.hasInk;if(undo)undo.disabled=!this.hasInk;};
      const paint=stroke=>{g.beginPath();g.moveTo(...stroke.points[0]);stroke.points.slice(1).forEach(point=>g.lineTo(...point));g.strokeStyle=stroke.color;g.lineWidth=14;g.lineCap=g.lineJoin='round';g.stroke();};
      const redraw=()=>{g.clearRect?.(0,0,800,500);this.strokes.forEach(paint);sync();};
      const guideId=`path-guide-${view}`;guide.id=guideId;
      const guideState=()=>{toggle.setAttribute('aria-pressed',String(!guide.hidden));toggle.setAttribute('aria-label',guide.hidden?'Show guide':'Hide guide');};
      guideState();toggle.setAttribute('aria-controls',guideId);
      toggle.onclick=()=>{if(!active()||this.reviewing)return;guide.hidden=!guide.hidden;guideState();toggle.focus?.();};
      clear.onclick=()=>{if(!active()||this.reviewing)return;this.release?.();this.strokes=[];redraw();};
      if(undo)undo.onclick=()=>{if(!active()||this.reviewing)return;this.release?.();this.strokes.pop();redraw();};
      const point=e=>{const r=canvas.getBoundingClientRect();if(r.width<=0||r.height<=0)return null;return [Math.max(0,Math.min(800,(e.clientX-r.left)*800/r.width)),Math.max(0,Math.min(500,(e.clientY-r.top)*500/r.height))];};
      canvas.onpointerdown=e=>{if(!active()||this.reviewing||this.pointer!==null||e.button>0||e.isPrimary===false)return;const pos=point(e);if(!pos)return;this.pointer=e.pointerId;canvas.setPointerCapture?.(e.pointerId);const [x,y]=pos;this.strokes.push({color:this.inkColor,points:[pos,[Math.min(800,x+.1),Math.min(500,y+.1)]]});paint(this.strokes.at(-1));sync();};
      canvas.onpointermove=e=>{if(!active()||this.reviewing||e.pointerId!==this.pointer||e.isPrimary===false)return;const pos=point(e);if(!pos)return;const stroke=this.strokes.at(-1),previous=stroke.points.at(-1);stroke.points.push(pos);g.beginPath();g.moveTo(...previous);g.lineTo(...pos);g.stroke();};
      const release=e=>{if(e&&!active())return;if(e&&e.pointerId!==undefined&&e.pointerId!==this.pointer)return;const id=this.pointer;this.pointer=null;if(id!==null&&canvas.hasPointerCapture?.(id))canvas.releasePointerCapture?.(id);};
      canvas.onpointerup=release;canvas.onpointercancel=release;canvas.onlostpointercapture=release;this.release=release;
      this.paletteButtons=DrawingPalette.wire(this.ctx.stage,{active:()=>active()&&!this.reviewing,release,onChange:color=>{this.inkColor=color;}});
      let previousGuide=false;
      const review=on=>{
        this.reviewing=on;find('.garden-paths')?.classList.toggle('is-reviewing',on);
        for(const selector of ['.path-editing-tools','.drawing-palette']){const el=find(selector);if(el)el.hidden=on;}
        for(const selector of ['.path-review-tools','.path-made']){const el=find(selector);if(el)el.hidden=!on;}
        if(on){previousGuide=guide.hidden;guide.hidden=true;}else {guide.hidden=previousGuide;guideState();}
        canvas.setAttribute?.('aria-label',on?`Your drawing of ${target.display}`:`Draw ${target.display} here`);
      };
      next.onclick=()=>{if(!active()||this.reviewing||!this.hasInk||this.pointer!==null)return;review(true);find('.path-continue')?.focus?.({preventScroll:true});};
      const edit=find('.path-edit');if(edit)edit.onclick=()=>{if(!active()||!this.reviewing)return;review(false);next.focus?.({preventScroll:true});};
      const turn=find('.path-continue');if(turn)turn.onclick=()=>{
        if(!active()||!this.reviewing||this.busy)return;this.busy=true;this.release();
        const size=canvas.getBoundingClientRect();
        this.drawings.push({target,mode,picture:inkPicture(this.strokes,size.width||800,size.height||500)});
        this.ctx.reportOutcome?.({item:target,itemId:key(target),correct:undefined,evidence:'motor_assembly_participation',skill:'drawing',activity:'GardenPaths',selectedId:key(target),choiceIds:[key(target)],assisted:true,affectsStrength:false});
        this.ctx.correct?.();this.index++;this.show();
      };
    }
    showGallery(){
      this.release?.();const view=++this.view,active=()=>this.alive&&view===this.view;this.reviewing=true;
      this.ctx.stage.innerHTML=`<div class="path-gallery"><div class="path-workbook"><div class="path-paper path-gallery-preview" role="img" aria-label="Your drawing"></div></div><div class="path-gallery-pages" role="group" aria-label="Your sketchbook pages">${this.drawings.map((drawing,i)=>`<button type="button" class="path-page" aria-pressed="false" aria-label="See drawing ${i+1}: ${drawing.target.display}">${drawing.picture}</button>`).join('')}</div>${button('Return to practice garden',tool('home'),'path-close')}</div>`;
      const pages=[...this.ctx.stage.querySelectorAll('.path-page')],preview=this.ctx.stage.querySelector('.path-gallery-preview');
      const select=(i,speak)=>{if(!active())return;preview.innerHTML=this.drawings[i].picture;preview.setAttribute('aria-label',`Your drawing of ${this.drawings[i].target.display}`);pages.forEach((page,n)=>page.setAttribute('aria-pressed',String(i===n)));this.ctx.prompt?.(this.drawings[i].target);if(speak)this.ctx.say?.(this.drawings[i].target);};
      pages.forEach((page,i)=>page.onclick=()=>select(i,true));select(this.drawings.length-1,false);
      this.ctx.stage.querySelector('.path-close').onclick=()=>{if(active())this.finish();};
      pages.at(-1)?.focus?.({preventScroll:true});
    }
    finish(){if(!this.alive)return;this.release?.();this.alive=false;this.ctx.done?.();}
    destroy(){this.alive=false;this.release?.();this.drawings=[];this.strokes=[];}
  }
  ns.GardenPractice={DotGarden,GardenPaths,explorationItems,draggable,inside,validDots,dotSpec,repairFamilies,repairPlan,eraserIcon:()=>eraser};
})(window.MiftahGame||(window.MiftahGame={}));

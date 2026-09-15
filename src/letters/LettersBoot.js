// Bounded optional startup work. A slow font or word request must not strand a child.
(function(ns){
  function settle(promise, milliseconds, onTimeout) {
    return new Promise(resolve=>{
      let finished=false;
      const done=value=>{if(finished)return;finished=true;clearTimeout(timer);resolve(value);};
      const timer=setTimeout(()=>{if(finished)return;try{onTimeout?.();}finally{done(undefined);}},milliseconds);
      Promise.resolve(promise).then(done,()=>done(undefined));
    });
  }
  ns.LettersBoot={settle};
})(window.MiftahGame||(window.MiftahGame={}));

(function () {
  'use strict';

  var BASE='/study/unit-1/sfx/';
  var FILES={
    blade:'blade.mp3',wand:'wand.mp3',wood:'wood.mp3',axe:'axe.mp3',
    bow:'bow.mp3',spear:'spear.mp3',hammer:'hammer.mp3',scythe:'scythe.mp3',
    troll:'troll.mp3',wisp:'wisp.mp3',golem:'golem.mp3',owl:'owl.mp3'
  };
  var GAINS={blade:.62,wand:.50,wood:.58,axe:.62,bow:.50,spear:.60,hammer:.62,scythe:.58,troll:.43,wisp:.40,golem:.44,owl:.42};
  var decoded=Object.create(null),loading=Object.create(null);

  function decode(ctx,name){
    if(decoded[name])return Promise.resolve(decoded[name]);
    if(loading[name])return loading[name];
    if(!FILES[name])return Promise.reject(new Error('Unknown battle sample'));
    loading[name]=fetch(BASE+FILES[name],{cache:'force-cache'}).then(function(response){
      if(!response.ok)throw new Error('Battle sample '+response.status);
      return response.arrayBuffer();
    }).then(function(bytes){
      return new Promise(function(resolve,reject){
        var settled=false;
        function ok(buffer){if(settled)return;settled=true;resolve(buffer);}
        function bad(error){if(settled)return;settled=true;reject(error);}
        try{
          var result=ctx.decodeAudioData(bytes,ok,bad);
          if(result&&typeof result.then==='function')result.then(ok,bad);
        }catch(error){bad(error);}
      });
    }).then(function(buffer){decoded[name]=buffer;delete loading[name];return buffer;},function(error){delete loading[name];throw error;});
    loading[name].catch(function(){});
    return loading[name];
  }

  function warm(ctx){
    if(!ctx)return;
    Object.keys(FILES).forEach(function(name){decode(ctx,name);});
  }

  function play(ctx,spec){
    if(!ctx||ctx.state!=='running'||!spec)return null;
    if(typeof spec==='string')spec={clip:spec};
    var buffer=decoded[spec.clip];
    if(!buffer){if(FILES[spec.clip])decode(ctx,spec.clip);return null;}
    var source=ctx.createBufferSource(),gain=ctx.createGain(),done=false;
    source.buffer=buffer;
    source.playbackRate.value=Number(spec.rate)||1;
    gain.gain.value=(GAINS[spec.clip]||.5)*(Number(spec.gain)||1);
    source.connect(gain);gain.connect(ctx.destination);
    function cleanup(){
      if(done)return;done=true;
      try{source.disconnect();}catch(_){}
      try{gain.disconnect();}catch(_){}
    }
    source.onended=cleanup;
    source.start(ctx.currentTime+(Number(spec.delay)||0));
    return function(){try{source.stop();}catch(_){}cleanup();};
  }

  window.WordExpeditionSfxBank={
    version:1,
    clipCount:12,
    warm:warm,
    play:play,
    weapon:{
      blade:{clip:'blade'},wand:{clip:'wand'},wood:{clip:'wood'},axe:{clip:'axe'},
      bow:{clip:'bow'},spear:{clip:'spear'},hammer:{clip:'hammer'},scythe:{clip:'scythe'}
    },
    creature:{
      mossling:{clip:'troll'},wisp:{clip:'wisp'},sentinel:{clip:'golem'},boss:{clip:'owl'}
    }
  };

  function primeBank(){
    try{if(localStorage.getItem('studyhub-weapon-sounds')==='off')return;}catch(_){}
    try{
      var Audio=window.AudioContext||window.webkitAudioContext;
      if(!Audio)return;
      var ctx=new Audio();
      function ready(){window.WordExpeditionSfxBank.warm(ctx);}
      if(ctx.state==='running')ready();
      else if(typeof ctx.resume==='function'){
        var resumed=ctx.resume();
        if(resumed&&typeof resumed.then==='function')resumed.then(ready).catch(function(){});
      }
    }catch(_){}
  }

  ['pointerdown','touchstart','keydown','click'].forEach(function(eventName){
    document.addEventListener(eventName,primeBank,{capture:true,passive:true});
  });
})();

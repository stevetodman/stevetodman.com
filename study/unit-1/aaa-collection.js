(function () {
  'use strict';

  // Cosmetic-only sightings. Learning/mastery/game rewards remain owned by app.js.
  var KEY='studyhub-word-expedition-aaa-sightings-v1-';
  var META={
    mushroom:{name:'Mushroom Knight',story:'A tiny forest duelist whose leaf shield is sturdier than its enormous confidence.',pitch:180},
    ink:{name:'Ink Slime',story:'A cheerful living blot that leaves dramatic punctuation everywhere it bounces.',pitch:420},
    beetle:{name:'Clockwork Beetle',story:'A brass trail guardian powered by gears, springs, and extremely serious maintenance schedules.',pitch:260},
    drake:{name:'Crystal Drake',story:'A young cave dragon whose luminous scales turn every battle into a miniature light show.',pitch:610}
  };

  function activeLearner(){
    var chip=document.getElementById('profile-chip');
    if(!chip||chip.hidden)return null;
    var match=/Pause\s*·\s*(.+)$/.exec(chip.textContent||'');
    return match?match[1].trim():null;
  }
  function readSightings(name){
    var safe={};
    if(!name)return safe;
    try{
      var raw=JSON.parse(localStorage.getItem(KEY+name)||'{}');
      Object.keys(META).forEach(function(id){
        var entry=raw&&raw[id];
        if(entry&&Number(entry.count)>0)safe[id]={count:Math.min(999,Math.floor(Number(entry.count))),art:typeof entry.art==='string'&&entry.art.length<12000?entry.art:''};
      });
    }catch(_){}
    return safe;
  }
  function writeSightings(name,sightings){
    try{localStorage.setItem(KEY+name,JSON.stringify(sightings));}catch(_){}
  }
  function sightingCount(name){return Object.keys(readSightings(name)).length;}

  function recordVictory(stage){
    if(!stage||stage.dataset.state!=='victory'||stage.dataset.aaaSightingRecorded==='true')return;
    var id=stage.dataset.aaaMonster,name=activeLearner();
    if(!id||!META[id]||!name)return;
    stage.dataset.aaaSightingRecorded='true';
    var sightings=readSightings(name),art=stage.querySelector('.monster-aaa');
    sightings[id]={count:(sightings[id]&&sightings[id].count||0)+1,art:art?art.outerHTML:''};
    writeSightings(name,sightings);
  }

  function soundsEnabled(){
    try{return localStorage.getItem('studyhub-weapon-sounds')!=='off';}catch(_){return true;}
  }
  function roar(id){
    if(!META[id]||!soundsEnabled())return;
    var Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
    var ctx;try{ctx=new Audio();}catch(_){return;}
    if(ctx.state!=='running')return;
    var at=ctx.currentTime+.01,osc=ctx.createOscillator(),gain=ctx.createGain(),filter=ctx.createBiquadFilter(),pitch=META[id].pitch;
    osc.type=id==='beetle'?'square':id==='drake'?'triangle':'sine';
    osc.frequency.setValueAtTime(pitch,at);osc.frequency.exponentialRampToValueAtTime(Math.max(58,pitch*.55),at+.20);
    filter.type='lowpass';filter.frequency.value=id==='drake'?1900:1100;
    gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(.035,at+.015);gain.gain.exponentialRampToValueAtTime(.0001,at+.24);
    osc.connect(filter);filter.connect(gain);gain.connect(ctx.destination);osc.start(at);osc.stop(at+.25);
    osc.onended=function(){try{osc.disconnect();filter.disconnect();gain.disconnect();}catch(_){}};
  }

  function enhanceShop(){
    var button=document.getElementById('monster-book');
    if(!button||button.dataset.aaaCounted==='true')return;
    var name=activeLearner(),span=button.querySelector('span'),match=span&&/Collected\s+(\d+)\s*\/\s*4/.exec(span.textContent||'');
    if(!name||!match)return;
    span.textContent='Collected '+(Number(match[1])+sightingCount(name))+' / 8 →';
    button.dataset.aaaCounted='true';
  }

  function cardHTML(id,index,entry){
    var meta=META[id],collected=!!entry,art=entry&&entry.art||'';
    return '<article class="monster-card aaa-monster-card '+(collected?'collected':'undiscovered')+'" data-aaa-entry="'+id+'">'+
      '<div class="monster-portrait" aria-hidden="true">'+(collected&&art?art:'<span>?</span>')+'</div>'+
      '<span class="monster-entry">Entry '+index+'</span><h3>'+(collected?meta.name:'Undiscovered')+'</h3>'+
      '<p class="monster-story">'+(collected?meta.story:'Defeat this creature on the trail to reveal its story.')+'</p>'+
      (collected?'<p class="monster-count">Battles completed: '+entry.count+'</p><button type="button" class="roar-button" data-aaa-roar="'+id+'" '+(soundsEnabled()?'':'disabled')+' aria-label="Hear '+meta.name+' roar">'+(soundsEnabled()?'Hear roar':'Sounds are off')+'</button>':'<p class="monster-locked">Waiting on the trail</p>')+
      '</article>';
  }

  function enhanceBook(){
    var book=document.querySelector('.monster-book');
    if(!book||book.dataset.aaaCollection==='true')return;
    var name=activeLearner(),grid=book.querySelector('.monster-grid'),heading=book.querySelector('.book-heading .eyebrow');
    if(!name||!grid)return;
    var sightings=readSightings(name),base=heading&&/(\d+)\s*\/\s*4/.exec(heading.textContent||'');
    if(heading&&base)heading.textContent=name+'’s collection · '+(Number(base[1])+Object.keys(sightings).length)+' / 8';
    ['mushroom','ink','beetle','drake'].forEach(function(id,index){grid.insertAdjacentHTML('beforeend',cardHTML(id,index+5,sightings[id]));});
    book.querySelectorAll('[data-aaa-roar]').forEach(function(button){button.addEventListener('click',function(){roar(button.dataset.aaaRoar);});});
    var foot=book.querySelector('.book-footnote');if(foot)foot.textContent='Store time keeps running while you browse. Defeating trail creatures adds them to this book.';
    book.dataset.aaaCollection='true';
  }

  function enhanceScreens(){
    var stage=document.getElementById('battle-stage');if(stage)recordVictory(stage);
    enhanceShop();enhanceBook();
  }

  var observer=new MutationObserver(function(mutations){
    mutations.forEach(function(mutation){
      if(mutation.type==='attributes'&&mutation.attributeName==='data-state'&&mutation.target.id==='battle-stage')recordVictory(mutation.target);
    });
    enhanceScreens();
  });
  observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['data-state']});
  enhanceScreens();
})();

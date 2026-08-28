(function () {
  'use strict';

  var TRAIL_VARIANTS={4:'mushroom',5:'ink',6:'beetle',7:'drake',8:'mushroom',9:'ink',10:'beetle',11:'drake'};
  var ENCOUNTERS={
    mushroom:{name:'Mushroom Knight',theme:'ruins',pitch:180,taunt:'My shield is small. My confidence is enormous!',ready:'The Mushroom Knight braces behind its tiny shield.',hit:'The knight staggers and its cap tilts sideways.',counter:'The Mushroom Knight lunges with a polished twig blade.',victory:'The Mushroom Knight lowers its shield. The trail is open.',lines:{
      blunder:'My greatest blunder was challenging a squirrel to a duel.',
      cancel:'I had to cancel patrol because a snail blocked the gate.',
      continuous:'My continuous marching has worn a perfect circle in the moss.',
      distribute:'I distribute acorn badges to every brave traveler.',
      document:'This document names me captain of the mushroom guard.',
      fragile:'My fragile shield is mostly confidence and one sturdy leaf.',
      myth:'The myth says mushroom knights never retreat. We call it strategic backing up.',
      reject:'I reject any helmet that squashes my magnificent cap.',
      scuffle:'A scuffle started when two beetles claimed the same acorn.',
      solitary:'A solitary mushroom guard still salutes at sunrise.',
      temporary:'This temporary fort is three stones and an excellent flag.',
      veteran:'I am a veteran of seven puddle campaigns.'
    }},
    ink:{name:'Ink Slime',theme:'ruins',pitch:420,taunt:'Careful! I can make absolutely anything look like homework.',ready:'The Ink Slime ripples across the ruined floor.',hit:'The slime splashes apart, then pulls itself together.',counter:'The Ink Slime snaps a ribbon of shadowy ink.',victory:'The last ink ripple sinks into the stones.',lines:{
      blunder:'My blunder was signing the wall instead of the document.',
      cancel:'Rain can cancel my outdoor calligraphy practice.',
      continuous:'A continuous trail of ink follows me everywhere.',
      distribute:'I distribute tiny ink drops whenever I bounce.',
      document:'I tried to document my journey and accidentally became the ink.',
      fragile:'That fragile paper never survives one of my enthusiastic hugs.',
      myth:'The myth says every ink stain hides a secret map.',
      reject:'I reject boring black lines when a dramatic splash will do.',
      scuffle:'The scuffle left ink footprints across the whole hall.',
      solitary:'One solitary ink drop escaped and started its own puddle.',
      temporary:'My temporary disguise as a shadow fooled nobody.',
      veteran:'I am a veteran of the Great Library Spill.'
    }},
    beetle:{name:'Clockwork Beetle',theme:'crystal',pitch:260,taunt:'My gears are calibrated. Mostly. Please ignore that spring.',ready:'The Clockwork Beetle ticks beneath the crystal arches.',hit:'Its brass shell rattles and a gear skips a tooth.',counter:'The Clockwork Beetle winds up and charges on clicking legs.',victory:'The beetle powers down with one last metallic tick.',lines:{
      blunder:'A loose screw caused my latest blunder during inspection.',
      cancel:'I must cancel charging mode when my gears overheat.',
      continuous:'My continuous ticking makes excellent marching music.',
      distribute:'I distribute spare bolts according to a very serious chart.',
      document:'This document contains my complete maintenance schedule.',
      fragile:'The fragile glass gauge is the only part I cannot sit on.',
      myth:'The myth says clockwork beetles never need naps. Incorrect.',
      reject:'I reject replacement gears that squeak before installation.',
      scuffle:'A scuffle bent one antenna exactly three degrees.',
      solitary:'A solitary gear rolled away and I still miss it.',
      temporary:'This temporary spring will hold until the next hill.',
      veteran:'I am a veteran of one thousand scheduled inspections.'
    }},
    drake:{name:'Crystal Drake',theme:'crystal',pitch:610,taunt:'These wings are not decorative. The glitter absolutely is.',ready:'The Crystal Drake watches from a ridge of blue crystal.',hit:'Light fractures across the drake’s crystal scales.',counter:'The Crystal Drake sweeps its wings and releases a bright shard-burst.',victory:'The drake folds its wings and the crystals grow quiet.',lines:{
      blunder:'My worst blunder was polishing the treasure until it rolled downhill.',
      cancel:'I cancel flying lessons whenever the cave ceiling gets too close.',
      continuous:'A continuous blue glow runs along my crystal scales.',
      distribute:'I distribute shiny pebbles to hatchlings who finish their chores.',
      document:'This document proves the largest crystal is definitely not my pillow.',
      fragile:'Even a dragon handles a fragile crystal egg carefully.',
      myth:'The myth says crystal drakes sleep on diamonds. Quartz is much softer.',
      reject:'I reject treasure chests with squeaky hinges.',
      scuffle:'A scuffle over one shiny pebble woke the entire cave.',
      solitary:'A solitary crystal still glows after every torch goes dark.',
      temporary:'My temporary nest became permanent after I added cushions.',
      veteran:'I am a veteran flyer, except near very low ceilings.'
    }}
  };

  var bossIntroduced=false;

  function activeLearner(){
    var chip=document.getElementById('profile-chip');
    if(!chip||chip.hidden)return null;
    var match=/Pause\s*·\s*(.+)$/.exec(chip.textContent||'');
    return match?match[1].trim():null;
  }
  function esc(value){return String(value).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];});}
  function trailNumber(stage){
    var chip=stage&&stage.querySelector('.coin-chip'),match=chip&&/^Trail\s+(\d+)/i.exec(chip.textContent||'');
    return match?Number(match[1]):0;
  }
  function variantId(stage){return TRAIL_VARIANTS[trailNumber(stage)]||null;}
  function environmentFor(stage,id){
    if(stage.dataset.enemy==='boss')return 'castle';
    if(id)return ENCOUNTERS[id].theme;
    var trail=trailNumber(stage);return trail>=8?'crystal':trail>=4?'ruins':'forest';
  }

  function monsterSvg(id){
    if(id==='mushroom')return '<svg class="monster-art monster-aaa monster-mushroom" viewBox="0 0 120 120" aria-hidden="true" focusable="false"><ellipse class="aaa-shadow" cx="61" cy="106" rx="34" ry="7"/><g class="aaa-body"><path class="mush-cap" d="M27 45C29 20 47 11 63 12c20 1 33 13 35 34-17-5-52-5-71-1Z"/><circle class="mush-dot" cx="48" cy="27" r="6"/><circle class="mush-dot" cx="75" cy="24" r="5"/><path class="mush-face" d="M44 45h37v42c0 12-8 18-18 18S44 99 44 87Z"/><circle class="aaa-eye" cx="54" cy="63" r="3"/><circle class="aaa-eye" cx="72" cy="63" r="3"/><path class="aaa-mouth" d="M56 74q7 5 14 0"/><path class="mush-shield" d="M30 62l17 4v25c-5 8-10 11-17 14-7-3-13-7-17-14V66Z"/><path class="mush-sword" d="M87 58l5 3-17 31-5-3Z"/></g><path class="damage-mark damage-1" d="M33 72l8 8-7 8"/><path class="damage-mark damage-2" d="M65 19l-7 12 8 7"/><path class="damage-mark damage-3" d="M84 38l-13 8 8 9"/></svg>';
    if(id==='ink')return '<svg class="monster-art monster-aaa monster-ink" viewBox="0 0 120 120" aria-hidden="true" focusable="false"><ellipse class="aaa-shadow" cx="60" cy="105" rx="38" ry="8"/><g class="aaa-body"><path class="ink-blob" d="M24 81c0-25 12-48 36-49 25-1 39 22 37 48-1 16-9 26-19 26-8 0-9-7-15-7-6 0-9 8-17 8-14 0-22-10-22-26Z"/><path class="ink-drip" d="M31 86c-8 4-10 12-5 17 7 6 14-3 13-12Zm51 2c8 3 12 10 8 16-5 7-15 1-15-9Z"/><ellipse class="ink-eye" cx="49" cy="61" rx="5" ry="7"/><ellipse class="ink-eye" cx="73" cy="61" rx="5" ry="7"/><circle class="aaa-eye" cx="50" cy="62" r="2"/><circle class="aaa-eye" cx="72" cy="62" r="2"/><path class="aaa-mouth ink-smile" d="M48 76q13 10 25 0"/></g><path class="damage-mark damage-1" d="M37 46q8-7 15-7"/><path class="damage-mark damage-2" d="M77 41q8 5 12 13"/><path class="damage-mark damage-3" d="M42 89q18-8 37 0"/></svg>';
    if(id==='beetle')return '<svg class="monster-art monster-aaa monster-beetle" viewBox="0 0 120 120" aria-hidden="true" focusable="false"><ellipse class="aaa-shadow" cx="61" cy="105" rx="38" ry="7"/><g class="aaa-body"><path class="beetle-leg" d="M33 67 15 54m19 25L12 82m75-15 18-13M87 79l21 4"/><path class="beetle-shell" d="M34 53c5-22 19-33 29-33 16 0 29 16 30 38v24c-1 15-13 24-30 24S34 96 33 82Z"/><path class="beetle-plate" d="M63 21v83M36 58h54"/><circle class="gear-ring" cx="63" cy="72" r="16"/><circle class="gear-core" cx="63" cy="72" r="6"/><path class="beetle-head" d="M45 33q18-18 36 0v20H45Z"/><circle class="beetle-eye" cx="53" cy="42" r="4"/><circle class="beetle-eye" cx="73" cy="42" r="4"/><path class="beetle-antenna" d="M50 29 39 14m35 15 11-15"/></g><path class="damage-mark damage-1" d="M40 69l10 7-8 9"/><path class="damage-mark damage-2" d="M79 62l-9 8 10 9"/><path class="damage-mark damage-3" d="M58 23l8 12-7 10"/></svg>';
    return '<svg class="monster-art monster-aaa monster-drake" viewBox="0 0 120 120" aria-hidden="true" focusable="false"><ellipse class="aaa-shadow" cx="61" cy="106" rx="39" ry="7"/><g class="aaa-body"><path class="drake-wing" d="M48 55 19 27l7 35-17 8 34 13Zm29 1 24-30-3 36 15 9-31 12Z"/><path class="drake-body" d="M42 55c4-19 14-28 23-28 13 0 23 13 24 34l-3 29c-3 11-12 17-23 17-15 0-25-9-25-22Z"/><path class="drake-head" d="M42 52 37 31l12 8 13-20 12 19 14-8-5 23Z"/><path class="drake-snout" d="M50 49h27l8 12-11 11H53L42 61Z"/><circle class="drake-eye" cx="56" cy="53" r="3"/><circle class="drake-eye" cx="72" cy="53" r="3"/><path class="drake-tail" d="M78 90q27 5 22 17-7-8-23-5"/></g><path class="damage-mark damage-1" d="M49 69l9 7-8 10"/><path class="damage-mark damage-2" d="M75 43l-9 9 8 9"/><path class="damage-mark damage-3" d="M70 80l10 8-11 11"/></svg>';
  }

  function highlighted(line,word){
    var at=line.toLowerCase().indexOf(String(word||'').toLowerCase());
    if(at<0)return esc(line);
    return esc(line.slice(0,at))+'<span class="target">'+esc(line.slice(at,at+word.length))+'</span>'+esc(line.slice(at+word.length));
  }

  function rewriteDialogue(root,id){
    if(!id)return;
    var encounter=ENCOUNTERS[id];
    root.querySelectorAll('.monster-dialogue').forEach(function(dialogue){
      var target=dialogue.querySelector('.target'),word=target&&target.textContent;
      var speaker=dialogue.querySelector('.dialogue-speaker'),line=dialogue.querySelector('.dialogue-line');
      if(speaker)speaker.textContent=encounter.name+' · Story practice';
      if(word&&line&&encounter.lines[word.toLowerCase()])line.innerHTML='“'+highlighted(encounter.lines[word.toLowerCase()],word)+'”';
    });
    root.querySelectorAll('.monster-taunt').forEach(function(taunt){
      var target=taunt.querySelector('.target'),word=target&&target.textContent;
      var speaker=taunt.querySelector('.dialogue-speaker'),body=taunt.querySelector('p:last-child');
      if(speaker)speaker.textContent=encounter.name;
      if(body){
        var sentence=word&&encounter.lines[word.toLowerCase()]||'';
        body.innerHTML='“'+esc(encounter.taunt)+(sentence?' '+highlighted(sentence,word):'')+'”';
      }
    });
  }

  function defenseText(stage){
    return ({shield:' Your shield catches it.',brace:' Your mail absorbs the blow.',barrier:' Your magic barrier deflects it.',evade:' You slip past the attack.'})[stage.dataset.defense]||'';
  }
  function rewriteStatus(stage,id){
    if(!id)return;
    var status=stage.querySelector('.battle-status'),state=stage.dataset.state,encounter=ENCOUNTERS[id];
    if(!status)return;
    if(state==='ready')status.textContent=encounter.ready;
    else if(state==='counter')status.textContent=encounter.counter+defenseText(stage);
    else if(state==='victory')status.textContent=encounter.victory;
    else if(state==='critical'||state==='standard'||state==='recovery')status.textContent=(state==='recovery'?'Correction complete. ':'')+encounter.hit;
  }

  function playLayer(stage,id,state){
    if(!id||state==='ready')return;
    try{if(localStorage.getItem('studyhub-weapon-sounds')==='off')return;}catch(_){}
    var Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
    var ctx;
    try{ctx=new Audio();}catch(_){return;}
    if(ctx.state!=='running')return;
    var encounter=ENCOUNTERS[id],contact=parseFloat(getComputedStyle(stage).getPropertyValue('--contact'))||.2;
    var delay=(state==='counter'?0.18:contact)+(state==='victory'?.03:0);
    var at=ctx.currentTime+delay,osc=ctx.createOscillator(),gain=ctx.createGain(),filter=ctx.createBiquadFilter();
    osc.type=id==='ink'?'sine':id==='beetle'?'square':id==='drake'?'triangle':'sine';
    osc.frequency.setValueAtTime(encounter.pitch,at);
    osc.frequency.exponentialRampToValueAtTime(Math.max(55,encounter.pitch*(state==='counter'?1.3:.62)),at+.09);
    filter.type=id==='ink'?'lowpass':'bandpass';filter.frequency.value=id==='drake'?1600:id==='beetle'?1100:760;filter.Q.value=.8;
    gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(state==='victory'?.028:.018,at+.008);gain.gain.exponentialRampToValueAtTime(.0001,at+.11);
    osc.connect(filter);filter.connect(gain);gain.connect(ctx.destination);osc.start(at);osc.stop(at+.12);
    osc.onended=function(){try{osc.disconnect();filter.disconnect();gain.disconnect();}catch(_){}};
  }

  function enhanceStage(stage){
    if(!stage)return;
    var id=variantId(stage),theme=environmentFor(stage,id);
    stage.dataset.environment=theme;
    if(stage.dataset.enemy==='boss'&&!bossIntroduced){stage.dataset.bossIntro='true';bossIntroduced=true;}
    if(!id){delete stage.dataset.aaaMonster;stage.dataset.aaaEnhanced='true';return;}
    stage.dataset.aaaMonster=id;
    var art=stage.querySelector('.enemy-fighter .monster-art');
    if(art&&!art.classList.contains('monster-aaa'))art.outerHTML=monsterSvg(id);
    var name=stage.querySelector('.enemy-name');if(name)name.textContent=ENCOUNTERS[id].name;
    rewriteStatus(stage,id);
    rewriteDialogue(document,id);
    stage.dataset.aaaEnhanced='true';
  }

  function enhanceCurrent(){
    var stage=document.getElementById('battle-stage');
    if(stage)enhanceStage(stage);
    var id=stage&&stage.dataset.aaaMonster;
    if(id)rewriteDialogue(document,id);
  }

  var observer=new MutationObserver(function(mutations){
    var stage=document.getElementById('battle-stage');
    mutations.forEach(function(mutation){
      if(mutation.type==='attributes'&&mutation.target.classList&&mutation.target.classList.contains('battle-stage')){
        var target=mutation.target,id=target.dataset.aaaMonster||variantId(target),state=target.dataset.state;
        if(id){rewriteStatus(target,id);if(mutation.attributeName==='data-state')playLayer(target,id,state);rewriteDialogue(document,id);}
      }
    });
    if(stage&&!stage.dataset.aaaEnhanced)enhanceStage(stage);
    else if(stage&&stage.dataset.aaaMonster)rewriteDialogue(document,stage.dataset.aaaMonster);
  });
  observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['data-state','data-wear']});
  enhanceCurrent();
})();

(function () {
  'use strict';

  var STORAGE_KEY = 'studyhub-word-expedition-unit1-v3';
  // Compatibility keys. Keep these values stable so existing device/cloud progress migrates safely.
  var LEGACY_KEY = 'studyhub-word-mission-unit1-v2';
  var CLOUD_URL = 'https://lpjvsjezjjasgpkvjjlq.supabase.co/functions/v1/studyhub-save';
  var CLOUD_TOKEN_KEY = 'studyhubCloudToken';
  var LEGACY_CLOUD_TOKEN_KEY = 'usStatesCloudToken';
  var CLOUD_ENABLED = location.protocol === 'https:' && /(^|\.)stevetodman\.com$/i.test(location.hostname);
  var CLOUD_PUSH_DELAY = 1200;
  var SESSION_LENGTH = 10;
  var GAME_STORAGE_KEY = 'studyhub-word-expedition-game-unit1-v1';
  var ROUND_KEY = 'studyhub-word-expedition-round-unit1-v1-';
  var GEAR_DRAFT_KEY = 'studyhub-word-expedition-gear-draft-unit1-v1-';
  var QUALITY = window.WordExpeditionQuality;
  var ART = window.WordExpeditionArt;
  var GAME_CATALOG = ART.catalog;
  var MONSTERS = [
    {id:'mossling',name:'Bramble Troll',story:'Claims this entire forest is its bedroom. Still refuses to tidy it.'},
    {id:'wisp',name:'Gloom Wisp',story:'Practices its terrifying entrance. Usually floats through the wrong wall.'},
    {id:'sentinel',name:'Rune Golem',story:'Built to guard ancient treasure. Forgot where it put the treasure.'},
    {id:'boss',name:'The Word Keeper',story:'An owl sorcerer with a thousand spells. Cannot find the one that fixes its hair.'}
  ];
  // Short, authored practice sentences. Never send a spelling answer into the prompt.
  var MONSTER_LINES = {
    mossling:{
      blunder:'I made a blunder: I put my soup in my boot.',
      cancel:'I had to cancel my picnic. The golem ate the blanket.',
      continuous:'That continuous dripping ruined my nap. Even the moss is grumpy.',
      distribute:'I distribute bridge tickets to visitors. Nobody buys the muddy ones.',
      document:'This document says the bridge is mine. I signed it in mud.',
      fragile:'This bridge is fragile. Last week, a squirrel broke it.',
      myth:'That myth about a polite troll is definitely not about me.',
      reject:'I reject your offer of broccoli. Bring something with more crunch.',
      scuffle:'A scuffle broke out over my sandwich. The sandwich lost.',
      solitary:'I prefer a solitary life. Visitors always steal my biscuits.',
      temporary:'Your bridge pass is temporary. It expires when I finish lunch.',
      veteran:'I am a veteran of bridge battles. The splinters remember me.'
    },
    wisp:{
      blunder:'My only blunder was floating into a jar. A very impressive jar.',
      cancel:'You cannot cancel my grand entrance. I already rehearsed it!',
      continuous:'Admire my continuous glow. I never need a candle break.',
      distribute:'I distribute sparkles everywhere. You are welcome, dusty castle.',
      document:'My document lists every wall I passed through. It is enormous.',
      fragile:'That fragile lantern cracked. My glow is clearly the better choice.',
      myth:'The myth says nobody can catch me. Excellent publicity!',
      reject:'I reject this tiny lantern. A star like me needs room.',
      scuffle:'I escaped the scuffle through a wall. Such elegant footwork!',
      solitary:'A solitary spark followed me. Even sparks want my autograph.',
      temporary:'Your victory would be temporary. My magnificent glow lasts all night.',
      veteran:'I am a veteran of midnight haunts. Even ghosts ask for tips.'
    },
    sentinel:{
      blunder:'I made a blunder. The door needed a key, not a boulder.',
      cancel:'I must cancel lunch. Apparently pebbles are not sandwiches.',
      continuous:'My continuous humming bothers the owl. I thought owls liked music.',
      distribute:'I distribute stones to every visitor. Why does everyone run?',
      document:'This document proves I own the castle. Can I eat it now?',
      fragile:'My fragile teacup survived. The table did not.',
      myth:'The myth says mountains can walk. Should I ask my cousin?',
      reject:'They reject my stone soup. Perhaps I need smaller stones.',
      scuffle:'The scuffle ended when I sat down. Was that the table?',
      solitary:'A solitary pebble sits beside me. I named it Crowd.',
      temporary:'My temporary repair is holding. Is this boulder supposed to roll?',
      veteran:'They call me a veteran guard. Does that come with a hat?'
    },
    boss:{
      blunder:'A blunder in my spell turned my crown into soup. Still regal.',
      cancel:'I shall cancel the royal feast. Someone invited a hungry golem.',
      continuous:'My continuous studying proves my brilliance. My feathers demand a holiday.',
      distribute:'I distribute royal invitations. The mice receive the smallest envelopes.',
      document:'This document declares me ruler. My signature takes an entire page.',
      fragile:'Handle my fragile crystal crown carefully. Royal glue is expensive.',
      myth:'The myth of my wisdom grows daily. I write the updates.',
      reject:'I reject this crooked crown. My royal head deserves better.',
      scuffle:'A scuffle in my throne room? Mind the royal cushions!',
      solitary:'A solitary throne suits me. Sharing is terribly unroyal.',
      temporary:'Your invitation is temporary. My magnificence, however, is permanent.',
      veteran:'I am a veteran spellcaster. That exploding teapot was intentional.'
    }
  };
  var XP_THRESHOLDS = [0,20,60,120,200,300,430,590,780,1000];
  var LEARNERS = [
    { name:'Luke', avatar:'🚀' },
    { name:'Samantha', avatar:'⭐' }
  ];
  // These cloud profile keys predate the Word Expedition rename. Do not change them without a server migration.
  var CLOUD_PROFILE_KEYS = {
    Luke:'word-mission-unit1-luke',
    Samantha:'word-mission-unit1-samantha'
  };
  var TEST_DATES = {
    vocabulary:new Date('2026-09-01T08:00:00'),
    spelling:new Date('2026-09-02T08:00:00')
  };
  var DOMAINS = ['definition','synonym','antonym','spelling'];
  var DOMAIN_LABELS = { definition:'What it means', synonym:'Same meaning', antonym:'Opposite meaning', spelling:'Spell it' };

  var WORDS = [
    { word:'blunder', pos:'verb · noun', definitions:['to make a foolish or careless mistake','a serious or thoughtless mistake'], synonyms:['err','foul up','bungle','goof','error','blooper'], antonyms:['triumph','succeed','success','hit'], example:'I made a blunder when I put salt in the lemonade.', spellingSentence:'That careless blunder cost our team a point.' },
    { word:'cancel', pos:'verb', definitions:['to call off or do away with; to cross out so it cannot be used again'], synonyms:['stop','discontinue','drop','repeal','revoke'], antonyms:['renew','continue','extend','maintain'], example:'The team had to cancel practice because of lightning.', spellingSentence:'The storm may cancel our outdoor practice.' },
    { word:'continuous', pos:'adjective', definitions:['going on without a stop or break'], synonyms:['ongoing','endless','ceaseless','unbroken','constant','perpetual'], antonyms:['broken','discontinuous','interrupted'], example:'A continuous hum came from the old refrigerator.', spellingSentence:'The machine made one continuous sound.' },
    { word:'distribute', pos:'verb', definitions:['to give out in shares; to scatter or spread'], synonyms:['divide','share','deal','issue'], antonyms:['gather','collect','hold'], example:'Maya will distribute one worksheet to each student.', spellingSentence:'Please distribute the papers to the whole class.' },
    { word:'document', pos:'noun · verb', definitions:['a written or printed record that gives information or proof','to provide written or printed proof'], synonyms:['certificate','deed','prove','establish'], antonyms:[], example:'The signed document gave proof, and photographs helped document what happened.', spellingSentence:'The signed document gave us the information we needed.' },
    { word:'fragile', pos:'adjective', definitions:['easily broken or damaged; requiring special handling or care'], synonyms:['weak','frail','breakable','delicate','brittle','flimsy'], antonyms:['sturdy','hardy','strong','rugged','tough'], example:'The fragile glass ornament needs careful handling.', spellingSentence:'The package was marked fragile because it contained glass.' },
    { word:'myth', pos:'noun', definitions:['an old story that explains why something is or how it came to be; something imaginary'], synonyms:['legend','fable','tale','fantasy','fairy tale'], antonyms:['fact'], example:'The class read a Greek myth about a hero and a monster.', spellingSentence:'We read a myth about how thunder began.' },
    { word:'reject', pos:'verb', definitions:['to refuse to accept, agree to, believe, or use'], synonyms:['deny','discard','junk','scrap','decline','dismiss'], antonyms:['take','accept','receive','welcome'], example:'The editor may reject a story that does not follow the rules.', spellingSentence:'The club may reject an application that is incomplete.' },
    { word:'scuffle', pos:'verb · noun', definitions:['to fight or struggle closely with','a fight or struggle'], synonyms:['tussle','roughhouse','battle','brawl','fistfight','clash'], antonyms:[], example:'A brief scuffle began when both puppies grabbed the same toy.', spellingSentence:'A brief scuffle began over the last ball.' },
    { word:'solitary', pos:'adjective', definitions:['living or being alone; being the only one'], synonyms:['single','sole','lone'], antonyms:['sociable','several','many','numerous'], example:'One solitary tree stood in the empty field.', spellingSentence:'A solitary bird sat alone on the fence.' },
    { word:'temporary', pos:'adjective', definitions:['lasting or used for a limited time'], synonyms:['short-term','passing','brief','momentary'], antonyms:['lasting','long-lived','permanent'], example:'The library used a temporary entrance during repairs.', spellingSentence:'The temporary bridge will be removed next month.' },
    { word:'veteran', pos:'noun · adjective', definitions:['a former member of the armed forces; an experienced person','having much experience in a job or field'], synonyms:['expert','professional','experienced','skilled','accomplished'], antonyms:['beginner','newcomer','novice','rookie'], example:'The veteran firefighter knew how to remain calm.', spellingSentence:'The veteran coach had many years of experience.' }
  ];

  var app = document.getElementById('app');
  var chip = document.getElementById('profile-chip');
  var toast = document.getElementById('toast');
  var state = loadState();
  var gameState = loadGameState();
  var activeName = null;
  var session = null;
  var toastTimer = null;
  var advanceTimer = null;
  var cloudPushTimer = null;
  var cloudPushInFlight = false;
  var cloudPushQueued = false;
  var cloudStatus = CLOUD_ENABLED ? 'loading' : 'local';
  var activityClock=QUALITY.createClock(function(){return performance.now();});
  var speechTimer=null,counterTimer=null,localVoice=null;
  var rewardTimer=null;
  var rewardDeadline=null;
  var STORE_TIME_MS=50000;
  var rewardAllowance=0;
  var selectedGear=null,shopPage=0;
  var weaponAudio=null,stopWeaponSound=null,stopCreatureSound=null,weaponSoundsEnabled=true;
  try{weaponSoundsEnabled=localStorage.getItem('studyhub-weapon-sounds')!=='off';}catch(_){}
  var localSaveErrors={};

  function persistLocal(key,value){
    try{localStorage.setItem(key,JSON.stringify(value));delete localSaveErrors[key];}
    catch(_){localSaveErrors[key]=true;}
    var warning=document.getElementById('save-warning'),failed=Object.keys(localSaveErrors).length>0;
    if(warning){warning.hidden=!failed;warning.textContent=failed?'This device is not saving. Keep this tab open—progress may be lost if you close it.':'';}
    updateCloudStatus(cloudStatus);
    return !localSaveErrors[key];
  }

  function saveTiming(){
    if(!session||!activeName)return;
    var entry=profile(activeName).sessions.find(function(s){return s.id===session.id;});
    if(entry){entry.timing=activityClock.snapshot();saveState(false);}
  }

  // A try-on is a device-local bookmark, never a purchase or cloud preference.
  function savedGearChoice(name){
    try{
      var draft=JSON.parse(localStorage.getItem(GEAR_DRAFT_KEY+name)||'null');
      var item=draft&&draft.version===1&&itemById(draft.item);
      return item?item.id:null;
    }catch(_){return null;}
  }
  function saveGearChoice(id){
    selectedGear=itemById(id)?id:null;
    return persistLocal(GEAR_DRAFT_KEY+activeName,{version:1,item:selectedGear});
  }

  function saveRound() {
    if(!session||!activeName||session.rewarded)return;
    var input=document.getElementById('answer-input');
    if(input&&!input.disabled)session.draftValue=input.value;
    session.timing=activityClock.snapshot();
    persistLocal(ROUND_KEY+activeName,Object.assign({},session,{version:1,strengthened:Array.from(session.strengthened)}));
  }
  function savedRound(name) {
    try{
      var raw=JSON.parse(localStorage.getItem(ROUND_KEY+name));
      if(!raw||raw.version!==1||typeof raw.id!=='string'||!Number.isInteger(raw.index)||raw.index<0||raw.index>10||!Array.isArray(raw.questions)||raw.questions.length!==10||!Array.isArray(raw.results)||raw.results.length<raw.index||raw.results.length>raw.index+1||gameProfile(name).rewards[raw.id])return null;
      raw.questions=raw.questions.map(function(old,index){
        var word=WORDS.find(function(w){return old.word&&w.word===old.word.word;});
        if(!word||assignedDomains(word).indexOf(old.domain)<0)throw new Error('Unknown question');
        var q=makeQuestion({word:word,domain:old.domain},index,old.kind==='text');
        if(q.kind==='choice'&&Array.isArray(old.choices)&&old.choices.length===4){
          var valid=q.domain==='definition'?WORDS.map(function(w){return w.definitions[0];}):q.accepted.concat(safeRelationDistractors(word,q.accepted,q.domain==='synonym'?word.antonyms:word.synonyms));
          if(old.choices.every(function(c){return valid.indexOf(c)>=0;})&&old.choices.some(function(c){return isAccepted(q,c);}))q.choices=old.choices;
        }
        return q;
      });
      raw.strengthened=new Set(Array.isArray(raw.strengthened)?raw.strengthened.filter(function(name){return WORDS.some(function(w){return w.word===name;});}):[]);
      raw.battleDamage=Math.max(0,Math.min(10,Number(raw.battleDamage)||0));raw.battleState='ready';
      return raw;
    }catch(_){return null;}
  }
  function cancelSpeech(){clearTimeout(counterTimer);silenceWeapon();silenceCreature();try{if('speechSynthesis'in window)window.speechSynthesis.cancel();}catch(_){}}
  function pauseSession(){saveRound();cancelSpeech();showProfilePicker();}

  function silenceWeapon(){if(stopWeaponSound){stopWeaponSound();stopWeaponSound=null;}}
  function warmWeaponAudio(){
    if(!weaponSoundsEnabled)return null;
    try{
      var Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return null;
      if(!weaponAudio||weaponAudio.state==='closed')weaponAudio=new Audio();
      if(weaponAudio.state==='suspended')weaponAudio.resume().catch(function(){});
      return weaponAudio;
    }catch(_){return null;}
  }
  // Short synthesized foley: swept air + inharmonic metal; the wand uses bell tones.
  function renderWeaponSound(ctx,weapon){
    var item=ART.catalog.find(function(item){return item.id===weapon;})||{sound:'blade',tone:730};
    var type=item.sound,toneHz=item.tone,motion=ART.combatProfile(weapon),contact=motion.contact;
    var start=ctx.currentTime+.005,nodes=[],sources=[],remaining=0;
    var output=ctx.createGain();output.gain.value=.16;output.connect(ctx.destination);nodes.push(output);
    function cleanup(){nodes.forEach(function(node){try{node.disconnect();}catch(_){}});}
    function voice(source,duration,volume,delay,filter){
      var at=start+(delay||0),gain=ctx.createGain();nodes.push(source,gain);sources.push(source);remaining++;
      gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(volume,at+.008);
      gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
      if(filter){source.connect(filter);filter.connect(gain);nodes.push(filter);}else source.connect(gain);
      gain.connect(output);source.onended=function(){if(--remaining===0)cleanup();};
      source.start(at);source.stop(at+duration+.01);
    }
    try{
      if(type==='wand'||type==='charm'){
        var charge=ctx.createOscillator();charge.type='sine';charge.frequency.setValueAtTime(toneHz*.35,start);charge.frequency.exponentialRampToValueAtTime(toneHz,start+contact);
        voice(charge,contact,.12,0);
        [toneHz,toneHz*1.498,toneHz*2].forEach(function(hz,index){
          var tone=ctx.createOscillator();tone.type='sine';tone.frequency.setValueAtTime(hz,start);
          voice(tone,.22,.24,contact+index*.025);
        });
        if(motion.element==='crystal'){
          var crack=ctx.createOscillator();crack.type='triangle';crack.frequency.value=toneHz*3;voice(crack,.055,.09,contact);
        }
      }else{
        var copper=weapon==='copper-blade',moon=weapon==='moon-blade',soft=type==='cloth'||type==='wood',heavy=type==='hammer'||type==='shield';
        var buffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*contact),ctx.sampleRate),data=buffer.getChannelData(0);
        for(var i=0;i<data.length;i++)data[i]=Math.random()*2-1;
        var air=ctx.createBufferSource();air.buffer=buffer;
        var filter=ctx.createBiquadFilter();filter.type='bandpass';filter.Q.value=.7;
        filter.frequency.setValueAtTime(type==='cloth'?toneHz*3:type==='bow'?3200:moon?3400:Math.min(3600,toneHz*3),start);
        filter.frequency.exponentialRampToValueAtTime(400,start+contact);voice(air,contact,soft?.42:.6,0,filter);
        if(type==='bow'){
          var string=ctx.createOscillator();string.type='triangle';string.frequency.setValueAtTime(toneHz*2,start+.04);string.frequency.exponentialRampToValueAtTime(toneHz,start+.10);voice(string,.10,.26,.04);
        }
        var thud=ctx.createOscillator();thud.type='triangle';thud.frequency.setValueAtTime(type==='bow'?toneHz:heavy?95:145,start+contact);thud.frequency.exponentialRampToValueAtTime(heavy?35:48,start+contact+.11);voice(thud,.13,soft?.14:heavy?.55:.38,contact);
        var partials=[toneHz,toneHz*(type==='bow'?2:1.68),toneHz*(soft?3:2.71)];
        partials.forEach(function(hz,index){
          var metal=ctx.createOscillator();metal.type='sine';metal.frequency.setValueAtTime(hz*1.035,start+contact);metal.frequency.exponentialRampToValueAtTime(hz,start+contact+.035);
          voice(metal,type==='cloth'?.08:type==='bow'?.12:moon?.28:copper?.16:.22,(soft?.06:.25)/(index+1),contact);
        });
        if(motion.element==='lightning'||motion.element==='ice'||motion.element==='fire'){
          var spark=ctx.createBufferSource();spark.buffer=buffer;
          var sparkFilter=ctx.createBiquadFilter();sparkFilter.type=motion.element==='fire'?'lowpass':'highpass';sparkFilter.frequency.value=motion.element==='ice'?4200:1800;
          voice(spark,.08,.18,contact,sparkFilter);
        }
      }
    }catch(error){sources.forEach(function(source){try{source.stop();}catch(_){}});cleanup();throw error;}
    return function(){sources.forEach(function(source){try{source.stop();}catch(_){}});cleanup();};
  }
  function playWeaponSound(weapon){
    silenceWeapon();
    var ctx=warmWeaponAudio();
    if(!ctx||ctx.state!=='running'||document.hidden)return;
    try{stopWeaponSound=renderWeaponSound(ctx,weapon);}catch(_){} // Audio must never block learning.
  }

  function silenceCreature(){if(stopCreatureSound){stopCreatureSound();stopCreatureSound=null;}}
  function renderCreatureSound(ctx,kind,armor){
    var params=({mossling:[95,700,.34],wisp:[520,2300,.32],sentinel:[55,430,.38],boss:[260,1800,.40]})[kind]||[95,700,.34];
    var armorItem=ART.catalog.find(function(item){return item.id===armor;}),armorTone=armorItem?armorItem.tone:115,defense=ART.combatProfile(armor||'starter-cloak').defense;
    var duration=.48,buffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*duration),ctx.sampleRate),data=buffer.getChannelData(0),phase=0;
    for(var i=0;i<data.length;i++){
      var t=i/ctx.sampleRate,fall=1-t/duration;
      phase+=2*Math.PI*params[0]*(.65+.35*fall+.06*Math.sin(2*Math.PI*23*t))/ctx.sampleRate;
      var growl=(Math.sin(phase)+.3*Math.sin(phase*2.01)+.2*Math.sin(phase*3.9))*(.7+.3*Math.sin(t*2*Math.PI*31));
      var grit=(Math.random()*2-1)*(kind==='wisp'?.55:.25);
      // Contact is at 200ms, shared with the counterattack and defense keyframes.
      var hitTime=t-.20,impact=0;
      if(armor&&hitTime>=0){
        var ring=Math.sin(hitTime*2*Math.PI*armorTone),noise=Math.random()*2-1;
        impact=defense==='evade'?noise*.24*Math.exp(-hitTime*28):
          defense==='barrier'?(ring+Math.sin(hitTime*2*Math.PI*armorTone*1.5))*.22*Math.exp(-hitTime*15):
          (ring+.35*Math.sin(hitTime*2*Math.PI*armorTone*2.71)+noise*.20)*.4*Math.exp(-hitTime*(defense==='brace'?24:18));
      }
      data[i]=(growl*.38+grit+impact)*Math.min(1,t/.018)*Math.pow(fall,1.3);
    }
    var source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
    source.buffer=buffer;filter.type='lowpass';filter.frequency.value=armorItem?Math.max(armorTone*1.4,params[1]):params[1];gain.gain.value=.20;
    source.connect(filter);filter.connect(gain);gain.connect(ctx.destination);
    function cleanup(){source.disconnect();filter.disconnect();gain.disconnect();}
    source.onended=cleanup;source.start();
    return function(){try{source.stop();}catch(_){}cleanup();};
  }
  function playCreatureSound(kind,armor){
    silenceCreature();var ctx=warmWeaponAudio();if(!ctx||ctx.state!=='running'||document.hidden)return;
    try{stopCreatureSound=renderCreatureSound(ctx,kind,armor);}catch(_){}
  }
  function monsterCounterattack(){
    if(!session||document.hidden||document.body.dataset.screen!=='question'||session.battleDamage>=SESSION_LENGTH)return;
    var defense=ART.combatProfile(gameProfile(activeName).equipped.armor).defense;
    var attack=({mossling:'The troll sweeps its claws.',wisp:'The wisp launches a ghost bolt.',sentinel:'The golem slams the ground.',boss:'The owl casts a spell.'})[session.enemy];
    var response=({shield:'Your shield catches it.',brace:'Your mail absorbs the blow.',barrier:'Your magic barrier deflects it.',evade:'You slip past the attack.'})[defense];
    setBattleState('counter',attack+' '+response,false);
    playCreatureSound(session.enemy,gameProfile(activeName).equipped.armor);
  }

  function blankProfile() { return { stats:{}, sessions:[] }; }
  function defaultState() { return { version:3, learners:{ Luke:blankProfile(), Samantha:blankProfile() } }; }

  function blankGameProfile() {
    return { rewards:{}, sessionsCompleted:0, bossDefeatedAt:null, owned:['starter-sword','starter-cloak'], equipped:{weapon:'starter-sword',armor:'starter-cloak'}, purchases:{} };
  }
  function defaultGameState() { return { version:1, learners:{ Luke:blankGameProfile(), Samantha:blankGameProfile() } }; }

  function sanitizeGameProfile(raw) {
    var clean=blankGameProfile();
    if(!raw||typeof raw!=='object')return clean;
    clean.sessionsCompleted=Math.max(0,Math.floor(Number(raw.sessionsCompleted)||0));
    clean.bossDefeatedAt=typeof raw.bossDefeatedAt==='string'&&raw.bossDefeatedAt.length<50?raw.bossDefeatedAt:null;
    clean.rewards={};
    // This is the source of truth for lifetime earnings, not a rolling history.
    if(raw.rewards&&typeof raw.rewards==='object')Object.keys(raw.rewards).forEach(function(id){
      var reward=raw.rewards[id],limit=id==='_legacy'?Number.MAX_SAFE_INTEGER:1000;
      if(id.length<100&&!['__proto__','constructor','prototype'].includes(id)&&reward&&typeof reward==='object'){
        clean.rewards[id]={xp:Math.max(0,Math.min(limit,Math.floor(Number(reward.xp)||0))),coins:Math.max(0,Math.min(limit,Math.floor(Number(reward.coins)||0)))};
        if(id!=='_legacy'&&knownMonster(reward.monster))clean.rewards[id].monster=reward.monster;
      }
    });
    if(!Object.keys(clean.rewards).length&&(Number(raw.xp)>0||Number(raw.coinsEarned)>0))clean.rewards._legacy={xp:Math.max(0,Math.floor(Number(raw.xp)||0)),coins:Math.max(0,Math.floor(Number(raw.coinsEarned)||0))};
    clean.sessionsCompleted=Math.max(clean.sessionsCompleted,Object.keys(clean.rewards).filter(function(id){return id!=='_legacy';}).length);
    clean.owned=unique(clean.owned.concat(Array.isArray(raw.owned)?raw.owned:[])).filter(function(id){return ART.validItems.indexOf(id)>=0;});
    clean.purchases={};
    if(raw.purchases&&typeof raw.purchases==='object')Object.keys(raw.purchases).forEach(function(id){
      if(GAME_CATALOG.some(function(item){return item.id===id;}))clean.purchases[id]=String(raw.purchases[id]||'owned');
    });
    clean.owned=unique(clean.owned.concat(Object.keys(clean.purchases)));
    var weapon=raw.equipped&&raw.equipped.weapon;
    var armor=raw.equipped&&raw.equipped.armor;
    if(clean.owned.indexOf(weapon)>=0&&itemType(weapon)==='weapon')clean.equipped.weapon=weapon;
    if(clean.owned.indexOf(armor)>=0&&itemType(armor)==='armor')clean.equipped.armor=armor;
    return clean;
  }
  function loadGameState() {
    try {
      var parsed=JSON.parse(localStorage.getItem(GAME_STORAGE_KEY));
      if(parsed&&parsed.version===1&&parsed.learners)return {version:1,learners:{Luke:sanitizeGameProfile(parsed.learners.Luke),Samantha:sanitizeGameProfile(parsed.learners.Samantha)}};
    } catch (_) {}
    return defaultGameState();
  }
  function saveGameState() {
    return persistLocal(GAME_STORAGE_KEY,gameState);
  }
  function itemById(id) { return GAME_CATALOG.find(function(item){return item.id===id;}); }
  function itemType(id) { var item=itemById(id);if(item)return item.type;return id==='starter-sword'?'weapon':'armor'; }
  function gameProfile(name) { return gameState.learners[name]; }
  function knownMonster(kind){return MONSTERS.some(function(monster){return monster.id===kind;});}
  function monsterCounts(name){
    var counts={mossling:0,wisp:0,sentinel:0,boss:0},gp=gameProfile(name);
    Object.keys(gp.rewards).forEach(function(id){var kind=gp.rewards[id].monster;if(id!=='_legacy'&&knownMonster(kind))counts[kind]+=1;});
    // Older ordinary battles did not record their monster. A saved boss victory is explicit.
    if(gp.bossDefeatedAt&&!counts.boss)counts.boss=1;
    return counts;
  }
  function rewardTotal(name,field) { return Object.keys(gameProfile(name).rewards).reduce(function(sum,id){return sum+(Number(gameProfile(name).rewards[id][field])||0);},0); }
  function gameXp(name) { return rewardTotal(name,'xp'); }
  function coinsEarned(name) { return rewardTotal(name,'coins'); }
  function coinsSpent(name) { return Object.keys(gameProfile(name).purchases).reduce(function(sum,id){var item=itemById(id);return sum+(item?item.price:0);},0); }
  function coinBalance(name) { return Math.max(0,coinsEarned(name)-coinsSpent(name)); }
  function levelForXp(xp) {
    var level=1;
    XP_THRESHOLDS.forEach(function(threshold,index){if(xp>=threshold)level=index+1;});
    if(xp>=XP_THRESHOLDS[XP_THRESHOLDS.length-1])level+=Math.floor((xp-XP_THRESHOLDS[XP_THRESHOLDS.length-1])/250);
    return level;
  }
  function nextLevelXp(xp) {
    var current=levelForXp(xp);
    return XP_THRESHOLDS[current]!==undefined?XP_THRESHOLDS[current]:XP_THRESHOLDS[XP_THRESHOLDS.length-1]+(current-(XP_THRESHOLDS.length-1))*250;
  }
  function levelFloorXp(level) {
    return XP_THRESHOLDS[level-1]!==undefined?XP_THRESHOLDS[level-1]:XP_THRESHOLDS[XP_THRESHOLDS.length-1]+(level-XP_THRESHOLDS.length)*250;
  }

  function gameCloudProfile(name) {
    var gp=gameProfile(name);
    return {version:1,rewards:gp.rewards,sessionsCompleted:gp.sessionsCompleted,bossDefeatedAt:gp.bossDefeatedAt,purchases:gp.purchases,equipped:gp.equipped};
  }
  function applyCloudGame(name,remote) {
    if(!remote||typeof remote!=='object')return;
    var local=gameProfile(name),safeRemote=sanitizeGameProfile(remote),rewards=Object.assign({},local.rewards);
    Object.keys(safeRemote.rewards).forEach(function(id){
      var a=rewards[id]||{xp:0,coins:0},b=safeRemote.rewards[id];
      rewards[id]={xp:Math.max(a.xp,b.xp),coins:Math.max(a.coins,b.coins)};
      var monster=[a.monster,b.monster].filter(knownMonster).sort()[0];if(monster)rewards[id].monster=monster;
    });
    var combined={version:1,rewards:rewards,sessionsCompleted:Math.max(local.sessionsCompleted||0,safeRemote.sessionsCompleted),bossDefeatedAt:local.bossDefeatedAt||safeRemote.bossDefeatedAt||null,purchases:Object.assign({},local.purchases,safeRemote.purchases),owned:local.owned,equipped:remote.equipped||local.equipped};
    gameState.learners[name]=sanitizeGameProfile(combined);
  }

  function loadState() {
    try {
      var parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (parsed && parsed.version === 3 && parsed.learners) {
        LEARNERS.forEach(function (l) {
          parsed.learners[l.name] = parsed.learners[l.name] || blankProfile();
          parsed.learners[l.name].stats = parsed.learners[l.name].stats || {};
          parsed.learners[l.name].sessions = Array.isArray(parsed.learners[l.name].sessions) ? parsed.learners[l.name].sessions : [];
        });
        return parsed;
      }
      var legacy = JSON.parse(localStorage.getItem(LEGACY_KEY));
      if (legacy && Array.isArray(legacy.learners)) {
        var migrated = defaultState();
        migrated.learners.Luke.stats = legacy.learners[0] && legacy.learners[0].stats || {};
        migrated.learners.Samantha.stats = legacy.learners[1] && legacy.learners[1].stats || {};
        return migrated;
      }
    } catch (_) {}
    return defaultState();
  }

  function saveState(sync) {
    persistLocal(STORAGE_KEY,state);
    if (sync !== false) scheduleCloudPush();
  }

  function esc(value) {
    return String(value).replace(/[&<>'"]/g, function (c) { return ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'})[c]; });
  }
  function normalize(value) {
    return String(value || '').toLowerCase().trim().replace(/[‐‑‒–—]/g,'-').replace(/\s+/g,' ').replace(/[.!?,;:]$/g,'');
  }
  function shuffle(items) {
    var copy = items.slice();
    for (var i=copy.length-1;i>0;i--) { var j=Math.floor(Math.random()*(i+1)); var t=copy[i];copy[i]=copy[j];copy[j]=t; }
    return copy;
  }
  function unique(items) { return Array.from(new Set(items)); }
  function pad2(value) { return String(value).padStart(2,'0'); }
  function localDateKey(date) {
    var d=date || new Date();
    return d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate());
  }
  function todayKey() { return localDateKey(new Date()); }
  function profile(name) { return state.learners[name]; }
  function statKey(word,domain) { return word + '|' + domain; }
  function getStat(name,word,domain) {
    return profile(name).stats[statKey(word,domain)] || { attempts:0,correct:0,wrong:0,assisted:0,streak:0,correctDays:[],lastAt:null };
  }
  function assignedDomains(word) { return word.antonyms.length ? DOMAINS.slice() : ['definition','synonym','spelling']; }

  function wordDays(name,word) {
    var days=[];
    assignedDomains(word).forEach(function (domain) { days=days.concat(getStat(name,word.word,domain).correctDays || []); });
    return unique(days).sort();
  }
  function wordLevel(name,word) {
    var domains=assignedDomains(word);
    var attempts=domains.reduce(function(sum,d){return sum+(getStat(name,word.word,d).attempts||0);},0);
    if (!attempts) return 'new';
    var vocabReady=['definition','synonym'].concat(word.antonyms.length?['antonym']:[]).every(function(d){return (getStat(name,word.word,d).correctDays||[]).length>=1;});
    var spellingDays=(getStat(name,word.word,'spelling').correctDays||[]).length;
    var days=wordDays(name,word).length;
    if (vocabReady && spellingDays>=2 && days>=3) return 'mastered';
    if (vocabReady && spellingDays>=1 && days>=2) return 'strong';
    return 'learning';
  }
  function masteredCount(name) { return WORDS.filter(function(w){return wordLevel(name,w)==='mastered';}).length; }

  function skillLabel(domain){return {definition:'meaning',synonym:'synonym',antonym:'antonym',spelling:'spelling'}[domain]||'practice';}
  function practiceSuggestions(name){
    var candidates=[];
    WORDS.forEach(function(word){
      var domains=assignedDomains(word),tried=domains.some(function(d){return getStat(name,word.word,d).attempts>0;});
      if(!tried)return;
      domains.forEach(function(domain){
        var st=getStat(name,word.word,domain),days=(st.correctDays||[]).length;
        var needsHelp=st.attempts>0&&st.streak===0&&((st.wrong||0)+(st.assisted||0)>0);
        if(!needsHelp&&days>=(domain==='spelling'?2:1)&&wordLevel(name,word)==='mastered')return;
        candidates.push({word:word.word,domain:domain,priority:needsHelp?0:days<(domain==='spelling'?2:1)?1:2,at:st.lastAt||''});
      });
    });
    candidates.sort(function(a,b){return a.priority-b.priority||b.at.localeCompare(a.at)||a.word.localeCompare(b.word)||a.domain.localeCompare(b.domain);});
    return candidates.slice(0,3);
  }
  function roundReviewHTML(results){
    var missed=unique(results.filter(function(r){return !r.correct;}).map(function(r){return r.word+' — '+skillLabel(r.domain);}));
    return '<section class="round-review" aria-label="This adventure’s practice"><p><strong>'+results.filter(function(r){return r.correct;}).length+' of 10 recalled on the first try.</strong></p><p>'+(missed.length?'Practiced with help: '+esc(missed.join('; '))+'.':'Every answer recalled without help.')+'</p></section>';
  }

  function showToast(message) {
    clearTimeout(toastTimer); toast.textContent=message; toast.hidden=false;
    toastTimer=setTimeout(function(){toast.hidden=true;},2200);
  }

  function resetView(headingSelector) {
    window.scrollTo(0,0);
    if(!headingSelector)return;
    var heading=document.querySelector(headingSelector);
    if(heading){heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});}
  }

  function setChip(name) {
    if (!name) { chip.hidden=true; return; }
    var learner=LEARNERS.find(function(l){return l.name===name;});
    chip.hidden=false;
    chip.innerHTML='<span aria-hidden="true">'+learner.avatar+'</span><span>Pause · '+esc(name)+'</span>';
  }

  function trailHTML(name,compact) {
    // A span keeps the learner card valid HTML because it is nested inside a button.
    return '<span class="trail '+(compact?'compact':'')+'" role="img" aria-label="'+masteredCount(name)+' of 12 words mastered">'+WORDS.map(function(w,i){
      var level=wordLevel(name,w);
      return '<span class="trail-stop '+level+'" title="'+esc(w.word)+': '+level+'"><span class="stop-number">'+(level==='mastered'?'⚑':(i+1))+'</span></span>';
    }).join('')+'</span>';
  }

  function readyForCastle(name){return masteredCount(name)>=12||gameProfile(name).sessionsCompleted>=11||(new Date()>=TEST_DATES.spelling&&masteredCount(name)>=10);}
  function journeySentence(name){
    var gp=gameProfile(name);
    if(gp.bossDefeatedAt)return 'Castle reached! Keep your words strong.';
    if(readyForCastle(name))return 'The castle is next: one final adventure!';
    return 'Adventure '+Math.min(12,gp.sessionsCompleted+1)+' of 12: heading to the castle.';
  }
  function showProfilePicker(preserveClock) {
    clearTimeout(counterTimer);silenceWeapon();silenceCreature();saveRound();saveTiming();clearTimeout(advanceTimer);clearTimeout(speechTimer);clearTimeout(rewardTimer);session=null;activeName=null;setChip(null);if(preserveClock!==true)activityClock=QUALITY.createClock(function(){return performance.now();});activityClock.mode('play');document.body.dataset.screen='home';
    app.innerHTML='<section class="picker-intro"><div class="intro-copy"><p class="eyebrow">'+esc(new Date()<TEST_DATES.vocabulary?'Tonight: mostly meanings':new Date()<TEST_DATES.spelling?'Tonight: mostly spelling':'Keep your words strong')+'</p><h2>Choose your hero</h2><p>Learn a word. Land a hit. Find your way to the castle.</p></div><div class="intro-emblem" aria-hidden="true">✦</div></section>'+
      '<div class="profile-grid">'+LEARNERS.map(function(l){return '<button type="button" class="learner-card" data-profile="'+esc(l.name)+'">'+
        '<span class="profile-hero">'+ART.hero(l.name,gameProfile(l.name).equipped,'ready')+'</span><strong>'+esc(l.name)+'</strong><span class="journey-line">'+esc(journeySentence(l.name))+'</span><span class="start-label">'+(savedRound(l.name)?'Resume adventure':'Start adventure')+' <span aria-hidden="true">→</span></span><span class="session-promise">10 questions · about 4 minutes</span></button>';}).join('')+'</div>'+
      '<div class="picker-links"><button type="button" class="text-button" id="word-list">Review the 12 words</button>'+
      '<span class="cloud-button" id="cloud-status">'+cloudStatusText()+'</span><button type="button" class="text-button" id="cloud-button">Device settings</button></div>'+learningSummaryHTML();
    app.querySelectorAll('[data-profile]').forEach(function(button){button.addEventListener('click',function(){startSession(button.getAttribute('data-profile'));});});
    document.getElementById('word-list').addEventListener('click',showWordList);
    document.getElementById('cloud-button').addEventListener('click',showCloudScreen);
  }
  function learningSummaryHTML(){
    return '<details class="learning-notes"><summary>Learning progress</summary>'+LEARNERS.map(function(learner){
      var name=learner.name,last=profile(name).sessions[0];
      var weak=practiceSuggestions(name).map(function(pair){return pair.word+' — '+skillLabel(pair.domain);});
      var vocab=WORDS.filter(function(word){return assignedDomains(word).filter(function(domain){return domain!=='spelling';}).every(function(domain){return (getStat(name,word.word,domain).correctDays||[]).length>0;});}).length;
      var spelling=WORDS.filter(function(word){return (getStat(name,word.word,'spelling').correctDays||[]).length>=2;}).length;
      return '<section><h3>'+esc(name)+'</h3><p>Meanings recalled: '+vocab+'/12 · Spelling across two days: '+spelling+'/12</p><p>'+(weak.length?'Practice next: '+esc(weak.join('; ')):masteredCount(name)===12?'All 12 words mastered.':'Start an adventure to find what needs practice.')+'</p>'+(last?'<p>Last adventure: '+last.correct+'/10 on the first try.</p>':'')+(last&&last.timing?'<p class="timing-note">Recorded active time: '+formatDuration(last.timing.learning)+' learning · '+formatDuration(last.timing.play)+' menus and rewards. Interaction-based estimate; idle and background time excluded.</p>':'')+'</section>';
    }).join('')+'<p class="mastery-explainer">A mastery seal means meanings recalled without story clues, two spelling days, and practice across three different days. Letter tiles help learning but do not earn a spelling day.</p></details>';
  }
  function formatDuration(ms){var seconds=Math.max(0,Math.round((Number(ms)||0)/1000));return Math.floor(seconds/60)+'m '+seconds%60+'s';}

  function cloudStatusText() {
    if(Object.keys(localSaveErrors).length)return 'Device save unavailable';
    if (!CLOUD_ENABLED) return 'Saved on this device';
    if (cloudStatus==='saving'||cloudStatus==='loading') return '☁ Saving…';
    if (cloudStatus==='unlinked') return 'Saved on this device · family link needed';
    if (cloudStatus==='capacity') return 'Saved on this device · cloud storage full';
    if (cloudStatus==='offline') return 'Offline · saved on this device';
    return '☁ Saved';
  }
  function updateCloudStatus(status) {
    cloudStatus=status;
    var el=document.getElementById('cloud-status');
    if (el) el.textContent=cloudStatusText();
    var mini=document.getElementById('cloud-mini');
    if (mini) mini.textContent=cloudStatusText();
  }
  function cloudToken(create) {
    var token=null;
    try {
      token=localStorage.getItem(CLOUD_TOKEN_KEY) || localStorage.getItem(LEGACY_CLOUD_TOKEN_KEY);
      if (token && !localStorage.getItem(CLOUD_TOKEN_KEY)) localStorage.setItem(CLOUD_TOKEN_KEY,token);
    } catch (_) {}
    return token;
  }
  function validCloudToken(token) {
    // New tokens are 48 lowercase hex chars. Keep the old 20-200 character window for legacy-device compatibility.
    return /^[0-9a-f]{48}$/i.test(token) || (token.length>=20 && token.length<=200 && /^[A-Za-z0-9_-]+$/.test(token));
  }
  function adoptTokenFromHash() {
    var match=/(?:^|[#&])k=([^&]+)/.exec(location.hash||'');
    if (!match) return false;
    var token;try{token=decodeURIComponent(match[1]).trim();}catch(_){return false;}
    if (!validCloudToken(token)) return false;
    try { localStorage.setItem(CLOUD_TOKEN_KEY,token);history.replaceState(null,'',location.pathname+location.search); } catch (_) {}
    return true;
  }
  function cloudRequest(payload) {
    return fetch(CLOUD_URL,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)}).then(function(res){return res.json().then(function(body){if(!res.ok){var error=new Error(body.error||'cloud '+res.status);error.status=res.status;throw error;}return body;});});
  }
  function cloudSkillKey(word,domain) { return 'wm1|'+word+'|'+domain; }
  function cloudPayload() {
    var out={};
    LEARNERS.forEach(function(learner){
      var remoteStats={};
      WORDS.forEach(function(word){assignedDomains(word).forEach(function(domain){
        var st=getStat(learner.name,word.word,domain); var base=cloudSkillKey(word.word,domain);
        remoteStats[base]={streak:st.streak||0,correct:st.correct||0,wrong:st.wrong||0,mastered:false};
        (st.correctDays||[]).forEach(function(day){remoteStats[base+'|day|'+day]={streak:1,correct:1,wrong:0,mastered:true};});
      });});
      out[CLOUD_PROFILE_KEYS[learner.name]]={stateStats:remoteStats,masteredOrder:[],avatar:learner.avatar,game:gameCloudProfile(learner.name)};
    });
    return out;
  }
  function applyCloudData(remote) {
    if (!remote||typeof remote!=='object') return;
    LEARNERS.forEach(function(learner){
      var source=remote[CLOUD_PROFILE_KEYS[learner.name]];
      var stats=source&&source.stateStats;
      if (!stats||typeof stats!=='object') return;
      Object.keys(stats).forEach(function(key){
        var parts=key.split('|');
        if (parts[0]!=='wm1') return;
        var word=WORDS.find(function(w){return w.word===parts[1];});
        if (!word||DOMAINS.indexOf(parts[2])<0) return;
        var local=getStat(learner.name,word.word,parts[2]); var remoteStat=stats[key]||{};
        if (parts.length===3) {
          local.correct=Math.max(local.correct||0,Number(remoteStat.correct)||0);
          local.wrong=Math.max(local.wrong||0,Number(remoteStat.wrong)||0);
          local.streak=Math.max(local.streak||0,Number(remoteStat.streak)||0);
          local.attempts=Math.max(local.attempts||0,local.correct+local.wrong+(local.assisted||0));
        } else if (parts.length===5&&parts[3]==='day'&&/^\d{4}-\d{2}-\d{2}$/.test(parts[4])&&remoteStat.mastered) {
          local.correctDays=unique((local.correctDays||[]).concat(parts[4])).sort();
        }
        profile(learner.name).stats[statKey(word.word,parts[2])]=local;
      });
      applyCloudGame(learner.name,source.game);
    });
    saveState(false);saveGameState();
  }
  function cloudPush() {
    if (!CLOUD_ENABLED) return Promise.resolve();
    var token=cloudToken(false); if(!token){updateCloudStatus('unlinked');return Promise.resolve();}
    if(cloudPushInFlight){cloudPushQueued=true;return Promise.resolve();}
    cloudPushInFlight=true;updateCloudStatus('saving');
    return cloudRequest({token:token,action:'push',data:cloudPayload()}).then(function(res){applyCloudData(res.data);updateCloudStatus('saved');}).catch(function(error){updateCloudStatus(error.status===403?'unlinked':error.status===413?'capacity':'offline');}).then(function(){cloudPushInFlight=false;if(cloudPushQueued){cloudPushQueued=false;scheduleCloudPush(0);}});
  }
  function scheduleCloudPush(delay) {
    if(!CLOUD_ENABLED)return;
    clearTimeout(cloudPushTimer);cloudPushTimer=setTimeout(function(){cloudPushTimer=null;cloudPush();},delay===undefined?CLOUD_PUSH_DELAY:delay);
  }
  function cloudPull() {
    if(!CLOUD_ENABLED)return Promise.resolve(false);
    var token=cloudToken(false);if(!token){updateCloudStatus('unlinked');return Promise.resolve(false);}updateCloudStatus('loading');
    return cloudRequest({token:token,action:'pull'}).then(function(res){if(res.found)applyCloudData(res.data);updateCloudStatus(res.found?'saved':'unlinked');return !!res.found;}).catch(function(error){updateCloudStatus(error.status===403?'unlinked':error.status===413?'capacity':'offline');return false;});
  }
  function cloudShareLink() { var token=cloudToken(false);return token?location.origin+'/study/#k='+encodeURIComponent(token):null; }

  function showCloudScreen() {
    activityClock.mode('play');document.body.dataset.screen='settings';
    setChip(null);
    var enabled=CLOUD_ENABLED,linked=!!cloudToken(false)&&cloudStatus!=='unlinked';
    app.innerHTML='<section class="panel cloud-panel"><span class="panel-icon" aria-hidden="true">☁</span><h2>Cloud save</h2>'+
      '<p>'+(enabled?'Both learners save on this device after every answer. Family-linked devices also sync to the cloud. On a new device, open the private link shared from an already linked device; local practice stays available without linking.':'This preview saves on this device. Family cloud linking is available on stevetodman.com.')+'</p>'+
      (enabled&&linked?'<button type="button" class="primary-button" id="share-cloud">Share private device link</button><p class="privacy-note">Treat this link like a password: anyone with it can read and change this family’s study progress. The key is removed from the address after a new device connects.</p>':'')+
      '<button type="button" class="secondary-button" id="weapon-sounds" aria-pressed="'+weaponSoundsEnabled+'">Battle sounds: '+(weaponSoundsEnabled?'on':'off')+'</button>'+
      '<a class="past-practice" href="/study/archive/">Past practice →</a><button type="button" class="text-button" id="cloud-done">Done</button></section>';
    document.getElementById('weapon-sounds').addEventListener('click',function(){
      weaponSoundsEnabled=!weaponSoundsEnabled;silenceWeapon();silenceCreature();
      try{localStorage.setItem('studyhub-weapon-sounds',weaponSoundsEnabled?'on':'off');}catch(_){}
      this.setAttribute('aria-pressed',String(weaponSoundsEnabled));this.textContent='Battle sounds: '+(weaponSoundsEnabled?'on':'off');
    });
    if(enabled&&linked)document.getElementById('share-cloud').addEventListener('click',function(){
      var link=cloudShareLink();if(!link)return;
      if(navigator.share)navigator.share({title:'Study Hub cloud save',url:link}).catch(function(){});
      else if(navigator.clipboard)navigator.clipboard.writeText(link).then(function(){showToast('Private link copied.');}).catch(function(){showToast('Could not copy the link.');});
      else showToast('Open this page in a browser that can share links.');
    });
    document.getElementById('cloud-done').addEventListener('click',showProfilePicker);
  }

  function eligibleWords(domain) { return WORDS.filter(function(w){return domain!=='antonym'||w.antonyms.length;}); }
  function pairPriority(name,word,domain) {
    var st=getStat(name,word.word,domain); var days=(st.correctDays||[]).length;
    return days*100+(st.correct||0)*7-(st.wrong||0)*9;
  }
  function domainPlan(now) {
    var current=now||new Date();
    if(current<TEST_DATES.vocabulary)return ['definition','definition','definition','synonym','synonym','antonym','antonym','spelling','spelling','spelling'];
    if(current<TEST_DATES.spelling)return ['spelling','spelling','spelling','spelling','spelling','spelling','spelling','spelling','definition','synonym'];
    // After both tests, switch to an explicit retention mix rather than silently reverting to the pre-test schedule.
    return ['definition','definition','synonym','synonym','antonym','antonym','spelling','spelling','spelling','spelling'];
  }
  function buildPlan(name) {
    var used=new Set(), usedWords={}, plan=[];
    domainPlan().forEach(function(domain,index){
      var ranked=eligibleWords(domain).map(function(word){
        var repeat=usedWords[word.word]||0;
        // Jitter is sampled once per candidate; the sort comparator itself is deterministic.
        return {word:word,score:repeat*75+pairPriority(name,word,domain)+Math.random()*18};
      }).sort(function(a,b){return a.score-b.score;});
      var chosenEntry=ranked.find(function(entry){return !used.has(entry.word.word+'|'+domain);})||ranked[0];
      var chosen=chosenEntry.word;
      used.add(chosen.word+'|'+domain);usedWords[chosen.word]=(usedWords[chosen.word]||0)+1;
      plan.push(makeQuestion({word:chosen,domain:domain},index,false));
    });
    return plan;
  }
  function safeRelationDistractors(word,list,other) {
    // The old global relation pool could surface a second defensible answer (for example
    // permanent for continuous, or scrap for cancel) and then grade it as wrong. Prefer
    // the target word's opposite relation, then fill with unrelated Unit 1 headwords.
    var accepted=new Set(list.map(normalize));
    var candidates=other.concat(WORDS.filter(function(w){return w.word!==word.word;}).map(function(w){return w.word;}));
    return unique(candidates).filter(function(term){return !accepted.has(normalize(term));});
  }
  function makeQuestion(pair,index,forceText) {
    var w=pair.word,domain=pair.domain,typed=forceText||domain==='spelling'||index%2===0,q;
    if(domain==='definition') {
      if(typed)q={kind:'text',prompt:'Which vocabulary word means “'+w.definitions[0].split(';')[0]+'”?',accepted:[w.word],answer:w.word,explanation:w.word+': '+w.definitions.join('; ')};
      else {var defs=WORDS.filter(function(x){return x.word!==w.word;}).map(function(x){return x.definitions[0];});q={kind:'choice',prompt:'Which definition matches <span class="target">'+esc(w.word)+'</span>?',choices:shuffle([w.definitions[0]].concat(shuffle(defs).slice(0,3))),accepted:[w.definitions[0]],answer:w.definitions[0],explanation:w.word+': '+w.definitions.join('; '),listen:true};}
    } else if(domain==='synonym'||domain==='antonym') {
      var list=domain==='synonym'?w.synonyms:w.antonyms,other=domain==='synonym'?w.antonyms:w.synonyms;
      if(typed)q={kind:'text',prompt:'Type one '+domain+' for <span class="target">'+esc(w.word)+'</span>.',accepted:list.slice(),answer:list[0],explanation:'School list: '+list.join(', '),listen:true};
      else {
        var distractors=shuffle(safeRelationDistractors(w,list,other)).slice(0,3);
        q={kind:'choice',prompt:'Which word is '+(domain==='antonym'?'an':'a')+' '+domain+' of <span class="target">'+esc(w.word)+'</span>?',choices:shuffle([list[0]].concat(distractors)),accepted:list.slice(),answer:list[0],explanation:'School list: '+list.join(', '),listen:true};
      }
    } else q={kind:'text',prompt:'Listen, then spell the word.',accepted:[w.word],answer:w.word,explanation:'The correct spelling is '+w.word+'.',listen:true,spelling:true};
    q.word=w;q.domain=domain;q.retry=!!forceText;q.checkpoint=index===SESSION_LENGTH-1;
    q.contextual=q.kind==='choice'&&!q.spelling&&!q.retry&&!q.checkpoint;
    return q;
  }
  function monsterSentence(q,kind){return (MONSTER_LINES[kind]||MONSTER_LINES.mossling)[q.word.word]||q.word.example;}
  function highlightedSentence(q,kind){
    var line=monsterSentence(q,kind),at=line.toLowerCase().indexOf(q.word.word);
    if(at<0)return esc(line);
    return esc(line.slice(0,at))+'<span class="target">'+esc(line.slice(at,at+q.word.word.length))+'</span>'+esc(line.slice(at+q.word.word.length));
  }
  function questionPromptHTML(q,kind){
    if(!q.contextual||q.kind!=='choice'||q.spelling||q.domain==='spelling'||q.retry||q.checkpoint)return '<p class="q-prompt">'+q.prompt+'</p>';
    var task=q.domain==='definition'?'Which definition matches the bold word?':q.domain==='synonym'?'Which word has the same meaning?':'Which word has the opposite meaning?';
    return '<div class="monster-dialogue"><p class="dialogue-speaker">'+esc(enemyName(kind))+' · Story practice</p><p class="q-prompt"><span class="dialogue-line">“'+highlightedSentence(q,kind)+'”</span><span class="dialogue-task">'+task+'</span></p></div>';
  }
  function monsterTauntHTML(q){
    // Only a completed wrong attempt unlocks this extra model, including in spelling.
    var result=session&&session.results[session.index];if(!result||result.correct||result.assisted)return '';
    var challenge=({mossling:'You soggy turnip!',wisp:'Nice try, walking night-light!',sentinel:'You wobbly pebble!',boss:'You featherless royal nuisance!'})[session.enemy]||'Your move!';
    return '<div class="monster-taunt"><p class="dialogue-speaker">'+esc(enemyName(session.enemy))+'</p><p>“'+esc(challenge)+' '+highlightedSentence(q,session.enemy)+'”</p></div>';
  }

  function startSession(name) {
    activeName=name;setChip(name);warmSpeech();warmWeaponAudio();
    var resumed=savedRound(name);
    var entryTiming=activityClock.snapshot();
    if(resumed){session=resumed;var prior=session.timing||{};prior.play=(prior.play||0)+entryTiming.play;activityClock=QUALITY.createClock(function(){return performance.now();},prior);activityClock.mode('learning');renderQuestion();return;}
    activityClock=QUALITY.createClock(function(){return performance.now();},entryTiming);activityClock.mode('learning');
    var completed=gameProfile(name).sessionsCompleted;
    var readyForBoss=readyForCastle(name);
    var kinds=['mossling','wisp','sentinel'];
    session={id:new Date().toISOString()+'-'+Math.random().toString(36).slice(2,8),index:0,questions:buildPlan(name),results:[],combo:0,beforeMastered:masteredCount(name),strengthened:new Set(),battleDamage:0,battleState:'ready',enemy:readyForBoss&&!gameProfile(name).bossDefeatedAt?'boss':kinds[completed%kinds.length],rewarded:false};
    saveRound();renderQuestion();
  }
  function warmSpeech() {
    try{if('speechSynthesis'in window){var voices=window.speechSynthesis.getVoices();localVoice=voices.find(function(v){return v.localService&&/^en[-_]US$/i.test(v.lang);})||voices.find(function(v){return v.localService&&/^en/i.test(v.lang);})||null;}}catch(_){}
  }
  function pipsHTML() {
    return '<div class="pips" aria-label="Question '+(session.index+1)+' of '+SESSION_LENGTH+'">'+Array.from({length:SESSION_LENGTH},function(_,i){
      var cls=i<session.results.length?(session.results[i].correct?'done':'learned'):(i===session.index?'current':'');
      return '<span class="pip '+cls+'"></span>';
    }).join('')+'</div>';
  }
  function enemyName(kind) {
    var monster=MONSTERS.find(function(monster){return monster.id===kind;});return monster?monster.name:'Shadow creature';
  }
  function battleStageHTML() {
    var gp=gameProfile(activeName),xp=gameXp(activeName),level=levelForXp(xp),next=nextLevelXp(xp),base=levelFloorXp(level);
    var weapon=ART.combatProfile(gp.equipped.weapon),armor=ART.combatProfile(gp.equipped.armor);
    var progress=Math.max(0,Math.min(100,Math.round(((xp-base)/Math.max(1,next-base))*100)));
    return '<section class="battle-stage" id="battle-stage" data-weapon="'+esc(gp.equipped.weapon)+'" data-enemy="'+esc(session.enemy)+'" data-wear="'+Math.min(3,Math.ceil(session.battleDamage/3))+'" data-attack="'+weapon.attack+'" data-element="'+weapon.element+'" data-defense="'+armor.defense+'" data-guard-element="'+armor.element+'" data-state="'+esc(session.battleState)+'" style="--contact:'+weapon.contact+'s;--swing:'+(weapon.contact*2)+'s;--flight:'+(weapon.contact-.04)+'s">'+
      '<div class="battle-hud"><span class="level-chip">Level '+level+'</span><span class="enemy-name">'+esc(enemyName(session.enemy))+'</span><span class="coin-chip">'+(session.enemy==='boss'?'Final battle':'Trail '+Math.min(12,gp.sessionsCompleted+1))+'</span></div>'+
      '<div class="battle-scene"><div class="fighter hero-fighter">'+ART.hero(activeName,gp.equipped,session.battleState,true)+'<span class="hero-guard" aria-hidden="true"></span></div><div class="projectile-lane" aria-hidden="true"><span class="hero-projectile"></span><span class="enemy-projectile"></span></div><div class="fighter enemy-fighter">'+ART.monster(session.enemy,session.battleState)+'<span class="enemy-guard" aria-hidden="true"></span><span class="hit-mark" aria-hidden="true"></span><span class="ground-ripple" aria-hidden="true"></span></div><div class="finish-burst" aria-hidden="true">'+Array.from({length:6},function(_,i){return '<i style="--dx:'+([-28,24,-14,34,-35,12][i])+'px;--dy:'+([-24,-32,28,15,8,-40][i])+'px;--spin:'+((i%2?1:-1)*110)+'deg"></i>';}).join('')+'</div></div>'+
      '<div class="shield-row" role="img" aria-label="'+session.battleDamage+' of 10 shield points cleared">'+Array.from({length:SESSION_LENGTH},function(_,i){return '<span class="shield-segment '+(i<session.battleDamage?'cleared':'')+'"></span>';}).join('')+'</div>'+
      '<div class="xp-track" aria-label="Hero level progress"><span style="width:'+progress+'%"></span></div><p class="battle-status" id="battle-status" aria-live="polite">'+esc(({mossling:'Claws ready. Your answers drive it back.',wisp:'Catch the wisp with each answer.',sentinel:'Each answer cracks its stone armor.',boss:'Each answer breaks the owl’s spell.'})[session.enemy])+'</p></section>';
  }
  function alignBattleContact(stage) {
    // Layout offsets ignore any still-running recoil. Measure at each strike so
    // rotating a phone cannot leave a cached desktop-sized lunge or projectile.
    var hero=stage.querySelector('.hero-fighter'),enemy=stage.querySelector('.enemy-fighter');
    var target=enemy.offsetLeft+enemy.offsetWidth*.30;
    var reach=Number(hero.querySelector('.hero-art').dataset.reach)||1.24;
    stage.style.setProperty('--lunge',Math.max(0,target-hero.offsetLeft-hero.offsetWidth*reach)+'px');
    var lane=stage.querySelector('.projectile-lane'),start=hero.offsetLeft+hero.offsetWidth*.84;
    lane.style.left=start+'px';lane.style.right='auto';lane.style.width=Math.max(0,target-start)+'px';
    lane.style.top=(hero.offsetTop+hero.offsetHeight*.62)+'px';
    var burst=stage.querySelector('.finish-burst');
    burst.style.left=(enemy.offsetLeft+enemy.offsetWidth*.5)+'px';burst.style.top=(enemy.offsetTop+enemy.offsetHeight*.45)+'px';
  }
  function setBattleState(kind,message,advance) {
    session.battleState=kind;
    if(advance)session.battleDamage=Math.min(SESSION_LENGTH,session.battleDamage+1);
    var stage=document.getElementById('battle-stage');
    if(!stage)return;
    alignBattleContact(stage);
    stage.setAttribute('data-state',kind);
    stage.setAttribute('data-wear',Math.min(3,Math.ceil(session.battleDamage/3)));
    var shields=stage.querySelectorAll('.shield-segment');
    shields.forEach(function(segment,index){segment.classList.toggle('cleared',index<session.battleDamage);});
    var row=stage.querySelector('.shield-row');if(row)row.setAttribute('aria-label',session.battleDamage+' of 10 shield points cleared');
    var status=document.getElementById('battle-status');if(status)status.textContent=message;
    clearTimeout(stage._battleTimer);
    if(kind!=='victory')stage._battleTimer=setTimeout(function(){if(stage.isConnected&&session){stage.setAttribute('data-state','ready');session.battleState='ready';}},Math.max(520,ART.combatProfile(gameProfile(activeName).equipped.weapon).contact*2000));
  }
  function landHit(kind) {
    var final=session.battleDamage+1>=SESSION_LENGTH;
    var message=final?'Victory! The path is clear.':({mossling:'Your strike drives the troll back.',wisp:'Your strike catches the wisp. Its glow fades.',sentinel:'Your strike cracks the golem’s armor.',boss:'Your strike breaks the owl’s shield.'})[session.enemy];
    if(kind==='recovery')message='Correction complete. '+message;
    setBattleState(final?'victory':kind,message,true);
    cancelSpeech();playWeaponSound(gameProfile(activeName).equipped.weapon);
    if(!final&&kind!=='recovery')counterTimer=setTimeout(monsterCounterattack,Math.max(450,ART.combatProfile(gameProfile(activeName).equipped.weapon).contact*2000));
  }
  function recoverAndContinue(button) {
    if(button)button.disabled=true;
    landHit('recovery');session.resolved=true;saveRound();
    activityClock.mode('play');
    advanceTimer=setTimeout(nextQuestion,480);
  }
  function renderQuestion() {
    clearTimeout(advanceTimer);
    clearTimeout(speechTimer);clearTimeout(counterTimer);
    if(!session||session.index>=SESSION_LENGTH){finishSession();return;}
    activityClock.mode('learning');document.body.dataset.screen='question';
    var q=session.questions[session.index];
    app.innerHTML='<section class="mission-head"><div><p class="eyebrow">'+esc(activeName)+'’s expedition</p><h2>'+(q.checkpoint?'Last question':'Question '+(session.index+1))+'</h2></div><span class="question-count">'+(session.index+1)+' / '+SESSION_LENGTH+'</span></section>'+battleStageHTML()+pipsHTML()+
      '<section class="question-card"><div class="question-top"><span class="q-domain" data-domain="'+q.domain+'">'+esc(DOMAIN_LABELS[q.domain])+'</span>'+
      (q.listen?'<button type="button" class="speak-button" id="listen" aria-label="Hear the word">Hear word</button>':'')+'</div>'+questionPromptHTML(q,session.enemy)+
      (q.spelling?'<p class="audio-note">Listen, then type. <button type="button" class="sentence-button" id="hear-sentence">Hear a sentence</button></p>':'')+
      '<div id="answer-area">'+(q.kind==='choice'?choicesHTML(q):inputHTML(q))+'</div><div id="feedback-area" aria-live="polite"></div></section><p class="cloud-mini" id="cloud-mini">'+cloudStatusText()+'</p>';
    resetView();
    if(q.kind==='choice')wireChoices(q);else wireInput(q);
    if(q.listen){document.getElementById('listen').addEventListener('click',function(){speakWord(q.word);});}
    if(q.spelling)document.getElementById('hear-sentence').addEventListener('click',function(){speakWord(q.word,true);});
    if(q.spelling&&session.tileQuestion===session.index)showLetterTiles(q);
    var input=document.getElementById('answer-input');if(input&&session.draftValue)input.value=session.draftValue;
    if(session.results.length>session.index){disableAnswerArea();var result=session.results[session.index];if(session.resolved){if(result.assisted)showAssistedFeedback(q);else showPositiveFeedback(q);}else showCorrection(q);}
    else if(q.spelling)speakWord(q.word);
  }
  function choicesHTML(q) { return '<div class="choice-list">'+q.choices.map(function(c){return '<button type="button" class="choice" data-answer="'+esc(c)+'">'+esc(c)+'</button>';}).join('')+'</div>'; }
  function inputHTML(q) {
    var label=q.spelling?'Type the spelling':'Type your answer';
    return '<form id="answer-form"><label class="sr-only" for="answer-input">'+label+'</label><div class="answer-row"><input class="answer-input" id="answer-input" type="text" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" enterkeyhint="done" placeholder="'+label+'"><button class="submit-button" type="submit">Check</button></div></form>'+
      (q.spelling?'<button type="button" class="tile-toggle" id="tile-toggle">Use letter tiles · practice, not mastery</button>':'');
  }
  function wireChoices(q) { app.querySelectorAll('.choice').forEach(function(button){button.addEventListener('click',function(){submitAnswer(q,button.getAttribute('data-answer'),button,false);});}); }
  function wireInput(q) {
    var form=document.getElementById('answer-form'),input=document.getElementById('answer-input');
    form.addEventListener('submit',function(e){e.preventDefault();if(!input.value.trim()){input.focus();return;}submitAnswer(q,input.value,input,false);});
    if(q.spelling)document.getElementById('tile-toggle').addEventListener('click',function(){showLetterTiles(q);});
    if(!q.spelling)setTimeout(function(){input.focus();},80);
  }
  function isAccepted(q,value){var n=normalize(value);return q.accepted.some(function(a){return normalize(a)===n;});}
  function meaningTypo(q,value){
    // Only Unit 1 headwords, only missing/doubled letters in meaning recall.
    // No fuzzy synonyms, substitutions (myth/math), or spelling credit.
    if(q.domain!=='definition'||q.kind!=='text'||q.word.word.length<6)return false;
    var n=normalize(value),word=q.word.word;
    if(!/^[a-z]+$/.test(n)||WORDS.some(function(w){return w.word===n;}))return false;
    return Array.from(word).some(function(letter,i){return n===word.slice(0,i)+word.slice(i+1)||n===word.slice(0,i)+letter+word.slice(i);});
  }
  function recordResult(q,correct,assisted) {
    var st=getStat(activeName,q.word.word,q.domain),attemptId=session.id+':'+session.index;
    if(st.lastAttemptId===attemptId)return;
    st.lastAttemptId=attemptId;st.attempts=(st.attempts||0)+1;st.lastAt=new Date().toISOString();st.correctDays=st.correctDays||[];
    if(assisted){st.assisted=(st.assisted||0)+1;st.streak=0;}
    else if(correct){st.correct=(st.correct||0)+1;st.streak=(st.streak||0)+1;if(!q.contextual)st.correctDays=unique(st.correctDays.concat(todayKey())).sort();}
    else {st.wrong=(st.wrong||0)+1;st.streak=0;}
    profile(activeName).stats[statKey(q.word.word,q.domain)]=st;saveState();
  }
  function scheduleRetry(q) {
    // Keep question 10 reserved as the final checkpoint. A retry can replace questions 3-9 only.
    var lastRetryIndex=SESSION_LENGTH-2;
    var start=session.index+2;if(start>lastRetryIndex)return;
    for(var i=start;i<=Math.min(lastRetryIndex,start+2);i++){
      var future=session.questions[i];
      if(future.word.word===q.word.word&&future.domain===q.domain)return;
    }
    var target=Math.min(start,lastRetryIndex);
    session.questions[target]=makeQuestion({word:q.word,domain:q.domain},target,true);
    session.questions[target].retry=true;
  }
  function disableAnswerArea() { app.querySelectorAll('#answer-area button,#answer-area input').forEach(function(el){el.disabled=true;}); }
  function submitAnswer(q,value,source,assisted) {
    if(session.results.length>session.index)return;
    var typo=meaningTypo(q,value),correct=isAccepted(q,value)||typo;
    recordResult(q,correct,assisted);
    session.results.push({word:q.word.word,domain:q.domain,correct:correct&&!assisted,assisted:!!assisted,typo:typo});
    if(correct&&!assisted){session.combo+=1;session.strengthened.add(q.word.word);landHit('critical');}
    else {session.combo=0;if(assisted)landHit('standard');else {cancelSpeech();monsterCounterattack();}}
    if(!correct)scheduleRetry(q);
    session.resolved=correct||assisted;saveRound();
    disableAnswerArea();
    if(q.kind==='choice'){
      app.querySelectorAll('.choice').forEach(function(button){if(isAccepted(q,button.getAttribute('data-answer')))button.classList.add('correct');});
      if(!correct&&source&&source.classList)source.classList.add('chosen');
    }
    if(correct&&!assisted){showPositiveFeedback(q);return;}
    if(assisted){showAssistedFeedback(q);return;}
    showCorrection(q);
  }
  function showPositiveFeedback(q) {
    var callout=session.combo>=3?session.combo+' in a row!':session.combo===2?'Two in a row!':'Nice work.';
    if(session.results[session.index]&&session.results[session.index].typo)callout='Right word! It’s spelled '+q.word.word+'.';
    document.getElementById('feedback-area').innerHTML='<div class="feedback good"><strong>'+callout+'</strong><span>'+esc(q.explanation)+'</span></div>';
    addNextButton();
  }
  function showAssistedFeedback(q) {
    document.getElementById('feedback-area').innerHTML='<div class="feedback learn"><strong>Built correctly.</strong><span>Type it without tiles next time to earn a mastery day.</span></div>';
    addNextButton();
  }
  function addNextButton(){
    document.getElementById('feedback-area').insertAdjacentHTML('beforeend','<button type="button" class="continue-button" id="next-question">'+(session.index===9?'Finish adventure':'Next question')+' <span aria-hidden="true">→</span></button>');
    var next=document.getElementById('next-question');next.addEventListener('click',nextQuestion);next.focus({preventScroll:true});
  }
  function showCorrection(q) {
    var area=document.getElementById('feedback-area');
    if(q.kind==='choice'){
      area.innerHTML=monsterTauntHTML(q)+'<div class="feedback learn"><strong>Good try—learn this one.</strong><span>'+esc(q.explanation)+'</span></div><button type="button" class="continue-button" id="continue">Strike and continue</button>';
      document.getElementById('continue').addEventListener('click',function(){recoverAndContinue(this);});document.getElementById('continue').focus();return;
    }
    area.innerHTML=monsterTauntHTML(q)+'<div class="feedback learn"><strong>Let’s learn this one.</strong><span>'+esc(q.explanation)+'</span></div><form id="correction-form"><label for="correction-input">'+(q.accepted.length>1?'Type any school answer, such as <strong>'+esc(q.answer)+'</strong>:':'Type <strong>'+esc(q.answer)+'</strong> once:')+'</label><div class="answer-row"><input class="answer-input" id="correction-input" type="text" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false"><button class="submit-button" type="submit">Done</button></div><p class="correction-note" id="correction-note"></p></form>';
    var form=document.getElementById('correction-form'),input=document.getElementById('correction-input');input.focus();
    form.addEventListener('submit',function(e){e.preventDefault();if(!isAccepted(q,input.value)){document.getElementById('correction-note').textContent='Use one of the school answers shown above.';input.select();return;}form.innerHTML='<p class="correction-success">That’s it. Your strike lands.</p>';landHit('recovery');session.resolved=true;saveRound();activityClock.mode('play');advanceTimer=setTimeout(nextQuestion,480);});
  }
  function nextQuestion(){if(!session)return;cancelSpeech();session.battleState='ready';session.index+=1;session.draftValue='';session.resolved=false;session.tileQuestion=null;session.tileChoiceIds=[];saveRound();renderQuestion();}

  function showLetterTiles(q) {
    var letters=shuffle(q.word.word.split('').map(function(letter,index){return {letter:letter,id:index};}));
    var ids=session.tileQuestion===session.index&&Array.isArray(session.tileChoiceIds)?session.tileChoiceIds:[];
    var chosen=ids.filter(function(id,index){return Number.isInteger(id)&&id>=0&&id<letters.length&&ids.indexOf(id)===index;}).map(function(id){return letters.find(function(letter){return letter.id===id;});});
    session.tileQuestion=session.index;
    function draw(message){
      document.getElementById('answer-area').innerHTML='<div class="tile-builder"><p class="tile-model">Read it, then build it: <strong>'+esc(q.word.word)+'</strong></p><div class="built-word" aria-label="Built word">'+(chosen.length?chosen.map(function(x){return '<button type="button" class="built-tile" data-remove="'+x.id+'">'+esc(x.letter)+'</button>';}).join(''):'<span>Build the word here</span>')+'</div><div class="tile-bank">'+letters.filter(function(x){return !chosen.some(function(c){return c.id===x.id;});}).map(function(x){return '<button type="button" class="letter-tile" data-tile="'+x.id+'">'+esc(x.letter)+'</button>';}).join('')+'</div><button type="button" class="submit-button tile-check" id="tile-check" '+(chosen.length===letters.length?'':'disabled')+'>Check tiles</button><p class="correction-note">'+esc(message||'')+'</p></div>';
      session.tileChoiceIds=chosen.map(function(x){return x.id;});saveRound();
      function focusTile(){var target=app.querySelector('.letter-tile')||document.getElementById('tile-check');if(target)target.focus({preventScroll:true});}
      app.querySelectorAll('[data-tile]').forEach(function(button){button.addEventListener('click',function(){var item=letters.find(function(x){return String(x.id)===button.getAttribute('data-tile');});chosen.push(item);draw();focusTile();});});
      app.querySelectorAll('[data-remove]').forEach(function(button){button.addEventListener('click',function(){chosen=chosen.filter(function(x){return String(x.id)!==button.getAttribute('data-remove');});draw();focusTile();});});
      document.getElementById('tile-check').addEventListener('click',function(){var answer=chosen.map(function(x){return x.letter;}).join('');if(normalize(answer)===normalize(q.word.word))submitAnswer(q,answer,null,true);else draw('Almost—tap a letter above to move it back.');});
    }
    draw('Tiles help you learn; typing earns mastery.');
  }

  function speakWord(word,sentence) {
    if(!('speechSynthesis'in window)){audioUnavailable(word);return;}
    cancelSpeech();
    try{
    warmSpeech();
    var utterance=new SpeechSynthesisUtterance(sentence?word.spellingSentence:word.word);
    utterance.lang='en-US';utterance.rate=1;
    if(localVoice)utterance.voice=localVoice;
    if(typeof window.speechSynthesis.resume==='function')window.speechSynthesis.resume();
    utterance.onerror=function(event){if(!['interrupted','canceled'].includes(event.error))audioUnavailable(word);};
    window.speechSynthesis.speak(utterance);
    }catch(_){audioUnavailable(word);}
  }
  function audioUnavailable(word){
    if(document.body.dataset.screen!=='question'&&document.body.dataset.screen!=='review')return;
    if(document.body.dataset.screen==='review'){showToast('Audio is unavailable on this device.');return;}
    if(!session||session.questions[session.index].word.word!==word.word)return;
    if(!session.questions[session.index].spelling){showToast('Audio is unavailable. You can read this question instead.');return;}
    showToast('Audio is unavailable. Try Hear word again, or use practice tiles.');
    var note=document.querySelector('.audio-note');
    if(note)note.textContent='Audio is unavailable here. Use letter tiles to practice this word, or ask someone to read it aloud.';
  }

  function sessionCoinAward(correct,newStamps,bossWon){return 2+Math.floor(Math.max(0,Math.min(10,correct))/4)+Math.max(0,newStamps)*3+(bossWon?8:0);}

  function finishSession() {
    if(!session||!activeName)return;
    clearTimeout(toastTimer);toast.hidden=true;
    activityClock.mode('play');document.body.dataset.screen='summary';
    var after=masteredCount(activeName),newStamps=Math.max(0,after-session.beforeMastered);
    var correct=session.results.filter(function(r){return r.correct;}).length;
    if(!profile(activeName).sessions.some(function(s){return s.id===session.id;}))profile(activeName).sessions.unshift({id:session.id,at:new Date().toISOString(),correct:correct,total:SESSION_LENGTH,newStamps:newStamps,timing:activityClock.snapshot()});
    profile(activeName).sessions=profile(activeName).sessions.slice(0,20);saveState();scheduleCloudPush(0);
    var gp=gameProfile(activeName),bossWon=session.enemy==='boss',oldLevel=levelForXp(gameXp(activeName)),xpAward=(bossWon?50:20)+newStamps*15,coinAward=sessionCoinAward(correct,newStamps,bossWon);
    if(!gp.rewards[session.id]){
      gp.rewards[session.id]={xp:xpAward,coins:coinAward,monster:session.enemy};gp.sessionsCompleted+=1;if(bossWon&&!gp.bossDefeatedAt)gp.bossDefeatedAt=new Date().toISOString();
    } else { xpAward=0;coinAward=0; }
    var rewardSaved=saveGameState();
    var newLevel=levelForXp(gameXp(activeName)),leveledUp=newLevel>oldLevel;
    session.rewarded=true;rewardAllowance=STORE_TIME_MS;rewardDeadline=null;shopPage=0;if(rewardSaved){try{localStorage.removeItem(ROUND_KEY+activeName);}catch(_){}}
    setChip(activeName);
    app.innerHTML='<section class="panel summary game-summary">'+
      '<div class="victory-lockup"><div class="summary-hero">'+ART.hero(activeName,gp.equipped,'victory')+(bossWon?'<span class="unit-crown" aria-hidden="true">✦</span>':'')+'</div><div><p class="eyebrow">'+(bossWon?'Adventure complete':'Expedition complete')+'</p><h2>'+(bossWon?'The castle is yours!':esc(activeName)+', the path is clear.')+'</h2><p>'+(bossWon?'You restored the realm. Keep practicing any words that still need a mastery seal.':session.strengthened.size+' '+(session.strengthened.size===1?'word got':'words got')+' stronger'+(newStamps?' and '+newStamps+' new '+(newStamps===1?'seal was':'seals were')+' restored.':'.'))+'</p></div></div>'+
      '<div class="reward-row" aria-label="Expedition rewards"><span><strong>+'+xpAward+'</strong> XP earned</span><span><strong>+'+coinAward+'</strong> study coins</span><span><strong>Level '+newLevel+'</strong>'+(leveledUp?'New level!':'Your hero')+'</span></div>'+
      ART.routeMap(Math.min(12,gp.sessionsCompleted))+
      roundReviewHTML(session.results)+
      '<div class="summary-actions"><button type="button" class="primary-button" id="summary-done">Done for now</button><button type="button" class="secondary-button" id="visit-shop">Choose gear</button></div>'+rewardBreakHTML()+'<p class="cloud-mini" id="cloud-mini">'+cloudStatusText()+'</p></section>';
    resetView('.game-summary h2');
    if(newStamps||correct>=8)celebrate();
    document.getElementById('visit-shop').addEventListener('click',function(){showShop();});
    document.getElementById('summary-done').addEventListener('click',showProfilePicker);
  }
  function rewardBreakHTML(){
    if(rewardDeadline===null)return '<p class="cloud-mini">Your 50-second store visit starts when you choose gear.</p>';
    return '<div class="reward-break" aria-live="off"><p id="reward-break-note">A short reward break. Coins and gear stay saved.</p><progress id="reward-break-progress" max="'+Math.max(1,rewardAllowance)+'" value="'+Math.max(0,rewardDeadline-performance.now())+'" aria-label="Reward break time remaining"></progress></div>';}
  function endExpiredRewardBreak(){
    if(!session||!session.rewarded)return true;
    if(rewardDeadline===null||performance.now()<rewardDeadline)return false;
    var pending=savedGearChoice(activeName);
    showProfilePicker();showToast(pending?'Choice saved for your next reward break. No coins spent.':'Adventure complete. Coins and gear are saved.');return true;
  }
  function scheduleRewardEnd(){
    clearTimeout(rewardTimer);
    // Navigation and preview share one allowance; neither can restart it.
    if(endExpiredRewardBreak())return;
    var remaining=Math.max(0,rewardDeadline-performance.now());
    var note=document.getElementById('reward-break-note');
    if(note)note.textContent=savedGearChoice(activeName)?'Back in '+Math.ceil(remaining/1000)+'s · choice saved for next time.':'Back to heroes in '+Math.ceil(remaining/1000)+'s. Coins and gear stay saved.';
    var progress=document.getElementById('reward-break-progress');if(progress)progress.value=remaining;
    rewardTimer=setTimeout(scheduleRewardEnd,Math.min(1000,remaining));
  }

  function gearItemHTML(item) {
    var gp=gameProfile(activeName),owned=gp.owned.indexOf(item.id)>=0,equipped=gp.equipped[item.type]===item.id,affordable=coinBalance(activeName)>=item.price;
    var label=equipped?'Equipped':owned?'Try on':item.price+' coins · try';
    var shortfall=!owned&&!affordable?'Need '+(item.price-coinBalance(activeName))+' more coins':'';
    return '<article class="shop-card '+(equipped?'equipped ':'')+(owned?'owned':'')+'"><div class="shop-art">'+ART.itemIcon(item)+'</div><div class="shop-copy"><span class="item-rarity">'+esc(item.rarity)+'</span><h3>'+esc(item.name)+'</h3>'+(shortfall?'<small class="coin-shortfall">'+shortfall+'</small>':'')+'</div><button type="button" class="shop-action '+(shortfall?'preview-only':'')+'" data-item="'+esc(item.id)+'" '+(equipped?'disabled':'')+' aria-label="'+esc(item.name+': '+label+(shortfall?' · '+shortfall:''))+'">'+esc(label)+'</button></article>';
  }
  function showShop(keepPosition) {
    if(endExpiredRewardBreak())return;
    cancelSpeech();
    if(rewardDeadline===null)rewardDeadline=performance.now()+rewardAllowance;
    activityClock.mode('play');document.body.dataset.screen='shop';
    var gp=gameProfile(activeName);
    setChip(activeName);
    app.innerHTML='<section class="merchant-head"><div><p class="eyebrow">Trail shop · a quick reward break</p><h2>Make it yours</h2></div><div class="wallet"><span aria-hidden="true">◆</span><strong>'+coinBalance(activeName)+'</strong><small>study coins</small></div><p class="merchant-note">Study coins only. No real money. Gear changes looks, not questions.</p></section>'+
      '<section class="merchant-preview" id="gear-preview"><div class="preview-glow"></div>'+ART.hero(activeName,gp.equipped,'ready')+'<div><span>Level '+levelForXp(gameXp(activeName))+'</span><strong>'+esc(activeName)+'</strong><small>'+esc((itemById(gp.equipped.weapon)||{name:'Starter Sword'}).name)+' · '+esc((itemById(gp.equipped.armor)||{name:'Starter Cloak'}).name)+'</small><button type="button" class="starter-button" id="starter-gear">Wear starter gear</button></div></section><button type="button" class="book-open" id="monster-book">Monster book <span>Collected '+MONSTERS.filter(function(monster){return monsterCounts(activeName)[monster.id]>0;}).length+' / 4 →</span></button>'+
      rewardBreakHTML()+'<div class="shop-grid">'+GAME_CATALOG.slice(shopPage*6,shopPage*6+6).map(gearItemHTML).join('')+'</div><nav class="shop-pages" aria-label="Shop shelves"><button type="button" id="shop-prev" '+(shopPage===0?'disabled':'')+'>← Back</button><span>Shelf '+(shopPage+1)+' / '+Math.ceil(GAME_CATALOG.length/6)+'</span><button type="button" id="shop-next" '+(shopPage>=Math.ceil(GAME_CATALOG.length/6)-1?'disabled':'')+'>More gear →</button></nav><button type="button" class="secondary-button merchant-done" id="shop-done">Done for now</button>';
    if(!keepPosition)resetView('.merchant-head h2');
    app.querySelectorAll('[data-item]').forEach(function(button){button.addEventListener('click',function(){previewGear(button.getAttribute('data-item'));});});
    document.getElementById('starter-gear').addEventListener('click',function(){if(endExpiredRewardBreak())return;saveGearChoice(null);gameProfile(activeName).equipped={weapon:'starter-sword',armor:'starter-cloak'};saveGameState();scheduleCloudPush();showShop(true);showToast('Starter gear equipped. Your collection is safe.');});
    document.getElementById('shop-done').addEventListener('click',showProfilePicker);
    document.getElementById('monster-book').addEventListener('click',showMonsterBook);
    document.getElementById('shop-prev').addEventListener('click',function(){if(endExpiredRewardBreak())return;shopPage=Math.max(0,shopPage-1);saveGearChoice(null);showShop(true);});
    document.getElementById('shop-next').addEventListener('click',function(){if(endExpiredRewardBreak())return;shopPage=Math.min(Math.ceil(GAME_CATALOG.length/6)-1,shopPage+1);saveGearChoice(null);showShop(true);});
    scheduleRewardEnd();
    var pending=savedGearChoice(activeName);
    if(pending)previewGear(pending,true);
  }
  function showMonsterBook(){
    if(rewardDeadline===null||endExpiredRewardBreak())return;
    cancelSpeech();activityClock.mode('play');document.body.dataset.screen='book';
    var counts=monsterCounts(activeName),discovered=MONSTERS.filter(function(monster){return counts[monster.id]>0;}).length;
    app.innerHTML='<section class="monster-book"><div class="book-controls"><div class="book-heading"><button type="button" class="back-button" id="book-back" aria-label="Back to store">←</button><div><p class="eyebrow">'+esc(activeName)+'’s collection · '+discovered+' / 4</p><h2>Monster book</h2></div></div>'+rewardBreakHTML()+'</div><p class="book-intro">Finish a battle to collect its monster. Corrections count, too.</p><div class="monster-grid">'+MONSTERS.map(function(monster,index){
      var count=counts[monster.id];
      return '<article class="monster-card '+(count?'collected':'undiscovered')+'" data-monster="'+monster.id+'"><div class="monster-portrait" aria-hidden="true">'+ART.monster(monster.id,'ready')+(count?'':'<span>?</span>')+'</div><span class="monster-entry">Entry '+(index+1)+'</span><h3>'+(count?esc(monster.name):'Undiscovered')+'</h3><p class="monster-story">'+(count?esc(monster.story):'Complete an encounter with this creature to reveal its story.')+'</p>'+(count?'<p class="monster-count">Battles completed: '+count+'</p><button type="button" class="roar-button" data-roar="'+monster.id+'" '+(weaponSoundsEnabled?'':'disabled')+' aria-label="Hear '+esc(monster.name)+' roar">'+(weaponSoundsEnabled?'Hear roar':'Sounds are off')+'</button>':'<p class="monster-locked">Waiting on the trail</p>')+'</article>';
    }).join('')+'</div><p class="book-footnote">Store time keeps running while you browse. New battles fill the book; earlier saved owl victories are included.</p></section>';
    document.getElementById('book-back').addEventListener('click',function(){if(endExpiredRewardBreak())return;showShop();});
    app.querySelectorAll('[data-roar]').forEach(function(button){button.addEventListener('click',function(){
      if(endExpiredRewardBreak())return;
      var kind=button.getAttribute('data-roar');if(!monsterCounts(activeName)[kind])return;
      cancelSpeech();playCreatureSound(kind);
      if(weaponSoundsEnabled&&(!weaponAudio||weaponAudio.state!=='running'))showToast('Sound is unavailable on this device.');
    });});
    resetView('.book-heading h2');scheduleRewardEnd();
  }
  function previewGear(id,resumed){
    if(endExpiredRewardBreak())return;
    var item=itemById(id);if(!item)return;
    var gp=gameProfile(activeName),equipped=Object.assign({},gp.equipped);equipped[item.type]=id;
    var owned=gp.owned.indexOf(id)>=0;
    if(gp.equipped[item.type]===id){saveGearChoice(null);return;}
    saveGearChoice(id);
    if(!resumed)playWeaponSound(id);
    var canBuy=owned||coinBalance(activeName)>=item.price;
    document.getElementById('gear-preview').innerHTML=ART.hero(activeName,equipped,'ready')+'<div><span>'+(resumed?'Your saved choice':'Try it on')+' · no coins spent</span><strong>'+esc(item.name)+'</strong><button type="button" class="preview-confirm" id="confirm-gear" '+(canBuy?'':'disabled')+'>'+(!canBuy?'Need '+(item.price-coinBalance(activeName))+' more coins':owned?'Equip this':'Use '+item.price+' coins')+'</button><button type="button" class="starter-button" id="cancel-gear">Keep my gear</button></div>';
    document.getElementById('confirm-gear').addEventListener('click',function(){buyOrEquip(selectedGear);});
    document.getElementById('cancel-gear').addEventListener('click',function(){if(endExpiredRewardBreak())return;saveGearChoice(null);showShop(true);});
    document.getElementById('gear-preview').scrollIntoView({block:'nearest',behavior:'auto'});
    document.getElementById(canBuy?'confirm-gear':'cancel-gear').focus({preventScroll:true});
    scheduleRewardEnd();
  }
  function buyOrEquip(id) {
    if(endExpiredRewardBreak())return;
    var item=itemById(id),gp=gameProfile(activeName);if(!item)return;
    if(gp.owned.indexOf(id)<0){
      if(coinBalance(activeName)<item.price)return;
      gp.purchases[id]=new Date().toISOString();gp.owned.push(id);
    }
    gp.equipped[item.type]=id;saveGameState();scheduleCloudPush(0);saveGearChoice(null);showShop(true);showToast(item.name+' equipped.');
  }
  function celebrate() {
    var colors=['#f2ad36','#087e78','#dc6a4d','#6d70c9'];
    for(var i=0;i<22;i++){var bit=document.createElement('span');bit.className='confetti';bit.style.left=(8+Math.random()*84)+'%';bit.style.background=colors[i%colors.length];bit.style.animationDelay=(Math.random()*.35)+'s';bit.style.transform='rotate('+Math.random()*180+'deg)';document.body.appendChild(bit);setTimeout(function(el){el.remove();},1800,bit);}
  }

  function showWordList() {
    activityClock.mode('learning');document.body.dataset.screen='review';
    setChip(null);
    app.innerHTML='<section class="screen-heading"><button type="button" class="back-button" id="list-back" aria-label="Back">←</button><div><p class="eyebrow">Exact school list</p><h2>The 12 words</h2></div></section><div class="word-list">'+WORDS.map(function(w){return '<article class="word-card"><div class="word-top"><div><h3>'+esc(w.word)+'</h3><span class="pos">'+esc(w.pos)+'</span></div><button type="button" class="speak-button" data-speak="'+esc(w.word)+'" aria-label="Hear '+esc(w.word)+'">🔊</button></div><p class="definition">'+esc(w.definitions.join('; '))+'</p><p><strong>Synonyms:</strong> '+esc(w.synonyms.join(', '))+'</p><p><strong>Antonyms:</strong> '+(w.antonyms.length?esc(w.antonyms.join(', ')):'Not assigned on the worksheet')+'</p><p class="example">'+esc(w.example)+'</p></article>';}).join('')+'</div>';
    document.getElementById('list-back').addEventListener('click',showProfilePicker);
    app.querySelectorAll('[data-speak]').forEach(function(button){button.addEventListener('click',function(){speakWord(WORDS.find(function(w){return w.word===button.getAttribute('data-speak');}));});});
  }

  chip.setAttribute('aria-label','Pause and return to heroes');
  chip.addEventListener('click',pauseSession);
  ['pointerdown','keydown','input','scroll'].forEach(function(event){document.addEventListener(event,function(){activityClock.activity();},{passive:true});});
  document.addEventListener('input',saveRound);
  window.addEventListener('pagehide',function(){saveRound();saveTiming();});
  window.addEventListener('online',function(){scheduleCloudPush(0);});
  document.addEventListener('visibilitychange',function(){if(document.hidden){clearTimeout(counterTimer);silenceWeapon();silenceCreature();}activityClock.visibility(!document.hidden);saveRound();saveTiming();if(!document.hidden)cloudPull().then(function(){if(!activeName&&document.body.dataset.screen==='home')showProfilePicker(true);});});

  adoptTokenFromHash();
  showProfilePicker();
  cloudPull().then(function(){if(!activeName&&document.body.dataset.screen==='home')showProfilePicker(true);});
})();

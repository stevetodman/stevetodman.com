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
  var QUALITY = window.WordExpeditionQuality;
  var ART = window.WordExpeditionArt;
  var GAME_CATALOG = ART.catalog;
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
  var speechTimer=null;
  var rewardTimer=null;
  var rewardDeadline=0;
  var rewardAllowance=0;
  var selectedGear=null;
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
  function pauseSession(){saveRound();if('speechSynthesis'in window)window.speechSynthesis.cancel();showProfilePicker();}

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
      if(id.length<100&&!['__proto__','constructor','prototype'].includes(id)&&reward&&typeof reward==='object')clean.rewards[id]={xp:Math.max(0,Math.min(limit,Math.floor(Number(reward.xp)||0))),coins:Math.max(0,Math.min(limit,Math.floor(Number(reward.coins)||0)))};
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
  function gameLevels(name) { return WORDS.map(function(word){return wordLevel(name,word);}); }

  function gameCloudProfile(name) {
    var gp=gameProfile(name);
    return {version:1,rewards:gp.rewards,sessionsCompleted:gp.sessionsCompleted,bossDefeatedAt:gp.bossDefeatedAt,purchases:gp.purchases,equipped:gp.equipped};
  }
  function applyCloudGame(name,remote) {
    if(!remote||typeof remote!=='object')return;
    var local=gameProfile(name),safeRemote=sanitizeGameProfile(remote),rewards=Object.assign({},local.rewards);
    Object.keys(safeRemote.rewards).forEach(function(id){var a=rewards[id]||{xp:0,coins:0},b=safeRemote.rewards[id];rewards[id]={xp:Math.max(a.xp,b.xp),coins:Math.max(a.coins,b.coins)};});
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

  function showProfilePicker(preserveClock) {
    saveRound();saveTiming();clearTimeout(advanceTimer);clearTimeout(speechTimer);clearTimeout(rewardTimer);session=null;activeName=null;setChip(null);if(preserveClock!==true)activityClock=QUALITY.createClock(function(){return performance.now();});activityClock.mode('play');document.body.dataset.screen='home';
    app.innerHTML='<section class="picker-intro"><div class="intro-copy"><p class="eyebrow">'+esc(new Date()<TEST_DATES.vocabulary?'Tonight: mostly meanings':new Date()<TEST_DATES.spelling?'Tonight: mostly spelling':'Keep your words strong')+'</p><h2>Choose your hero</h2><p>Learn a word. Land a hit. Find your way to the castle.</p></div><div class="intro-emblem" aria-hidden="true">✦</div></section>'+
      '<div class="profile-grid">'+LEARNERS.map(function(l){return '<button type="button" class="learner-card" data-profile="'+esc(l.name)+'">'+
        '<span class="profile-hero">'+ART.hero(l.name,gameProfile(l.name).equipped,'ready')+'</span><strong>'+esc(l.name)+'</strong><span class="stamp-count">'+masteredCount(l.name)+' of 12 words mastered</span><span class="start-label">'+(savedRound(l.name)?'Resume adventure':'Start adventure')+' <span aria-hidden="true">→</span></span><span class="session-promise">10 questions · about 4 minutes</span></button>';}).join('')+'</div>'+
      '<div class="picker-links"><button type="button" class="text-button" id="word-list">Review the 12 words</button>'+
      '<span class="cloud-button" id="cloud-status">'+cloudStatusText()+'</span><button type="button" class="text-button" id="cloud-button">Device settings</button></div>'+learningSummaryHTML();
    app.querySelectorAll('[data-profile]').forEach(function(button){button.addEventListener('click',function(){startSession(button.getAttribute('data-profile'));});});
    document.getElementById('word-list').addEventListener('click',showWordList);
    document.getElementById('cloud-button').addEventListener('click',showCloudScreen);
  }
  function learningSummaryHTML(){
    return '<details class="learning-notes"><summary>Learning progress</summary>'+LEARNERS.map(function(learner){
      var name=learner.name,last=profile(name).sessions[0];
      var weak=WORDS.filter(function(word){return wordLevel(name,word)!=='mastered';}).slice(0,3).map(function(word){return word.word;});
      var vocab=WORDS.filter(function(word){return assignedDomains(word).filter(function(domain){return domain!=='spelling';}).every(function(domain){return (getStat(name,word.word,domain).correctDays||[]).length>0;});}).length;
      var spelling=WORDS.filter(function(word){return (getStat(name,word.word,'spelling').correctDays||[]).length>=2;}).length;
      return '<section><h3>'+esc(name)+'</h3><p>Meanings practiced: '+vocab+'/12 · Spelling across two days: '+spelling+'/12</p><p>'+(weak.length?'Keep practicing: '+esc(weak.join(', ')):'All 12 words mastered.')+'</p>'+(last?'<p>Last adventure: '+last.correct+'/10 on the first try.</p>':'')+(last&&last.timing?'<p class="timing-note">Recorded active time: '+formatDuration(last.timing.learning)+' learning · '+formatDuration(last.timing.play)+' menus and rewards. Interaction-based estimate; idle and background time excluded.</p>':'')+'</section>';
    }).join('')+'<p class="mastery-explainer">A mastery seal means correct meanings, two spelling days, and practice across three different days. Letter tiles help learning but do not earn a spelling day.</p></details>';
  }
  function formatDuration(ms){var seconds=Math.max(0,Math.round((Number(ms)||0)/1000));return Math.floor(seconds/60)+'m '+seconds%60+'s';}

  function cloudStatusText() {
    if(Object.keys(localSaveErrors).length)return 'Device save unavailable';
    if (!CLOUD_ENABLED) return 'Saved on this device';
    if (cloudStatus==='saving'||cloudStatus==='loading') return '☁ Saving…';
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
  function newCloudToken() {
    var bytes=new Uint8Array(24); crypto.getRandomValues(bytes); var out='';
    for (var i=0;i<bytes.length;i++) out+=('0'+bytes[i].toString(16)).slice(-2);
    return out;
  }
  function cloudToken(create) {
    var token=null;
    try {
      token=localStorage.getItem(CLOUD_TOKEN_KEY) || localStorage.getItem(LEGACY_CLOUD_TOKEN_KEY);
      if (token && !localStorage.getItem(CLOUD_TOKEN_KEY)) localStorage.setItem(CLOUD_TOKEN_KEY,token);
      if (!token && create) { token=newCloudToken();localStorage.setItem(CLOUD_TOKEN_KEY,token); }
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
    return fetch(CLOUD_URL,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)}).then(function(res){if(!res.ok)throw new Error('cloud '+res.status);return res.json();});
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
    var token=cloudToken(true); if(!token)return Promise.resolve();
    if(cloudPushInFlight){cloudPushQueued=true;return Promise.resolve();}
    cloudPushInFlight=true;updateCloudStatus('saving');
    return cloudRequest({token:token,action:'push',data:cloudPayload()}).then(function(res){applyCloudData(res.data);updateCloudStatus('saved');}).catch(function(){updateCloudStatus('offline');}).then(function(){cloudPushInFlight=false;if(cloudPushQueued){cloudPushQueued=false;scheduleCloudPush(0);}});
  }
  function scheduleCloudPush(delay) {
    if(!CLOUD_ENABLED)return;
    clearTimeout(cloudPushTimer);cloudPushTimer=setTimeout(function(){cloudPushTimer=null;cloudPush();},delay===undefined?CLOUD_PUSH_DELAY:delay);
  }
  function cloudPull() {
    if(!CLOUD_ENABLED)return Promise.resolve(false);
    var token=cloudToken(true);updateCloudStatus('loading');
    return cloudRequest({token:token,action:'pull'}).then(function(res){if(res.found)applyCloudData(res.data);updateCloudStatus('saved');return !!res.found;}).catch(function(){updateCloudStatus('offline');return false;});
  }
  function cloudShareLink() { return location.origin+'/study/#k='+encodeURIComponent(cloudToken(true)); }

  function showCloudScreen() {
    activityClock.mode('play');document.body.dataset.screen='settings';
    setChip(null);
    var enabled=CLOUD_ENABLED;
    app.innerHTML='<section class="panel cloud-panel"><span class="panel-icon" aria-hidden="true">☁</span><h2>Cloud save</h2>'+
      '<p>'+(enabled?'Both learner profiles save automatically after every answer. Use the private link once on another device to connect the same progress.':'Cloud sync turns on automatically on stevetodman.com. This preview is saving only on this device.')+'</p>'+
      (enabled?'<button type="button" class="primary-button" id="share-cloud">Share private device link</button><p class="privacy-note">Treat this link like a password: anyone with it can read and change this family’s study progress. The key is removed from the address after a new device connects.</p>':'')+
      '<button type="button" class="text-button" id="cloud-done">Done</button></section>';
    if(enabled)document.getElementById('share-cloud').addEventListener('click',function(){
      var link=cloudShareLink();
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
    q.word=w;q.domain=domain;q.retry=!!forceText;q.checkpoint=index===SESSION_LENGTH-1;return q;
  }

  function startSession(name) {
    activeName=name;setChip(name);warmSpeech();
    var resumed=savedRound(name);
    var entryTiming=activityClock.snapshot();
    if(resumed){session=resumed;var prior=session.timing||{};prior.play=(prior.play||0)+entryTiming.play;activityClock=QUALITY.createClock(function(){return performance.now();},prior);activityClock.mode('learning');renderQuestion();return;}
    activityClock=QUALITY.createClock(function(){return performance.now();},entryTiming);activityClock.mode('learning');
    var completed=gameProfile(name).sessionsCompleted;
    var readyForBoss=masteredCount(name)>=12||completed>=11||(new Date()>=TEST_DATES.spelling&&masteredCount(name)>=10);
    var kinds=['mossling','wisp','sentinel'];
    session={id:new Date().toISOString()+'-'+Math.random().toString(36).slice(2,8),index:0,questions:buildPlan(name),results:[],combo:0,beforeMastered:masteredCount(name),strengthened:new Set(),battleDamage:0,battleState:'ready',enemy:readyForBoss&&!gameProfile(name).bossDefeatedAt?'boss':kinds[completed%kinds.length],rewarded:false};
    saveRound();renderQuestion();
  }
  function warmSpeech() { if('speechSynthesis'in window)window.speechSynthesis.getVoices(); }
  function pipsHTML() {
    return '<div class="pips" aria-label="Question '+(session.index+1)+' of '+SESSION_LENGTH+'">'+Array.from({length:SESSION_LENGTH},function(_,i){
      var cls=i<session.results.length?(session.results[i].correct?'done':'learned'):(i===session.index?'current':'');
      return '<span class="pip '+cls+'"></span>';
    }).join('')+'</div>';
  }
  function enemyName(kind) {
    return ({mossling:'Bramble Imp',wisp:'Gloom Wisp',sentinel:'Rune Sentinel',boss:'The Word Keeper'})[kind]||'Shadow creature';
  }
  function battleStageHTML() {
    var gp=gameProfile(activeName),xp=gameXp(activeName),level=levelForXp(xp),next=nextLevelXp(xp),base=levelFloorXp(level);
    var progress=Math.max(0,Math.min(100,Math.round(((xp-base)/Math.max(1,next-base))*100)));
    return '<section class="battle-stage" id="battle-stage" data-weapon="'+esc(gp.equipped.weapon)+'" data-state="'+esc(session.battleState)+'">'+
      '<div class="battle-hud"><span class="level-chip">Level '+level+'</span><span class="enemy-name">'+esc(enemyName(session.enemy))+'</span><span class="coin-chip">'+(session.enemy==='boss'?'Final battle':'Trail '+Math.min(12,gp.sessionsCompleted+1))+'</span></div>'+
      '<div class="battle-scene"><div class="fighter hero-fighter">'+ART.hero(activeName,gp.equipped,session.battleState)+'</div><div class="impact-burst" aria-hidden="true">✦</div><div class="fighter enemy-fighter">'+ART.monster(session.enemy,session.battleState)+'</div></div>'+
      '<div class="shield-row" role="img" aria-label="'+session.battleDamage+' of 10 shield points cleared">'+Array.from({length:SESSION_LENGTH},function(_,i){return '<span class="shield-segment '+(i<session.battleDamage?'cleared':'')+'"></span>';}).join('')+'</div>'+
      '<div class="xp-track" aria-label="Hero level progress"><span style="width:'+progress+'%"></span></div><p class="battle-status sr-only" id="battle-status" aria-live="assertive"></p></section>';
  }
  function setBattleState(kind,message,advance) {
    session.battleState=kind;
    if(advance)session.battleDamage=Math.min(SESSION_LENGTH,session.battleDamage+1);
    var stage=document.getElementById('battle-stage');
    if(!stage)return;
    stage.setAttribute('data-state',kind);
    var shields=stage.querySelectorAll('.shield-segment');
    shields.forEach(function(segment,index){segment.classList.toggle('cleared',index<session.battleDamage);});
    var row=stage.querySelector('.shield-row');if(row)row.setAttribute('aria-label',session.battleDamage+' of 10 shield points cleared');
    var status=document.getElementById('battle-status');if(status)status.textContent=message;
    clearTimeout(stage._battleTimer);
    if(kind!=='victory')stage._battleTimer=setTimeout(function(){if(stage.isConnected&&session){stage.setAttribute('data-state','ready');session.battleState='ready';}},520);
  }
  function landHit(kind) {
    var final=session.battleDamage+1>=SESSION_LENGTH;
    var message=kind==='critical'?'Critical hit. Shield point cleared.':kind==='recovery'?'Correction complete. Shield point cleared.':'Shield point cleared.';
    setBattleState(final?'victory':kind,message,true);
  }
  function recoverAndContinue(button) {
    if(button)button.disabled=true;
    landHit('recovery');session.resolved=true;saveRound();
    activityClock.mode('play');
    advanceTimer=setTimeout(nextQuestion,480);
  }
  function renderQuestion() {
    clearTimeout(advanceTimer);
    clearTimeout(speechTimer);
    if(!session||session.index>=SESSION_LENGTH){finishSession();return;}
    activityClock.mode('learning');document.body.dataset.screen='question';
    var q=session.questions[session.index];
    app.innerHTML='<section class="mission-head"><div><p class="eyebrow">'+esc(activeName)+'’s expedition</p><h2>'+(q.checkpoint?'Last question':'Question '+(session.index+1))+'</h2></div><span class="question-count">'+(session.index+1)+' / '+SESSION_LENGTH+'</span></section>'+battleStageHTML()+pipsHTML()+
      '<section class="question-card"><div class="question-top"><span class="q-domain" data-domain="'+q.domain+'">'+esc(DOMAIN_LABELS[q.domain])+'</span>'+
      (q.listen?'<button type="button" class="speak-button" id="listen" aria-label="Hear the word">Hear word</button>':'')+'</div><p class="q-prompt">'+q.prompt+'</p>'+
      (q.spelling?'<p class="audio-note">Listen, then type. <button type="button" class="sentence-button" id="hear-sentence">Hear a sentence</button></p>':'')+
      '<div id="answer-area">'+(q.kind==='choice'?choicesHTML(q):inputHTML(q))+'</div><div id="feedback-area" aria-live="polite"></div></section><p class="cloud-mini" id="cloud-mini">'+cloudStatusText()+'</p>';
    resetView();
    if(q.kind==='choice')wireChoices(q);else wireInput(q);
    if(q.listen){document.getElementById('listen').addEventListener('click',function(){speakWord(q.word);});speechTimer=setTimeout(function(){if(session&&session.questions[session.index]===q)speakWord(q.word);},220);}
    if(q.spelling)document.getElementById('hear-sentence').addEventListener('click',function(){speakWord(q.word,true);});
    if(q.spelling&&session.tileQuestion===session.index)showLetterTiles(q);
    var input=document.getElementById('answer-input');if(input&&session.draftValue)input.value=session.draftValue;
    if(session.results.length>session.index){disableAnswerArea();var result=session.results[session.index];if(session.resolved){if(result.assisted)showAssistedFeedback(q);else showPositiveFeedback(q);}else showCorrection(q);}
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
  function recordResult(q,correct,assisted) {
    var st=getStat(activeName,q.word.word,q.domain),attemptId=session.id+':'+session.index;
    if(st.lastAttemptId===attemptId)return;
    st.lastAttemptId=attemptId;st.attempts=(st.attempts||0)+1;st.lastAt=new Date().toISOString();st.correctDays=st.correctDays||[];
    if(assisted){st.assisted=(st.assisted||0)+1;st.streak=0;}
    else if(correct){st.correct=(st.correct||0)+1;st.streak=(st.streak||0)+1;st.correctDays=unique(st.correctDays.concat(todayKey())).sort();}
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
    var correct=isAccepted(q,value);
    recordResult(q,correct,assisted);
    session.results.push({word:q.word.word,domain:q.domain,correct:correct&&!assisted,assisted:!!assisted});
    if(correct&&!assisted){session.combo+=1;session.strengthened.add(q.word.word);landHit('critical');}
    else {session.combo=0;if(assisted)landHit('standard');else setBattleState('blocked','The creature blocked. Learn the answer, then strike again.',false);}
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
      area.innerHTML='<div class="feedback learn"><strong>Good try—learn this one.</strong><span>'+esc(q.explanation)+'</span></div><button type="button" class="continue-button" id="continue">Strike and continue</button>';
      document.getElementById('continue').addEventListener('click',function(){recoverAndContinue(this);});document.getElementById('continue').focus();return;
    }
    area.innerHTML='<div class="feedback learn"><strong>Let’s learn this one.</strong><span>'+esc(q.explanation)+'</span></div><form id="correction-form"><label for="correction-input">'+(q.accepted.length>1?'Type any school answer, such as <strong>'+esc(q.answer)+'</strong>:':'Type <strong>'+esc(q.answer)+'</strong> once:')+'</label><div class="answer-row"><input class="answer-input" id="correction-input" type="text" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false"><button class="submit-button" type="submit">Done</button></div><p class="correction-note" id="correction-note"></p></form>';
    var form=document.getElementById('correction-form'),input=document.getElementById('correction-input');input.focus();
    form.addEventListener('submit',function(e){e.preventDefault();if(!isAccepted(q,input.value)){document.getElementById('correction-note').textContent='Use one of the school answers shown above.';input.select();return;}form.innerHTML='<p class="correction-success">That’s it. Your strike lands.</p>';landHit('recovery');session.resolved=true;saveRound();activityClock.mode('play');advanceTimer=setTimeout(nextQuestion,480);});
  }
  function nextQuestion(){if(!session)return;if('speechSynthesis'in window)window.speechSynthesis.cancel();session.index+=1;session.draftValue='';session.resolved=false;session.tileQuestion=null;session.tileChoiceIds=[];saveRound();renderQuestion();}

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
    window.speechSynthesis.cancel();
    var first=new SpeechSynthesisUtterance(word.word+'.');var second=new SpeechSynthesisUtterance(word.spellingSentence);
    first.lang=second.lang='en-US';first.rate=.78;second.rate=.84;
    var utterance=sentence?second:first;
    utterance.onerror=function(event){if(!['interrupted','canceled'].includes(event.error))audioUnavailable(word);};
    window.speechSynthesis.speak(utterance);
  }
  function audioUnavailable(word){
    if(document.body.dataset.screen!=='question'&&document.body.dataset.screen!=='review')return;
    if(document.body.dataset.screen==='review'){showToast('Audio is unavailable on this device.');return;}
    if(!session||session.questions[session.index].word.word!==word.word)return;
    showToast('Audio is unavailable. Try Hear word again, or use practice tiles.');
    var note=document.querySelector('.audio-note');
    if(note)note.textContent='Audio is unavailable here. Use letter tiles to practice this word, or ask someone to read it aloud.';
  }

  function finishSession() {
    if(!session||!activeName)return;
    clearTimeout(toastTimer);toast.hidden=true;
    activityClock.mode('play');document.body.dataset.screen='summary';
    var after=masteredCount(activeName),newStamps=Math.max(0,after-session.beforeMastered);
    var correct=session.results.filter(function(r){return r.correct;}).length;
    if(!profile(activeName).sessions.some(function(s){return s.id===session.id;}))profile(activeName).sessions.unshift({id:session.id,at:new Date().toISOString(),correct:correct,total:SESSION_LENGTH,newStamps:newStamps,timing:activityClock.snapshot()});
    profile(activeName).sessions=profile(activeName).sessions.slice(0,20);saveState();scheduleCloudPush(0);
    var gp=gameProfile(activeName),bossWon=session.enemy==='boss',oldLevel=levelForXp(gameXp(activeName)),xpAward=(bossWon?50:20)+newStamps*15,coinAward=(bossWon?20:8)+newStamps*5;
    if(!gp.rewards[session.id]){
      gp.rewards[session.id]={xp:xpAward,coins:coinAward};gp.sessionsCompleted+=1;if(bossWon&&!gp.bossDefeatedAt)gp.bossDefeatedAt=new Date().toISOString();
    } else { xpAward=0;coinAward=0; }
    var rewardSaved=saveGameState();
    var newLevel=levelForXp(gameXp(activeName)),leveledUp=newLevel>oldLevel;
    session.rewarded=true;rewardAllowance=Math.min(25000,QUALITY.playBudget(activityClock.snapshot()));rewardDeadline=performance.now()+rewardAllowance;if(rewardSaved){try{localStorage.removeItem(ROUND_KEY+activeName);}catch(_){}}
    setChip(activeName);
    app.innerHTML='<section class="panel summary game-summary">'+
      '<div class="victory-lockup"><div class="summary-hero">'+ART.hero(activeName,gp.equipped,'victory')+(bossWon?'<span class="unit-crown" aria-hidden="true">✦</span>':'')+'</div><div><p class="eyebrow">'+(bossWon?'Adventure complete':'Expedition complete')+'</p><h2>'+(bossWon?'The castle is yours!':esc(activeName)+', the path is clear.')+'</h2><p>'+(bossWon?'You restored the realm. Keep practicing any words that still need a mastery seal.':session.strengthened.size+' '+(session.strengthened.size===1?'word got':'words got')+' stronger'+(newStamps?' and '+newStamps+' new '+(newStamps===1?'seal was':'seals were')+' restored.':'.'))+'</p></div></div>'+
      '<div class="reward-row" aria-label="Expedition rewards"><span><strong>+'+xpAward+'</strong> XP earned</span><span><strong>+'+coinAward+'</strong> study coins</span><span><strong>Level '+newLevel+'</strong>'+(leveledUp?'New level!':'Your hero')+'</span></div>'+
      ART.routeMap(Math.min(12,gp.sessionsCompleted),gameLevels(activeName))+
      '<div class="summary-actions"><button type="button" class="primary-button" id="summary-done">Done for now</button><button type="button" class="secondary-button" id="visit-shop">Choose gear</button></div>'+rewardBreakHTML()+'<p class="cloud-mini" id="cloud-mini">'+cloudStatusText()+'</p></section>';
    resetView('.game-summary h2');
    if(newStamps||correct>=8)celebrate();
    document.getElementById('visit-shop').addEventListener('click',function(){selectedGear=null;showShop();});
    document.getElementById('summary-done').addEventListener('click',showProfilePicker);
    scheduleRewardEnd();
  }
  function rewardBreakHTML(){return '<div class="reward-break" aria-live="off"><p id="reward-break-note">A short reward break. Coins and gear stay saved.</p><progress id="reward-break-progress" max="'+Math.max(1,rewardAllowance)+'" value="'+Math.max(0,rewardDeadline-performance.now())+'" aria-label="Reward break time remaining"></progress></div>';}
  function endExpiredRewardBreak(){
    if(!session||!session.rewarded)return true;
    if(performance.now()<rewardDeadline)return false;
    showProfilePicker();showToast('Adventure complete. Coins and gear are saved.');return true;
  }
  function scheduleRewardEnd(){
    clearTimeout(rewardTimer);
    // Navigation and preview share one allowance; neither can restart it.
    if(endExpiredRewardBreak())return;
    var remaining=Math.max(0,rewardDeadline-performance.now());
    var link=document.getElementById('visit-shop');
    if(link&&remaining<4000){link.disabled=true;link.textContent='Gear saved for next time';}
    var note=document.getElementById('reward-break-note');
    if(note)note.textContent='Back to heroes in '+Math.ceil(remaining/1000)+'s. Coins and gear stay saved.';
    var progress=document.getElementById('reward-break-progress');if(progress)progress.value=remaining;
    rewardTimer=setTimeout(scheduleRewardEnd,Math.min(1000,remaining));
  }

  function gearItemHTML(item) {
    var gp=gameProfile(activeName),owned=gp.owned.indexOf(item.id)>=0,equipped=gp.equipped[item.type]===item.id,affordable=coinBalance(activeName)>=item.price;
    var label=equipped?'Equipped':owned?'Try on':affordable?item.price+' coins':'Need '+(item.price-coinBalance(activeName))+' more';
    return '<article class="shop-card '+(equipped?'equipped ':'')+(owned?'owned':'')+'"><div class="shop-art">'+ART.itemIcon(item)+'</div><div class="shop-copy"><span class="item-rarity">'+esc(item.rarity)+'</span><h3>'+esc(item.name)+'</h3></div><button type="button" class="shop-action" data-item="'+esc(item.id)+'" '+(equipped||(!owned&&!affordable)?'disabled':'')+' aria-label="'+esc(item.name+': '+label)+'">'+esc(label)+'</button></article>';
  }
  function showShop(keepPosition) {
    if(endExpiredRewardBreak())return;
    activityClock.mode('play');document.body.dataset.screen='shop';
    var gp=gameProfile(activeName);
    setChip(activeName);
    app.innerHTML='<section class="merchant-head"><div><p class="eyebrow">Trail shop · a quick reward break</p><h2>Make it yours</h2><p>Study coins only. No real money. Gear changes the adventure’s look, never the questions.</p></div><div class="wallet"><span aria-hidden="true">◆</span><strong>'+coinBalance(activeName)+'</strong><small>study coins</small></div></section>'+
      '<section class="merchant-preview" id="gear-preview"><div class="preview-glow"></div>'+ART.hero(activeName,gp.equipped,'ready')+'<div><span>Level '+levelForXp(gameXp(activeName))+'</span><strong>'+esc(activeName)+'</strong><small>'+esc((itemById(gp.equipped.weapon)||{name:'Starter Sword'}).name)+' · '+esc((itemById(gp.equipped.armor)||{name:'Starter Cloak'}).name)+'</small><button type="button" class="starter-button" id="starter-gear">Wear starter gear</button></div></section>'+
      rewardBreakHTML()+'<div class="shop-grid">'+GAME_CATALOG.map(gearItemHTML).join('')+'</div><button type="button" class="secondary-button merchant-done" id="shop-done">Done for now</button>';
    if(!keepPosition)resetView('.merchant-head h2');
    app.querySelectorAll('[data-item]').forEach(function(button){button.addEventListener('click',function(){previewGear(button.getAttribute('data-item'));});});
    document.getElementById('starter-gear').addEventListener('click',function(){if(endExpiredRewardBreak())return;gameProfile(activeName).equipped={weapon:'starter-sword',armor:'starter-cloak'};saveGameState();scheduleCloudPush();showShop(true);showToast('Starter gear equipped. Your collection is safe.');});
    document.getElementById('shop-done').addEventListener('click',showProfilePicker);
    scheduleRewardEnd();
  }
  function previewGear(id){
    if(endExpiredRewardBreak())return;
    var item=itemById(id);if(!item)return;
    var gp=gameProfile(activeName),equipped=Object.assign({},gp.equipped);equipped[item.type]=id;selectedGear=id;
    var owned=gp.owned.indexOf(id)>=0;
    if(!owned&&coinBalance(activeName)<item.price)return;
    document.getElementById('gear-preview').innerHTML=ART.hero(activeName,equipped,'ready')+'<div><span>Try it on · no coins spent</span><strong>'+esc(item.name)+'</strong><button type="button" class="preview-confirm" id="confirm-gear">'+(owned?'Equip this':'Use '+item.price+' coins')+'</button><button type="button" class="starter-button" id="cancel-gear">Keep my gear</button></div>';
    document.getElementById('confirm-gear').addEventListener('click',function(){buyOrEquip(selectedGear);});
    document.getElementById('cancel-gear').addEventListener('click',function(){selectedGear=null;showShop(true);});
    document.getElementById('gear-preview').scrollIntoView({block:'nearest',behavior:'auto'});
    document.getElementById('confirm-gear').focus({preventScroll:true});
  }
  function buyOrEquip(id) {
    if(endExpiredRewardBreak())return;
    var item=itemById(id),gp=gameProfile(activeName);if(!item)return;
    if(gp.owned.indexOf(id)<0){
      if(coinBalance(activeName)<item.price)return;
      gp.purchases[id]=new Date().toISOString();gp.owned.push(id);
    }
    gp.equipped[item.type]=id;saveGameState();scheduleCloudPush(0);selectedGear=null;showShop(true);showToast(item.name+' equipped.');
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
  document.addEventListener('visibilitychange',function(){activityClock.visibility(!document.hidden);saveRound();saveTiming();if(!document.hidden)cloudPull().then(function(){if(!activeName&&document.body.dataset.screen==='home')showProfilePicker(true);});});

  adoptTokenFromHash();
  showProfilePicker();
  cloudPull().then(function(){if(!activeName&&document.body.dataset.screen==='home')showProfilePicker(true);});
})();

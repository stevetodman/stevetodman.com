(function () {
  'use strict';

  var STORAGE_KEY = 'studyhub-word-expedition-unit1-v3';
  var LEGACY_KEY = 'studyhub-word-mission-unit1-v2';
  var CLOUD_URL = 'https://lpjvsjezjjasgpkvjjlq.supabase.co/functions/v1/studyhub-save';
  var CLOUD_TOKEN_KEY = 'studyhubCloudToken';
  var LEGACY_CLOUD_TOKEN_KEY = 'usStatesCloudToken';
  var CLOUD_ENABLED = location.protocol === 'https:' && /(^|\.)stevetodman\.com$/i.test(location.hostname);
  var CLOUD_PUSH_DELAY = 1200;
  var SESSION_LENGTH = 10;
  var LEARNERS = [
    { name:'Luke', avatar:'🚀' },
    { name:'Samantha', avatar:'⭐' }
  ];
  var CLOUD_PROFILE_KEYS = {
    Luke:'word-mission-unit1-luke',
    Samantha:'word-mission-unit1-samantha'
  };
  var TEST_DATES = {
    vocabulary:new Date('2026-09-01T08:00:00'),
    spelling:new Date('2026-09-02T08:00:00')
  };
  var DOMAINS = ['definition','synonym','antonym','spelling'];
  var DOMAIN_LABELS = { definition:'Definition', synonym:'Synonym', antonym:'Antonym', spelling:'Spelling' };

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
  var activeName = null;
  var session = null;
  var toastTimer = null;
  var advanceTimer = null;
  var cloudPushTimer = null;
  var cloudPushInFlight = false;
  var cloudPushQueued = false;
  var cloudStatus = CLOUD_ENABLED ? 'loading' : 'local';

  function blankProfile() { return { stats:{}, sessions:[] }; }
  function defaultState() { return { version:3, learners:{ Luke:blankProfile(), Samantha:blankProfile() } }; }

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
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) { showToast('Progress could not be saved on this device.'); }
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
  function todayKey() { return new Date().toISOString().slice(0,10); }
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

  function setChip(name) {
    if (!name) { chip.hidden=true; return; }
    var learner=LEARNERS.find(function(l){return l.name===name;});
    chip.hidden=false;
    chip.innerHTML='<span aria-hidden="true">'+learner.avatar+'</span><span>'+esc(name)+'</span>';
  }

  function trailHTML(name,compact) {
    return '<div class="trail '+(compact?'compact':'')+'" role="img" aria-label="'+masteredCount(name)+' of 12 words mastered">'+WORDS.map(function(w,i){
      var level=wordLevel(name,w);
      return '<span class="trail-stop '+level+'" title="'+esc(w.word)+': '+level+'"><span class="stop-number">'+(level==='mastered'?'⚑':(i+1))+'</span></span>';
    }).join('')+'</div>';
  }

  function showProfilePicker() {
    clearTimeout(advanceTimer); session=null;activeName=null;setChip(null);
    app.innerHTML='<section class="picker-intro"><p class="eyebrow">Vocabulary Tuesday · Spelling Wednesday</p><h2>Who is practicing?</h2><p>Tap your name. Your 10-question expedition starts right away.</p></section>'+
      '<div class="profile-grid">'+LEARNERS.map(function(l){return '<button type="button" class="learner-card" data-profile="'+esc(l.name)+'">'+
        '<span class="big-avatar" aria-hidden="true">'+l.avatar+'</span><strong>'+esc(l.name)+'</strong><span class="stamp-count">'+masteredCount(l.name)+' of 12 stamps</span>'+trailHTML(l.name,true)+'</button>';}).join('')+'</div>'+
      '<div class="picker-links"><button type="button" class="text-button" id="word-list">Review the 12 words</button>'+
      '<button type="button" class="cloud-button" id="cloud-button">'+cloudStatusText()+'</button></div>';
    app.querySelectorAll('[data-profile]').forEach(function(button){button.addEventListener('click',function(){startSession(button.getAttribute('data-profile'));});});
    document.getElementById('word-list').addEventListener('click',showWordList);
    document.getElementById('cloud-button').addEventListener('click',showCloudScreen);
  }

  function cloudStatusText() {
    if (!CLOUD_ENABLED) return 'Saved on this device';
    if (cloudStatus==='saving'||cloudStatus==='loading') return '☁ Saving…';
    if (cloudStatus==='offline') return 'Offline · saved on this device';
    return '☁ Saved';
  }
  function updateCloudStatus(status) {
    cloudStatus=status;
    var el=document.getElementById('cloud-button');
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
  function adoptTokenFromHash() {
    var match=/(?:^|[#&])k=([^&]+)/.exec(location.hash||'');
    if (!match) return false;
    var token=decodeURIComponent(match[1]).trim();
    if (token.length<20||token.length>200) return false;
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
      out[CLOUD_PROFILE_KEYS[learner.name]]={stateStats:remoteStats,masteredOrder:[],avatar:learner.avatar};
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
    });
    saveState(false);
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
    setChip(null);
    var enabled=CLOUD_ENABLED;
    app.innerHTML='<section class="panel cloud-panel"><span class="panel-icon" aria-hidden="true">☁</span><h2>Cloud save</h2>'+
      '<p>'+(enabled?'Luke and Samantha save automatically after every answer. Use the private link once on another device to connect the same progress.':'Cloud sync turns on automatically on stevetodman.com. This preview is saving only on this device.')+'</p>'+
      (enabled?'<button type="button" class="primary-button" id="share-cloud">Share private device link</button><p class="privacy-note">Anyone with this private link can access this family’s study progress. The key is removed from the address after the new device connects.</p>':'')+
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
    return days*100+(st.correct||0)*7-(st.wrong||0)*9+Math.random()*18;
  }
  function domainPlan() {
    var now=new Date();
    if(now>=TEST_DATES.vocabulary&&now<TEST_DATES.spelling)return ['spelling','spelling','spelling','spelling','spelling','spelling','spelling','spelling','definition','synonym'];
    return ['definition','definition','definition','synonym','synonym','antonym','antonym','spelling','spelling','spelling'];
  }
  function buildPlan(name) {
    var used=new Set(), usedWords={}, plan=[];
    domainPlan().forEach(function(domain,index){
      var candidates=eligibleWords(domain).slice().sort(function(a,b){
        var aRepeat=usedWords[a.word]||0,bRepeat=usedWords[b.word]||0;
        return (aRepeat-bRepeat)*75+pairPriority(name,a,domain)-pairPriority(name,b,domain);
      });
      var chosen=candidates.find(function(w){return !used.has(w.word+'|'+domain);})||candidates[0];
      used.add(chosen.word+'|'+domain);usedWords[chosen.word]=(usedWords[chosen.word]||0)+1;
      plan.push(makeQuestion({word:chosen,domain:domain},index,false));
    });
    return plan;
  }
  function relationTerms(exclude) {
    var terms=[];WORDS.forEach(function(w){terms=terms.concat(w.synonyms,w.antonyms);});
    return unique(terms.filter(function(x){return exclude.indexOf(x)<0;}));
  }
  function makeQuestion(pair,index,forceText) {
    var w=pair.word,domain=pair.domain,typed=forceText||domain==='spelling'||index%2===0,q;
    if(domain==='definition') {
      if(typed)q={kind:'text',prompt:'Which vocabulary word means “'+w.definitions.join('; or ')+'”?',accepted:[w.word],answer:w.word,explanation:w.word+': '+w.definitions.join('; ')};
      else {var defs=WORDS.filter(function(x){return x.word!==w.word;}).map(function(x){return x.definitions[0];});q={kind:'choice',prompt:'Which definition matches <span class="target">'+esc(w.word)+'</span>?',choices:shuffle([w.definitions[0]].concat(shuffle(defs).slice(0,3))),accepted:[w.definitions[0]],answer:w.definitions[0],explanation:w.word+': '+w.definitions.join('; '),listen:true};}
    } else if(domain==='synonym'||domain==='antonym') {
      var list=domain==='synonym'?w.synonyms:w.antonyms,other=domain==='synonym'?w.antonyms:w.synonyms;
      if(typed)q={kind:'text',prompt:'Type one '+domain+' for <span class="target">'+esc(w.word)+'</span>.',accepted:list,answer:list[0],explanation:'School list: '+list.join(', '),listen:true};
      else {var distractors=unique(other.concat(shuffle(relationTerms(list.concat(other))).slice(0,5)));q={kind:'choice',prompt:'Which word is '+(domain==='antonym'?'an':'a')+' '+domain+' of <span class="target">'+esc(w.word)+'</span>?',choices:shuffle([list[0]].concat(shuffle(distractors).slice(0,3))),accepted:[list[0]],answer:list[0],explanation:'School list: '+list.join(', '),listen:true};}
    } else q={kind:'text',prompt:'Listen, then spell the word.',accepted:[w.word],answer:w.word,explanation:'The correct spelling is '+w.word+'.',listen:true,spelling:true};
    q.word=w;q.domain=domain;q.retry=!!forceText;q.checkpoint=index===SESSION_LENGTH-1;return q;
  }

  function startSession(name) {
    activeName=name;setChip(name);warmSpeech();
    session={index:0,questions:buildPlan(name),results:[],combo:0,beforeMastered:masteredCount(name),strengthened:new Set()};
    renderQuestion();
  }
  function warmSpeech() { if('speechSynthesis'in window)window.speechSynthesis.getVoices(); }
  function pipsHTML() {
    return '<div class="pips" aria-label="Question '+(session.index+1)+' of '+SESSION_LENGTH+'">'+Array.from({length:SESSION_LENGTH},function(_,i){
      var cls=i<session.results.length?(session.results[i].correct?'done':'learned'):(i===session.index?'current':'');
      return '<span class="pip '+cls+'"></span>';
    }).join('')+'</div>';
  }
  function renderQuestion() {
    clearTimeout(advanceTimer);
    if(!session||session.index>=SESSION_LENGTH){finishSession();return;}
    var q=session.questions[session.index];
    app.innerHTML='<section class="mission-head"><div><p class="eyebrow">'+esc(activeName)+'’s expedition</p><h2>'+(q.checkpoint?'Final checkpoint':'Question '+(session.index+1))+'</h2></div><span class="question-count">'+(session.index+1)+' / '+SESSION_LENGTH+'</span></section>'+pipsHTML()+
      '<section class="question-card"><div class="question-top"><span class="q-domain">'+(q.checkpoint?'Checkpoint · ':'')+esc(DOMAIN_LABELS[q.domain])+'</span>'+
      (q.listen?'<button type="button" class="speak-button" id="listen" aria-label="Hear the word">🔊</button>':'')+'</div><p class="q-prompt">'+q.prompt+'</p>'+
      (q.spelling?'<p class="audio-note">The word plays automatically. Tap the speaker to hear it again.</p>':'')+
      '<div id="answer-area">'+(q.kind==='choice'?choicesHTML(q):inputHTML(q))+'</div><div id="feedback-area" aria-live="polite"></div></section><p class="cloud-mini" id="cloud-mini">'+cloudStatusText()+'</p>';
    if(q.kind==='choice')wireChoices(q);else wireInput(q);
    if(q.listen){document.getElementById('listen').addEventListener('click',function(){speakWord(q.word);});setTimeout(function(){speakWord(q.word);},220);}
  }
  function choicesHTML(q) { return '<div class="choice-list">'+q.choices.map(function(c){return '<button type="button" class="choice" data-answer="'+esc(c)+'">'+esc(c)+'</button>';}).join('')+'</div>'; }
  function inputHTML(q) {
    var label=q.spelling?'Type the spelling':'Type your answer';
    return '<form id="answer-form"><label class="sr-only" for="answer-input">'+label+'</label><div class="answer-row"><input class="answer-input" id="answer-input" type="text" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" enterkeyhint="done" placeholder="'+label+'"><button class="submit-button" type="submit">Check</button></div></form>'+
      (q.spelling?'<button type="button" class="tile-toggle" id="tile-toggle">Need help? Use letter tiles</button>':'');
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
    var st=getStat(activeName,q.word.word,q.domain);st.attempts=(st.attempts||0)+1;st.lastAt=new Date().toISOString();st.correctDays=st.correctDays||[];
    if(assisted){st.assisted=(st.assisted||0)+1;st.streak=0;}
    else if(correct){st.correct=(st.correct||0)+1;st.streak=(st.streak||0)+1;st.correctDays=unique(st.correctDays.concat(todayKey())).sort();}
    else {st.wrong=(st.wrong||0)+1;st.streak=0;}
    profile(activeName).stats[statKey(q.word.word,q.domain)]=st;saveState();
  }
  function scheduleRetry(q) {
    var start=session.index+2;if(start>=SESSION_LENGTH)return;
    for(var i=start;i<Math.min(SESSION_LENGTH,start+3);i++){
      var future=session.questions[i];
      if(future.word.word===q.word.word&&future.domain===q.domain)return;
    }
    var target=Math.min(start,SESSION_LENGTH-1);
    session.questions[target]=makeQuestion({word:q.word,domain:q.domain},target,true);
    session.questions[target].retry=true;
  }
  function disableAnswerArea() { app.querySelectorAll('#answer-area button,#answer-area input').forEach(function(el){el.disabled=true;}); }
  function submitAnswer(q,value,source,assisted) {
    if(session.results.length>session.index)return;
    var correct=isAccepted(q,value);
    recordResult(q,correct,assisted);
    session.results.push({word:q.word.word,domain:q.domain,correct:correct&&!assisted,assisted:!!assisted});
    if(correct&&!assisted){session.combo+=1;session.strengthened.add(q.word.word);}else session.combo=0;
    if(!correct)scheduleRetry(q);
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
    advanceTimer=setTimeout(nextQuestion,900);
  }
  function showAssistedFeedback(q) {
    document.getElementById('feedback-area').innerHTML='<div class="feedback learn"><strong>Built correctly.</strong><span>Type it without tiles next time to earn a mastery day.</span></div>';
    advanceTimer=setTimeout(nextQuestion,1200);
  }
  function showCorrection(q) {
    var area=document.getElementById('feedback-area');
    if(q.kind==='choice'){
      area.innerHTML='<div class="feedback learn"><strong>Good try—learn this one.</strong><span>'+esc(q.explanation)+'</span></div><button type="button" class="continue-button" id="continue">Continue</button>';
      document.getElementById('continue').addEventListener('click',nextQuestion);document.getElementById('continue').focus();return;
    }
    area.innerHTML='<div class="feedback learn"><strong>Now lock it in.</strong><span>'+esc(q.explanation)+'</span></div><form id="correction-form"><label for="correction-input">Type <strong>'+esc(q.answer)+'</strong> once:</label><div class="answer-row"><input class="answer-input" id="correction-input" type="text" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false"><button class="submit-button" type="submit">Done</button></div><p class="correction-note" id="correction-note"></p></form>';
    var form=document.getElementById('correction-form'),input=document.getElementById('correction-input');input.focus();
    form.addEventListener('submit',function(e){e.preventDefault();if(normalize(input.value)!==normalize(q.answer)){document.getElementById('correction-note').textContent='Copy it exactly, then try again.';input.select();return;}form.innerHTML='<p class="correction-success">That’s it.</p>';advanceTimer=setTimeout(nextQuestion,700);});
  }
  function nextQuestion(){session.index+=1;renderQuestion();}

  function showLetterTiles(q) {
    var letters=shuffle(q.word.word.split('').map(function(letter,index){return {letter:letter,id:index};}));
    var chosen=[];
    function draw(message){
      document.getElementById('answer-area').innerHTML='<div class="tile-builder"><div class="built-word" aria-label="Built word">'+(chosen.length?chosen.map(function(x){return '<button type="button" class="built-tile" data-remove="'+x.id+'">'+esc(x.letter)+'</button>';}).join(''):'<span>Build the word here</span>')+'</div><div class="tile-bank">'+letters.filter(function(x){return !chosen.some(function(c){return c.id===x.id;});}).map(function(x){return '<button type="button" class="letter-tile" data-tile="'+x.id+'">'+esc(x.letter)+'</button>';}).join('')+'</div><button type="button" class="submit-button tile-check" id="tile-check" '+(chosen.length===letters.length?'':'disabled')+'>Check tiles</button><p class="correction-note">'+esc(message||'')+'</p></div>';
      app.querySelectorAll('[data-tile]').forEach(function(button){button.addEventListener('click',function(){var item=letters.find(function(x){return String(x.id)===button.getAttribute('data-tile');});chosen.push(item);draw();});});
      app.querySelectorAll('[data-remove]').forEach(function(button){button.addEventListener('click',function(){chosen=chosen.filter(function(x){return String(x.id)!==button.getAttribute('data-remove');});draw();});});
      document.getElementById('tile-check').addEventListener('click',function(){var answer=chosen.map(function(x){return x.letter;}).join('');if(normalize(answer)===normalize(q.word.word))submitAnswer(q,answer,null,true);else draw('Almost—tap a letter above to move it back.');});
    }
    draw('Tiles help you learn; typing earns mastery.');
  }

  function speakWord(word) {
    if(!('speechSynthesis'in window)){showToast('Audio is unavailable in this browser.');return;}
    window.speechSynthesis.cancel();
    var first=new SpeechSynthesisUtterance(word.word+'.');var second=new SpeechSynthesisUtterance(word.spellingSentence);
    first.lang=second.lang='en-US';first.rate=.78;second.rate=.84;window.speechSynthesis.speak(first);window.speechSynthesis.speak(second);
  }

  function finishSession() {
    var after=masteredCount(activeName),newStamps=Math.max(0,after-session.beforeMastered);
    var correct=session.results.filter(function(r){return r.correct;}).length;
    profile(activeName).sessions.unshift({id:new Date().toISOString()+'-'+Math.random().toString(36).slice(2,8),at:new Date().toISOString(),correct:correct,total:SESSION_LENGTH,newStamps:newStamps});
    profile(activeName).sessions=profile(activeName).sessions.slice(0,20);saveState();scheduleCloudPush(0);
    setChip(activeName);
    app.innerHTML='<section class="panel summary"><div class="summary-icon" aria-hidden="true">'+(newStamps?'🚩':'🧭')+'</div><p class="eyebrow">Expedition complete</p><h2>'+esc(activeName)+', you finished all 10.</h2><p>'+session.strengthened.size+' '+(session.strengthened.size===1?'word got':'words got')+' stronger'+(newStamps?' and '+newStamps+' new '+(newStamps===1?'stamp was':'stamps were')+' earned.':'.')+'</p>'+trailHTML(activeName,false)+'<button type="button" class="primary-button done-button" id="summary-done">Done</button><p class="cloud-mini" id="cloud-mini">'+cloudStatusText()+'</p></section>';
    if(newStamps||correct>=8)celebrate();
    document.getElementById('summary-done').addEventListener('click',showProfilePicker);
  }
  function celebrate() {
    var colors=['#f2ad36','#087e78','#dc6a4d','#6d70c9'];
    for(var i=0;i<22;i++){var bit=document.createElement('span');bit.className='confetti';bit.style.left=(8+Math.random()*84)+'%';bit.style.background=colors[i%colors.length];bit.style.animationDelay=(Math.random()*.35)+'s';bit.style.transform='rotate('+Math.random()*180+'deg)';document.body.appendChild(bit);setTimeout(function(el){el.remove();},1800,bit);}
  }

  function showWordList() {
    setChip(null);
    app.innerHTML='<section class="screen-heading"><button type="button" class="back-button" id="list-back" aria-label="Back">←</button><div><p class="eyebrow">Exact school list</p><h2>The 12 words</h2></div></section><div class="word-list">'+WORDS.map(function(w){return '<article class="word-card"><div class="word-top"><div><h3>'+esc(w.word)+'</h3><span class="pos">'+esc(w.pos)+'</span></div><button type="button" class="speak-button" data-speak="'+esc(w.word)+'" aria-label="Hear '+esc(w.word)+'">🔊</button></div><p class="definition">'+esc(w.definitions.join('; '))+'</p><p><strong>Synonyms:</strong> '+esc(w.synonyms.join(', '))+'</p><p><strong>Antonyms:</strong> '+(w.antonyms.length?esc(w.antonyms.join(', ')):'Not assigned on the worksheet')+'</p><p class="example">'+esc(w.example)+'</p></article>';}).join('')+'</div>';
    document.getElementById('list-back').addEventListener('click',showProfilePicker);
    app.querySelectorAll('[data-speak]').forEach(function(button){button.addEventListener('click',function(){speakWord(WORDS.find(function(w){return w.word===button.getAttribute('data-speak');}));});});
  }

  chip.addEventListener('click',showProfilePicker);
  window.addEventListener('online',function(){scheduleCloudPush(0);});
  document.addEventListener('visibilitychange',function(){if(!document.hidden)cloudPull().then(function(){if(!activeName)showProfilePicker();});});

  adoptTokenFromHash();
  showProfilePicker();
  cloudPull().then(function(){if(!activeName)showProfilePicker();});
})();

(function(){
  'use strict';

  var BANK=['blunder','cancel','continuous','distribute','document','fragile','myth','reject','scuffle','solitary','temporary','veteran'];
  var MAIN_STORAGE='studyhub-word-expedition-unit1-v3';
  var META_STORAGE='studyhub-word-expedition-test-practice-unit1-v3';
  var MOCK_STORAGE='studyhub-word-expedition-mocks-unit1-v1';
  var DATA={
    blunder:{pos:['verb','noun'],definitions:['to make a foolish or careless mistake','a serious or thoughtless mistake'],syn:['err','foul up','bungle','goof','error','blooper'],ant:['triumph','succeed','success','hit']},
    cancel:{pos:['verb'],definitions:['to call off or do away with; to cross out so it cannot be used again'],syn:['stop','discontinue','drop','repeal','revoke'],ant:['renew','continue','extend','maintain']},
    continuous:{pos:['adjective'],definitions:['going on without a stop or break'],syn:['ongoing','endless','ceaseless','unbroken','constant','perpetual'],ant:['broken','discontinuous','interrupted']},
    distribute:{pos:['verb'],definitions:['to give out in shares; to scatter or spread'],syn:['divide','share','deal','issue'],ant:['gather','collect','hold']},
    document:{pos:['noun','verb'],definitions:['a written or printed record that gives information or proof','to provide written or printed proof'],syn:['certificate','deed','prove','establish'],ant:[]},
    fragile:{pos:['adjective'],definitions:['easily broken or damaged; requiring special handling or care'],syn:['weak','frail','breakable','delicate','brittle','flimsy'],ant:['sturdy','hardy','strong','rugged','tough']},
    myth:{pos:['noun'],definitions:['an old story that explains why something is or how it came to be; something imaginary'],syn:['legend','fable','tale','fantasy','fairy tale'],ant:['fact']},
    reject:{pos:['verb'],definitions:['to refuse to accept, agree to, believe, or use'],syn:['deny','discard','junk','scrap','decline','dismiss'],ant:['take','accept','receive','welcome']},
    scuffle:{pos:['verb','noun'],definitions:['to fight or struggle closely with','a fight or struggle'],syn:['tussle','roughhouse','battle','brawl','fistfight','clash'],ant:[]},
    solitary:{pos:['adjective'],definitions:['living or being alone; being the only one'],syn:['single','sole','lone'],ant:['sociable','several','many','numerous']},
    temporary:{pos:['adjective'],definitions:['lasting or used for a limited time'],syn:['short-term','passing','brief','momentary'],ant:['lasting','long-lived','permanent']},
    veteran:{pos:['noun','adjective'],definitions:['a former member of the armed forces; an experienced person','having much experience in a job or field'],syn:['expert','professional','experienced','skilled','accomplished'],ant:['beginner','newcomer','novice','rookie']}
  };

  function readJSON(key,fallback){try{var x=JSON.parse(localStorage.getItem(key)||'null');return x||fallback;}catch(_){return fallback;}}
  function writeJSON(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch(_){return false;}}
  function blankMain(){return {version:3,learners:{Luke:{stats:{},sessions:[]},Samantha:{stats:{},sessions:[]}}};}
  function blankMeta(){return {version:3,learners:{Luke:{events:[],diagnostic:null,paragraphClean:false,practiceMs:0},Samantha:{events:[],diagnostic:null,paragraphClean:false,practiceMs:0}}};}
  function blankMocks(){return {version:1,learners:{Luke:{history:[],lastVocabForm:null},Samantha:{history:[],lastVocabForm:null}}};}
  function loadMain(){var x=readJSON(MAIN_STORAGE,null);return x&&x.version===3&&x.learners?x:blankMain();}
  function saveMain(x){return writeJSON(MAIN_STORAGE,x);}
  function loadMeta(){var x=readJSON(META_STORAGE,null);return x&&x.version===3&&x.learners?x:blankMeta();}
  function saveMeta(x){return writeJSON(META_STORAGE,x);}
  function loadMocks(){var x=readJSON(MOCK_STORAGE,null);return x&&x.version===1&&x.learners?x:blankMocks();}
  function saveMocks(x){return writeJSON(MOCK_STORAGE,x);}
  function dayKey(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
  function unique(a){return Array.from(new Set(a));}
  function statKey(word,domain){return word+'|'+domain;}
  function ensureProfile(main,name){main.learners[name]=main.learners[name]||{stats:{},sessions:[]};main.learners[name].stats=main.learners[name].stats||{};main.learners[name].sessions=main.learners[name].sessions||[];return main.learners[name];}
  function ensureMeta(meta,name){meta.learners[name]=meta.learners[name]||{events:[],diagnostic:null,paragraphClean:false,practiceMs:0};meta.learners[name].events=meta.learners[name].events||[];return meta.learners[name];}
  function getStat(name,word,domain){var p=ensureProfile(loadMain(),name);return p.stats[statKey(word,domain)]||{attempts:0,correct:0,wrong:0,assisted:0,streak:0,correctDays:[],lastAt:null};}
  function recentEvents(name,word,domain){var p=ensureMeta(loadMeta(),name);return p.events.filter(function(e){return e.word===word&&(!domain||e.domain===domain);}).slice(-12);}
  function recordEvidence(name,word,domain,correct,options){
    options=options||{};
    var main=loadMain(),p=ensureProfile(main,name),k=statKey(word,domain),st=p.stats[k]||{attempts:0,correct:0,wrong:0,assisted:0,streak:0,correctDays:[],lastAt:null};
    st.attempts=(st.attempts||0)+1;st.lastAt=new Date().toISOString();st.correctDays=st.correctDays||[];
    if(options.assisted){st.assisted=(st.assisted||0)+1;st.streak=0;}
    else if(correct){st.correct=(st.correct||0)+1;st.streak=(st.streak||0)+1;if(options.independent)st.correctDays=unique(st.correctDays.concat(dayKey())).sort();}
    else{st.wrong=(st.wrong||0)+1;st.streak=0;}
    st.lastPracticeType=options.type||domain;if(options.error)st.lastError=options.error;p.stats[k]=st;saveMain(main);
    var meta=loadMeta(),mp=ensureMeta(meta,name);mp.events.push({ts:Date.now(),word:word,domain:domain,type:options.type||domain,correct:!!correct,independent:!!options.independent,assisted:!!options.assisted,error:options.error||null});if(mp.events.length>600)mp.events=mp.events.slice(-600);saveMeta(meta);
    return st;
  }
  function priorAdventureEvidence(name,word,domain){if(domain==='pos')return 0;return (getStat(name,word,domain).correctDays||[]).length>0?1:0;}
  function independentCorrects(name,word,domain){var local=recentEvents(name,word,domain).filter(function(e){return e.correct&&e.independent&&!e.assisted;}).length;return Math.max(local,priorAdventureEvidence(name,word,domain));}
  function unresolved(name,word,domain){var ev=recentEvents(name,word,domain);if(ev.length){var last=ev[ev.length-1];return !last.correct||last.assisted;}if(domain==='pos')return true;var st=getStat(name,word,domain);return !((st.streak||0)>0&&(st.correctDays||[]).length>0);}
  function vocabReady(name,word){var d=DATA[word],req=['definition','synonym'].concat(d.ant.length?['antonym']:[]),ok=req.every(function(domain){return independentCorrects(name,word,domain)>=2&&!unresolved(name,word,domain);});if(d.pos.length>1)ok=ok&&independentCorrects(name,word,'pos')>=1&&!unresolved(name,word,'pos');return ok;}
  function spellingReady(name,word){var st=getStat(name,word,'spelling');return (st.correctDays||[]).length>=2&&!unresolved(name,word,'spelling');}
  function readiness(name){var vocab=BANK.filter(function(w){return vocabReady(name,w);}).length,spelling=BANK.filter(function(w){return spellingReady(name,w);}).length,both=BANK.filter(function(w){return vocabReady(name,w)&&spellingReady(name,w);}).length;return {vocab:vocab,spelling:spelling,both:both};}
  function weakness(name,word,domain){var ev=recentEvents(name,word,domain),score=0,prior=priorAdventureEvidence(name,word,domain);if(!ev.length&&!prior)score+=50;if(prior)score-=12;ev.forEach(function(e){score+=e.correct?-4:12;if(e.assisted)score+=5;});if(unresolved(name,word,domain))score+=18;if(domain==='spelling'&&!spellingReady(name,word))score+=15;return score;}
  function weakestWords(name,n){return BANK.map(function(w){var domains=['definition','synonym'].concat(DATA[w].ant.length?['antonym']:[]).concat(['spelling']);if(DATA[w].pos.length>1)domains.push('pos');return {word:w,score:Math.max.apply(null,domains.map(function(d){return weakness(name,w,d);})),vocab:vocabReady(name,w),spelling:spellingReady(name,w)};}).sort(function(a,b){return b.score-a.score;}).slice(0,n||5);}
  function recentErrors(name,n){var p=ensureMeta(loadMeta(),name);return p.events.filter(function(e){return !e.correct&&!e.assisted;}).slice(-(n||6)).reverse();}
  function practiceMs(name){return ensureMeta(loadMeta(),name).practiceMs||0;}
  function spellingError(target,attempt){target=String(target||'').toLowerCase().trim();attempt=String(attempt||'').toLowerCase().trim();if(attempt===target)return null;if(attempt.length<target.length)return 'missing letter';if(attempt.length>target.length)return 'extra letter';for(var j=0;j<target.length-1;j++)if(target[j]===attempt[j+1]&&target[j+1]===attempt[j]&&target.slice(0,j)===attempt.slice(0,j)&&target.slice(j+2)===attempt.slice(j+2))return 'letters reversed';return 'letter pattern';}
  function recordMock(name,result){var x=loadMocks(),p=x.learners[name]=x.learners[name]||{history:[],lastVocabForm:null};p.history.unshift(result);p.history=p.history.slice(0,20);if(result.type==='vocabulary')p.lastVocabForm=result.formId||null;saveMocks(x);return result;}
  function latestMock(name,type){var p=(loadMocks().learners[name]||{history:[]});return (p.history||[]).find(function(x){return !type||x.type===type;})||null;}
  function wordSnapshot(name,word){var d=DATA[word],domains=['definition','synonym'].concat(d.ant.length?['antonym']:[]);return {word:word,vocabReady:vocabReady(name,word),spellingReady:spellingReady(name,word),vocabEvidence:domains.map(function(domain){var st=getStat(name,word,domain);return {domain:domain,correct:st.correct||0,wrong:st.wrong||0,days:(st.correctDays||[]).length,lastError:st.lastError||null};}),spelling:getStat(name,word,'spelling')};}

  window.WordExpeditionMastery={BANK:BANK,DATA:DATA,MAIN_STORAGE:MAIN_STORAGE,META_STORAGE:META_STORAGE,MOCK_STORAGE:MOCK_STORAGE,loadMain:loadMain,saveMain:saveMain,loadMeta:loadMeta,saveMeta:saveMeta,loadMocks:loadMocks,saveMocks:saveMocks,getStat:getStat,recordEvidence:recordEvidence,recentEvents:recentEvents,vocabReady:vocabReady,spellingReady:spellingReady,readiness:readiness,weakness:weakness,weakestWords:weakestWords,recentErrors:recentErrors,practiceMs:practiceMs,spellingError:spellingError,recordMock:recordMock,latestMock:latestMock,wordSnapshot:wordSnapshot};
})();

(function(){
  'use strict';

  var BANK=['blunder','cancel','continuous','distribute','document','fragile','myth','reject','scuffle','solitary','temporary','veteran'];
  var LEARNERS=['Luke','Samantha'];
  var STORAGE='studyhub-word-expedition-test-practice-unit1-v1';
  var app=document.getElementById('practice-app');
  var learner=null;
  var state=load();

  var DATA={
    blunder:{pos:['verb','noun'],syn:['err','foul up','bungle','goof','error','blooper'],ant:['triumph','succeed','success','hit']},
    cancel:{pos:['verb'],syn:['stop','discontinue','drop','repeal','revoke'],ant:['renew','continue','extend','maintain']},
    continuous:{pos:['adjective'],syn:['ongoing','endless','ceaseless','unbroken','constant','perpetual'],ant:['broken','discontinuous','interrupted']},
    distribute:{pos:['verb'],syn:['divide','share','deal','issue'],ant:['gather','collect','hold']},
    document:{pos:['noun','verb'],syn:['certificate','deed','prove','establish'],ant:[]},
    fragile:{pos:['adjective'],syn:['weak','frail','breakable','delicate','brittle','flimsy'],ant:['sturdy','hardy','strong','rugged','tough']},
    myth:{pos:['noun'],syn:['legend','fable','tale','fantasy','fairy tale'],ant:['fact']},
    reject:{pos:['verb'],syn:['deny','discard','junk','scrap','decline','dismiss'],ant:['take','accept','receive','welcome']},
    scuffle:{pos:['verb','noun'],syn:['tussle','roughhouse','battle','brawl','fistfight','clash'],ant:[]},
    solitary:{pos:['adjective'],syn:['single','sole','lone'],ant:['sociable','several','many','numerous']},
    temporary:{pos:['adjective'],syn:['short-term','passing','brief','momentary'],ant:['lasting','long-lived','permanent']},
    veteran:{pos:['noun','adjective'],syn:['expert','professional','experienced','skilled','accomplished'],ant:['beginner','newcomer','novice','rookie']}
  };

  var PARAGRAPHS=[
    {
      title:'Canyon ranger · 12-for-12',
      text:'The {1} ranger had worked the canyon alone for years, a truly {2} job. Each morning she would {3} trail maps to hikers and warn them the rope bridge was {4}. One {5} was letting a group cross with heavy packs — the boards cracked. She had to {6} every tour for the rest of the week. A {7} went around that a bear had chewed the ropes, but she would {8} that idea flatly. She wrote a {9} describing the real cause, and the noise of the repair crew was {10} from dawn to dusk. Two chipmunks even had a {11} over a dropped nail. The new bridge, she said, was only {12} until the steel one arrived in spring.',
      key:['veteran','solitary','distribute','fragile','blunder','cancel','myth','reject','document','continuous','scuffle','temporary']
    },
    {
      title:'Foggy flight · 12-for-12',
      text:'The {1} pilot did not {2} the flight, even though the fog was {3} all morning. Her one small {4} was leaving the coffee on the wing. A flight attendant began to {5} pretzels while a {6} passenger read alone in row 12. Two toddlers had a tiny {7} over a plastic cup. The captain signed a {8} saying the delay was only {9}. A rumor that the plane could fly upside down was a {10}, and the crew had to {11} that idea completely. The snack cart, sadly, was {12} and lost a wheel.',
      key:['veteran','cancel','continuous','blunder','distribute','solitary','scuffle','document','temporary','myth','reject','fragile']
    }
  ];

  var PRESSURE=[
    {q:'The buzzing was __________, not stopping even for a second.',a:'continuous',why:'“not stopping” decides it; temporary is about how long something lasts.'},
    {q:'The scaffolding is __________ and comes down in March.',a:'temporary',why:'The clue is about limited time, not whether it breaks easily.'},
    {q:'The librarian will __________ the overdue notice by stamping PAID across it.',a:'cancel',why:'Here cancel means cross out or mark so it cannot be used again.'},
    {q:'Miss Alvarez will __________ the field trip, so nobody goes.',a:'cancel',why:'Cancel means call off.'},
    {q:'The judges will __________ any drawing done in crayon.',a:'reject',why:'Reject means refuse to accept.'},
    {q:'His __________ cost the team the game.',a:'blunder',why:'The blank needs a noun meaning a mistake.'},
    {q:'The __________ lasted four seconds and ended in giggles.',a:'scuffle',why:'The clue describes a short fight or struggle.'},
    {q:'The mug is __________ — one drop and it is gone.',a:'fragile',why:'Fragile means easily broken or damaged.'},
    {q:'That story about the mayor’s flying goat is a __________.',a:'myth',why:'A myth is an old or imaginary story, not proof.'},
    {q:'She kept the __________ in a locked box as proof.',a:'document',why:'A document is a written or printed record that gives information or proof.'},
    {q:'He was the __________ diner at the far table.',a:'solitary',why:'Solitary is an adjective meaning alone or the only one.'},
    {q:'A __________ of thirty years, Chief Ruiz had seen every kind of fire.',a:'veteran',why:'The grammar needs a noun; veteran can mean an experienced person.'}
  ];

  var BLANK_FIRST=[
    {q:'__________ is what you call an old story that is not a fact.',a:'myth'},
    {q:'__________ noise from the highway kept us up all night.',a:'continuous'},
    {q:'__________ items go in the box marked HANDLE WITH CARE.',a:'fragile'},
    {q:'__________ jobs end when the season ends.',a:'temporary'},
    {q:'__________ hikers carry a whistle, since nobody else is around to hear them.',a:'solitary'},
    {q:'__________ pilots know exactly what that gauge means.',a:'veteran'}
  ];

  var GRAMMAR=[
    {q:'“a __________ of the Coast Guard”',need:'noun',a:'veteran'},
    {q:'“will __________ the papers tomorrow”',need:'verb',a:'distribute'},
    {q:'“a __________ vase”',need:'adjective',a:'fragile'},
    {q:'“the __________ broke out at recess”',need:'noun',a:'scuffle'},
    {q:'“they will __________ the invitation”',need:'verb',a:'reject'},
    {q:'“a __________ arrangement”',need:'adjective',a:'temporary'}
  ];

  var CANCEL_SENSE=[
    {q:'The post office will __________ the stamp so nobody can mail a letter with it twice.',a:'cancel'},
    {q:'Dad had to __________ the check by drawing a big X through it.',a:'cancel'},
    {q:'The conductor punched a hole in the ticket to __________ it.',a:'cancel'},
    {q:'Please __________ the coupon after you use it.',a:'cancel'}
  ];

  var CONFUSABLE=[
    {q:'Grandpa is a Navy __________.',a:'veteran',choices:['veteran','veterinarian']},
    {q:'The rain is __________, with no break at all.',a:'continuous',choices:['continuous','continues']},
    {q:'The teacup is __________ and may break.',a:'fragile',choices:['fragile','agile']},
    {q:'The judges will __________ the excuse.',a:'reject',choices:['reject','eject']},
    {q:'An old imaginary story can be a __________.',a:'myth',choices:['myth','mystery']},
    {q:'The tent is __________ and comes down Sunday.',a:'temporary',choices:['temporary','temporarily']}
  ];

  var SPELLING=[
    {w:'continuous',hint:'Watch contin-u-ous: the middle is “uou”.'},
    {w:'veteran',hint:'Keep the e after vet: veteran. Do not turn it into veterinarian.'},
    {w:'fragile',hint:'Keep the g: fra-gile.'},
    {w:'scuffle',hint:'Double f: scu-ff-le.'},
    {w:'solitary',hint:'Ends in -ary.'},
    {w:'temporary',hint:'Ends in -ary.'},
    {w:'myth',hint:'The vowel letter is y.'},
    {w:'document',hint:'doc-u-ment.'},
    {w:'distribute',hint:'dis-trib-ute.'},
    {w:'cancel',hint:'The weekly word is the base form: cancel.'},
    {w:'reject',hint:'re-ject.'},
    {w:'blunder',hint:'blun-der.'}
  ];

  function load(){try{return JSON.parse(localStorage.getItem(STORAGE)||'{}')||{};}catch(_){return {};}}
  function save(){try{localStorage.setItem(STORAGE,JSON.stringify(state));}catch(_){}}
  function esc(s){return String(s).replace(/[&<>"']/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];});}
  function norm(s){return String(s||'').trim().toLowerCase().replace(/[’']/g,"'").replace(/\s+/g,' ');}
  function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t;}return a;}
  function record(mode,correct,total){if(!learner)return;state[learner]=state[learner]||{};var x=state[learner][mode]||{correct:0,total:0,runs:0};x.correct+=correct;x.total+=total;x.runs+=1;state[learner][mode]=x;save();}
  function bankHTML(used){return '<div class="word-bank" aria-label="Word bank">'+BANK.map(function(w){return '<span class="bank-word '+((used||[]).indexOf(w)>=0?'used':'')+'">'+w+'</span>';}).join('')+'</div>';}
  function top(title,sub){return '<section class="practice-panel"><div class="practice-progress"><button class="text-button" id="practice-home" type="button">← Practice menu</button><span>'+esc(learner||'')+'</span></div><p class="eyebrow">Test practice</p><h1>'+esc(title)+'</h1>'+(sub?'<p>'+sub+'</p>':'')+'</section>';}

  function chooseLearner(){
    learner=null;
    app.innerHTML='<section class="practice-panel"><p class="eyebrow">Unit 1 · teacher-aligned</p><h1>Test practice</h1><p>Choose a learner. Practice mirrors the known test demands: full word-bank elimination on the front, teacher-sheet synonym/antonym relationships on the back, and exact spelling for Wednesday.</p><div class="mode-grid">'+LEARNERS.map(function(n){return '<button class="mode-card" data-learner="'+n+'"><strong>'+n+'</strong><span>Separate local practice history</span></button>';}).join('')+'</div><p class="small-note">The 12 teacher words remain the answer bank. Added sentences are practice contexts only; definitions, synonyms, and antonyms stay anchored to the teacher sheet.</p></section>';
    app.querySelectorAll('[data-learner]').forEach(function(b){b.addEventListener('click',function(){learner=b.dataset.learner;menu();});});
  }

  function menu(){
    var s=state[learner]||{};
    function stat(k){var x=s[k];return x&&x.total?Math.round(x.correct/x.total*100)+'% best evidence':'Not tried yet';}
    app.innerHTML='<section class="practice-panel"><p class="eyebrow">'+esc(learner)+' · Unit 1</p><h1>Practice what the test actually demands</h1><p class="strategy-tip"><strong>Fast rule:</strong> first check the blank’s grammar shape (noun, verb, adjective), then use the meaning clue, then cross that word off the bank. Do not guess from the leftover word until the other answers make sense.</p></section><div class="mode-grid">'+
      card('paragraph','12-for-12 paragraph','Full word bank. No grading until all 12 blanks are filled. A wrong early choice can poison the leftover word. '+stat('paragraph'))+
      card('pressure','Distractor pressure','All 12 words stay visible; two choices may look plausible until the context decides. '+stat('pressure'))+
      card('grammar','Grammar + blank-first','Use noun/verb/adjective shape as the first elimination tool, then handle blanks that come first. '+stat('grammar'))+
      card('back','Back-of-test recall','Given a vocabulary word, produce a teacher-sheet synonym and antonym cold. '+stat('back'))+
      card('cancel','Cancel + dual meanings','Drill the “cross out so it cannot be used again” sense that ordinary call-off questions miss. '+stat('cancel'))+
      card('confusable','Look-alike traps','Veteran/veterinarian, continuous/continues, fragile/agile, reject/eject, and more. '+stat('confusable'))+
      card('spelling','Wednesday spelling sprint','Hear each base word, type it with no word bank, and correct exact letter traps. '+stat('spelling'))+
      '</div><section class="practice-panel"><div class="practice-actions"><button class="secondary" id="switch-learner" type="button">Switch learner</button><a class="text-button" href="/study/unit-1/">Back to adventure</a></div></section>';
    app.querySelectorAll('[data-mode]').forEach(function(b){b.addEventListener('click',function(){({paragraph:paragraphMode,pressure:pressureMode,grammar:grammarMode,back:backMode,cancel:cancelMode,confusable:confusableMode,spelling:spellingMode})[b.dataset.mode]();});});
    document.getElementById('switch-learner').addEventListener('click',chooseLearner);
  }
  function card(id,title,copy){return '<button class="mode-card" data-mode="'+id+'"><strong>'+title+'</strong><span>'+copy+'</span></button>';}
  function bindHome(){var b=document.getElementById('practice-home');if(b)b.addEventListener('click',menu);}

  function paragraphMode(){
    var set=PARAGRAPHS[Math.floor(Math.random()*PARAGRAPHS.length)],answers=Array(12).fill(''),active=0;
    function render(){
      var used=answers.filter(Boolean);
      var text=esc(set.text).replace(/\{(\d+)\}/g,function(_,n){var i=Number(n)-1;return '<button type="button" class="blank-token" data-blank="'+i+'">'+(answers[i]?esc(answers[i]):'('+n+') ______')+'</button>';});
      app.innerHTML=top('12-for-12 paragraph','Fill the entire paragraph before checking. Each bank word can be used once.')+'<section class="practice-panel"><p class="section-label">'+esc(set.title)+'</p><p class="strategy-tip"><strong>Elimination strategy:</strong> use grammar + meaning. Cross off each word only when you are confident. The last word is useful only if the first eleven are right.</p><div class="paragraph-text">'+text+'</div><p class="small-note">Tap a blank, then tap a word.</p><div class="word-bank">'+BANK.map(function(w){var disabled=used.indexOf(w)>=0&&answers[active]!==w;return '<button type="button" class="bank-word '+(disabled?'used':'')+'" data-bank="'+w+'" '+(disabled?'disabled':'')+'>'+w+'</button>';}).join('')+'</div><div class="practice-actions"><button class="primary" id="check-paragraph" '+(answers.every(Boolean)?'':'disabled')+'>Check all 12</button><button class="secondary" id="clear-paragraph">Clear</button></div></section>';
      bindHome();
      app.querySelectorAll('[data-blank]').forEach(function(b){b.addEventListener('click',function(){active=Number(b.dataset.blank);render();});});
      app.querySelectorAll('[data-bank]').forEach(function(b){b.addEventListener('click',function(){answers[active]=b.dataset.bank;var next=answers.findIndex(function(x,i){return !x&&i>active;});if(next<0)next=answers.findIndex(function(x){return !x;});if(next>=0)active=next;render();});});
      document.getElementById('clear-paragraph').addEventListener('click',function(){answers=Array(12).fill('');active=0;render();});
      document.getElementById('check-paragraph').addEventListener('click',function(){var correct=answers.reduce(function(n,a,i){return n+(a===set.key[i]?1:0);},0);record('paragraph',correct,12);showParagraphResult(set,answers,correct);});
    }
    render();
  }
  function showParagraphResult(set,answers,correct){
    app.innerHTML=top('Paragraph result','This is the point where leftover-word errors become visible.')+'<section class="practice-panel"><p class="test-ready">'+correct+'/12</p><p class="score-line">'+(correct===12?'Clean elimination run.':correct>=10?'Very close. Fix the first wrong decision, not just the last blank.':'Rebuild the chain: grammar first, meaning second, leftover word last.')+'</p><div class="result-list">'+set.key.map(function(a,i){return '<div class="result-row"><span>'+(i+1)+'. '+esc(answers[i]||'—')+'</span><strong>'+(answers[i]===a?'✓':'→ '+a)+'</strong></div>';}).join('')+'</div><div class="practice-actions"><button class="primary" id="again">Another paragraph</button><button class="secondary" id="menu">Practice menu</button></div></section>';
    bindHome();document.getElementById('again').addEventListener('click',paragraphMode);document.getElementById('menu').addEventListener('click',menu);
  }

  function runChoiceMode(mode,title,items,tip,choiceFn){var index=0,correct=0,order=shuffle(items);
    function render(){if(index>=order.length){record(mode,correct,order.length);return summary(title,correct,order.length,function(){runChoiceMode(mode,title,items,tip,choiceFn);});}var x=order[index],choices=choiceFn?choiceFn(x):shuffle(BANK);app.innerHTML=top(title,'Question '+(index+1)+' of '+order.length)+'<section class="practice-panel">'+(tip?'<p class="strategy-tip">'+tip+'</p>':'')+bankHTML([])+'<div class="question-box">'+esc(x.q)+'</div><div class="choice-grid">'+choices.map(function(c){return '<button type="button" data-choice="'+esc(c)+'">'+esc(c)+'</button>';}).join('')+'</div><div id="choice-feedback"></div></section>';bindHome();app.querySelectorAll('[data-choice]').forEach(function(b){b.addEventListener('click',function(){var ok=b.dataset.choice===x.a;if(ok)correct++;app.querySelectorAll('[data-choice]').forEach(function(z){z.disabled=true;if(z.dataset.choice===x.a)z.classList.add('correct');});if(!ok)b.classList.add('wrong');document.getElementById('choice-feedback').innerHTML='<div class="feedback '+(ok?'good':'learn')+'"><strong>'+(ok?'Correct.':'Use the clue, not just grammar.')+'</strong><span>'+(x.why?esc(x.why):' Correct answer: '+esc(x.a)+'.')+'</span></div><div class="practice-actions"><button class="primary" id="next">Next</button></div>';document.getElementById('next').addEventListener('click',function(){index++;render();});});});}
    render();
  }
  function pressureMode(){runChoiceMode('pressure','Distractor pressure',PRESSURE,'Several bank words may fit the grammar. The context clue must decide.');}
  function cancelMode(){runChoiceMode('cancel','The second meaning of cancel',CANCEL_SENSE,'On the teacher sheet, cancel can also mean to cross out so something cannot be used again.');}
  function confusableMode(){runChoiceMode('confusable','Look-alike traps',CONFUSABLE,'Read every letter. These pairs look or sound similar but are not interchangeable.',function(x){return x.choices;});}

  function grammarMode(){var items=GRAMMAR.map(function(x){return Object.assign({kind:'grammar'},x);}).concat(BLANK_FIRST.map(function(x){return Object.assign({kind:'blank'},x); }));var index=0,correct=0,order=shuffle(items);
    function render(){if(index>=order.length){record('grammar',correct,order.length);return summary('Grammar + blank-first',correct,order.length,grammarMode);}var x=order[index],choices=shuffle(BANK);app.innerHTML=top('Grammar + blank-first','Question '+(index+1)+' of '+order.length)+'<section class="practice-panel"><p class="strategy-tip">'+(x.kind==='grammar'?'<strong>Step 1:</strong> the blank needs a <strong>'+esc(x.need)+'</strong>. Eliminate words that cannot play that grammatical role.':'When the blank comes first, do not wait for a clue before it. Read through the whole sentence, then return to the blank.')+'</p>'+bankHTML([])+'<div class="question-box '+(x.kind==='blank'?'blank-first':'')+'">'+esc(x.q)+(x.need?'<span class="pos-chip">needs '+esc(x.need)+'</span>':'')+'</div><div class="choice-grid">'+choices.map(function(c){return '<button type="button" data-choice="'+c+'">'+c+'</button>';}).join('')+'</div><div id="choice-feedback"></div></section>';bindHome();app.querySelectorAll('[data-choice]').forEach(function(b){b.addEventListener('click',function(){var ok=b.dataset.choice===x.a;if(ok)correct++;app.querySelectorAll('[data-choice]').forEach(function(z){z.disabled=true;if(z.dataset.choice===x.a)z.classList.add('correct');});if(!ok)b.classList.add('wrong');document.getElementById('choice-feedback').innerHTML='<div class="feedback '+(ok?'good':'learn')+'"><strong>'+(ok?'Correct.':'Try grammar, then meaning.')+'</strong><span>The answer is '+esc(x.a)+'.</span></div><div class="practice-actions"><button class="primary" id="next">Next</button></div>';document.getElementById('next').addEventListener('click',function(){index++;render();});});});}
    render();
  }

  function backMode(){var index=0,correct=0,order=shuffle(BANK);
    function render(){if(index>=order.length){record('back',correct,order.length*2);return summary('Back-of-test recall',correct,order.length*2,backMode);}var w=order[index],d=DATA[w],noAnt=d.ant.length===0;app.innerHTML=top('Back-of-test recall','Word '+(index+1)+' of '+order.length)+'<section class="practice-panel"><p class="strategy-tip">Use only relationships from the teacher sheet. For <strong>document</strong> and <strong>scuffle</strong>, the sheet gives no antonym: write <strong>none given</strong>.</p><div class="question-box"><strong>'+esc(w)+'</strong><br>Give one teacher-sheet synonym and one teacher-sheet antonym.</div><form id="reverse-form"><div class="reverse-pair"><label>Synonym<input id="syn" autocomplete="off" autocorrect="off" spellcheck="false"></label><label>Antonym<input id="ant" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="'+(noAnt?'none given':'')+'"></label></div><div class="practice-actions"><button class="primary" type="submit">Check</button></div></form><div id="reverse-feedback"></div></section>';bindHome();document.getElementById('reverse-form').addEventListener('submit',function(e){e.preventDefault();var syn=document.getElementById('syn').value,ant=document.getElementById('ant').value;var synOk=d.syn.map(norm).indexOf(norm(syn))>=0;var antOk=noAnt?['none given','none','no antonym'].indexOf(norm(ant))>=0:d.ant.map(norm).indexOf(norm(ant))>=0;correct+=(synOk?1:0)+(antOk?1:0);document.querySelectorAll('#reverse-form input,#reverse-form button').forEach(function(x){x.disabled=true;});document.getElementById('reverse-feedback').innerHTML='<div class="feedback '+(synOk&&antOk?'good':'learn')+'"><strong>'+(synOk&&antOk?'Both sanctioned answers.':'Use only the sheet.')+'</strong><span>Synonyms: '+esc(d.syn.join(', '))+'. Antonyms: '+esc(noAnt?'none given':d.ant.join(', '))+'.</span></div><div class="practice-actions"><button class="primary" id="next">Next word</button></div>';document.getElementById('next').addEventListener('click',function(){index++;render();});});}
    render();
  }

  function spellingMode(){var order=shuffle(SPELLING),index=0,correct=0;
    function speak(w){try{if('speechSynthesis'in window){speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(w);u.lang='en-US';u.rate=.9;speechSynthesis.speak(u);}}catch(_){}}
    function render(){if(index>=order.length){record('spelling',correct,order.length);return summary('Wednesday spelling sprint',correct,order.length,spellingMode);}var x=order[index];app.innerHTML=top('Wednesday spelling sprint','Word '+(index+1)+' of '+order.length)+'<section class="practice-panel"><p class="strategy-tip"><strong>Mastery rule:</strong> type the exact weekly base word from hearing it. Inflected forms such as “documented” are useful awareness, but they do not replace mastery of <strong>document</strong>.</p><div class="question-box">Listen, then type the word.</div><div class="practice-actions"><button class="secondary" id="hear" type="button">Hear word</button></div><form id="spell-form"><div class="answer-row"><input id="spell" autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" placeholder="Type spelling"><button type="submit">Check</button></div></form><div id="spell-feedback"></div></section>';bindHome();document.getElementById('hear').addEventListener('click',function(){speak(x.w);});document.getElementById('spell-form').addEventListener('submit',function(e){e.preventDefault();var v=norm(document.getElementById('spell').value),ok=v===x.w;if(ok)correct++;document.querySelectorAll('#spell-form input,#spell-form button').forEach(function(z){z.disabled=true;});document.getElementById('spell-feedback').innerHTML='<div class="feedback '+(ok?'good':'learn')+'"><strong>'+(ok?'Exact spelling.':'Correct form: '+esc(x.w))+'</strong><span>'+esc(x.hint)+'</span></div>'+(ok?'<div class="practice-actions"><button class="primary" id="next">Next word</button></div>':'<form id="repair-form"><label class="small-note">Type <strong>'+esc(x.w)+'</strong> once correctly:</label><div class="answer-row"><input id="repair" autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false"><button type="submit">Repair</button></div><p class="small-note" id="repair-note"></p></form>');if(ok){document.getElementById('next').addEventListener('click',function(){index++;render();});}else{document.getElementById('repair-form').addEventListener('submit',function(e2){e2.preventDefault();if(norm(document.getElementById('repair').value)!==x.w){document.getElementById('repair-note').textContent='Copy it exactly once, then move on.';return;}index++;render();});}});setTimeout(function(){speak(x.w);},120);}
    render();
  }

  function summary(title,correct,total,again){app.innerHTML=top(title+' complete','Focused evidence from this drill only.')+'<section class="practice-panel"><p class="test-ready">'+correct+'/'+total+'</p><p class="score-line">'+(correct===total?'Clean run.':correct/total>=.8?'Strong; repeat until the misses disappear.':'Repeat now while the corrections are fresh.')+'</p><div class="practice-actions"><button class="primary" id="again">Repeat</button><button class="secondary" id="menu">Practice menu</button></div></section>';bindHome();document.getElementById('again').addEventListener('click',again);document.getElementById('menu').addEventListener('click',menu);}

  chooseLearner();
})();

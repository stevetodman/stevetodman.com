(function(){
  'use strict';

  var WRONG=[
    'That answer was so wrong the question got offended!',
    'Wrong! Wrong! Deliciously, snackably wrong!',
    'Even the rocks are embarrassed for that guess.',
    'Is that your final answer, or just a burp?',
    'That answer was so bad it hurt my third ear!',
    'Pfffft! I have been beaten by mushrooms tougher than that answer!',
    'Wrong-o! Add it to the pile!',
    'My fungus grows faster than that idea!',
    'That guess was so strange I felt it in all six knees.',
    'I have heard better answers from a hiccup!',
    'Bwahaha! Another wrong answer for my collection!',
    'Do you hear that? That is the sound of me not being impressed.',
    'Ha! That answer fights like a marshmallow!',
    'Nope! My pet slug is still undefeated!',
    'That guess just tripped over its own shoelaces!',
    'My swamp mud had a better plan than that!',
    'Wrong! And somehow I am suddenly hungry.',
    'That answer needs a map, a flashlight, and possibly a sandwich.'
  ];

  var RIGHT=[
    'NO! You were not supposed to know that!',
    'Ugh! My slime is curdling!',
    'Lucky guess! That is all! LUCKY GUESS!',
    'Who told you?! Was it the mushrooms? IT WAS THE MUSHROOMS!',
    'Hrrmph. Fine. That was... adequate. Barely.',
    'My tail is sulking now. Look what you did.',
    'I am not crying. Monsters do not cry. This is swamp water.',
    'Blechhh! Correct answers taste TERRIBLE!',
    'AAARGH! Back to monster school for me!',
    'Stop that. Stop being right. It is rude.',
    'I demand a rematch! And a snack! Mostly a snack!',
    'Ohhh, you are one of those smart ones, are you?',
    'My earwax collection is very disappointed in me.',
    'Curses! Foiled by a person with a juice box!',
    'That is it. I am telling my grandmother.',
    'Hmph! Anyone could have known that. Except me, apparently.',
    'Well... okay. That was actually kind of good. DO NOT TELL ANYONE I SAID THAT.',
    'You win this round, tiny hero. THIS round.'
  ];

  function numberFrom(text){var m=String(text||'').match(/(\d+)/);return m?Number(m[1]):0;}
  function hash(text){var h=0;for(var i=0;i<text.length;i++)h=((h<<5)-h+text.charCodeAt(i))|0;return Math.abs(h);}
  function stage(){return document.getElementById('battle-stage');}
  function speaker(){var name=document.querySelector('.enemy-name');return name&&name.textContent?name.textContent.trim():'Monster';}
  function seed(kind){var s=stage(),enemy=s?(s.dataset.aaaMonster||s.dataset.enemy||'monster'):'monster',q=document.querySelector('.question-count'),n=numberFrom(q&&q.textContent);return kind+'|'+enemy+'|'+n+'|'+speaker();}
  function pick(pool,kind){return pool[hash(seed(kind))%pool.length];}
  function markup(kind,extra,line){return '<div class="monster-taunt '+(extra||'')+'" data-monster-banter="true" data-banter-kind="'+kind+'" data-banter-line="'+encodeURIComponent(line)+'"><p class="dialogue-speaker"></p><p></p></div>';}
  function enforce(node){if(!node)return;var line='';try{line=decodeURIComponent(node.dataset.banterLine||'');}catch(_){line=node.dataset.banterLine||'';}var who=node.querySelector('.dialogue-speaker'),body=node.querySelector('p:last-child'),wantWho=speaker(),wantBody='“'+line+'”';if(who&&who.textContent!==wantWho)who.textContent=wantWho;if(body&&body.textContent!==wantBody)body.textContent=wantBody;}
  function refresh(){
    var area=document.getElementById('feedback-area');if(!area)return;
    var wrong=area.querySelector('.monster-taunt:not([data-monster-banter])');
    if(wrong){var line=pick(WRONG,'wrong');wrong.dataset.monsterBanter='true';wrong.dataset.banterKind='wrong';wrong.dataset.banterLine=encodeURIComponent(line);wrong.classList.add('monster-roast');}
    var good=area.querySelector('.feedback.good');
    if(good&&!area.querySelector('.monster-frustrated')){var rightLine=pick(RIGHT,'right');good.insertAdjacentHTML('beforebegin',markup('right','monster-frustrated',rightLine));}
    area.querySelectorAll('[data-monster-banter]').forEach(enforce);
  }
  var observer=new MutationObserver(refresh);
  observer.observe(document.documentElement,{subtree:true,childList:true});
  refresh();
})();

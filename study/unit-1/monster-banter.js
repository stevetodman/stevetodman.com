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
    'That answer needs a map, a flashlight, and possibly a sandwich.',
    'That was terrible. Do it again, I want to laugh twice.'
  ];

  var RIGHT=[
    'Correct. Do not get used to it.',
    'One right answer. ONE. Meanwhile I have had six hundred years of being right.',
    'Fine. But you took forever. I aged. I have new wrinkles because of you.',
    'Correct — and yet somehow still annoying.',
    'Oh, you are proud of that? That was the EASY one.',
    'Yes. That is right. Now wipe that grin off before I eat it.',
    'Anyone could have gotten that. My moss got that. Yesterday.',
    'Correct. Also your shoelace is untied. I am not telling you which one.',
    'Well well. The tiny snack has ONE trick.',
    'You got it right and I still do not like you.',
    'Do not celebrate. Celebrating is for winners, and you have won ONE thing.',
    'Correct. I have written your name down. In my grudge book.',
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
  function markup(extra,line){return '<div class="monster-banter-line '+(extra||'')+'" data-monster-banter="true"><p class="dialogue-speaker"></p><p></p></div>';}
  function fill(node,line){var who=node.querySelector('.dialogue-speaker'),body=node.querySelector('p:last-child');if(who)who.textContent=speaker();if(body)body.textContent='“'+line+'”';}
  function refresh(){
    var area=document.getElementById('feedback-area');if(!area)return;
    var wrong=area.querySelector('.monster-taunt:not([data-monster-banter])');
    if(wrong){var line=pick(WRONG,'wrong');wrong.dataset.monsterBanter='true';wrong.classList.remove('monster-taunt');wrong.classList.add('monster-banter-line','monster-roast');fill(wrong,line);}
    var good=area.querySelector('.feedback.good');
    if(good&&!area.querySelector('.monster-frustrated')){var rightLine=pick(RIGHT,'right');good.insertAdjacentHTML('beforebegin',markup('monster-frustrated',rightLine));fill(area.querySelector('.monster-frustrated'),rightLine);}
  }
  var observer=new MutationObserver(refresh);
  observer.observe(document.documentElement,{subtree:true,childList:true});
  refresh();
})();

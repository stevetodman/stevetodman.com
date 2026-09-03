(function(){
  'use strict';

  var DEFAULT_RATE=.95;
  var cachedVoice=null;

  function normalize(value){return String(value||'').toLowerCase().trim();}
  function shuffle(items){var out=items.slice();for(var i=out.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),tmp=out[i];out[i]=out[j];out[j]=tmp;}return out;}

  function pickVoice(){
    if(cachedVoice)return cachedVoice;
    if(!('speechSynthesis' in window)||!speechSynthesis.getVoices)return null;
    var voices=speechSynthesis.getVoices()||[];
    cachedVoice=voices.find(function(v){return v.lang==='en-US'&&v.localService;})||
      voices.find(function(v){return v.lang==='en-US';})||
      voices.find(function(v){return /^en-US/i.test(v.lang||'');})||
      voices.find(function(v){return /^en/i.test(v.lang||'');})||null;
    return cachedVoice;
  }

  function unavailable(status){if(status)status.textContent='Audio is unavailable. Ask an adult to say the word aloud without showing the spelling.';}

  function speak(word,status){
    if(!('speechSynthesis' in window)||!window.SpeechSynthesisUtterance){unavailable(status);return false;}
    try{
      speechSynthesis.cancel();
      var utterance=new SpeechSynthesisUtterance(String(word||''));
      utterance.lang='en-US';
      utterance.rate=DEFAULT_RATE;
      utterance.pitch=1;
      utterance.volume=1;
      var voice=pickVoice();if(voice)utterance.voice=voice;
      utterance.onerror=function(){unavailable(status);};
      speechSynthesis.speak(utterance);
      return true;
    }catch(_){unavailable(status);return false;}
  }

  function grade(order,answers,errorClassifier){
    var correct=0,items=[];
    order.forEach(function(word,index){
      var given=answers[index]||'',ok=normalize(given)===normalize(word),error=ok?null:errorClassifier(word,given);
      if(ok)correct++;
      items.push({word:word,given:given,correct:ok,error:error});
    });
    return {correct:correct,total:order.length,items:items,misses:items.filter(function(item){return !item.correct;})};
  }

  if('speechSynthesis' in window&&speechSynthesis.addEventListener){speechSynthesis.addEventListener('voiceschanged',function(){cachedVoice=null;pickVoice();});}

  window.WordExpeditionSpelling={normalize:normalize,shuffle:shuffle,speak:speak,grade:grade,rate:DEFAULT_RATE};
})();

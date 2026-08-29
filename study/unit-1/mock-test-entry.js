(function(){
  'use strict';
  var p=new URLSearchParams(location.search),mode=p.get('mode'),ret=p.get('return'),learner=p.get('learner'),started=false;
  function routeBack(){if(ret!=='mastery'||(learner!=='Luke'&&learner!=='Samantha'))return;document.querySelectorAll('a[href^="test-practice.html?learner="]').forEach(function(a){a.href='mastery-quest.html?learner='+encodeURIComponent(learner);a.textContent='Return to Mastery Quest';});}
  function startRequested(){if(started||mode!=='vocabulary')return;var button=document.getElementById('start-vocab');if(button){started=true;button.click();}}
  function scan(){startRequested();routeBack();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(scan,0);});else setTimeout(scan,0);
  new MutationObserver(scan).observe(document.getElementById('mock-app'),{childList:true,subtree:true});
})();

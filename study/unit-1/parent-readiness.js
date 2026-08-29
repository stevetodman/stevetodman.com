(function(){
  'use strict';
  var M=window.WordExpeditionMastery,grid=document.getElementById('readiness-grid');if(!M||!grid)return;
  function esc(v){return String(v).replace(/[&<>'"]/g,function(c){return ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'})[c];});}
  function fmt(ms){var min=Math.max(0,Math.round((Number(ms)||0)/60000));return min?min+' min recorded practice':'No timed practice recorded yet';}
  function domainLabel(d){return {definition:'meaning',synonym:'synonym',antonym:'antonym',spelling:'spelling',pos:'part of speech'}[d]||d;}
  function mockLine(name,type){var m=M.latestMock(name,type);if(!m)return 'No '+type+' mock yet.';return (type==='vocabulary'?'Vocabulary':'Spelling')+' mock: '+m.correct+'/'+m.total+' · '+new Date(m.at).toLocaleDateString();}
  function learnerCard(name){var r=M.readiness(name),weak=M.weakestWords(name,5),errors=M.recentErrors(name,4),allReady=r.vocab===12&&r.spelling===12;
    return '<section class="learner-readiness" data-learner="'+esc(name)+'"><div class="learner-head"><h2>'+esc(name)+'</h2><span class="readiness-badge">'+(allReady?'Test-ready':'Focused practice')+'</span></div>'+ 
      '<div class="meter-grid"><div class="meter"><strong>'+r.vocab+'/12</strong><span>vocabulary ready</span></div><div class="meter"><strong>'+r.spelling+'/12</strong><span>spelling ready</span></div><div class="meter"><strong>'+r.both+'/12</strong><span>ready in both</span></div></div>'+ 
      '<p class="practice-time">'+esc(fmt(M.practiceMs(name)))+'</p>'+ 
      '<p class="subhead">Highest-value next words</p><ul class="weak-list">'+weak.map(function(item){return '<li><strong>'+esc(item.word)+'</strong><span class="skill-pills"><span class="skill-pill '+(item.vocab?'ready':'')+'">vocab '+(item.vocab?'ready':'work')+'</span><span class="skill-pill '+(item.spelling?'ready':'')+'">spelling '+(item.spelling?'ready':'work')+'</span></span></li>';}).join('')+'</ul>'+ 
      '<p class="subhead">Recent misses</p>'+(errors.length?'<ul class="error-list">'+errors.map(function(e){return '<li><span><strong>'+esc(e.word)+'</strong> · '+esc(domainLabel(e.domain))+'</span><span>'+esc(e.error||'miss')+'</span></li>';}).join('')+'</ul>':'<p class="empty-note">No recent misses recorded on this device.</p>')+
      '<p class="subhead">Final mocks</p><ul class="mock-history"><li><span>'+esc(mockLine(name,'vocabulary'))+'</span></li><li><span>'+esc(mockLine(name,'spelling'))+'</span></li></ul>'+ 
      '<div class="learner-actions"><a class="primary-button" href="test-practice.html?learner='+encodeURIComponent(name)+'">Continue practice</a><a class="secondary-button" href="mock-test.html?learner='+encodeURIComponent(name)+'">Run final mock</a></div></section>';
  }
  function render(){grid.innerHTML=learnerCard('Luke')+learnerCard('Samantha');}
  window.addEventListener('wordexpedition:mastery-updated',render);window.addEventListener('storage',render);render();
})();

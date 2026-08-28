from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def replace_once(path, old, new):
    p = ROOT / path
    text = p.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected exactly one match, found {count}')
    p.write_text(text.replace(old, new, 1))


app = 'study/unit-1/app.js'
css = 'study/unit-1/app.css'
test = 'tests/study-game.test.mjs'

replace_once(app, """  function playBankSound(ctx,spec){
    if(!SFX||typeof SFX.play!=='function'||!spec)return null;
    try{return SFX.play(ctx,spec);}catch(_){return null;}
  }
""", """  function playBankSound(ctx,spec){
    if(!SFX||typeof SFX.play!=='function'||!spec)return null;
    try{return SFX.play(ctx,spec);}catch(_){return null;}
  }
  function timedWeaponSample(weapon,item,sample){
    if(!sample)return null;
    var contact=ART.combatProfile(weapon).contact;
    // Bow and wand clips describe launch motion; melee/material clips describe contact.
    // AudioContext scheduling keeps the sample transient aligned with the CSS combat keyframe.
    var delay=(item.sound==='bow'||item.sound==='wand')?Math.min(.06,Math.max(.03,contact*.25)):contact;
    return Object.assign({},sample,{delay:delay});
  }
""")

replace_once(app, """    var item=ART.catalog.find(function(entry){return entry.id===weapon;})||{sound:'blade'};
    var sample=SFX&&SFX.weapon&&SFX.weapon[item.sound];
    try{stopWeaponSound=playBankSound(ctx,sample)||renderWeaponSound(ctx,weapon);}catch(_){try{stopWeaponSound=renderWeaponSound(ctx,weapon);}catch(__){}} // Audio must never block learning.
""", """    var item=ART.catalog.find(function(entry){return entry.id===weapon;})||{sound:'blade'};
    var sample=timedWeaponSample(weapon,item,SFX&&SFX.weapon&&SFX.weapon[item.sound]);
    try{stopWeaponSound=playBankSound(ctx,sample)||renderWeaponSound(ctx,weapon);}catch(_){try{stopWeaponSound=renderWeaponSound(ctx,weapon);}catch(__){}} // Audio must never block learning.
""")

replace_once(app, """<div class=\"fighter enemy-fighter\">'+ART.monster(session.enemy,session.battleState)+'<span class=\"enemy-guard\" aria-hidden=\"true\"></span><span class=\"hit-mark\" aria-hidden=\"true\"></span><span class=\"ground-ripple\" aria-hidden=\"true\"></span></div>""", """<div class=\"fighter enemy-fighter\">'+ART.monster(session.enemy,session.battleState)+'<span class=\"enemy-guard\" aria-hidden=\"true\"></span><span class=\"hit-mark\" aria-hidden=\"true\"></span><span class=\"impact-chip\" aria-hidden=\"true\">✦</span><span class=\"ground-ripple\" aria-hidden=\"true\"></span></div>""")

replace_once(app, """  function setBattleState(kind,message,advance) {
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
""", """  function applyBattleDamageVisual(stage){
    if(!stage||!stage.isConnected||!session)return;
    stage.setAttribute('data-wear',Math.min(3,Math.ceil(session.battleDamage/3)));
    var shields=stage.querySelectorAll('.shield-segment');
    shields.forEach(function(segment,index){segment.classList.toggle('cleared',index<session.battleDamage);});
    var row=stage.querySelector('.shield-row');if(row)row.setAttribute('aria-label',session.battleDamage+' of 10 shield points cleared');
  }
  function pulseQuestionFeedback(kind){
    var card=document.querySelector('.question-card');if(!card)return;
    card.setAttribute('data-feedback',kind);clearTimeout(card._feedbackTimer);
    card._feedbackTimer=setTimeout(function(){if(card.isConnected)card.removeAttribute('data-feedback');},360);
  }
  function setBattleState(kind,message,advance) {
    session.battleState=kind;
    if(advance)session.battleDamage=Math.min(SESSION_LENGTH,session.battleDamage+1);
    var stage=document.getElementById('battle-stage');
    if(!stage)return;
    alignBattleContact(stage);
    stage.setAttribute('data-state',kind);
    var motion=ART.combatProfile(gameProfile(activeName).equipped.weapon);
    clearTimeout(stage._impactTimer);
    if(advance)stage._impactTimer=setTimeout(function(){applyBattleDamageVisual(stage);},Math.max(0,motion.contact*1000));
    else applyBattleDamageVisual(stage);
    var status=document.getElementById('battle-status');if(status)status.textContent=message;
    clearTimeout(stage._battleTimer);
    if(kind!=='victory')stage._battleTimer=setTimeout(function(){if(stage.isConnected&&session){stage.setAttribute('data-state','ready');session.battleState='ready';}},Math.max(520,motion.contact*2000));
  }
  function landHit(kind) {
""")

replace_once(app, """    setBattleState(final?'victory':kind,message,true);
    cancelSpeech();playWeaponSound(gameProfile(activeName).equipped.weapon);
""", """    setBattleState(final?'victory':kind,message,true);
    pulseQuestionFeedback(kind==='recovery'?'recovery':kind==='standard'?'assisted':'correct');
    cancelSpeech();playWeaponSound(gameProfile(activeName).equipped.weapon);
""")

replace_once(app, """    if(correct&&!assisted){session.combo+=1;session.strengthened.add(q.word.word);landHit('critical');}
    else {session.combo=0;if(assisted)landHit('standard');else {cancelSpeech();monsterCounterattack();}}
""", """    if(correct&&!assisted){session.combo+=1;session.strengthened.add(q.word.word);landHit('critical');}
    else {session.combo=0;if(assisted)landHit('standard');else {pulseQuestionFeedback('incorrect');cancelSpeech();monsterCounterattack();}}
""")

replace_once(app, """    var callout=session.combo>=3?session.combo+' in a row!':session.combo===2?'Two in a row!':'Nice work.';
""", """    var callout=session.combo>=3?session.combo+' in a row!':session.combo===2?'Two in a row!':'Direct hit.';
""")

css_path = ROOT / css
css_text = css_path.read_text()
marker = '/* Answer feedback and contact-synchronized impact polish. */'
if marker in css_text:
    raise SystemExit('app.css: polish block already exists')
css_text += r'''

/* Answer feedback and contact-synchronized impact polish. */
.impact-chip { position:absolute;z-index:6;left:38%;top:28%;display:grid;place-items:center;width:24px;height:24px;opacity:0;border:1px solid color-mix(in srgb,var(--effect) 70%,white);border-radius:50%;background:#173526e8;color:var(--effect);font-size:.78rem;font-weight:900;line-height:1;box-shadow:0 0 12px color-mix(in srgb,var(--effect) 58%,transparent);pointer-events:none; }
.battle-stage:is([data-state="critical"],[data-state="standard"],[data-state="recovery"],[data-state="victory"]) .impact-chip { animation:impact-chip .30s cubic-bezier(.2,.8,.2,1) var(--contact) both; }
.question-card[data-feedback="correct"] { animation:answer-confirm .32s ease-out; }
.question-card[data-feedback="incorrect"] { animation:answer-rethink .26s ease-out; }
.question-card:is([data-feedback="assisted"],[data-feedback="recovery"]) { animation:answer-learn .30s ease-out; }
@keyframes impact-chip { 0%{opacity:0;transform:translateY(6px) scale(.55)}28%{opacity:1;transform:translateY(0) scale(1.08)}100%{opacity:0;transform:translateY(-12px) scale(.92)} }
@keyframes answer-confirm { 0%,100%{box-shadow:var(--shadow)}45%{box-shadow:0 0 0 3px #7fae7238,var(--shadow)} }
@keyframes answer-rethink { 0%,100%{transform:none;box-shadow:var(--shadow)}35%{transform:translateX(-2px);box-shadow:0 0 0 3px #c9985330,var(--shadow)}65%{transform:translateX(2px)} }
@keyframes answer-learn { 0%,100%{box-shadow:var(--shadow)}45%{box-shadow:0 0 0 3px #6e9e9c2d,var(--shadow)} }
@media (prefers-reduced-motion:reduce) { .question-card[data-feedback],.impact-chip { animation:none!important;transform:none!important; } }
@media (forced-colors:active) { .impact-chip { border:1px solid CanvasText;background:Canvas;color:CanvasText;box-shadow:none; } }
'''
css_path.write_text(css_text)

insert_before = """test('cloud merge unions session rewards and purchases instead of using last-write-wins', () => {
"""
new_test = r'''test('answer feedback is immediate while combat impact stays contact-synchronized and non-blocking', () => {
  const source = read('study/unit-1/app.js');
  const css = read('study/unit-1/app.css');
  assert.match(source, /function timedWeaponSample\(/);
  assert.match(source, /return Object\.assign\(\{\},sample,\{delay:delay\}\)/);
  assert.match(source, /stage\._impactTimer=setTimeout\(function\(\)\{applyBattleDamageVisual\(stage\);\},Math\.max\(0,motion\.contact\*1000\)\)/);
  assert.match(source, /pulseQuestionFeedback\('incorrect'\)/);
  assert.match(source, /pulseQuestionFeedback\(kind==='recovery'\?'recovery':kind==='standard'\?'assisted':'correct'\)/);
  assert.equal((source.match(/advanceTimer=setTimeout\(nextQuestion,480\)/g)||[]).length,2,'recovery cadence must remain unchanged');
  assert.doesNotMatch(source, /advanceTimer=setTimeout\(nextQuestion,(?:[5-9]\d\d|\d{4,})\)/,'feedback polish must not lengthen recovery');
  assert.match(css, /\.impact-chip/);
  assert.match(css, /\.question-card\[data-feedback="correct"\]/);
  assert.match(css, /prefers-reduced-motion:reduce[^}]*\.question-card\[data-feedback\]/s);
});

test('cloud merge unions session rewards and purchases instead of using last-write-wins', () => {
'''
replace_once(test, insert_before, new_test)

print('Patched Word Expedition feedback and combat timing contract.')

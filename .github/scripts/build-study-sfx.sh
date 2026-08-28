#!/usr/bin/env bash
set -euo pipefail

sudo apt-get update -qq
sudo apt-get install -y -qq ffmpeg >/dev/null

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
mkdir -p "$work/out" study/unit-1/sfx

echo "Fetching sparse CC0 mirrors from GitHub..."
git clone --quiet --depth 1 --filter=blob:none --sparse https://github.com/lospolosadwords-dev/birodalmak.git "$work/biro"
git -C "$work/biro" sparse-checkout set assets/audio/sfx assets/AUDIO_CREDITS.md
git clone --quiet --depth 1 --filter=blob:none --sparse https://github.com/Ethanil/LogicaTactica.git "$work/logica"
git -C "$work/logica" sparse-checkout set assets/Sounds/cc0/80-CC0-creature-SFX assets/AudioResources/SFX

encode() {
  local src="$1" out="$2" dur="$3" fade="$4" tempo="${5:-1.0}"
  test -s "$src" || { echo "Missing source: $src" >&2; exit 1; }
  ffmpeg -y -hide_banner -loglevel error -i "$src" \
    -af "silenceremove=start_periods=1:start_duration=0.001:start_threshold=-45dB,atempo=${tempo},loudnorm=I=-18:TP=-3:LRA=7,apad=pad_dur=0.5,atrim=0:${dur},afade=t=out:st=${fade}:d=0.03" \
    -ac 1 -ar 22050 -c:a libmp3lame -b:a 48k -map_metadata -1 "$out"
}

# Eight weapon/material sounds. The source mirror records each original CC0 pack
# and source filename in assets/AUDIO_CREDITS.md.
encode "$work/biro/assets/audio/sfx/melee_1.mp3"    study/unit-1/sfx/blade.mp3   0.29 0.26
encode "$work/biro/assets/audio/sfx/faith_1.mp3"    study/unit-1/sfx/wand.mp3    0.25 0.22
encode "$work/biro/assets/audio/sfx/building_l1.mp3" study/unit-1/sfx/wood.mp3    0.24 0.21
encode "$work/biro/assets/audio/sfx/pillage_2.mp3"  study/unit-1/sfx/axe.mp3     0.28 0.25 0.90
encode "$work/biro/assets/audio/sfx/arrow_2.mp3"    study/unit-1/sfx/bow.mp3     0.22 0.19
encode "$work/biro/assets/audio/sfx/melee_2.mp3"    study/unit-1/sfx/spear.mp3   0.30 0.27 1.05
encode "$work/biro/assets/audio/sfx/project_1.mp3"  study/unit-1/sfx/hammer.mp3  0.30 0.27 0.90
encode "$work/biro/assets/audio/sfx/melee_3.mp3"    study/unit-1/sfx/scythe.mp3  0.34 0.31 0.94

# Four creature effects from rubberduck's CC0 creature pack. We deliberately use
# only cute/eat/roar families. No scream_* recording is selected or shipped.
encode "$work/logica/assets/Sounds/cc0/80-CC0-creature-SFX/cute_05.ogg" study/unit-1/sfx/troll.mp3 0.31 0.28 0.92
encode "$work/logica/assets/Sounds/cc0/80-CC0-creature-SFX/eat_02.ogg"  study/unit-1/sfx/wisp.mp3  0.28 0.25 1.08
encode "$work/logica/assets/Sounds/cc0/80-CC0-creature-SFX/roar_03.ogg" study/unit-1/sfx/golem.mp3 0.33 0.30 0.88
encode "$work/logica/assets/Sounds/cc0/80-CC0-creature-SFX/roar_03.ogg" study/unit-1/sfx/owl.mp3   0.34 0.31 1.12

echo "Validating final bank..."
count=0
for f in study/unit-1/sfx/*.mp3; do
  count=$((count+1))
  duration="$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$f")"
  channels="$(ffprobe -v error -select_streams a:0 -show_entries stream=channels -of default=noprint_wrappers=1:nokey=1 "$f")"
  rate="$(ffprobe -v error -select_streams a:0 -show_entries stream=sample_rate -of default=noprint_wrappers=1:nokey=1 "$f")"
  bitrate="$(ffprobe -v error -select_streams a:0 -show_entries stream=bit_rate -of default=noprint_wrappers=1:nokey=1 "$f")"
  awk -v d="$duration" 'BEGIN { if (d < 0.150 || d > 0.400) exit 1 }' || { echo "$f duration $duration outside 150-400 ms" >&2; exit 1; }
  test "$channels" = "1" || { echo "$f is not mono" >&2; exit 1; }
  test "$rate" = "22050" || { echo "$f sample rate is $rate" >&2; exit 1; }
  case "$bitrate" in 48000|47999|48001) ;; *) echo "$f bitrate is $bitrate" >&2; exit 1;; esac
  printf '%s: %ss, mono, %s Hz, %s bps\n' "$(basename "$f")" "$duration" "$rate" "$bitrate"
done
test "$count" -eq 12 || { echo "Expected 12 clips, got $count" >&2; exit 1; }

cat > study/unit-1/sfx-bank.js <<'JS'
(function () {
  'use strict';

  var BASE='/study/unit-1/sfx/';
  var FILES={
    blade:'blade.mp3',wand:'wand.mp3',wood:'wood.mp3',axe:'axe.mp3',
    bow:'bow.mp3',spear:'spear.mp3',hammer:'hammer.mp3',scythe:'scythe.mp3',
    troll:'troll.mp3',wisp:'wisp.mp3',golem:'golem.mp3',owl:'owl.mp3'
  };
  var GAINS={blade:.62,wand:.50,wood:.58,axe:.62,bow:.50,spear:.60,hammer:.62,scythe:.58,troll:.43,wisp:.40,golem:.44,owl:.42};
  var decoded=Object.create(null),loading=Object.create(null);

  function decode(ctx,name){
    if(decoded[name])return Promise.resolve(decoded[name]);
    if(loading[name])return loading[name];
    if(!FILES[name])return Promise.reject(new Error('Unknown battle sample'));
    loading[name]=fetch(BASE+FILES[name],{cache:'force-cache'}).then(function(response){
      if(!response.ok)throw new Error('Battle sample '+response.status);
      return response.arrayBuffer();
    }).then(function(bytes){
      return new Promise(function(resolve,reject){
        var settled=false;
        function ok(buffer){if(settled)return;settled=true;resolve(buffer);}
        function bad(error){if(settled)return;settled=true;reject(error);}
        try{
          var result=ctx.decodeAudioData(bytes,ok,bad);
          if(result&&typeof result.then==='function')result.then(ok,bad);
        }catch(error){bad(error);}
      });
    }).then(function(buffer){decoded[name]=buffer;delete loading[name];return buffer;},function(error){delete loading[name];throw error;});
    loading[name].catch(function(){});
    return loading[name];
  }

  function warm(ctx){
    if(!ctx)return;
    Object.keys(FILES).forEach(function(name){decode(ctx,name);});
  }

  function play(ctx,spec){
    if(!ctx||ctx.state!=='running'||!spec)return null;
    if(typeof spec==='string')spec={clip:spec};
    var buffer=decoded[spec.clip];
    if(!buffer){if(FILES[spec.clip])decode(ctx,spec.clip);return null;}
    var source=ctx.createBufferSource(),gain=ctx.createGain(),done=false;
    source.buffer=buffer;
    source.playbackRate.value=Number(spec.rate)||1;
    gain.gain.value=(GAINS[spec.clip]||.5)*(Number(spec.gain)||1);
    source.connect(gain);gain.connect(ctx.destination);
    function cleanup(){
      if(done)return;done=true;
      try{source.disconnect();}catch(_){}
      try{gain.disconnect();}catch(_){}
    }
    source.onended=cleanup;
    source.start(ctx.currentTime+(Number(spec.delay)||0));
    return function(){try{source.stop();}catch(_){}cleanup();};
  }

  window.WordExpeditionSfxBank={
    version:1,
    clipCount:12,
    warm:warm,
    play:play,
    weapon:{
      blade:{clip:'blade'},wand:{clip:'wand'},wood:{clip:'wood'},axe:{clip:'axe'},
      bow:{clip:'bow'},spear:{clip:'spear'},hammer:{clip:'hammer'},scythe:{clip:'scythe'}
    },
    creature:{
      mossling:{clip:'troll'},wisp:{clip:'wisp'},sentinel:{clip:'golem'},boss:{clip:'owl'}
    }
  };

  function primeBank(){
    try{if(localStorage.getItem('studyhub-weapon-sounds')==='off')return;}catch(_){}
    try{
      var Audio=window.AudioContext||window.webkitAudioContext;
      if(!Audio)return;
      var ctx=new Audio();
      function ready(){window.WordExpeditionSfxBank.warm(ctx);}
      if(ctx.state==='running')ready();
      else if(typeof ctx.resume==='function'){
        var resumed=ctx.resume();
        if(resumed&&typeof resumed.then==='function')resumed.then(ready).catch(function(){});
      }
    }catch(_){}
  }

  ['pointerdown','touchstart','keydown','click'].forEach(function(eventName){
    document.addEventListener(eventName,primeBank,{capture:true,passive:true});
  });
})();
JS

python3 <<'PY'
from pathlib import Path

p=Path('study/unit-1/app.js')
s=p.read_text()
old="var weaponAudio=null,stopWeaponSound=null,stopCreatureSound=null,weaponSoundsEnabled=true;"
if 'var SFX=window.WordExpeditionSfxBank||null;' not in s:
    assert s.count(old)==1
    s=s.replace(old,old+"\n  var SFX=window.WordExpeditionSfxBank||null;")
old_resume="""      if(weaponAudio.state==='suspended')weaponAudio.resume().catch(function(){});
      return weaponAudio;"""
new_resume="""      if(weaponAudio.state==='suspended')weaponAudio.resume().catch(function(){});
      if(weaponAudio.state==='running'&&SFX&&typeof SFX.warm==='function')SFX.warm(weaponAudio);
      return weaponAudio;"""
if new_resume not in s:
    assert s.count(old_resume)==1
    s=s.replace(old_resume,new_resume)
marker="  // Short synthesized foley: swept air + inharmonic metal; the wand uses bell tones."
helper="""  function playBankSound(ctx,spec){
    if(!SFX||typeof SFX.play!=='function'||!spec)return null;
    try{return SFX.play(ctx,spec);}catch(_){return null;}
  }
"""
if helper not in s:
    assert s.count(marker)==1
    s=s.replace(marker,helper+marker)
old_weapon="""  function playWeaponSound(weapon){
    silenceWeapon();
    var ctx=warmWeaponAudio();
    if(!ctx||ctx.state!=='running'||document.hidden)return;
    try{stopWeaponSound=renderWeaponSound(ctx,weapon);}catch(_){} // Audio must never block learning.
  }"""
new_weapon="""  function playWeaponSound(weapon){
    silenceWeapon();
    var ctx=warmWeaponAudio();
    if(!ctx||ctx.state!=='running'||document.hidden)return;
    var item=ART.catalog.find(function(entry){return entry.id===weapon;})||{sound:'blade'};
    var sample=SFX&&SFX.weapon&&SFX.weapon[item.sound];
    try{stopWeaponSound=playBankSound(ctx,sample)||renderWeaponSound(ctx,weapon);}catch(_){try{stopWeaponSound=renderWeaponSound(ctx,weapon);}catch(__){}} // Audio must never block learning.
  }"""
if new_weapon not in s:
    assert s.count(old_weapon)==1
    s=s.replace(old_weapon,new_weapon)
old_creature="""  function playCreatureSound(kind,armor){
    silenceCreature();var ctx=warmWeaponAudio();if(!ctx||ctx.state!=='running'||document.hidden)return;
    try{stopCreatureSound=renderCreatureSound(ctx,kind,armor);}catch(_){}
  }"""
new_creature="""  function playCreatureSound(kind,armor){
    silenceCreature();var ctx=warmWeaponAudio();if(!ctx||ctx.state!=='running'||document.hidden)return;
    var sample=SFX&&SFX.creature&&SFX.creature[kind];
    try{stopCreatureSound=playBankSound(ctx,sample)||renderCreatureSound(ctx,kind,armor);}catch(_){try{stopCreatureSound=renderCreatureSound(ctx,kind,armor);}catch(__){}}
  }"""
if new_creature not in s:
    assert s.count(old_creature)==1
    s=s.replace(old_creature,new_creature)
p.write_text(s)

for name in ['study/index.html','study/unit-1/index.html']:
    p=Path(name); s=p.read_text()
    s=s.replace('  <script src="/study/unit-1/sfx-bank-weapons.js"></script>\n  <script src="/study/unit-1/sfx-bank-creatures.js"></script>', '  <script src="/study/unit-1/sfx-bank.js"></script>')
    s=s.replace('  <script src="sfx-bank-weapons.js"></script>\n  <script src="sfx-bank-creatures.js"></script>', '  <script src="sfx-bank.js"></script>')
    assert 'sfx-bank-weapons' not in s and 'sfx-bank-creatures' not in s and 'sfx-bank.js' in s
    p.write_text(s)

p=Path('study/ATTRIBUTIONS.md'); s=p.read_text()
start=s.index('## Word Expedition battle audio')
end=s.index('## Word Expedition game artwork')
section="""## Word Expedition battle audio

Battle effects use a deliberately small **12-clip** local sample bank so mobile Safari has little to fetch or decode. Every shipped clip is **CC0 1.0 / public domain**, trimmed to **150–400 ms**, mono **22.05 kHz**, **48 kbps MP3**, and loudness-normalized. Decoding begins on the same user gesture that unlocks the shared iPhone/desktop AudioContext. Until a sample is decoded—or if fetch/decode ever fails—the existing Web Audio synthesizer plays immediately instead, so audio can never delay a learning interaction.

No scream, flesh-impact, or gunshot recording is selected or shipped.

Sources (CC0 does not require attribution, but exact provenance is recorded):

- **rubberduck — 80 CC0 RPG SFX** (OpenGameArt, CC0 1.0): `blade_01.ogg`, `blade_02.ogg`, `blade_03.ogg`, `item_gem_01.ogg`, and `wood_02.ogg` — blade/spear/scythe, magic, and wood/axe layers. Source: https://opengameart.org/content/80-cc0-rpg-sfx
- **Kenney — RPG Audio** (CC0 1.0): `Audio/chop.ogg` — staff/wood contact. Source: https://kenney.nl/assets/rpg-audio
- **artisticdude — Swishes Sound Pack** (OpenGameArt, CC0 1.0): `swishes/swish-7.wav` — bow/whoosh. Source: https://opengameart.org/content/swishes-sound-pack
- **rubberduck — 100 CC0 SFX #2** (OpenGameArt, CC0 1.0): `sfx100v2_metal_04.ogg` — hammer/metal impact. Source: https://opengameart.org/content/100-cc0-sfx-2
- **rubberduck — 80 CC0 creature SFX** (OpenGameArt, CC0 1.0): `cute_05.ogg`, `eat_02.ogg`, and `roar_03.ogg` — four short creature effects are derived only from these kid-safe families. `scream_*` files from the source pack are intentionally not used. Source: https://opengameart.org/content/80-cc0-creature-sfx

The final MP3 files live under `study/unit-1/sfx/`; there are no runtime third-party audio requests. Word/sentence audio remains the browser speech synthesizer.

"""
p.write_text(s[:start]+section+s[end:])
PY

node --check study/unit-1/sfx-bank.js
node --check study/unit-1/app.js
git diff --check
npm ci --no-audit --no-fund
npx playwright install --with-deps chromium >/dev/null
npm run test:study:unit
npm run test:study:smoke
npm run build

git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
git add study/unit-1/sfx study/unit-1/sfx-bank.js study/unit-1/app.js study/index.html study/unit-1/index.html study/ATTRIBUTIONS.md
git commit -m "Finish sample-first battle audio bank"
git push origin HEAD:agent/word-expedition-battle-sfx

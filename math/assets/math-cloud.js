(function(){
  "use strict";
  var CLOUD_URL="https://lpjvsjezjjasgpkvjjlq.supabase.co/functions/v1/studyhub-save";
  var DATA_KEY="mathmission.m1.v1",TOKEN_KEY="studyhubCloudToken",LEGACY_TOKEN_KEY="usStatesCloudToken";
  var ENABLED=location.protocol==="https:"&&/(^|\.)stevetodman\.com$/i.test(location.hostname);
  var PROFILES={luke:"math-mission-luke",samantha:"math-mission-samantha"};
  var VALID_SKILLS=["place","forms","round","addsub","multiply","divide"];
  var VALID_MICROS=["place_digit","place_value","powers_multiply","powers_divide","metric_conversion","decimal_forms","decimal_compare","decimal_round","decimal_add","decimal_subtract","decimal_multiply","decimal_divide"];
  var VALID_MISCONCEPTIONS=["wrong_direction","wrong_shift_count","place_value_result","place_identification","digit_value","unit_scale_relation","decimal_form_place_value","comparison_relation","rounding_rule","addition_place_value_or_computation","subtraction_place_value_or_computation","multiplication_place_value_or_computation","division_place_value_or_computation","unknown_misconception"];
  var status=ENABLED?"loading":"local",timer=null,inFlight=false,queued=false,lastLocal="";

  function isObj(v){return !!v&&typeof v==="object"&&!Array.isArray(v)}
  function read(){try{return JSON.parse(localStorage.getItem(DATA_KEY))||{}}catch(_){return {}}}
  function write(data){try{localStorage.setItem(DATA_KEY,JSON.stringify(data));lastLocal=localStorage.getItem(DATA_KEY)||""}catch(_){}}
  function token(){try{var t=localStorage.getItem(TOKEN_KEY)||localStorage.getItem(LEGACY_TOKEN_KEY);if(t&&!localStorage.getItem(TOKEN_KEY))localStorage.setItem(TOKEN_KEY,t);return t}catch(_){return null}}
  function validToken(t){return !!t&&(/^[0-9a-f]{48}$/i.test(t)||(t.length>=20&&t.length<=200&&/^[A-Za-z0-9_-]+$/.test(t)))}
  function adoptHash(){var m=/(?:^|[#&])k=([^&]+)/.exec(location.hash||"");if(!m)return false;var t;try{t=decodeURIComponent(m[1]).trim()}catch(_){return false}if(!validToken(t))return false;try{localStorage.setItem(TOKEN_KEY,t);history.replaceState(null,"",location.pathname+location.search)}catch(_){}return true}
  function statusText(){if(!ENABLED)return "Saved on this device";if(status==="saving"||status==="loading")return "☁ Syncing…";if(status==="saved")return "☁ Saved on all devices";if(status==="unlinked")return "Saved here · family link needed";if(status==="capacity")return "Saved here · cloud storage full";return "Offline · saved on this device"}
  function setStatus(next){status=next;document.querySelectorAll("[data-math-cloud-status]").forEach(function(el){el.textContent=statusText();el.dataset.state=status})}
  function request(data){return fetch(CLOUD_URL,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(data)}).then(function(res){return res.json().then(function(body){if(!res.ok){var e=new Error(body.error||("cloud "+res.status));e.status=res.status;throw e}return body})})}
  function safeId(v){return String(v||"").replace(/[^A-Za-z0-9_-]/g,"").slice(0,40)}
  function safeMisconception(v){return VALID_MISCONCEPTIONS.indexOf(v)>=0?v:""}
  function attemptById(profile,id){return profile.attempts.find(function(a){return safeId(a.cloudId)===id})}

  function payload(){
    var local=read(),out={},changed=false;
    Object.keys(PROFILES).forEach(function(name){
      var p=isObj(local[name])?local[name]:{},stats={};
      (Array.isArray(p.attempts)?p.attempts:[]).forEach(function(a,i){
        if(!isObj(a)||VALID_SKILLS.indexOf(a.skill)<0)return;
        var date=/^\d{4}-\d{2}-\d{2}$/.test(a.date)?a.date:"unknown",at=Number(a.at)||0,id=safeId(a.cloudId),misconception=safeMisconception(a.misconception);
        if(!id){id=at+"-"+i;a.cloudId=id;changed=true}
        var key;
        if(VALID_MICROS.indexOf(a.micro)>=0&&misconception){
          key=["math1d",a.skill,a.micro,a.correct?1:0,a.assisted?1:0,a.recovery?1:0,Math.max(1,Math.min(3,Number(a.difficulty)||1)),a.transfer?1:0,a.recheck?1:0,misconception,date,at,id].join("|");
        }else if(VALID_MICROS.indexOf(a.micro)>=0){
          key=[a.recheck?"math1c":"math1b",a.skill,a.micro,a.correct?1:0,a.assisted?1:0,a.recovery?1:0,Math.max(1,Math.min(3,Number(a.difficulty)||1)),a.transfer?1:0,a.recheck?1:0,date,at,id].filter(function(part,index){return a.recheck||index!==8}).join("|");
        }else{
          key=["math1a",a.skill,a.correct?1:0,a.transfer?1:0,date,at,id].join("|");
        }
        stats[key]={streak:1,correct:a.correct?1:0,wrong:a.correct?0:1,mastered:true};
      });
      stats.math1sessions={streak:Number(p.sessions)||0,correct:Number(p.sessions)||0,wrong:0,mastered:false};
      if(p.diagnostic)stats[p.diagnosticVersion===2?"math1diagnostic2":"math1diagnostic"]={streak:1,correct:1,wrong:0,mastered:true};
      out[PROFILES[name]]={stateStats:stats,masteredOrder:[]};
    });
    if(changed)write(local);return out;
  }

  function apply(remote){
    if(!isObj(remote))return;var local=read();
    Object.keys(PROFILES).forEach(function(name){
      var profile=remote[PROFILES[name]],stats=isObj(profile)&&isObj(profile.stateStats)?profile.stateStats:null;if(!stats)return;
      var p=isObj(local[name])?local[name]:{diagnostic:false,diagnosticVersion:0,attempts:[],sessions:0};p.attempts=Array.isArray(p.attempts)?p.attempts:[];
      var seen=new Set(p.attempts.map(function(a,i){return safeId(a.cloudId)||((Number(a.at)||0)+"-"+i)}));
      Object.keys(stats).forEach(function(key){
        var st=stats[key]||{},parts=key.split("|");
        if(key==="math1diagnostic"&&st.mastered)p.diagnostic=true;
        else if(key==="math1diagnostic2"&&st.mastered){p.diagnostic=true;p.diagnosticVersion=2}
        else if(key==="math1sessions")p.sessions=Math.max(Number(p.sessions)||0,Number(st.correct)||0,Number(st.streak)||0);
        else if(parts[0]==="math1a"&&parts.length===7&&VALID_SKILLS.indexOf(parts[1])>=0&&st.mastered){
          var legacyId=safeId(parts[6]);if(!legacyId||seen.has(legacyId))return;seen.add(legacyId);
          p.attempts.push({skill:parts[1],correct:parts[2]==="1",transfer:parts[3]==="1",date:/^\d{4}-\d{2}-\d{2}$/.test(parts[4])?parts[4]:"unknown",at:Number(parts[5])||0,cloudId:legacyId});
        }else if(parts[0]==="math1b"&&parts.length===11&&VALID_SKILLS.indexOf(parts[1])>=0&&VALID_MICROS.indexOf(parts[2])>=0&&st.mastered){
          var id=safeId(parts[10]);if(!id||seen.has(id))return;seen.add(id);
          p.attempts.push({skill:parts[1],micro:parts[2],correct:parts[3]==="1",assisted:parts[4]==="1",recovery:parts[5]==="1",difficulty:Math.max(1,Math.min(3,Number(parts[6])||1)),transfer:parts[7]==="1",date:/^\d{4}-\d{2}-\d{2}$/.test(parts[8])?parts[8]:"unknown",at:Number(parts[9])||0,cloudId:id});
        }else if(parts[0]==="math1c"&&parts.length===12&&VALID_SKILLS.indexOf(parts[1])>=0&&VALID_MICROS.indexOf(parts[2])>=0&&st.mastered){
          var recheckId=safeId(parts[11]);if(!recheckId||seen.has(recheckId))return;seen.add(recheckId);
          p.attempts.push({skill:parts[1],micro:parts[2],correct:parts[3]==="1",assisted:parts[4]==="1",recovery:parts[5]==="1",difficulty:Math.max(1,Math.min(3,Number(parts[6])||1)),transfer:parts[7]==="1",recheck:parts[8]==="1",date:/^\d{4}-\d{2}-\d{2}$/.test(parts[9])?parts[9]:"unknown",at:Number(parts[10])||0,cloudId:recheckId});
        }else if(parts[0]==="math1d"&&parts.length===13&&VALID_SKILLS.indexOf(parts[1])>=0&&VALID_MICROS.indexOf(parts[2])>=0&&safeMisconception(parts[9])&&st.mastered){
          var evidenceId=safeId(parts[12]);if(!evidenceId)return;
          if(seen.has(evidenceId)){
            var existing=attemptById(p,evidenceId);if(existing&&!existing.misconception)existing.misconception=parts[9];
            return;
          }
          seen.add(evidenceId);
          p.attempts.push({skill:parts[1],micro:parts[2],correct:parts[3]==="1",assisted:parts[4]==="1",recovery:parts[5]==="1",difficulty:Math.max(1,Math.min(3,Number(parts[6])||1)),transfer:parts[7]==="1",recheck:parts[8]==="1",misconception:parts[9],date:/^\d{4}-\d{2}-\d{2}$/.test(parts[10])?parts[10]:"unknown",at:Number(parts[11])||0,cloudId:evidenceId});
        }
      });
      p.attempts.sort(function(a,b){return (Number(a.at)||0)-(Number(b.at)||0)});local[name]=p;
    });
    write(local);window.dispatchEvent(new CustomEvent("mathmission:cloud-updated"));
  }

  function handleError(e){setStatus(e&&e.status===403?"unlinked":e&&e.status===413?"capacity":"offline")}
  function pull(){if(!ENABLED)return Promise.resolve(false);var t=token();if(!t){setStatus("unlinked");return Promise.resolve(false)}setStatus("loading");return request({token:t,action:"pull"}).then(function(res){if(res.found)apply(res.data);setStatus(res.found?"saved":"unlinked");return !!res.found}).catch(function(e){handleError(e);return false})}
  function push(){if(!ENABLED)return Promise.resolve(false);var t=token();if(!t){setStatus("unlinked");return Promise.resolve(false)}if(inFlight){queued=true;return Promise.resolve(false)}inFlight=true;setStatus("saving");return request({token:t,action:"push",data:payload()}).then(function(res){apply(res.data);setStatus("saved");return true}).catch(function(e){handleError(e);return false}).then(function(ok){inFlight=false;if(queued){queued=false;schedule(0)}return ok})}
  function schedule(delay){if(!ENABLED)return;clearTimeout(timer);timer=setTimeout(function(){timer=null;push()},delay===undefined?700:delay)}
  function share(){var t=token();if(!t){alert("This device is not linked yet. Open the private family link on this device first.");return}var url=location.origin+"/math/#k="+encodeURIComponent(t);if(navigator.share){navigator.share({title:"Math Mission family link",text:"Open this private link on the other family device.",url:url}).catch(function(){})}else if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(url).then(function(){alert("Private family link copied. Open it on the other device.")}).catch(function(){prompt("Copy this private family link:",url)})}else prompt("Copy this private family link:",url)}
  function watch(){lastLocal=localStorage.getItem(DATA_KEY)||"";setInterval(function(){if(document.hidden)return;var now=localStorage.getItem(DATA_KEY)||"";if(now!==lastLocal){lastLocal=now;schedule()}},750)}

  adoptHash();watch();window.addEventListener("online",function(){pull().then(function(found){if(found)schedule(0)})});document.addEventListener("visibilitychange",function(){if(!document.hidden)pull()});window.MathMissionCloud={status:function(){return status},statusText:statusText,pull:pull,push:push,share:share,payload:payload,apply:apply};pull().then(function(found){if(found)schedule(0)});
})();
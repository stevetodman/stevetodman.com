(function(){
  "use strict";
  var CLOUD_URL="https://lpjvsjezjjasgpkvjjlq.supabase.co/functions/v1/studyhub-save";
  var DATA_KEY="mathmission.m1.v1",GAME_KEY="mathmission.starship.v1",TOKEN_KEY="studyhubCloudToken",LEGACY_TOKEN_KEY="usStatesCloudToken";
  var ENABLED=location.protocol==="https:"&&/(^|\.)stevetodman\.com$/i.test(location.hostname);
  var PROFILES={luke:"math-mission-luke",samantha:"math-mission-samantha"};
  var VALID_SKILLS=["place","forms","round","addsub","multiply","divide"];
  var VALID_MICROS=["place_digit","place_value","powers_multiply","powers_divide","metric_conversion","decimal_forms","decimal_compare","decimal_round","decimal_add","decimal_subtract","decimal_multiply","decimal_divide"];
  var VALID_ARCHETYPES=["division_units","division_decompose","division_scale_relation","division_reasonableness","division_model","division_algorithm","division_regroup","division_error_analysis","division_word_one_step","division_multistep","division_context_result","tape_diagram_transfer","metric_embedded"];
  var VALID_MISCONCEPTIONS=["place_sequence","digit_vs_value","place_value","power10_direction","power10_shift_count","power10_structure","metric_direction","metric_scale","expanded_form_notation","expanded_place_value","decimal_compare_place_value","rounding_truncated","rounding_place","decimal_alignment","decimal_magnitude","operation_arithmetic","multistep_skipped_subtraction","multistep_sequence","recheck_strategy","division_decomposition","division_unit_to_value","division_regrouping","division_model_interpretation","division_quantity_roles","division_context_unit","division_error_analysis"];
  var STARSHIP_HULLS=["comet-scout","solar-wing","nebula-runner","lunar-dart","eclipse-cruiser","nova-spear","starlight-voyager"],STARSHIP_TRAILS=["ion-wake","meteor-wake","aurora-wake","plasma-ribbon","comet-dust","prism-wake","hyperspace-wake"],STARSHIP_COMPANIONS=["none","orbit-bot","beacon-drone","mini-rover","astro-cat","satellite-scout","alien-orb"];
  var STARSHIP_PURCHASES=STARSHIP_HULLS.slice(1).concat(STARSHIP_TRAILS.slice(1),STARSHIP_COMPANIONS.slice(1));
  var status=ENABLED?"loading":"local",timer=null,inFlight=false,queued=false,lastLocal="",lastGameLocal="";

  function isObj(v){return !!v&&typeof v==="object"&&!Array.isArray(v)}
  function read(){try{return JSON.parse(localStorage.getItem(DATA_KEY))||{}}catch(_){return {}}}
  function write(data){try{localStorage.setItem(DATA_KEY,JSON.stringify(data));lastLocal=localStorage.getItem(DATA_KEY)||""}catch(_){}}
  function readGame(){try{return JSON.parse(localStorage.getItem(GAME_KEY))||{}}catch(_){return {}}}
  function writeGame(data){try{localStorage.setItem(GAME_KEY,JSON.stringify(data));lastGameLocal=localStorage.getItem(GAME_KEY)||""}catch(_){}}
  function token(){try{var t=localStorage.getItem(TOKEN_KEY)||localStorage.getItem(LEGACY_TOKEN_KEY);if(t&&!localStorage.getItem(TOKEN_KEY))localStorage.setItem(TOKEN_KEY,t);return t}catch(_){return null}}
  function validToken(t){return !!t&&(/^[0-9a-f]{48}$/i.test(t)||(t.length>=20&&t.length<=200&&/^[A-Za-z0-9_-]+$/.test(t)))}
  function adoptHash(){var m=/(?:^|[#&])k=([^&]+)/.exec(location.hash||"");if(!m)return false;var t;try{t=decodeURIComponent(m[1]).trim()}catch(_){return false}if(!validToken(t))return false;try{localStorage.setItem(TOKEN_KEY,t);history.replaceState(null,"",location.pathname+location.search)}catch(_){}return true}
  function statusText(){if(!ENABLED)return "Saved on this device";if(status==="saving"||status==="loading")return "☁ Syncing…";if(status==="saved")return "☁ Saved on all devices";if(status==="unlinked")return "Saved here · family link needed";if(status==="capacity")return "Saved here · cloud storage full";return "Offline · saved on this device"}
  function setStatus(next){status=next;document.querySelectorAll("[data-math-cloud-status]").forEach(function(el){el.textContent=statusText();el.dataset.state=status})}
  function request(data){return fetch(CLOUD_URL,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(data)}).then(function(res){return res.json().then(function(body){if(!res.ok){var e=new Error(body.error||("cloud "+res.status));e.status=res.status;throw e}return body})})}
  function safeId(v){return String(v||"").replace(/[^A-Za-z0-9_-]/g,"").slice(0,40)}
  function encodeMeta(value){try{return btoa(unescape(encodeURIComponent(JSON.stringify(value)))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"")}catch(_){return ""}}
  function decodeMeta(value){try{var text=String(value||"").replace(/-/g,"+").replace(/_/g,"/");while(text.length%4)text+="=";var parsed=JSON.parse(decodeURIComponent(escape(atob(text))));return isObj(parsed)?parsed:null}catch(_){return null}}
  function evidenceMeta(a){return {evidenceVersion:Number(a.evidenceVersion)||0,sessionId:safeId(a.sessionId),questionId:safeId(a.questionId),itemVersion:Number(a.itemVersion)||0,seed:Number(a.seed)||0,familyId:String(a.familyId||"").slice(0,80),fingerprint:String(a.fingerprint||"").slice(0,80),target:String(a.target||"").slice(0,80),transferKind:String(a.transferKind||"routine").slice(0,24),representation:String(a.representation||"symbolic").slice(0,32),contextStructure:String(a.contextStructure||"none").slice(0,40),scaffoldShown:!!a.scaffoldShown,instructionAt:Number(a.instructionAt)||0,reviewedAt:Number(a.reviewedAt)||0,responseMode:String(a.responseMode||"").slice(0,20),responseCode:String(a.responseCode||"").slice(0,800),coverage:Array.isArray(a.coverage)?a.coverage.map(String).slice(0,8):[],coverageRequired:Array.isArray(a.coverageRequired)?a.coverageRequired.map(String).slice(0,8):[],diagnosisCandidates:Array.isArray(a.diagnosisCandidates)?a.diagnosisCandidates.map(String).slice(0,2):[],diagnosisConfidence:String(a.diagnosisConfidence||"undifferentiated").slice(0,20),recoveryOf:safeId(a.recoveryOf),retrieval:!!a.retrieval,testRun:!!a.testRun,repairOnly:!!a.repairOnly,evidenceConflict:!!a.evidenceConflict}}
  function mergeEvidence(local,remote){
    if(!isObj(remote))return local;var out=Object.assign({},local),conflict=!!local.evidenceConflict||!!remote.evidenceConflict;
    ["evidenceVersion","itemVersion","instructionAt","reviewedAt"].forEach(function(key){out[key]=Math.max(Number(local[key])||0,Number(remote[key])||0)});
    ["scaffoldShown","retrieval","testRun","repairOnly"].forEach(function(key){out[key]=!!local[key]||!!remote[key]});
    var localCoverage=Array.isArray(local.coverage)?local.coverage.map(String):[],remoteCoverage=Array.isArray(remote.coverage)?remote.coverage.map(String):[];
    out.coverage=localCoverage.length&&remoteCoverage.length?localCoverage.filter(function(value){return remoteCoverage.indexOf(value)>=0}):localCoverage.length?localCoverage:remoteCoverage;
    out.coverageRequired=[].concat(Array.isArray(local.coverageRequired)?local.coverageRequired:[],Array.isArray(remote.coverageRequired)?remote.coverageRequired:[]).map(String).filter(function(value,index,array){return array.indexOf(value)===index}).slice(0,8);
    out.diagnosisCandidates=[].concat(Array.isArray(local.diagnosisCandidates)?local.diagnosisCandidates:[],Array.isArray(remote.diagnosisCandidates)?remote.diagnosisCandidates:[]).map(String).filter(function(value,index,array){return array.indexOf(value)===index}).slice(0,2);
    ["sessionId","questionId","seed","familyId","fingerprint","target","transferKind","representation","contextStructure","responseMode","responseCode","diagnosisConfidence","recoveryOf"].forEach(function(key){var before=local[key],incoming=remote[key];if((before===undefined||before===null||before===""||before===0)&&incoming!==undefined&&incoming!==null&&incoming!=="")out[key]=incoming;else if(incoming!==undefined&&incoming!==null&&incoming!==""&&String(before)!==String(incoming))conflict=true});
    if(conflict){out.evidenceConflict=true;out.coverage=[];out.transferKind="routine";out.diagnosisConfidence="undifferentiated";out.scaffoldShown=true}
    return out;
  }
  function starshipDefault(){return {version:1,purchases:{},equipped:{hull:"comet-scout",trail:"ion-wake",companion:"none"},updatedAt:0}}
  function starshipProfile(root,name){var profiles=isObj(root)&&isObj(root.profiles)?root.profiles:{};var raw=isObj(profiles[name])?profiles[name]:{},out=starshipDefault();var purchases=isObj(raw.purchases)?raw.purchases:{};Object.keys(purchases).forEach(function(id){if(STARSHIP_PURCHASES.indexOf(id)<0)return;var rec=isObj(purchases[id])?purchases[id]:{};out.purchases[id]={at:Math.max(0,Math.floor(Number(rec.at)||0))}});var equipped=isObj(raw.equipped)?raw.equipped:{};if(STARSHIP_HULLS.indexOf(equipped.hull)>=0)out.equipped.hull=equipped.hull;if(STARSHIP_TRAILS.indexOf(equipped.trail)>=0)out.equipped.trail=equipped.trail;if(STARSHIP_COMPANIONS.indexOf(equipped.companion)>=0)out.equipped.companion=equipped.companion;out.updatedAt=Math.max(0,Math.floor(Number(raw.updatedAt)||0));return out}

  function payload(){
    var local=read(),game=readGame(),out={},changed=false;
    Object.keys(PROFILES).forEach(function(name){
      var p=isObj(local[name])?local[name]:{},stats={};
      (Array.isArray(p.attempts)?p.attempts:[]).forEach(function(a,i){
        if(!isObj(a)||VALID_SKILLS.indexOf(a.skill)<0)return;
        var date=/^\d{4}-\d{2}-\d{2}$/.test(a.date)?a.date:"unknown",at=Number(a.at)||0,id=safeId(a.cloudId);
        if(!id){id=at+"-"+i;a.cloudId=id;changed=true}
        var misconception=VALID_MISCONCEPTIONS.indexOf(a.misconception)>=0?a.misconception:"";
        var archetype=VALID_ARCHETYPES.indexOf(a.assessmentArchetype)>=0?a.assessmentArchetype:"";
        var key;
        if(VALID_MICROS.indexOf(a.micro)>=0&&archetype){
          key=["math1e",a.skill,a.micro,archetype,a.correct?1:0,a.assisted?1:0,a.recovery?1:0,Math.max(1,Math.min(3,Number(a.difficulty)||1)),a.transfer?1:0,a.recheck?1:0,misconception,date,at,id].join("|");
        }else if(VALID_MICROS.indexOf(a.micro)>=0&&misconception){
          key=["math1d",a.skill,a.micro,a.correct?1:0,a.assisted?1:0,a.recovery?1:0,Math.max(1,Math.min(3,Number(a.difficulty)||1)),a.transfer?1:0,a.recheck?1:0,misconception,date,at,id].join("|");
        }else if(VALID_MICROS.indexOf(a.micro)>=0){
          key=[a.recheck?"math1c":"math1b",a.skill,a.micro,a.correct?1:0,a.assisted?1:0,a.recovery?1:0,Math.max(1,Math.min(3,Number(a.difficulty)||1)),a.transfer?1:0,a.recheck?1:0,date,at,id].filter(function(part,index){return a.recheck||index!==8}).join("|");
        }else{
          key=["math1a",a.skill,a.correct?1:0,a.transfer?1:0,date,at,id].join("|");
        }
        stats[key]={streak:1,correct:a.correct?1:0,wrong:a.correct?0:1,mastered:true};
        if(Number(a.evidenceVersion)>=2){var encoded=encodeMeta(evidenceMeta(a));if(encoded)stats[["math1m",id,encoded].join("|")]={streak:1,correct:1,wrong:0,mastered:true}}
      });
      stats.math1sessions={streak:Number(p.sessions)||0,correct:Number(p.sessions)||0,wrong:0,mastered:false};
      stats.math1testruns={streak:Number(p.testRuns)||0,correct:Number(p.testRuns)||0,wrong:0,mastered:false};
      if(p.diagnostic){
        var diagnosticKey=p.diagnosticVersion===3?"math1diagnostic3":p.diagnosticVersion===2?"math1diagnostic2":"math1diagnostic";
        stats[diagnosticKey]={streak:1,correct:1,wrong:0,mastered:true};
      }
      var awards=isObj(p.masteryAwards)?p.masteryAwards:{};Object.keys(awards).forEach(function(micro){if(VALID_MICROS.indexOf(micro)<0)return;var earned=Math.max(0,Math.floor(Number(awards[micro])||0));stats[["math1mastery",micro,earned].join("|")]={streak:1,correct:1,wrong:0,mastered:true}});
      var rechecks=isObj(p.rechecks)?p.rechecks:{};Object.keys(rechecks).forEach(function(micro){if(VALID_MICROS.indexOf(micro)<0||rechecks[micro]?.status!=="pending")return;stats[["math1recheck",micro,Math.max(1,Math.floor(Number(rechecks[micro].version)||1)),"pending"].join("|")]={streak:1,correct:1,wrong:0,mastered:true}});

      var g=starshipProfile(game,name),latest=Number(g.updatedAt)||0;
      Object.keys(g.purchases).forEach(function(id){var at=Math.max(0,Number(g.purchases[id].at)||0);latest=Math.max(latest,at);stats[["mathstar1p",id,at].join("|")]={streak:1,correct:1,wrong:0,mastered:true}});
      if(latest>0)stats[["mathstar1e",latest,g.equipped.hull,g.equipped.trail,g.equipped.companion].join("|")]={streak:1,correct:1,wrong:0,mastered:true};
      out[PROFILES[name]]={stateStats:stats,masteredOrder:[]};
    });
    if(changed)write(local);return out;
  }

  function apply(remote){
    if(!isObj(remote))return;var local=read(),game=readGame(),gameProfiles=isObj(game.profiles)?{...game.profiles}:{};
    Object.keys(PROFILES).forEach(function(name){
      var profile=remote[PROFILES[name]],stats=isObj(profile)&&isObj(profile.stateStats)?profile.stateStats:null;if(!stats)return;
      var p=isObj(local[name])?local[name]:{diagnostic:false,diagnosticVersion:0,attempts:[],sessions:0};p.attempts=Array.isArray(p.attempts)?p.attempts:[];
      var metadataById={};Object.keys(stats).forEach(function(metaKey){var metaParts=metaKey.split("|");if(metaParts[0]!=="math1m"||metaParts.length!==3)return;var metaId=safeId(metaParts[1]),meta=decodeMeta(metaParts[2]);if(metaId&&meta)metadataById[metaId]=meta});p.attempts=p.attempts.map(function(a){var localId=safeId(a.cloudId);return localId&&metadataById[localId]?Object.assign(mergeEvidence(a,metadataById[localId]),{cloudId:localId}):a});
      var seen=new Set(p.attempts.map(function(a,i){return safeId(a.cloudId)||((Number(a.at)||0)+"-"+i)}));
      var g=starshipProfile({profiles:gameProfiles},name),gameUpdatedAt=Number(g.updatedAt)||0;
      Object.keys(stats).forEach(function(key){
        var st=stats[key]||{},parts=key.split("|");
        if(key==="math1diagnostic"&&st.mastered)p.diagnostic=true;
        else if(key==="math1diagnostic2"&&st.mastered){p.diagnostic=true;p.diagnosticVersion=Math.max(Number(p.diagnosticVersion)||0,2)}
        else if(key==="math1diagnostic3"&&st.mastered){p.diagnostic=true;p.diagnosticVersion=Math.max(Number(p.diagnosticVersion)||0,3)}
        else if(key==="math1sessions")p.sessions=Math.max(Number(p.sessions)||0,Number(st.correct)||0,Number(st.streak)||0);
        else if(key==="math1testruns")p.testRuns=Math.max(Number(p.testRuns)||0,Number(st.correct)||0,Number(st.streak)||0);
        else if(parts[0]==="math1m")return;
        else if(parts[0]==="math1mastery"&&parts.length===3&&VALID_MICROS.indexOf(parts[1])>=0&&st.mastered){p.masteryAwards=isObj(p.masteryAwards)?p.masteryAwards:{};var earnedAt=Math.max(0,Math.floor(Number(parts[2])||0));if(!p.masteryAwards[parts[1]]||earnedAt&&earnedAt<Number(p.masteryAwards[parts[1]]))p.masteryAwards[parts[1]]=earnedAt||Number(p.masteryAwards[parts[1]])||1}
        else if(parts[0]==="math1recheck"&&parts.length===4&&VALID_MICROS.indexOf(parts[1])>=0&&parts[3]==="pending"&&st.mastered){var completed=p.attempts.some(function(a){return a.micro===parts[1]&&a.recheck&&!a.assisted&&a.correct});if(!completed){p.rechecks=isObj(p.rechecks)?p.rechecks:{};p.rechecks[parts[1]]={version:Math.max(1,Math.floor(Number(parts[2])||1)),status:"pending"}}}
        else if(parts[0]==="mathstar1p"&&parts.length===3&&STARSHIP_PURCHASES.indexOf(parts[1])>=0&&st.mastered){
          var purchaseAt=Math.max(0,Math.floor(Number(parts[2])||0)),old=isObj(g.purchases[parts[1]])?Math.max(0,Number(g.purchases[parts[1]].at)||0):0;g.purchases[parts[1]]={at:Math.max(old,purchaseAt)};
        }else if(parts[0]==="mathstar1e"&&parts.length===5&&STARSHIP_HULLS.indexOf(parts[2])>=0&&STARSHIP_TRAILS.indexOf(parts[3])>=0&&STARSHIP_COMPANIONS.indexOf(parts[4])>=0&&st.mastered){
          var equipAt=Math.max(0,Math.floor(Number(parts[1])||0));if(equipAt>gameUpdatedAt){gameUpdatedAt=equipAt;g.equipped={hull:parts[2],trail:parts[3],companion:parts[4]}}
        }else if(parts[0]==="math1a"&&parts.length===7&&VALID_SKILLS.indexOf(parts[1])>=0&&st.mastered){
          var legacyId=safeId(parts[6]);if(!legacyId||seen.has(legacyId))return;seen.add(legacyId);
          p.attempts.push({skill:parts[1],correct:parts[2]==="1",transfer:parts[3]==="1",date:/^\d{4}-\d{2}-\d{2}$/.test(parts[4])?parts[4]:"unknown",at:Number(parts[5])||0,cloudId:legacyId});
        }else if(parts[0]==="math1b"&&parts.length===11&&VALID_SKILLS.indexOf(parts[1])>=0&&VALID_MICROS.indexOf(parts[2])>=0&&st.mastered){
          var id=safeId(parts[10]);if(!id||seen.has(id))return;seen.add(id);
          p.attempts.push(mergeEvidence({skill:parts[1],micro:parts[2],correct:parts[3]==="1",assisted:parts[4]==="1",recovery:parts[5]==="1",difficulty:Math.max(1,Math.min(3,Number(parts[6])||1)),transfer:parts[7]==="1",date:/^\d{4}-\d{2}-\d{2}$/.test(parts[8])?parts[8]:"unknown",at:Number(parts[9])||0,cloudId:id},metadataById[id]||{}));
        }else if(parts[0]==="math1c"&&parts.length===12&&VALID_SKILLS.indexOf(parts[1])>=0&&VALID_MICROS.indexOf(parts[2])>=0&&st.mastered){
          var recheckId=safeId(parts[11]);if(!recheckId||seen.has(recheckId))return;seen.add(recheckId);
          p.attempts.push(mergeEvidence({skill:parts[1],micro:parts[2],correct:parts[3]==="1",assisted:parts[4]==="1",recovery:parts[5]==="1",difficulty:Math.max(1,Math.min(3,Number(parts[6])||1)),transfer:parts[7]==="1",recheck:parts[8]==="1",date:/^\d{4}-\d{2}-\d{2}$/.test(parts[9])?parts[9]:"unknown",at:Number(parts[10])||0,cloudId:recheckId},metadataById[recheckId]||{}));
        }else if(parts[0]==="math1d"&&parts.length===13&&VALID_SKILLS.indexOf(parts[1])>=0&&VALID_MICROS.indexOf(parts[2])>=0&&VALID_MISCONCEPTIONS.indexOf(parts[9])>=0&&st.mastered){
          var diagnosisId=safeId(parts[12]);if(!diagnosisId||seen.has(diagnosisId))return;seen.add(diagnosisId);
          p.attempts.push(mergeEvidence({skill:parts[1],micro:parts[2],correct:parts[3]==="1",assisted:parts[4]==="1",recovery:parts[5]==="1",difficulty:Math.max(1,Math.min(3,Number(parts[6])||1)),transfer:parts[7]==="1",recheck:parts[8]==="1",misconception:parts[9],date:/^\d{4}-\d{2}-\d{2}$/.test(parts[10])?parts[10]:"unknown",at:Number(parts[11])||0,cloudId:diagnosisId},metadataById[diagnosisId]||{}));
        }else if(parts[0]==="math1e"&&parts.length===14&&VALID_SKILLS.indexOf(parts[1])>=0&&VALID_MICROS.indexOf(parts[2])>=0&&VALID_ARCHETYPES.indexOf(parts[3])>=0&&(!parts[10]||VALID_MISCONCEPTIONS.indexOf(parts[10])>=0)&&st.mastered){
          var assessmentId=safeId(parts[13]);if(!assessmentId||seen.has(assessmentId))return;seen.add(assessmentId);
          p.attempts.push(mergeEvidence({skill:parts[1],micro:parts[2],assessmentArchetype:parts[3],correct:parts[4]==="1",assisted:parts[5]==="1",recovery:parts[6]==="1",difficulty:Math.max(1,Math.min(3,Number(parts[7])||1)),transfer:parts[8]==="1",recheck:parts[9]==="1",misconception:parts[10]||null,date:/^\d{4}-\d{2}-\d{2}$/.test(parts[11])?parts[11]:"unknown",at:Number(parts[12])||0,cloudId:assessmentId},metadataById[assessmentId]||{}));
        }
      });
      g.updatedAt=gameUpdatedAt;
      p.attempts.sort(function(a,b){return (Number(a.at)||0)-(Number(b.at)||0)});local[name]=p;gameProfiles[name]=g;
    });
    write(local);writeGame({version:1,profiles:gameProfiles});window.dispatchEvent(new CustomEvent("mathmission:cloud-updated"));
  }

  function handleError(e){setStatus(e&&e.status===403?"unlinked":e&&e.status===413?"capacity":"offline")}
  function pull(){if(!ENABLED)return Promise.resolve(false);var t=token();if(!t){setStatus("unlinked");return Promise.resolve(false)}setStatus("loading");return request({token:t,action:"pull"}).then(function(res){if(res.found)apply(res.data);setStatus(res.found?"saved":"unlinked");return !!res.found}).catch(function(e){handleError(e);return false})}
  function push(){if(!ENABLED)return Promise.resolve(false);var t=token();if(!t){setStatus("unlinked");return Promise.resolve(false)}if(inFlight){queued=true;return Promise.resolve(false)}inFlight=true;setStatus("saving");return request({token:t,action:"push",data:payload()}).then(function(res){apply(res.data);setStatus("saved");return true}).catch(function(e){handleError(e);return false}).then(function(ok){inFlight=false;if(queued){queued=false;schedule(0)}return ok})}
  function schedule(delay){if(!ENABLED)return;clearTimeout(timer);timer=setTimeout(function(){timer=null;push()},delay===undefined?700:delay)}
  function share(){var t=token();if(!t){alert("This device is not linked yet. Open the private family link on this device first.");return}var url=location.origin+"/math/#k="+encodeURIComponent(t);if(navigator.share){navigator.share({title:"Math Mission family link",text:"Open this private link on the other family device.",url:url}).catch(function(){})}else if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(url).then(function(){alert("Private family link copied. Open it on the other device.")}).catch(function(){prompt("Copy this private family link:",url)})}else prompt("Copy this private family link:",url)}
  function watch(){lastLocal=localStorage.getItem(DATA_KEY)||"";lastGameLocal=localStorage.getItem(GAME_KEY)||"";setInterval(function(){if(document.hidden)return;var now=localStorage.getItem(DATA_KEY)||"",nowGame=localStorage.getItem(GAME_KEY)||"";if(now!==lastLocal||nowGame!==lastGameLocal){lastLocal=now;lastGameLocal=nowGame;schedule()}},750)}

  adoptHash();watch();window.addEventListener("online",function(){pull().then(function(found){if(found)schedule(0)})});document.addEventListener("visibilitychange",function(){if(!document.hidden)pull()});window.MathMissionCloud={status:function(){return status},statusText:statusText,pull:pull,push:push,share:share,payload:payload,apply:apply};pull().then(function(found){if(found)schedule(0)});
})();

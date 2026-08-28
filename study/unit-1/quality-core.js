(function (root) {
  'use strict';
  // Local interaction time is evidence, not a claim about a child's attention.
  function createClock(now, initial) {
    var totals={learning:0,play:0,idle:0};
    Object.keys(totals).forEach(function(key){var v=Number(initial&&initial[key]);totals[key]=Number.isFinite(v)&&v>0?v:0;});
    var mode='play',visible=true,last=now(),activeUntil=last+30000;
    function flush(){
      var end=Math.max(last,now()),active=visible?Math.max(0,Math.min(end,activeUntil)-last):0;
      totals[mode]+=active;totals.idle+=Math.max(0,end-last-active);last=end;
    }
    return {
      activity:function(){flush();activeUntil=now()+30000;},
      mode:function(next){flush();if(next==='learning'||next==='play')mode=next;},
      visibility:function(shown){flush();visible=!!shown;if(shown)activeUntil=now()+30000;},
      snapshot:function(){flush();return {learning:totals.learning,play:totals.play,idle:totals.idle};}
    };
  }
  function playBudget(timing){return Math.max(0,(Number(timing&&timing.learning)||0)/9-(Number(timing&&timing.play)||0));}
  root.WordExpeditionQuality={createClock:createClock,playBudget:playBudget};
})(typeof window==='undefined'?globalThis:window);

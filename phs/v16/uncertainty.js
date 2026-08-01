'use strict';

const baseCompleteSpecial = completeSpecial;
completeSpecial = function(special){
  if(special==='nora-speciation'&&!state.flags.noraSpeciated&&!state.noraJudgment){
    scheduleProcess({kind:'special',special:'nora-speciation',due:state.time+30});
    return;
  }
  baseCompleteSpecial(special);
};

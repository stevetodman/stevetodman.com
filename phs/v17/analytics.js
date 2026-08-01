'use strict';

function firstEvent(state, predicate){
  return state.timeline.filter(predicate).sort((a,b)=>a.time-b.time)[0] || null;
}

function latestReasoning(state, patientId){
  const list = state.patients[patientId].reasoning;
  return list.length ? list[list.length - 1] : null;
}

function correctReasoningEvent(state, patientId){
  const correct = state.caseData.patients[patientId].correctDiagnosis;
  return state.patients[patientId].reasoning.find(r => r.diagnosis === correct) || null;
}

function computeDiagnosticAnalytics(state){
  const firstDisconfirming = firstEvent(state, e => e.patientId === 'maya' && e.meta?.disconfirming === true);
  const contradiction = firstEvent(state, e => e.patientId === 'maya' && ['pulses','fourbp','ductalsats','cardiac','abdomen'].includes(e.meta?.examId));
  const correctCommit = correctReasoningEvent(state, 'maya');
  const firstCommit = state.patients.maya.reasoning[0] || null;
  const rankingRevision = state.initialRanking && state.finalRanking ? {
    initialMaya: state.initialRanking.maya,
    finalMaya: state.finalRanking.maya,
    improved: state.finalRanking.maya < state.initialRanking.maya || state.finalRanking.maya === 1
  } : null;
  const uniqueSearch = new Set([
    ...state.patients.maya.historyLog.map(x => `h:${x.category}`),
    ...state.patients.maya.examLog.map(x => `e:${x.examId}`)
  ]).size;
  const urgentPages = state.pages.filter(p => p.urgent);
  const pageLatencies = urgentPages.map(p => ({
    title: p.title,
    patientId: p.patientId,
    acknowledge: p.ackAt == null ? null : p.ackAt - p.createdAt,
    response: p.responseAt == null ? null : p.responseAt - p.createdAt
  }));
  const overconfidence = firstCommit && firstCommit.diagnosis !== state.caseData.patients.maya.correctDiagnosis && firstCommit.confidence >= 70;
  return {
    firstDisconfirmingSeconds: firstDisconfirming?.time ?? null,
    contradictionSeconds: contradiction?.time ?? null,
    correctCommitSeconds: correctCommit?.time ?? null,
    contradictionToRevisionSeconds: contradiction && correctCommit ? Math.max(0, correctCommit.time - contradiction.time) : null,
    inheritedFrameDwellSeconds: correctCommit?.time ?? state.time,
    initialDiagnosis: firstCommit?.diagnosis ?? null,
    initialConfidence: firstCommit?.confidence ?? null,
    finalDiagnosis: latestReasoning(state, 'maya')?.diagnosis ?? null,
    finalConfidence: latestReasoning(state, 'maya')?.confidence ?? null,
    overconfidenceOnIncorrectFrame: !!overconfidence,
    uniqueInformationSourcesBeforeEnd: uniqueSearch,
    rankingRevision,
    pageLatencies
  };
}

function analyticsNarrative(analytics){
  const rows = [];
  rows.push({
    label: 'Time to first disconfirming inquiry',
    value: analytics.firstDisconfirmingSeconds == null ? 'Not observed' : fmtTime(analytics.firstDisconfirmingSeconds),
    interpretation: analytics.firstDisconfirmingSeconds == null ? 'The inherited frame was not actively tested.' : analytics.firstDisconfirmingSeconds <= 120 ? 'The inherited frame was tested early.' : 'Disconfirming evidence was sought late.'
  });
  rows.push({
    label: 'Contradictory evidence to diagnostic revision',
    value: analytics.contradictionToRevisionSeconds == null ? 'Not measurable' : fmtTime(analytics.contradictionToRevisionSeconds),
    interpretation: analytics.contradictionToRevisionSeconds == null ? 'A correct revision or a measurable contradiction was absent.' : analytics.contradictionToRevisionSeconds <= 90 ? 'The working model changed promptly.' : 'Contradictory data persisted before the plan changed.'
  });
  rows.push({
    label: 'Inherited-frame dwell time',
    value: fmtTime(analytics.inheritedFrameDwellSeconds),
    interpretation: 'Time until the first correct mechanism commitment; this is a behavioral measure, not a diagnosis of cognitive bias.'
  });
  rows.push({
    label: 'Confidence calibration',
    value: analytics.initialDiagnosis ? `${analytics.initialDiagnosis} at ${analytics.initialConfidence}%` : 'No initial commitment',
    interpretation: analytics.overconfidenceOnIncorrectFrame ? 'High confidence was recorded before the diagnostic model was correct.' : 'No high-confidence incorrect initial commitment was detected.'
  });
  rows.push({
    label: 'Acuity recalibration',
    value: analytics.rankingRevision ? `Maya ${analytics.rankingRevision.initialMaya} → ${analytics.rankingRevision.finalMaya}` : 'Not available',
    interpretation: analytics.rankingRevision?.improved ? 'The final ranking corrected or preserved appropriate priority.' : 'The final ranking did not correct the initial priority estimate.'
  });
  return rows;
}

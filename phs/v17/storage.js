'use strict';

const PHS_STORAGE_KEY = 'phs.v17.learnerRecord';
let phsMemoryRecord = null;

function defaultLearnerRecord(){
  return {
    schemaVersion: 1,
    learnerId: 'local-anonymous',
    attempts: [],
    objectiveHistory: {},
    assignedVariant: null,
    lastUpdated: null
  };
}

function safeStorageGet(){
  try{return localStorage.getItem(PHS_STORAGE_KEY);}catch(error){return phsMemoryRecord;}
}
function safeStorageSet(value){
  phsMemoryRecord = value;
  try{localStorage.setItem(PHS_STORAGE_KEY,value);}catch(error){console.warn('Persistent browser storage unavailable; using in-memory learner record.');}
}
function safeStorageClear(){
  phsMemoryRecord = null;
  try{localStorage.removeItem(PHS_STORAGE_KEY);}catch(error){console.warn('Persistent browser storage unavailable; cleared in-memory learner record.');}
}

function loadLearnerRecord(){
  try{
    const raw = safeStorageGet();
    if(!raw) return defaultLearnerRecord();
    const parsed = JSON.parse(raw);
    if(parsed.schemaVersion !== 1 || !Array.isArray(parsed.attempts)) return defaultLearnerRecord();
    return {...defaultLearnerRecord(), ...parsed};
  }catch(error){
    console.warn('Unable to load learner record', error);
    return defaultLearnerRecord();
  }
}

function saveLearnerRecord(record){
  const next = {...record, lastUpdated: new Date().toISOString()};
  safeStorageSet(JSON.stringify(next));
  return next;
}

function clearLearnerRecord(){
  safeStorageClear();
  return defaultLearnerRecord();
}

function appendAttempt(record, attempt){
  const attempts = [...record.attempts, attempt].slice(-30);
  const objectiveHistory = {...record.objectiveHistory};
  for(const [objectiveId, value] of Object.entries(attempt.objectiveScores || {})){
    objectiveHistory[objectiveId] = [...(objectiveHistory[objectiveId] || []), {
      attemptId: attempt.id,
      timestamp: attempt.completedAt,
      score: value,
      variantId: attempt.variantId,
      mastery: attempt.mastery
    }].slice(-20);
  }
  return saveLearnerRecord({...record, attempts, objectiveHistory, assignedVariant: attempt.nextVariantId || null});
}

function getNextVariantId(record, caseData, currentVariantId, weakestObjectiveId){
  const variants = caseData.variants.map(v => v.id);
  if(record.assignedVariant && variants.includes(record.assignedVariant) && record.assignedVariant !== currentVariantId){
    return record.assignedVariant;
  }
  const currentIndex = Math.max(0, variants.indexOf(currentVariantId));
  const remediation = caseData.remediation.find(r => r.objectiveId === weakestObjectiveId);
  if(remediation?.nextVariantRule === 'same-mechanism-new-timing') return variants[(currentIndex + 2) % variants.length];
  return variants[(currentIndex + 1) % variants.length];
}

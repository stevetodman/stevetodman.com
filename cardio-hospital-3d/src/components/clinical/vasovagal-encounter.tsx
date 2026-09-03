"use client";

import { useEffect, useMemo, useState } from "react";
import { CASES } from "@/lib/cases-data";
import { VASOVAGAL_TEACHING_POLICY } from "@/lib/clinical-policy/vasovagal-2026";
import { getActiveEncounter } from "@/lib/hospital-engine";
import { scoreCanonicalEncounter } from "@/lib/hospital-scoring";
import { useHospitalStore } from "@/lib/hospital-store";
import {
  VASOVAGAL_CASE_ID,
  VASOVAGAL_PATIENT_ID,
  VASOVAGAL_ROOM,
  VASOVAGAL_TASK_ID,
} from "@/lib/scenario-ids";
import { useSimulationStore } from "@/lib/simulation-store";

const vasovagalCase = CASES.find((clinicalCase) => clinicalCase.id === VASOVAGAL_CASE_ID);
const UNSAFE_IMMEDIATE_RETURN = "Immediate same-day return to competition because the episode happened after exercise";

const ECG_CHOICES = [
  ["athletic_sinus_bradycardia", "Sinus bradycardia compatible with athletic training"],
  ["normal_intervals", "PR, QRS, and QTc are within the supplied reassuring range"],
  ["normal_repolarization", "No LVH criteria and normal repolarization"],
  ["long_qt", "Long-QT pattern"],
  ["sinus_node_disease", "Pathologic sinus-node dysfunction"],
] as const;
const CORRECT_ECG_FINDINGS = new Set(["athletic_sinus_bradycardia", "normal_intervals", "normal_repolarization"]);

const MISSED_HISTORY_MESSAGES: Record<string, string> = {
  exertional_timing: "Clarify the exact exercise relationship: still running, slowing, finished, stopped, or walking afterward. Timing is high-value but not diagnostic by itself.",
  prodrome: "Characterize warning symptoms and whether the collapse was progressive or abrupt/unheralded.",
  triggers: "Ask about fasting, hydration, heat exposure, recent illness, and other reversible contributors.",
  family_sudden_death: "Ask specifically about sudden unexplained death, cardiomyopathy, channelopathy, significant arrhythmia, unexplained drowning, and suspicious premature deaths.",
  palpitations: "Ask about exertional chest pain, abrupt or sustained palpitations, unusual dyspnea, declining exercise tolerance, and prior exertional events.",
  substance_use: "A confidential adolescent history should address energy drinks/caffeine, nicotine/vaping, prescription stimulants, decongestants, pre-workout/supplements, and recreational substances.",
};

function HistoryStage() {
  const encounter = useHospitalStore((state) => getActiveEncounter(state.hospital));
  const dispatch = useHospitalStore((state) => state.dispatch);
  if (!vasovagalCase || !encounter) return null;

  const visibleFacts = vasovagalCase.history.filter((fact) => !fact.confidential || encounter.confidentialInterviewDone);
  const asked = encounter.askedHistoryKeys;
  const latestKey = asked.at(-1);
  const latestFact = vasovagalCase.history.find((fact) => fact.key === latestKey);
  const requiredAsked = VASOVAGAL_TEACHING_POLICY.requiredHistoryKeys.filter((key) => asked.includes(key)).length;
  const canContinue = asked.length >= 4;

  return (
    <div className="clinical-stage">
      <div className="clinical-stage-heading">
        <div><p className="eyebrow">History</p><h3>Build the whole syncopal phenotype, not a timing shortcut.</h3></div>
        <strong className="clinical-signal">{requiredAsked} of {VASOVAGAL_TEACHING_POLICY.requiredHistoryKeys.length} key domains established</strong>
      </div>

      {vasovagalCase.allowConfidentialInterview && (
        <div className="history-privacy">
          <div>
            <strong>Adolescent confidentiality</strong>
            <span>{encounter.confidentialInterviewDone
              ? "Ava is being interviewed privately. Confidential substance questions are now available."
              : "Her father is still in the room. Ask him to step out before confidential adolescent history."}</span>
          </div>
          {!encounter.confidentialInterviewDone && (
            <button type="button" className="secondary-action" onClick={() => dispatch({ type: "CONFIDENTIAL_INTERVIEW_STARTED", encounterId: encounter.encounterId })}>
              Ask parent to step out
            </button>
          )}
        </div>
      )}

      <div className="clinical-action-grid">
        {visibleFacts.map((fact) => (
          <button
            key={`${fact.key}-${fact.question}`}
            type="button"
            className={`clinical-action${fact.confidential ? " confidential" : ""}${asked.includes(fact.key) ? " used" : ""}`}
            onClick={() => dispatch({ type: "HISTORY_ASKED", encounterId: encounter.encounterId, key: fact.key })}
          >
            {fact.question}
          </button>
        ))}
      </div>

      <div className="clinical-response" aria-live="polite">
        {latestFact ? latestFact.answer : "Ava and her father wait for your first question."}
      </div>
      <div className="clinical-stage-footer">
        <span>{asked.length} question{asked.length === 1 ? "" : "s"} asked</span>
        <button type="button" className="primary-action" disabled={!canContinue} onClick={() => dispatch({ type: "ENCOUNTER_STAGE_CHANGED", encounterId: encounter.encounterId, stage: "exam" })}>
          Continue to examination
        </button>
      </div>
    </div>
  );
}

function ExamStage() {
  const encounter = useHospitalStore((state) => getActiveEncounter(state.hospital));
  const dispatch = useHospitalStore((state) => state.dispatch);

  useEffect(() => {
    if (!encounter) return;
    dispatch({ type: "EXAM_PERFORMED", encounterId: encounter.encounterId, action: "general" });
    dispatch({ type: "EXAM_PERFORMED", encounterId: encounter.encounterId, action: "vitals" });
  }, [dispatch, encounter?.encounterId]);

  if (!vasovagalCase || !encounter) return null;
  const performed = encounter.performedExamActions;
  const learnerActions = performed.filter((action) => action !== "general" && action !== "vitals");
  const latestAction = learnerActions.at(-1);
  const hasAuscultation = performed.some((action) => action.startsWith("auscultation:"));
  const canContinue = hasAuscultation && performed.includes("femoralPulses");

  let response = vasovagalCase.exam.general;
  if (latestAction === "femoralPulses") response = vasovagalCase.exam.femoralPulses;
  if (latestAction === "orthostatics") {
    response = "Orthostatic HR/BP are reasonable to obtain when clinically appropriate. This synthetic case does not supply case-specific orthostatic measurements, so no values are invented here.";
  }
  if (latestAction?.startsWith("auscultation:")) {
    const site = latestAction.split(":")[1];
    response = vasovagalCase.exam.auscultation.find((finding) => finding.site === site)?.description ?? response;
  }

  return (
    <div className="clinical-stage">
      <div className="clinical-stage-heading">
        <div><p className="eyebrow">Examination</p><h3>Perform a focused cardiovascular examination.</h3></div>
        <strong className="clinical-signal">Reassuring exam must be established, not assumed</strong>
      </div>
      <div className="vital-strip" aria-label="Vital signs">
        <span>HR <strong>{vasovagalCase.exam.vitals.HR}</strong></span>
        <span>BP <strong>{vasovagalCase.exam.vitals.BP}</strong></span>
        <span>RR <strong>{vasovagalCase.exam.vitals.RR}</strong></span>
        <span>SpO₂ <strong>{vasovagalCase.exam.vitals.SpO2}%</strong></span>
      </div>
      <div className="clinical-action-grid exam-actions">
        {vasovagalCase.exam.auscultation.map((finding) => (
          <button key={finding.site} type="button" className={`clinical-action${performed.includes(`auscultation:${finding.site}`) ? " used" : ""}`} onClick={() => dispatch({ type: "EXAM_PERFORMED", encounterId: encounter.encounterId, action: `auscultation:${finding.site}` })}>
            Auscultate {finding.site}
          </button>
        ))}
        <button type="button" className={`clinical-action${performed.includes("femoralPulses") ? " used" : ""}`} onClick={() => dispatch({ type: "EXAM_PERFORMED", encounterId: encounter.encounterId, action: "femoralPulses" })}>Check femoral pulses</button>
        <button type="button" className={`clinical-action${performed.includes("orthostatics") ? " used" : ""}`} onClick={() => dispatch({ type: "EXAM_PERFORMED", encounterId: encounter.encounterId, action: "orthostatics" })}>Obtain orthostatic HR/BP</button>
      </div>
      <div className="clinical-response" aria-live="polite">{response}</div>
      <div className="clinical-stage-footer">
        <span>{learnerActions.length} focused action{learnerActions.length === 1 ? "" : "s"} performed</span>
        <button type="button" className="primary-action" disabled={!canContinue} onClick={() => dispatch({ type: "ENCOUNTER_STAGE_CHANGED", encounterId: encounter.encounterId, stage: "tests" })}>
          Choose diagnostic tests
        </button>
      </div>
    </div>
  );
}

function TestsStage() {
  const encounter = useHospitalStore((state) => getActiveEncounter(state.hospital));
  const dispatch = useHospitalStore((state) => state.dispatch);
  const [selectedEcgFindings, setSelectedEcgFindings] = useState<Set<string>>(
    () => new Set(encounter?.ecgInterpretation?.selectedFindings ?? [])
  );
  if (!vasovagalCase || !encounter) return null;

  const ordered = encounter.orderedTests;
  const reviewed = encounter.reviewedResults;
  const hasEcg = ordered.includes("ECG");
  const canContinue = hasEcg && Boolean(encounter.ecgInterpretation);

  const orderAndReview = (test: string) => {
    dispatch({ type: "TEST_ORDERED", encounterId: encounter.encounterId, test });
    dispatch({ type: "RESULT_REVIEWED", encounterId: encounter.encounterId, result: test });
  };
  const orderOnly = (test: string) => dispatch({ type: "TEST_ORDERED", encounterId: encounter.encounterId, test });
  const toggleEcgFinding = (finding: string) => {
    setSelectedEcgFindings((current) => {
      const next = new Set(current);
      if (next.has(finding)) next.delete(finding);
      else next.add(finding);
      return next;
    });
  };
  const commitEcg = () => {
    const missed = [...CORRECT_ECG_FINDINGS].filter((finding) => !selectedEcgFindings.has(finding));
    const falsePositives = [...selectedEcgFindings].filter((finding) => !CORRECT_ECG_FINDINGS.has(finding));
    const score = Math.max(0, Math.round(((ECG_CHOICES.length - missed.length - falsePositives.length) / ECG_CHOICES.length) * 100));
    dispatch({ type: "ECG_INTERPRETATION_COMMITTED", encounterId: encounter.encounterId, selectedFindings: [...selectedEcgFindings], score });
  };

  const responseBlocks: string[] = [];
  if (reviewed.includes("ECG")) {
    responseBlocks.push(`ECG — ${vasovagalCase.ecg.rhythm}, rate ${vasovagalCase.ecg.rate}; PR ${vasovagalCase.ecg.intervals.PR}; QRS ${vasovagalCase.ecg.intervals.QRS}; QTc ${vasovagalCase.ecg.intervals.QTc}; ${vasovagalCase.ecg.axis} axis.`);
  }
  if (reviewed.includes("Echocardiogram")) {
    responseBlocks.push(`Echo — ${vasovagalCase.echo.summary} ${vasovagalCase.echo.keyFindings.join("; ")}.`);
  }
  for (const test of ["Ambulatory rhythm monitoring", "Exercise stress testing", "Cardiac MRI", "Troponin", "BNP", "Broad laboratory testing"]) {
    if (ordered.includes(test)) responseBlocks.push(`${test} ordered. No case-specific result is supplied for this synthetic low-risk encounter.`);
  }

  return (
    <div className="clinical-stage">
      <div className="clinical-stage-heading">
        <div><p className="eyebrow">Diagnostic testing</p><h3>Use the initial evaluation to decide whether additional cardiac testing is warranted.</h3></div>
        <strong className="clinical-signal">History + family history + exam + ECG — not “ECG only”</strong>
      </div>
      <p className="policy-context">Additional tests shown here are conditional tools, not universally wrong tests. In this supplied low-risk phenotype they are not routine after a reassuring initial evaluation.</p>

      <div className="clinical-action-grid">
        <button type="button" className={`clinical-action${hasEcg ? " used" : ""}`} onClick={() => orderAndReview("ECG")}>Order + review 12-lead ECG</button>
        <button type="button" className={`clinical-action${ordered.includes("Echocardiogram") ? " used" : ""}`} onClick={() => orderAndReview("Echocardiogram")}>Order echocardiogram</button>
        <button type="button" className={`clinical-action${ordered.includes("Ambulatory rhythm monitoring") ? " used" : ""}`} onClick={() => orderOnly("Ambulatory rhythm monitoring")}>Order ambulatory rhythm monitor</button>
        <button type="button" className={`clinical-action${ordered.includes("Exercise stress testing") ? " used" : ""}`} onClick={() => orderOnly("Exercise stress testing")}>Order exercise stress test</button>
        <button type="button" className={`clinical-action${ordered.includes("Cardiac MRI") ? " used" : ""}`} onClick={() => orderOnly("Cardiac MRI")}>Order cardiac MRI</button>
        <button type="button" className={`clinical-action${ordered.includes("Troponin") ? " used" : ""}`} onClick={() => orderOnly("Troponin")}>Order troponin</button>
        <button type="button" className={`clinical-action${ordered.includes("BNP") ? " used" : ""}`} onClick={() => orderOnly("BNP")}>Order BNP</button>
        <button type="button" className={`clinical-action${ordered.includes("Broad laboratory testing") ? " used" : ""}`} onClick={() => orderOnly("Broad laboratory testing")}>Order broad laboratory testing</button>
      </div>

      {hasEcg && (
        <section className="assessment-block">
          <p className="field-label">Interpret the supplied ECG before proceeding.</p>
          <div className="finding-grid">
            {ECG_CHOICES.map(([value, label]) => (
              <label key={value} className={selectedEcgFindings.has(value) ? "selected" : ""}>
                <input type="checkbox" checked={selectedEcgFindings.has(value)} onChange={() => toggleEcgFinding(value)} />
                {label}
              </label>
            ))}
          </div>
          <button type="button" className="secondary-action" onClick={commitEcg}>{encounter.ecgInterpretation ? "Update ECG interpretation" : "Commit ECG interpretation"}</button>
          {encounter.ecgInterpretation && <p className="policy-context">{VASOVAGAL_TEACHING_POLICY.athleteEcgInterpretation}</p>}
        </section>
      )}

      <div className="clinical-response result-response" aria-live="polite">{responseBlocks.length ? responseBlocks.join("\n\n") : "No studies ordered."}</div>
      <div className="clinical-stage-footer">
        <span>{ordered.length} test item{ordered.length === 1 ? "" : "s"} ordered · {VASOVAGAL_TEACHING_POLICY.version}</span>
        <button type="button" className="primary-action" disabled={!canContinue} onClick={() => dispatch({ type: "ENCOUNTER_STAGE_CHANGED", encounterId: encounter.encounterId, stage: "assessment" })}>
          Commit assessment and plan
        </button>
      </div>
    </div>
  );
}

function AssessmentStage() {
  const encounter = useHospitalStore((state) => getActiveEncounter(state.hospital));
  const dispatch = useHospitalStore((state) => state.dispatch);
  if (!vasovagalCase || !encounter) return null;

  const diagnosisOptions = [
    VASOVAGAL_TEACHING_POLICY.preferredDiagnosis,
    "Post-exertional vasovagal syncope",
    ...vasovagalCase.differentials.filter((diagnosis) => diagnosis !== "Post-exertional vasovagal syncope"),
  ];
  const managementOptions = [...VASOVAGAL_TEACHING_POLICY.correctManagement, UNSAFE_IMMEDIATE_RETURN];
  const canPresent = Boolean(encounter.diagnosis && encounter.management.length > 0);
  const toggleManagement = (item: string) => {
    const next = encounter.management.includes(item)
      ? encounter.management.filter((selected) => selected !== item)
      : [...encounter.management, item];
    dispatch({ type: "MANAGEMENT_SELECTED", encounterId: encounter.encounterId, management: next });
  };
  const presentCase = () => {
    if (!canPresent) return;
    if (encounter.management.includes(UNSAFE_IMMEDIATE_RETURN)) {
      dispatch({ type: "SAFETY_EVENT_RECORDED", encounterId: encounter.encounterId, description: "Same-day immediate return to competition selected after a syncopal event before the approved recovery/return framework" });
    }
    dispatch({ type: "ENCOUNTER_STAGE_CHANGED", encounterId: encounter.encounterId, stage: "debrief" });
  };

  return (
    <div className="clinical-stage">
      <div className="clinical-stage-heading">
        <div><p className="eyebrow">Assessment + plan</p><h3>Integrate the entire phenotype and decide what actually changes today.</h3></div>
        <strong className="clinical-signal">{encounter.diagnosis ? "Clinical judgment committed" : "Assessment incomplete"}</strong>
      </div>
      <section className="assessment-block">
        <p className="field-label">Most likely diagnosis</p>
        <div className="diagnosis-grid">
          {diagnosisOptions.map((diagnosis) => (
            <button key={diagnosis} type="button" className={`diagnosis-choice${encounter.diagnosis === diagnosis ? " selected" : ""}`} onClick={() => dispatch({ type: "DIAGNOSIS_COMMITTED", encounterId: encounter.encounterId, diagnosis })}>{diagnosis}</button>
          ))}
        </div>
      </section>
      <section className="assessment-block">
        <p className="field-label">What happens today?</p>
        <div className="management-grid">
          {managementOptions.map((item) => (
            <label key={item} className={encounter.management.includes(item) ? "selected" : ""}>
              <input type="checkbox" checked={encounter.management.includes(item)} onChange={() => toggleManagement(item)} />
              <span>{item}</span>
            </label>
          ))}
        </div>
      </section>
      <div className="clinical-stage-footer">
        <span>{encounter.management.length} management action{encounter.management.length === 1 ? "" : "s"} selected</span>
        <button type="button" className="primary-action" disabled={!canPresent} onClick={presentCase}>Present to Dr. Patel</button>
      </div>
    </div>
  );
}

function DebriefStage() {
  const encounter = useHospitalStore((state) => getActiveEncounter(state.hospital));
  const dispatch = useHospitalStore((state) => state.dispatch);
  const closeEncounter = useSimulationStore((state) => state.closeEncounter);
  if (!vasovagalCase || !encounter) return null;

  const score = scoreCanonicalEncounter(encounter, vasovagalCase, {
    appropriateTests: VASOVAGAL_TEACHING_POLICY.requiredInitialTests,
    unnecessaryTests: [],
    correctManagement: VASOVAGAL_TEACHING_POLICY.correctManagement,
    acceptedDiagnoses: VASOVAGAL_TEACHING_POLICY.acceptableDiagnosisLabels,
    requiredHistoryKeys: VASOVAGAL_TEACHING_POLICY.requiredHistoryKeys,
  });
  const missedHistoryMessages = score.missedHistoryKeys.map((key) => MISSED_HISTORY_MESSAGES[key]).filter(Boolean);
  const notRoutineOrdered = VASOVAGAL_TEACHING_POLICY.notRoutineAfterReassuringInitialEvaluation.filter((test) => encounter.orderedTests.includes(test));
  const headline = score.overall >= 85 ? "Strong low-risk syncope assessment" : score.overall >= 70 ? "Safe, with missed opportunities" : "Rebuild the syncopal phenotype";

  const replayEncounter = () => {
    const hospital = useHospitalStore.getState().hospital;
    const priorAttempts = Object.values(hospital.encounters).filter((item) => item.caseId === VASOVAGAL_CASE_ID).length;
    dispatch({ type: "ENCOUNTER_COMPLETED", encounterId: encounter.encounterId });
    dispatch({ type: "TASK_ASSIGNED", taskId: VASOVAGAL_TASK_ID });
    dispatch({ type: "ENCOUNTER_STARTED", encounterId: `encounter-${VASOVAGAL_CASE_ID}-${priorAttempts + 1}`, taskId: VASOVAGAL_TASK_ID, patientId: VASOVAGAL_PATIENT_ID, caseId: VASOVAGAL_CASE_ID, location: VASOVAGAL_ROOM });
  };
  const completeEncounter = () => {
    dispatch({ type: "ENCOUNTER_COMPLETED", encounterId: encounter.encounterId });
    closeEncounter();
  };

  return (
    <div className="clinical-stage debrief-stage">
      <div className="clinical-stage-heading">
        <div><p className="eyebrow">Attending debrief</p><h3>{headline}</h3></div>
        <strong className="overall-score">{score.overall}%</strong>
      </div>
      <p className="debrief-summary">{score.diagnosisCorrect
        ? "Your diagnosis is compatible with the physician-approved post-exertional neurally mediated syncope framework. The score reflects whether you established that low-risk phenotype rather than recognizing one clue."
        : "The submitted diagnosis did not adequately integrate the post-exertional timing, progressive prodrome, reversible contributors, family/exertional history, examination, and athlete-appropriate ECG."}</p>
      <div className="score-grid">{Object.entries(score.dimensions).map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}%</strong></div>)}</div>

      {(missedHistoryMessages.length > 0 || notRoutineOrdered.length > 0) && (
        <section className="debrief-opportunities">
          <p className="field-label">Missed opportunities / test stewardship</p>
          {missedHistoryMessages.map((message) => <p key={message}>{message}</p>)}
          {notRoutineOrdered.length > 0 && <p>Not routinely indicated in this supplied reassuring phenotype: {notRoutineOrdered.join(", ")}. These remain conditional tests when red flags or diagnostic uncertainty are present.</p>}
        </section>
      )}

      <section className="debrief-opportunities">
        <p className="field-label">Do not miss in an adolescent endurance athlete</p>
        {VASOVAGAL_TEACHING_POLICY.additionalHistoryDomains.map((item) => <p key={item}>{item}</p>)}
      </section>
      <section className="debrief-opportunities">
        <p className="field-label">Stimulant exposure</p>
        <p>{VASOVAGAL_TEACHING_POLICY.stimulantTeaching.interpretation}</p>
        <p>{VASOVAGAL_TEACHING_POLICY.stimulantTeaching.counseling}</p>
      </section>
      <blockquote>{VASOVAGAL_TEACHING_POLICY.teachingPoint}</blockquote>
      <p className="policy-context">Return to sport: {VASOVAGAL_TEACHING_POLICY.returnToPlay.lowRisk}</p>
      <p className="policy-version">Teaching policy: {VASOVAGAL_TEACHING_POLICY.version}</p>
      <div className="clinical-stage-footer">
        <span>Each completed replay is preserved as a separate encounter attempt.</span>
        <button type="button" className="secondary-action" onClick={replayEncounter}>Replay this case</button>
        <button type="button" className="primary-action" onClick={completeEncounter}>Complete encounter and return to hospital</button>
      </div>
    </div>
  );
}

export default function VasovagalEncounter() {
  const encounter = useHospitalStore((state) => getActiveEncounter(state.hospital));
  const closeEncounter = useSimulationStore((state) => state.closeEncounter);
  const stageLabel = useMemo(() => encounter?.stage ?? "not-started", [encounter?.stage]);
  if (!vasovagalCase || !encounter || encounter.caseId !== VASOVAGAL_CASE_ID) return null;

  return (
    <section className="encounter-workspace" aria-label="Ava Rodriguez clinical encounter">
      <header className="encounter-workspace-header">
        <div>
          <p className="eyebrow">Clinic Room 1 · New consultation</p>
          <h2>{vasovagalCase.patientName} <small>{vasovagalCase.age} years · {vasovagalCase.sex}</small></h2>
          <p>{vasovagalCase.chiefComplaint}</p>
        </div>
        <button type="button" className="encounter-close" onClick={closeEncounter} aria-label="Return to the 3D hospital">×</button>
      </header>
      <div className="encounter-progress"><span>{stageLabel}</span><span>One patient · one persistent encounter</span></div>
      {encounter.stage === "history" && <HistoryStage />}
      {encounter.stage === "exam" && <ExamStage />}
      {encounter.stage === "tests" && <TestsStage />}
      {encounter.stage === "assessment" && <AssessmentStage />}
      {encounter.stage === "debrief" && <DebriefStage />}
    </section>
  );
}

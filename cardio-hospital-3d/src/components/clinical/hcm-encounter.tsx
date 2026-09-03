"use client";

import { useEffect, useState } from "react";
import { CASES } from "@/lib/cases-data";
import { getActiveEncounter } from "@/lib/hospital-engine";
import { useHospitalStore } from "@/lib/hospital-store";
import {
  startMurmur,
  stopMurmur,
  updateSite,
  updateValsalva,
  type AuscultationSite,
} from "@/lib/murmur-audio";
import { useSimulationStore } from "@/lib/simulation-store";
import HcmTestsStage from "./hcm-tests-stage";

const hcmCase = CASES.find((clinicalCase) => clinicalCase.id === "case-hcm");

function HistoryStage() {
  const encounter = useHospitalStore((state) => getActiveEncounter(state.hospital));
  const dispatch = useHospitalStore((state) => state.dispatch);

  if (!hcmCase || !encounter) return null;

  const visibleFacts = hcmCase.history.filter((fact) => !fact.confidential);
  const asked = encounter.askedHistoryKeys;
  const latestKey = asked[asked.length - 1];
  const latestFact = visibleFacts.find((fact) => fact.key === latestKey);
  const recognizedRedFlags = hcmCase.redFlagKeys.filter((key) => asked.includes(key)).length;
  const canContinue = asked.length >= 3;

  const clinicalSignal =
    recognizedRedFlags === hcmCase.redFlagKeys.length
      ? "High-risk cardiac syncope"
      : recognizedRedFlags > 0
        ? `${recognizedRedFlags} of ${hcmCase.redFlagKeys.length} red flags recognized`
        : "Clinical picture incomplete";

  return (
    <div className="clinical-stage">
      <div className="clinical-stage-heading">
        <div>
          <p className="eyebrow">History</p>
          <h3>Choose questions that change pretest probability.</h3>
        </div>
        <strong className="clinical-signal">{clinicalSignal}</strong>
      </div>

      <div className="clinical-action-grid">
        {visibleFacts.map((fact) => {
          const used = asked.includes(fact.key);
          return (
            <button
              key={fact.key}
              type="button"
              className={`clinical-action${used ? " used" : ""}`}
              onClick={() =>
                dispatch({
                  type: "HISTORY_ASKED",
                  encounterId: encounter.encounterId,
                  key: fact.key,
                })
              }
            >
              {fact.question}
            </button>
          );
        })}
      </div>

      <div className="clinical-response" aria-live="polite">
        {latestFact
          ? latestFact.answer
          : "Marcus and his mother wait for your first question."}
      </div>

      <div className="clinical-stage-footer">
        <span>{asked.length} question{asked.length === 1 ? "" : "s"} asked</span>
        <button
          type="button"
          className="primary-action"
          disabled={!canContinue}
          onClick={() =>
            dispatch({
              type: "ENCOUNTER_STAGE_CHANGED",
              encounterId: encounter.encounterId,
              stage: "exam",
            })
          }
        >
          Continue to examination
        </button>
      </div>
    </div>
  );
}

function ExamStage() {
  const encounter = useHospitalStore((state) => getActiveEncounter(state.hospital));
  const dispatch = useHospitalStore((state) => state.dispatch);
  const priorSiteAction = encounter?.performedExamActions
    .filter((action) => action.startsWith("auscultation:") && action !== "auscultation:valsalva")
    .at(-1);
  const [selectedSite, setSelectedSite] = useState<AuscultationSite>(
    priorSiteAction?.split(":")[1] as AuscultationSite || "LLSB"
  );
  const [listening, setListening] = useState(false);
  const [valsalva, setValsalva] = useState(false);

  useEffect(() => {
    if (!encounter) return;
    dispatch({
      type: "EXAM_PERFORMED",
      encounterId: encounter.encounterId,
      action: "general",
    });
    dispatch({
      type: "EXAM_PERFORMED",
      encounterId: encounter.encounterId,
      action: "vitals",
    });
  }, [dispatch, encounter?.encounterId]);

  useEffect(() => () => stopMurmur(), []);

  if (!hcmCase || !encounter) return null;

  const performed = encounter.performedExamActions;
  const siteFinding = hcmCase.exam.auscultation.find((finding) => finding.site === selectedSite);
  const hasDynamicMurmur =
    performed.includes("auscultation:LLSB") && performed.includes("auscultation:valsalva");
  const learnerActions = performed.filter((action) => action !== "general" && action !== "vitals");
  const canContinue = learnerActions.length >= 2;
  const latestAction = learnerActions.at(-1);

  let response = hcmCase.exam.general;
  if (latestAction === "femoralPulses") response = hcmCase.exam.femoralPulses;
  if (latestAction === "extras:pmi") {
    response = hcmCase.exam.extras.find((item) => item.toLowerCase().includes("pmi")) ?? hcmCase.exam.extras.join(" ");
  }
  if (latestAction?.startsWith("auscultation:")) {
    response = siteFinding?.description ?? response;
    if (valsalva && selectedSite === "LLSB") response += " The murmur becomes more prominent with Valsalva.";
  }

  const selectSite = (site: AuscultationSite) => {
    setSelectedSite(site);
    updateSite(site);
    dispatch({
      type: "EXAM_PERFORMED",
      encounterId: encounter.encounterId,
      action: `auscultation:${site}`,
    });
  };

  const toggleListening = () => {
    if (listening) {
      stopMurmur();
      setListening(false);
      return;
    }
    startMurmur({ pattern: "hcm", heartRate: hcmCase.exam.vitals.HR, valsalva }, selectedSite);
    setListening(true);
  };

  const toggleValsalva = (next: boolean) => {
    setValsalva(next);
    updateValsalva(next);
    if (next) {
      dispatch({
        type: "EXAM_PERFORMED",
        encounterId: encounter.encounterId,
        action: "auscultation:valsalva",
      });
    }
  };

  return (
    <div className="clinical-stage">
      <div className="clinical-stage-heading">
        <div>
          <p className="eyebrow">Examination</p>
          <h3>Perform a focused cardiovascular examination.</h3>
        </div>
        <strong className="clinical-signal">
          {hasDynamicMurmur ? "Dynamic outflow murmur identified" : "Focused exam in progress"}
        </strong>
      </div>

      <div className="vital-strip" aria-label="Vital signs">
        <span>HR <strong>{hcmCase.exam.vitals.HR}</strong></span>
        <span>BP <strong>{hcmCase.exam.vitals.BP}</strong></span>
        <span>RR <strong>{hcmCase.exam.vitals.RR}</strong></span>
        <span>SpO₂ <strong>{hcmCase.exam.vitals.SpO2}%</strong></span>
      </div>

      <div className="clinical-action-grid exam-actions">
        <button
          type="button"
          className={`clinical-action${performed.includes("femoralPulses") ? " used" : ""}`}
          onClick={() => dispatch({ type: "EXAM_PERFORMED", encounterId: encounter.encounterId, action: "femoralPulses" })}
        >
          Check femoral pulses
        </button>
        <button
          type="button"
          className={`clinical-action${performed.includes("extras:pmi") ? " used" : ""}`}
          onClick={() => dispatch({ type: "EXAM_PERFORMED", encounterId: encounter.encounterId, action: "extras:pmi" })}
        >
          Palpate the PMI
        </button>
      </div>

      <section className="auscultation-workbench" aria-label="Interactive cardiac auscultation">
        <div>
          <p className="eyebrow">Digital stethoscope</p>
          <h4>{selectedSite}</h4>
          <div className="site-grid">
            {hcmCase.exam.auscultation.map((finding) => (
              <button
                key={finding.site}
                type="button"
                className={`site-button${selectedSite === finding.site ? " selected" : ""}${performed.includes(`auscultation:${finding.site}`) ? " used" : ""}`}
                onClick={() => selectSite(finding.site)}
              >
                {finding.site}
              </button>
            ))}
          </div>
        </div>
        <div className="auscultation-controls">
          <p>{siteFinding?.description}</p>
          <button type="button" className="primary-action" onClick={toggleListening}>
            {listening ? "Stop listening" : "Begin listening"}
          </button>
          <label>
            <input
              type="checkbox"
              checked={valsalva}
              onChange={(event) => toggleValsalva(event.target.checked)}
            />
            Ask Marcus to perform Valsalva
          </label>
          <small>Educational synthesized heart sounds · headphones recommended</small>
        </div>
      </section>

      <div className="clinical-response" aria-live="polite">{response}</div>

      <div className="clinical-stage-footer">
        <span>{learnerActions.length} focused action{learnerActions.length === 1 ? "" : "s"} performed</span>
        <button
          type="button"
          className="primary-action"
          disabled={!canContinue}
          onClick={() => {
            stopMurmur();
            setListening(false);
            dispatch({
              type: "ENCOUNTER_STAGE_CHANGED",
              encounterId: encounter.encounterId,
              stage: "tests",
            });
          }}
        >
          Choose diagnostic tests
        </button>
      </div>
    </div>
  );
}

function MigrationStageNotice() {
  const encounter = useHospitalStore((state) => getActiveEncounter(state.hospital));
  const dispatch = useHospitalStore((state) => state.dispatch);
  if (!encounter) return null;

  return (
    <div className="clinical-stage clinical-stage-placeholder">
      <p className="eyebrow">{encounter.stage}</p>
      <h3>This stage is being ported into the same canonical encounter.</h3>
      <p>
        History, examination, auscultation, ECG interpretation, and test ordering
        now share one persistent patient state. The next increment ports the
        committed assessment, management, and debrief.
      </p>
      <button
        type="button"
        className="secondary-action"
        onClick={() =>
          dispatch({
            type: "ENCOUNTER_STAGE_CHANGED",
            encounterId: encounter.encounterId,
            stage: "tests",
          })
        }
      >
        Return to diagnostic testing
      </button>
    </div>
  );
}

export default function HcmEncounter() {
  const encounter = useHospitalStore((state) => getActiveEncounter(state.hospital));
  const resumeWorld = useSimulationStore((state) => state.resumeWorld);

  if (!hcmCase || !encounter || encounter.caseId !== hcmCase.id) return null;

  return (
    <section className="encounter-workspace" aria-label="Marcus Chen clinical encounter">
      <header className="encounter-workspace-header">
        <div>
          <p className="eyebrow">Clinic Room 3 · New consultation</p>
          <h2>
            {hcmCase.patientName} <small>{hcmCase.age} years · {hcmCase.sex}</small>
          </h2>
          <p>{hcmCase.chiefComplaint}</p>
        </div>
        <button
          type="button"
          className="encounter-close"
          onClick={resumeWorld}
          aria-label="Return to the 3D hospital"
        >
          ×
        </button>
      </header>

      <div className="encounter-progress">
        <span>{encounter.stage}</span>
        <span>One patient · one persistent encounter</span>
      </div>

      {encounter.stage === "history" && <HistoryStage />}
      {encounter.stage === "exam" && <ExamStage />}
      {encounter.stage === "tests" && <HcmTestsStage />}
      {encounter.stage !== "history" && encounter.stage !== "exam" && encounter.stage !== "tests" && <MigrationStageNotice />}
    </section>
  );
}

"use client";

import { CASES } from "@/lib/cases-data";
import { getActiveEncounter } from "@/lib/hospital-engine";
import { useHospitalStore } from "@/lib/hospital-store";
import { useSimulationStore } from "@/lib/simulation-store";

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
              className={`clinical-action${fact.redFlag ? " critical" : ""}${used ? " used" : ""}`}
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

function MigrationStageNotice() {
  const encounter = useHospitalStore((state) => getActiveEncounter(state.hospital));
  const dispatch = useHospitalStore((state) => state.dispatch);
  if (!encounter) return null;

  return (
    <div className="clinical-stage clinical-stage-placeholder">
      <p className="eyebrow">{encounter.stage}</p>
      <h3>This stage is being ported into the same canonical encounter.</h3>
      <p>
        History is already running from the unified event/state engine. The next
        committed increment ports the focused examination without creating a
        second copy of patient state.
      </p>
      <button
        type="button"
        className="secondary-action"
        onClick={() =>
          dispatch({
            type: "ENCOUNTER_STAGE_CHANGED",
            encounterId: encounter.encounterId,
            stage: "history",
          })
        }
      >
        Return to history
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

      {encounter.stage === "history" ? <HistoryStage /> : <MigrationStageNotice />}
    </section>
  );
}

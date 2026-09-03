"use client";

import { CASES } from "@/lib/cases-data";
import { getActiveEncounter } from "@/lib/hospital-engine";
import { scoreCanonicalEncounter } from "@/lib/hospital-scoring";
import { useHospitalStore } from "@/lib/hospital-store";
import { useSimulationStore } from "@/lib/simulation-store";

const hcmCase = CASES.find((clinicalCase) => clinicalCase.id === "case-hcm");
const UNSAFE_RETURN_TO_PLAY = "Reassure and return to competitive sports";

export function HcmAssessmentStage() {
  const encounter = useHospitalStore((state) => getActiveEncounter(state.hospital));
  const dispatch = useHospitalStore((state) => state.dispatch);

  if (!hcmCase || !encounter) return null;

  const managementOptions = [...hcmCase.correctManagement, UNSAFE_RETURN_TO_PLAY];
  const canPresent = Boolean(encounter.diagnosis && encounter.management.length > 0);

  const toggleManagement = (item: string) => {
    const next = encounter.management.includes(item)
      ? encounter.management.filter((selected) => selected !== item)
      : [...encounter.management, item];
    dispatch({
      type: "MANAGEMENT_SELECTED",
      encounterId: encounter.encounterId,
      management: next,
    });
  };

  const presentCase = () => {
    if (!canPresent) return;
    if (encounter.management.includes(UNSAFE_RETURN_TO_PLAY)) {
      dispatch({
        type: "SAFETY_EVENT_RECORDED",
        encounterId: encounter.encounterId,
        description: "Return to competitive sports selected despite high-risk exertional syncope",
      });
    }
    dispatch({
      type: "ENCOUNTER_STAGE_CHANGED",
      encounterId: encounter.encounterId,
      stage: "debrief",
    });
  };

  return (
    <div className="clinical-stage">
      <div className="clinical-stage-heading">
        <div>
          <p className="eyebrow">Assessment + plan</p>
          <h3>Commit to one diagnosis and the actions that happen today.</h3>
        </div>
        <strong className="clinical-signal">
          {encounter.diagnosis ? "Clinical judgment committed" : "Assessment incomplete"}
        </strong>
      </div>

      <section className="assessment-block">
        <p className="field-label">Most likely diagnosis</p>
        <div className="diagnosis-grid">
          {hcmCase.differentials.map((diagnosis) => (
            <button
              key={diagnosis}
              type="button"
              className={`diagnosis-choice${encounter.diagnosis === diagnosis ? " selected" : ""}`}
              onClick={() =>
                dispatch({
                  type: "DIAGNOSIS_COMMITTED",
                  encounterId: encounter.encounterId,
                  diagnosis,
                })
              }
            >
              {diagnosis}
            </button>
          ))}
        </div>
      </section>

      <section className="assessment-block">
        <p className="field-label">What happens today?</p>
        <div className="management-grid">
          {managementOptions.map((item) => (
            <label key={item} className={encounter.management.includes(item) ? "selected" : ""}>
              <input
                type="checkbox"
                checked={encounter.management.includes(item)}
                onChange={() => toggleManagement(item)}
              />
              <span>{item}</span>
            </label>
          ))}
        </div>
      </section>

      <div className="clinical-stage-footer">
        <span>{encounter.management.length} management action{encounter.management.length === 1 ? "" : "s"} selected</span>
        <button type="button" className="primary-action" disabled={!canPresent} onClick={presentCase}>
          Present to Dr. Patel
        </button>
      </div>
    </div>
  );
}

export function HcmDebriefStage() {
  const encounter = useHospitalStore((state) => getActiveEncounter(state.hospital));
  const dispatch = useHospitalStore((state) => state.dispatch);
  const resumeWorld = useSimulationStore((state) => state.resumeWorld);

  if (!hcmCase || !encounter) return null;

  const score = scoreCanonicalEncounter(encounter, hcmCase);
  const headline = score.overall >= 85
    ? "Strong clinical judgment"
    : score.overall >= 70
      ? "Safe, with missed opportunities"
      : "Revisit the red flags";

  const missedOpportunityMessages = score.missedRedFlags
    .map((key) => hcmCase.missedOpportunityTemplate[key])
    .filter(Boolean);

  const completeEncounter = () => {
    dispatch({ type: "ENCOUNTER_COMPLETED", encounterId: encounter.encounterId });
    resumeWorld();
  };

  return (
    <div className="clinical-stage debrief-stage">
      <div className="clinical-stage-heading">
        <div>
          <p className="eyebrow">Attending debrief</p>
          <h3>{headline}</h3>
        </div>
        <strong className="overall-score">{score.overall}%</strong>
      </div>

      <p className="debrief-summary">
        {score.diagnosisCorrect
          ? "You identified hypertrophic cardiomyopathy. The debrief below reflects the process used to get there, not just the final diagnosis."
          : "The submitted diagnosis did not fully account for the mid-exertional collapse, dynamic murmur, ECG/echo phenotype, and family history."}
      </p>

      <div className="score-grid">
        {Object.entries(score.dimensions).map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{value}%</strong>
          </div>
        ))}
      </div>

      {(missedOpportunityMessages.length > 0 || score.unnecessaryTests.length > 0) && (
        <section className="debrief-opportunities">
          <p className="field-label">Missed opportunities</p>
          {missedOpportunityMessages.map((message) => <p key={message}>{message}</p>)}
          {score.unnecessaryTests.length > 0 && (
            <p>Potentially unnecessary testing selected: {score.unnecessaryTests.join(", ")}.</p>
          )}
        </section>
      )}

      <blockquote>{hcmCase.teachingPoint}</blockquote>

      <div className="clinical-stage-footer">
        <span>Encounter state is saved and will persist after you leave the room.</span>
        <button type="button" className="primary-action" onClick={completeEncounter}>
          Complete encounter and return to hospital
        </button>
      </div>
    </div>
  );
}

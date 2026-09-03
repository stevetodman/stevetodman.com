"use client";

import { useState } from "react";
import { CASES } from "@/lib/cases-data";
import { getActiveEncounter } from "@/lib/hospital-engine";
import { useHospitalStore } from "@/lib/hospital-store";
import HcmEcgReader from "./hcm-ecg-reader";

const hcmCase = CASES.find((clinicalCase) => clinicalCase.id === "case-hcm");

export default function HcmTestsStage() {
  const encounter = useHospitalStore((state) => getActiveEncounter(state.hospital));
  const dispatch = useHospitalStore((state) => state.dispatch);
  const [ecgOpen, setEcgOpen] = useState(false);

  if (!hcmCase || !encounter) return null;

  const ordered = encounter.orderedTests;
  const reviewed = encounter.reviewedResults;
  const hasEcg = ordered.includes("ECG");
  const hasEcho = ordered.includes("Echocardiogram");
  const hasTroponin = ordered.includes("Troponin") || ordered.includes("BNP");
  const hasMri = ordered.includes("Cardiac MRI");
  const canContinue = ordered.length > 0;

  const orderAndReview = (test: string) => {
    dispatch({ type: "TEST_ORDERED", encounterId: encounter.encounterId, test });
    dispatch({ type: "RESULT_REVIEWED", encounterId: encounter.encounterId, result: test });
  };

  const responseBlocks: string[] = [];
  if (reviewed.includes("ECG")) {
    responseBlocks.push(
      `ECG — ${hcmCase.ecg.rhythm}; ${hcmCase.ecg.keyFindings.join("; ")}.`
    );
  }
  if (reviewed.includes("Echocardiogram")) {
    responseBlocks.push(
      `Echo — ${hcmCase.echo.summary} ${hcmCase.echo.keyFindings.join("; ")}.`
    );
  }
  if (hasTroponin) responseBlocks.push("Troponin + BNP ordered. No numeric laboratory values are required for this teaching case.");
  if (hasMri) responseBlocks.push("Cardiac MRI ordered. No additional case-specific MRI result is supplied in this vertical slice.");

  return (
    <div className="clinical-stage">
      <div className="clinical-stage-heading">
        <div>
          <p className="eyebrow">Diagnostic testing</p>
          <h3>Order only the studies that change diagnosis or immediate management.</h3>
        </div>
        <strong className="clinical-signal">
          {hasEcg && hasEcho ? "ECG and echocardiographic phenotype reviewed" : "Diagnostic workup in progress"}
        </strong>
      </div>

      <div className="clinical-action-grid">
        <button
          type="button"
          className={`clinical-action${hasEcg ? " used" : ""}`}
          onClick={() => setEcgOpen(true)}
        >
          {hasEcg ? "Review / update ECG interpretation" : "Acquire + interpret ECG"}
        </button>
        <button
          type="button"
          className={`clinical-action${hasEcho ? " used" : ""}`}
          onClick={() => orderAndReview("Echocardiogram")}
        >
          Order echocardiogram
        </button>
        <button
          type="button"
          className={`clinical-action${hasTroponin ? " used" : ""}`}
          onClick={() => {
            orderAndReview("Troponin");
            orderAndReview("BNP");
          }}
        >
          Order troponin + BNP
        </button>
        <button
          type="button"
          className={`clinical-action${hasMri ? " used" : ""}`}
          onClick={() => orderAndReview("Cardiac MRI")}
        >
          Order cardiac MRI
        </button>
      </div>

      <div className="clinical-response result-response" aria-live="polite">
        {responseBlocks.length ? responseBlocks.join("\n\n") : "No studies ordered."}
      </div>

      <div className="clinical-stage-footer">
        <span>{ordered.length} test item{ordered.length === 1 ? "" : "s"} ordered</span>
        <button
          type="button"
          className="primary-action"
          disabled={!canContinue}
          onClick={() =>
            dispatch({
              type: "ENCOUNTER_STAGE_CHANGED",
              encounterId: encounter.encounterId,
              stage: "assessment",
            })
          }
        >
          Commit assessment and plan
        </button>
      </div>

      {ecgOpen && <HcmEcgReader onClose={() => setEcgOpen(false)} />}
    </div>
  );
}

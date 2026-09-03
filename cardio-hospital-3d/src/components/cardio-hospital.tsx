"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect } from "react";
import {
  formatHospitalTime,
  getActiveEncounter,
  getHospitalWorkflowPhase,
  getTask,
} from "@/lib/hospital-engine";
import { SERVICE_PAGER_PAGE_ID } from "@/lib/hospital-pages";
import { useHospitalStore } from "@/lib/hospital-store";
import { HCM_CASE_ID, HCM_PATIENT_ID, HCM_ROOM, HCM_TASK_ID } from "@/lib/scenario-ids";
import { useSimulationStore } from "@/lib/simulation-store";
import HcmEncounter from "./clinical/hcm-encounter";
import MobileControls from "./mobile-controls";
import PagerPanel from "./pager-panel";
import HospitalWorld from "./world/hospital-world";

function EntryScreen() {
  const setEntered = useSimulationStore((state) => state.setEntered);
  const openEncounter = useSimulationStore((state) => state.openEncounter);
  const hospital = useHospitalStore((state) => state.hospital);
  const hydrated = useHospitalStore((state) => state.hydrated);
  const dispatch = useHospitalStore((state) => state.dispatch);
  const activeEncounter = getActiveEncounter(hospital);

  const enterHospital = () => {
    if (!hydrated) return;
    if (hospital.shift.status === "not-started") {
      dispatch({ type: "SHIFT_STARTED", shiftId: "shift-1", day: 1, startMinute: 7 * 60 + 42, location: "workroom" });
    }
    dispatch({ type: "PAGE_RECEIVED", pageId: SERVICE_PAGER_PAGE_ID });
    dispatch({ type: "PATIENT_ARRIVED", patientId: HCM_PATIENT_ID, caseId: HCM_CASE_ID, location: HCM_ROOM });
    dispatch({ type: "TASK_CREATED", taskId: HCM_TASK_ID, kind: "consult", caseId: HCM_CASE_ID, patientId: HCM_PATIENT_ID, location: HCM_ROOM });
    if (activeEncounter) dispatch({ type: "TASK_STARTED", taskId: HCM_TASK_ID });
    setEntered(true);
    if (activeEncounter) openEncounter();
  };

  return (
    <section className="entry-screen">
      <div className="entry-vignette" />
      <div className="entry-content">
        <p className="eyebrow">LSU Health Shreveport · Pediatric Cardiology</p>
        <h1>Pediatric<br />Hospital</h1>
        <p className="entry-lead">
          {!hydrated
            ? "Loading your saved hospital state…"
            : activeEncounter
              ? "Your patient encounter is saved and ready to resume."
              : "Your pediatric cardiology shift is ready."}
        </p>
        <div className="shift-card">
          <span>Monday</span>
          <strong>7:42 AM</strong>
          <span>Cardiology rotation · Day 1</span>
        </div>
        <button className="primary-action" onClick={enterHospital} disabled={!hydrated}>
          {!hydrated ? "Loading saved shift…" : activeEncounter ? "Resume patient" : "Enter the hospital"}
        </button>
        <p className="entry-help">Unified development build · headphones improve auscultation</p>
      </div>
    </section>
  );
}

function BriefingPanel() {
  const open = useSimulationStore((state) => state.briefingOpen);
  const closeBriefing = useSimulationStore((state) => state.closeBriefing);
  const task = useHospitalStore((state) => getTask(state.hospital, HCM_TASK_ID));
  const dispatch = useHospitalStore((state) => state.dispatch);
  if (!open) return null;

  const acceptAssignment = () => {
    dispatch({ type: "TASK_ASSIGNED", taskId: HCM_TASK_ID });
    closeBriefing();
  };

  return (
    <div className="dialog-backdrop" role="presentation">
      <section className="briefing-panel" role="dialog" aria-modal="true" aria-label="Morning briefing">
        <div className="speaker-row">
          <div className="speaker-avatar">RP</div>
          <div><p className="eyebrow">Attending physician</p><h2>Dr. Patel</h2></div>
        </div>
        <div className="dialogue-copy">
          <p>Morning. We have a fourteen-year-old in Room 3 who fainted during basketball practice.</p>
          <p>I want you to see him first. Decide whether this is benign syncope or a high-risk cardiac presentation that needs urgent evaluation.</p>
        </div>
        <div className="assignment-card">
          <span>Room 3</span>
          <strong>Marcus Chen · 14 years</strong>
          <span>Referral: exertional syncope</span>
        </div>
        <div className="dialog-actions">
          {task?.status === "available" && <button className="primary-action" onClick={acceptAssignment}>Accept patient</button>}
          <button className="secondary-action" onClick={closeBriefing}>Close</button>
        </div>
      </section>
    </div>
  );
}

function SimulationHud() {
  const prompt = useSimulationStore((state) => state.prompt);
  const locked = useSimulationStore((state) => state.controlsLocked);
  const briefingOpen = useSimulationStore((state) => state.briefingOpen);
  const encounterOpen = useSimulationStore((state) => state.encounterOpen);
  const hospital = useHospitalStore((state) => state.hospital);
  const task = getTask(hospital, HCM_TASK_ID);
  const activeEncounter = getActiveEncounter(hospital);
  const workflow = getHospitalWorkflowPhase(hospital);

  let objective = "Meet Dr. Patel in the team room";
  if (briefingOpen) objective = "Receive your first patient";
  else if (activeEncounter && encounterOpen) objective = "Evaluate the patient";
  else if (activeEncounter) objective = "Continue Marcus Chen's encounter in Room 3";
  else if (workflow === "assigned" || task?.status === "assigned") objective = "Walk to Clinic Room 3";
  else if (workflow === "complete") objective = "Patient encounter complete";

  return (
    <div className="hud" aria-live="polite">
      <div className="hud-top">
        <div className="location-card">
          <span>{formatHospitalTime(hospital.shift.clockMinutes)}</span>
          <strong>Pediatric Hospital · Cardiology</strong>
          <span>{objective}</span>
        </div>
        <div className="controls-card">
          <span>WASD move</span><span>Mouse look</span><span>E interact</span><span>Shift faster</span>
        </div>
      </div>
      {locked && <div className="crosshair" aria-hidden="true"><i /><i /></div>}
      {prompt && <div className="interaction-prompt">{prompt}</div>}
      {!locked && !briefingOpen && !encounterOpen && <div className="lock-hint">Click inside the hospital to look around</div>}
    </div>
  );
}

export default function CardioHospital() {
  const entered = useSimulationStore((state) => state.entered);
  const encounterOpen = useSimulationStore((state) => state.encounterOpen);
  const hydrateHospital = useHospitalStore((state) => state.hydrate);

  useEffect(() => { hydrateHospital(); }, [hydrateHospital]);

  return (
    <main className="simulation-shell">
      <Canvas
        id="simulation-canvas"
        shadows
        dpr={[1, 1.65]}
        camera={{ fov: 68, near: 0.05, far: 75, position: [0, 1.57, 8.65] }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <Suspense fallback={null}><HospitalWorld /></Suspense>
      </Canvas>
      {!entered && <EntryScreen />}
      {entered && <SimulationHud />}
      {entered && <PagerPanel />}
      {entered && <MobileControls />}
      {entered && <BriefingPanel />}
      {entered && encounterOpen && <HcmEncounter />}
    </main>
  );
}

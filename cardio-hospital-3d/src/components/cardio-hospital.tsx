"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import {
  formatHospitalTime,
  getActiveEncounter,
  getTask,
} from "@/lib/hospital-engine";
import { useHospitalStore } from "@/lib/hospital-store";
import { WORKROOM_HANDOFF_TASK_ID } from "@/lib/hospital-work";
import {
  HCM_CASE_ID,
  HCM_PATIENT_ID,
  HCM_ROOM,
  HCM_TASK_ID,
  VASOVAGAL_CASE_ID,
  VASOVAGAL_TASK_ID,
} from "@/lib/scenario-ids";
import { useSimulationStore } from "@/lib/simulation-store";
import HcmEncounter from "./clinical/hcm-encounter";
import VasovagalEncounter from "./clinical/vasovagal-encounter";
import MobileControls from "./mobile-controls";
import PagerPanel from "./pager-panel";
import WorkQueuePanel from "./work-queue-panel";

const HospitalWorldCanvas = dynamic(() => import("./world/hospital-world-canvas"), {
  ssr: false,
  loading: () => null,
});

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
    dispatch({ type: "PATIENT_ARRIVED", patientId: HCM_PATIENT_ID, caseId: HCM_CASE_ID, location: HCM_ROOM });
    dispatch({ type: "TASK_CREATED", taskId: HCM_TASK_ID, kind: "consult", caseId: HCM_CASE_ID, patientId: HCM_PATIENT_ID, location: HCM_ROOM, priority: "urgent" });
    if (activeEncounter?.taskId) dispatch({ type: "TASK_STARTED", taskId: activeEncounter.taskId });
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
  const hcmTask = getTask(hospital, HCM_TASK_ID);
  const vasovagalTask = getTask(hospital, VASOVAGAL_TASK_ID);
  const handoffTask = getTask(hospital, WORKROOM_HANDOFF_TASK_ID);
  const activeEncounter = getActiveEncounter(hospital);

  let objective = "Meet Dr. Patel in the team room";
  if (briefingOpen) objective = "Receive your first patient";
  else if (activeEncounter?.caseId === HCM_CASE_ID && encounterOpen) objective = "Evaluate Marcus Chen";
  else if (activeEncounter?.caseId === VASOVAGAL_CASE_ID && encounterOpen) objective = "Evaluate Ava Rodriguez";
  else if (activeEncounter?.caseId === HCM_CASE_ID) objective = "Continue Marcus Chen's encounter in Room 3";
  else if (activeEncounter?.caseId === VASOVAGAL_CASE_ID) objective = "Continue Ava Rodriguez's encounter in Room 1";
  else if (hcmTask?.status === "assigned" || hcmTask?.status === "in-progress") objective = "Walk to Clinic Room 3";
  else if (vasovagalTask?.status === "available") objective = "Review the pager for the new Room 1 consult";
  else if (vasovagalTask?.status === "assigned" || vasovagalTask?.status === "in-progress") objective = "Walk to Clinic Room 1";
  else if (hcmTask?.status === "complete" && vasovagalTask?.status === "complete") objective = "Clinical consults complete";

  const secondaryObjective = handoffTask && (handoffTask.status === "assigned" || handoffTask.status === "in-progress")
    ? "Secondary · Review overnight handoff at a team-room workstation"
    : handoffTask?.status === "complete"
      ? "Secondary · Overnight handoff reviewed"
      : null;

  return (
    <div className="hud" aria-live="polite">
      <div className="hud-top">
        <div className="location-card">
          <span>{formatHospitalTime(hospital.shift.clockMinutes)}</span>
          <strong>Pediatric Hospital · Cardiology</strong>
          <span>{objective}</span>
          {secondaryObjective && <span>{secondaryObjective}</span>}
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
  const activeCaseId = useHospitalStore((state) => getActiveEncounter(state.hospital)?.caseId);
  const hydrateHospital = useHospitalStore((state) => state.hydrate);

  useEffect(() => { hydrateHospital(); }, [hydrateHospital]);

  return (
    <main className="simulation-shell">
      {entered && <HospitalWorldCanvas />}
      {!entered && <EntryScreen />}
      {entered && <SimulationHud />}
      {entered && <PagerPanel />}
      {entered && <WorkQueuePanel />}
      {entered && <MobileControls />}
      {entered && <BriefingPanel />}
      {entered && encounterOpen && activeCaseId === HCM_CASE_ID && <HcmEncounter />}
      {entered && encounterOpen && activeCaseId === VASOVAGAL_CASE_ID && <VasovagalEncounter />}
    </main>
  );
}

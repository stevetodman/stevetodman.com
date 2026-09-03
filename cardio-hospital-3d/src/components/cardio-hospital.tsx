"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect } from "react";
import { formatHospitalTime } from "@/lib/hospital-engine";
import { useHospitalStore } from "@/lib/hospital-store";
import { useSimulationStore } from "@/lib/simulation-store";
import HcmEncounter from "./clinical/hcm-encounter";
import HospitalWorld from "./world/hospital-world";

function EntryScreen() {
  const setEntered = useSimulationStore((state) => state.setEntered);
  const shiftStatus = useHospitalStore((state) => state.hospital.shift.status);
  const dispatch = useHospitalStore((state) => state.dispatch);

  const enterHospital = () => {
    if (shiftStatus === "not-started") {
      dispatch({
        type: "SHIFT_STARTED",
        shiftId: "shift-1",
        day: 1,
        startMinute: 7 * 60 + 42,
        location: "workroom",
      });
    }
    setEntered(true);
  };

  return (
    <section className="entry-screen">
      <div className="entry-vignette" />
      <div className="entry-content">
        <p className="eyebrow">LSU Health Shreveport · Pediatric Cardiology</p>
        <h1>Cardio Hospital</h1>
        <p className="entry-lead">Your first clinic patient is waiting.</p>
        <div className="shift-card">
          <span>Monday</span>
          <strong>7:42 AM</strong>
          <span>Cardiology rotation · Day 1</span>
        </div>
        <button className="primary-action" onClick={enterHospital}>
          Enter the hospital
        </button>
        <p className="entry-help">Desktop Chrome recommended · headphones improve auscultation</p>
      </div>
    </section>
  );
}

function BriefingPanel() {
  const open = useSimulationStore((state) => state.briefingOpen);
  const phase = useSimulationStore((state) => state.phase);
  const acceptAssignment = useSimulationStore((state) => state.acceptAssignment);
  const closeBriefing = useSimulationStore((state) => state.closeBriefing);
  if (!open) return null;

  return (
    <div className="dialog-backdrop" role="presentation">
      <section className="briefing-panel" role="dialog" aria-modal="true" aria-label="Morning briefing">
        <div className="speaker-row">
          <div className="speaker-avatar">RP</div>
          <div>
            <p className="eyebrow">Attending physician</p>
            <h2>Dr. Patel</h2>
          </div>
        </div>
        <div className="dialogue-copy">
          <p>Morning. We have a fourteen-year-old in Room 3 who fainted during basketball practice.</p>
          <p>I want you to see him first. Decide whether this is benign syncope or whether he needs immediate restriction and further evaluation.</p>
        </div>
        <div className="assignment-card">
          <span>Room 3</span>
          <strong>Marcus Chen · 14 years</strong>
          <span>Referral: exertional syncope</span>
        </div>
        <div className="dialog-actions">
          {phase === "briefing" && (
            <button className="primary-action" onClick={acceptAssignment}>Accept patient</button>
          )}
          <button className="secondary-action" onClick={closeBriefing}>Close</button>
        </div>
      </section>
    </div>
  );
}

function SimulationHud() {
  const phase = useSimulationStore((state) => state.phase);
  const prompt = useSimulationStore((state) => state.prompt);
  const locked = useSimulationStore((state) => state.controlsLocked);
  const clockMinutes = useHospitalStore((state) => state.hospital.shift.clockMinutes);
  const objectives = {
    arrival: "Meet Dr. Patel in the team room",
    briefing: "Receive your first patient",
    assigned: "Walk to Clinic Room 3",
    encounter: "Evaluate the patient",
  } as const;

  return (
    <div className="hud" aria-live="polite">
      <div className="hud-top">
        <div className="location-card">
          <span>{formatHospitalTime(clockMinutes)}</span>
          <strong>Pediatric Cardiology</strong>
          <span>{objectives[phase]}</span>
        </div>
        <div className="controls-card">
          <span>WASD move</span><span>Mouse look</span><span>E interact</span><span>Shift faster</span>
        </div>
      </div>
      {locked && <div className="crosshair" aria-hidden="true"><i /><i /></div>}
      {prompt && <div className="interaction-prompt">{prompt}</div>}
      {!locked && phase !== "briefing" && phase !== "encounter" && <div className="lock-hint">Click inside the hospital to look around</div>}
    </div>
  );
}

export default function CardioHospital() {
  const entered = useSimulationStore((state) => state.entered);
  const phase = useSimulationStore((state) => state.phase);
  const hydrateHospital = useHospitalStore((state) => state.hydrate);

  useEffect(() => {
    hydrateHospital();
  }, [hydrateHospital]);

  return (
    <main className="simulation-shell">
      <Canvas
        id="simulation-canvas"
        shadows
        dpr={[1, 1.65]}
        camera={{ fov: 68, near: 0.05, far: 75, position: [0, 1.57, 8.65] }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <Suspense fallback={null}>
          <HospitalWorld />
        </Suspense>
      </Canvas>
      {!entered && <EntryScreen />}
      {entered && <SimulationHud />}
      {entered && <BriefingPanel />}
      {entered && phase === "encounter" && <HcmEncounter />}
    </main>
  );
}

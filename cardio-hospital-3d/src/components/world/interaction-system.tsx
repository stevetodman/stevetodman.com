import { useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useRef } from "react";
import { getActiveEncounter, getTask } from "@/lib/hospital-engine";
import { useHospitalStore } from "@/lib/hospital-store";
import { getHospitalWorkDefinition, WORKROOM_HANDOFF_TASK_ID } from "@/lib/hospital-work";
import { HCM_CASE_ID, HCM_PATIENT_ID, HCM_ROOM, HCM_TASK_ID } from "@/lib/scenario-ids";
import { useSimulationStore } from "@/lib/simulation-store";

const TEAM_ROOM_WORKSTATIONS: Array<[number, number]> = [
  [-4.45, 6.1],
  [-4.45, 7.8],
  [-4.45, 9.5],
];

function nearestWorkstationDistance(x: number, z: number): number {
  return Math.min(...TEAM_ROOM_WORKSTATIONS.map(([workstationX, workstationZ]) => Math.hypot(x - workstationX, z - workstationZ)));
}

export function InteractionSystem() {
  const { camera } = useThree();
  const taskStatus = useHospitalStore((state) => getTask(state.hospital, HCM_TASK_ID)?.status);
  const handoffTaskStatus = useHospitalStore((state) => getTask(state.hospital, WORKROOM_HANDOFF_TASK_ID)?.status);
  const hasActiveEncounter = useHospitalStore((state) => Boolean(getActiveEncounter(state.hospital)));
  const setPrompt = useSimulationStore((state) => state.setPrompt);
  const openBriefing = useSimulationStore((state) => state.openBriefing);
  const openEncounter = useSimulationStore((state) => state.openEncounter);
  const interactSequence = useSimulationStore((state) => state.interactSequence);
  const dispatch = useHospitalStore((state) => state.dispatch);
  const active = useRef<"attending" | "exam" | "handoff" | null>(null);
  const priorPrompt = useRef<string | null>(null);
  const handledInteractSequence = useRef(interactSequence);

  useFrame(() => {
    const attendingDistance = Math.hypot(camera.position.x, camera.position.z - 10.25);
    const examDistance = Math.hypot(camera.position.x - 2.2, camera.position.z + 3);
    const handoffDistance = nearestWorkstationDistance(camera.position.x, camera.position.z);
    let next: "attending" | "exam" | "handoff" | null = null;
    let prompt: string | null = null;

    if (taskStatus === "available" && attendingDistance < 2.1) {
      next = "attending";
      prompt = "Interact · Speak with Dr. Patel";
    } else if ((taskStatus === "assigned" || taskStatus === "in-progress" || hasActiveEncounter) && examDistance < 2.2) {
      next = "exam";
      prompt = hasActiveEncounter ? "Interact · Continue patient encounter" : "Interact · Enter Clinic Room 3";
    } else if ((handoffTaskStatus === "assigned" || handoffTaskStatus === "in-progress") && handoffDistance < 1.8) {
      next = "handoff";
      prompt = "Interact · Review overnight handoff";
    }

    active.current = next;
    if (prompt !== priorPrompt.current) {
      priorPrompt.current = prompt;
      setPrompt(prompt);
    }
  });

  const performInteraction = useCallback(() => {
    if (active.current === "attending") {
      openBriefing();
      return;
    }

    if (active.current === "handoff") {
      const handoffTask = getTask(useHospitalStore.getState().hospital, WORKROOM_HANDOFF_TASK_ID);
      if (!handoffTask || (handoffTask.status !== "assigned" && handoffTask.status !== "in-progress")) return;
      const durationMinutes = handoffTask.durationMinutes
        ?? getHospitalWorkDefinition(WORKROOM_HANDOFF_TASK_ID)?.durationMinutes;
      if (handoffTask.status === "assigned") dispatch({ type: "TASK_STARTED", taskId: WORKROOM_HANDOFF_TASK_ID });
      if (typeof durationMinutes === "number" && durationMinutes > 0) {
        dispatch({ type: "TIME_ADVANCED", minutes: durationMinutes });
      }
      dispatch({ type: "TASK_COMPLETED", taskId: WORKROOM_HANDOFF_TASK_ID });
      return;
    }

    if (active.current !== "exam") return;

    const hospital = useHospitalStore.getState().hospital;
    const current = getActiveEncounter(hospital);
    if (!current) {
      const priorHcmAttempts = Object.values(hospital.encounters).filter((encounter) => encounter.caseId === HCM_CASE_ID).length;
      dispatch({
        type: "ENCOUNTER_STARTED",
        encounterId: `encounter-case-hcm-${priorHcmAttempts + 1}`,
        taskId: HCM_TASK_ID,
        patientId: HCM_PATIENT_ID,
        caseId: HCM_CASE_ID,
        location: HCM_ROOM,
      });
    } else {
      dispatch({ type: "TASK_STARTED", taskId: HCM_TASK_ID });
    }
    openEncounter();
  }, [dispatch, openBriefing, openEncounter]);

  useEffect(() => {
    const interact = (event: KeyboardEvent) => {
      if (event.code !== "KeyE" || event.repeat) return;
      performInteraction();
    };
    window.addEventListener("keydown", interact);
    return () => window.removeEventListener("keydown", interact);
  }, [performInteraction]);

  useEffect(() => {
    if (interactSequence === handledInteractSequence.current) return;
    handledInteractSequence.current = interactSequence;
    performInteraction();
  }, [interactSequence, performInteraction]);

  return null;
}

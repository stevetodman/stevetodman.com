import { useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useRef } from "react";
import { getActiveEncounter, getTask, type TaskStatus } from "@/lib/hospital-engine";
import { useHospitalStore } from "@/lib/hospital-store";
import {
  HCM_PARENT_WORLD_POSITION,
  HCM_PATIENT_WORLD_POSITION,
  VASOVAGAL_PARENT_WORLD_POSITION,
  VASOVAGAL_PATIENT_WORLD_POSITION,
} from "@/lib/hospital-world-layout";
import { getHospitalWorkDefinition, WORKROOM_HANDOFF_TASK_ID } from "@/lib/hospital-work";
import {
  HCM_CASE_ID,
  HCM_PATIENT_ID,
  HCM_ROOM,
  HCM_TASK_ID,
  VASOVAGAL_CASE_ID,
  VASOVAGAL_PATIENT_ID,
  VASOVAGAL_ROOM,
  VASOVAGAL_TASK_ID,
} from "@/lib/scenario-ids";
import { useSimulationStore } from "@/lib/simulation-store";

const TEAM_ROOM_WORKSTATIONS: Array<[number, number]> = [
  [-4.45, 6.1],
  [-4.45, 7.8],
  [-4.45, 9.5],
];

const NPC_INTERACTION_RADIUS = 2.4;

type ActiveInteraction = "attending" | "hcm-exam" | "vasovagal-exam" | "handoff" | null;

const CONSULTS = {
  "hcm-exam": {
    caseId: HCM_CASE_ID,
    patientId: HCM_PATIENT_ID,
    taskId: HCM_TASK_ID,
    room: HCM_ROOM,
    label: "Clinic Room 3",
  },
  "vasovagal-exam": {
    caseId: VASOVAGAL_CASE_ID,
    patientId: VASOVAGAL_PATIENT_ID,
    taskId: VASOVAGAL_TASK_ID,
    room: VASOVAGAL_ROOM,
    label: "Clinic Room 1",
  },
} as const;

function nearestWorkstationDistance(x: number, z: number): number {
  return Math.min(...TEAM_ROOM_WORKSTATIONS.map(([workstationX, workstationZ]) => Math.hypot(x - workstationX, z - workstationZ)));
}

function nearestNpcDistance(
  x: number,
  z: number,
  anchors: ReadonlyArray<readonly [number, number, number]>
): number {
  return Math.min(...anchors.map(([npcX, , npcZ]) => Math.hypot(x - npcX, z - npcZ)));
}

function consultCanBeOpened(status: TaskStatus | undefined): boolean {
  return status === "available" || status === "assigned" || status === "in-progress";
}

export function InteractionSystem() {
  const { camera } = useThree();
  const hcmTaskStatus = useHospitalStore((state) => getTask(state.hospital, HCM_TASK_ID)?.status);
  const vasovagalTaskStatus = useHospitalStore((state) => getTask(state.hospital, VASOVAGAL_TASK_ID)?.status);
  const handoffTaskStatus = useHospitalStore((state) => getTask(state.hospital, WORKROOM_HANDOFF_TASK_ID)?.status);
  const activeEncounter = useHospitalStore((state) => getActiveEncounter(state.hospital));
  const setPrompt = useSimulationStore((state) => state.setPrompt);
  const openBriefing = useSimulationStore((state) => state.openBriefing);
  const openEncounter = useSimulationStore((state) => state.openEncounter);
  const interactSequence = useSimulationStore((state) => state.interactSequence);
  const dispatch = useHospitalStore((state) => state.dispatch);
  const active = useRef<ActiveInteraction>(null);
  const priorPrompt = useRef<string | null>(null);
  const handledInteractSequence = useRef(interactSequence);

  useFrame(() => {
    const attendingDistance = Math.hypot(camera.position.x, camera.position.z - 10.55);
    const hcmNpcDistance = nearestNpcDistance(camera.position.x, camera.position.z, [HCM_PATIENT_WORLD_POSITION, HCM_PARENT_WORLD_POSITION]);
    const vasovagalNpcDistance = nearestNpcDistance(camera.position.x, camera.position.z, [VASOVAGAL_PATIENT_WORLD_POSITION, VASOVAGAL_PARENT_WORLD_POSITION]);
    const handoffDistance = nearestWorkstationDistance(camera.position.x, camera.position.z);
    let next: ActiveInteraction = null;
    let prompt: string | null = null;

    if ((hcmTaskStatus === "available" || hcmTaskStatus === "assigned") && attendingDistance < 2.1) {
      next = "attending";
      prompt = "Interact · Speak with Dr. Patel";
    } else if (activeEncounter?.caseId === HCM_CASE_ID && hcmNpcDistance < NPC_INTERACTION_RADIUS) {
      next = "hcm-exam";
      prompt = "Interact · Speak with Marcus Chen";
    } else if (activeEncounter?.caseId === VASOVAGAL_CASE_ID && vasovagalNpcDistance < NPC_INTERACTION_RADIUS) {
      next = "vasovagal-exam";
      prompt = "Interact · Speak with Ava Rodriguez";
    } else if (!activeEncounter && consultCanBeOpened(hcmTaskStatus) && hcmNpcDistance < NPC_INTERACTION_RADIUS) {
      next = "hcm-exam";
      prompt = "Interact · Speak with Marcus Chen";
    } else if (!activeEncounter && consultCanBeOpened(vasovagalTaskStatus) && vasovagalNpcDistance < NPC_INTERACTION_RADIUS) {
      next = "vasovagal-exam";
      prompt = "Interact · Speak with Ava Rodriguez";
    } else if ((handoffTaskStatus === "assigned" || handoffTaskStatus === "in-progress") && handoffDistance < 1.8) {
      next = "handoff";
      prompt = "Interact · Review overnight handoff";
    }

    active.current = next;
    const visiblePrompt = useSimulationStore.getState().prompt;
    if (prompt !== priorPrompt.current || prompt !== visiblePrompt) {
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

    if (active.current !== "hcm-exam" && active.current !== "vasovagal-exam") return;
    const consult = CONSULTS[active.current];
    const hospital = useHospitalStore.getState().hospital;
    const current = getActiveEncounter(hospital);
    if (current && current.caseId !== consult.caseId) return;

    if (!current) {
      const priorAttempts = Object.values(hospital.encounters).filter((encounter) => encounter.caseId === consult.caseId).length;
      dispatch({
        type: "ENCOUNTER_STARTED",
        encounterId: `encounter-${consult.caseId}-${priorAttempts + 1}`,
        taskId: consult.taskId,
        patientId: consult.patientId,
        caseId: consult.caseId,
        location: consult.room,
      });
    } else if (current.taskId) {
      dispatch({ type: "TASK_STARTED", taskId: current.taskId });
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

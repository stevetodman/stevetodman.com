import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { getActiveEncounter, getTask } from "@/lib/hospital-engine";
import { useHospitalStore } from "@/lib/hospital-store";
import { HCM_CASE_ID, HCM_PATIENT_ID, HCM_ROOM, HCM_TASK_ID } from "@/lib/scenario-ids";
import { useSimulationStore } from "@/lib/simulation-store";

export function InteractionSystem() {
  const { camera } = useThree();
  const taskStatus = useHospitalStore((state) => getTask(state.hospital, HCM_TASK_ID)?.status);
  const hasActiveEncounter = useHospitalStore((state) => Boolean(getActiveEncounter(state.hospital)));
  const setPrompt = useSimulationStore((state) => state.setPrompt);
  const openBriefing = useSimulationStore((state) => state.openBriefing);
  const openEncounter = useSimulationStore((state) => state.openEncounter);
  const dispatch = useHospitalStore((state) => state.dispatch);
  const active = useRef<"attending" | "exam" | null>(null);
  const priorPrompt = useRef<string | null>(null);

  useFrame(() => {
    const attendingDistance = Math.hypot(camera.position.x, camera.position.z - 10.25);
    const examDistance = Math.hypot(camera.position.x - 2.2, camera.position.z + 3);
    let next: "attending" | "exam" | null = null;
    let prompt: string | null = null;

    if (taskStatus === "available" && attendingDistance < 2.1) {
      next = "attending";
      prompt = "E  Speak with Dr. Patel";
    } else if ((taskStatus === "assigned" || taskStatus === "in-progress" || hasActiveEncounter) && examDistance < 2.2) {
      next = "exam";
      prompt = hasActiveEncounter ? "E  Continue patient encounter" : "E  Enter Clinic Room 3";
    }

    active.current = next;
    if (prompt !== priorPrompt.current) {
      priorPrompt.current = prompt;
      setPrompt(prompt);
    }
  });

  useEffect(() => {
    const interact = (event: KeyboardEvent) => {
      if (event.code !== "KeyE" || event.repeat) return;
      if (active.current === "attending") openBriefing();
      if (active.current === "exam") {
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
      }
    };
    window.addEventListener("keydown", interact);
    return () => window.removeEventListener("keydown", interact);
  }, [dispatch, openBriefing, openEncounter]);

  return null;
}

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { useSimulationStore } from "@/lib/simulation-store";

export function InteractionSystem() {
  const { camera } = useThree();
  const phase = useSimulationStore((state) => state.phase);
  const setPrompt = useSimulationStore((state) => state.setPrompt);
  const beginBriefing = useSimulationStore((state) => state.beginBriefing);
  const startEncounter = useSimulationStore((state) => state.startEncounter);
  const active = useRef<"attending" | "exam" | null>(null);
  const priorPrompt = useRef<string | null>(null);

  useFrame(() => {
    const attendingDistance = Math.hypot(camera.position.x, camera.position.z - 10.25);
    const examDistance = Math.hypot(camera.position.x - 2.2, camera.position.z + 3);
    let next: "attending" | "exam" | null = null;
    let prompt: string | null = null;

    if ((phase === "arrival" || phase === "briefing") && attendingDistance < 2.1) {
      next = "attending";
      prompt = "E  Speak with Dr. Patel";
    } else if (phase === "assigned" && examDistance < 2.2) {
      next = "exam";
      prompt = "E  Enter Clinic Room 3";
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
      if (active.current === "attending") beginBriefing();
      if (active.current === "exam") startEncounter();
    };
    window.addEventListener("keydown", interact);
    return () => window.removeEventListener("keydown", interact);
  }, [beginBriefing, startEncounter]);

  return null;
}

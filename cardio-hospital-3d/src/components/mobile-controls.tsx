"use client";

import { useRef, type MutableRefObject, type PointerEvent as ReactPointerEvent } from "react";
import { useSimulationStore } from "@/lib/simulation-store";

const JOYSTICK_RADIUS_PX = 52;
const THUMB_TRAVEL_PX = 32;
const DEAD_ZONE = 0.12;

function normalizeStick(event: ReactPointerEvent<HTMLDivElement>) {
  const rect = event.currentTarget.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  let x = (event.clientX - centerX) / JOYSTICK_RADIUS_PX;
  let y = (centerY - event.clientY) / JOYSTICK_RADIUS_PX;
  const magnitude = Math.hypot(x, y);
  if (magnitude > 1) {
    x /= magnitude;
    y /= magnitude;
  }
  if (Math.hypot(x, y) < DEAD_ZONE) return { x: 0, y: 0 };
  return { x, y };
}

export default function MobileControls() {
  const prompt = useSimulationStore((state) => state.prompt);
  const briefingOpen = useSimulationStore((state) => state.briefingOpen);
  const encounterOpen = useSimulationStore((state) => state.encounterOpen);
  const mobileMove = useSimulationStore((state) => state.mobileMove);
  const mobileLook = useSimulationStore((state) => state.mobileLook);
  const setMobileMove = useSimulationStore((state) => state.setMobileMove);
  const setMobileLook = useSimulationStore((state) => state.setMobileLook);
  const requestInteract = useSimulationStore((state) => state.requestInteract);
  const movePointer = useRef<number | null>(null);
  const lookPointer = useRef<number | null>(null);

  const beginStick = (
    event: ReactPointerEvent<HTMLDivElement>,
    pointerRef: MutableRefObject<number | null>,
    setter: (x: number, y: number) => void,
  ) => {
    if (briefingOpen || encounterOpen || pointerRef.current !== null) return;
    event.preventDefault();
    event.stopPropagation();
    pointerRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    const value = normalizeStick(event);
    setter(value.x, value.y);
  };

  const moveStick = (
    event: ReactPointerEvent<HTMLDivElement>,
    pointerRef: MutableRefObject<number | null>,
    setter: (x: number, y: number) => void,
  ) => {
    if (pointerRef.current !== event.pointerId) return;
    event.preventDefault();
    const value = normalizeStick(event);
    setter(value.x, value.y);
  };

  const endStick = (
    event: ReactPointerEvent<HTMLDivElement>,
    pointerRef: MutableRefObject<number | null>,
    setter: (x: number, y: number) => void,
  ) => {
    if (pointerRef.current !== event.pointerId) return;
    event.preventDefault();
    pointerRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setter(0, 0);
  };

  if (briefingOpen || encounterOpen) return null;

  return (
    <div className="mobile-controls" aria-label="Touch hospital controls">
      <div
        className="mobile-joystick mobile-joystick-move"
        role="application"
        aria-label="Move through the hospital"
        onPointerDown={(event) => beginStick(event, movePointer, setMobileMove)}
        onPointerMove={(event) => moveStick(event, movePointer, setMobileMove)}
        onPointerUp={(event) => endStick(event, movePointer, setMobileMove)}
        onPointerCancel={(event) => endStick(event, movePointer, setMobileMove)}
        onLostPointerCapture={() => {
          movePointer.current = null;
          setMobileMove(0, 0);
        }}
      >
        <span className="mobile-stick-label" aria-hidden="true">Move</span>
        <div className="mobile-joystick-ring" aria-hidden="true" />
        <div
          className="mobile-joystick-thumb"
          aria-hidden="true"
          style={{ transform: `translate(calc(-50% + ${mobileMove.x * THUMB_TRAVEL_PX}px), calc(-50% - ${mobileMove.y * THUMB_TRAVEL_PX}px))` }}
        />
      </div>

      <div
        className="mobile-joystick mobile-joystick-look"
        role="application"
        aria-label="Look around the hospital"
        onPointerDown={(event) => beginStick(event, lookPointer, setMobileLook)}
        onPointerMove={(event) => moveStick(event, lookPointer, setMobileLook)}
        onPointerUp={(event) => endStick(event, lookPointer, setMobileLook)}
        onPointerCancel={(event) => endStick(event, lookPointer, setMobileLook)}
        onLostPointerCapture={() => {
          lookPointer.current = null;
          setMobileLook(0, 0);
        }}
      >
        <span className="mobile-stick-label" aria-hidden="true">Look</span>
        <div className="mobile-joystick-ring" aria-hidden="true" />
        <div
          className="mobile-joystick-thumb"
          aria-hidden="true"
          style={{ transform: `translate(calc(-50% + ${mobileLook.x * THUMB_TRAVEL_PX}px), calc(-50% - ${mobileLook.y * THUMB_TRAVEL_PX}px))` }}
        />
      </div>

      <button
        type="button"
        className="mobile-interact"
        disabled={!prompt}
        aria-label={prompt ? prompt.replace("Interact · ", "") : "Nothing nearby to interact with"}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          if (prompt) requestInteract();
        }}
      >
        <span>Interact</span>
        <small>{prompt ? prompt.replace("Interact · ", "") : "Move closer"}</small>
      </button>
    </div>
  );
}

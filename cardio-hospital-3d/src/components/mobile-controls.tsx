"use client";

import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import { useSimulationStore } from "@/lib/simulation-store";

const JOYSTICK_RADIUS_PX = 52;
const THUMB_TRAVEL_PX = 32;

export default function MobileControls() {
  const prompt = useSimulationStore((state) => state.prompt);
  const briefingOpen = useSimulationStore((state) => state.briefingOpen);
  const encounterOpen = useSimulationStore((state) => state.encounterOpen);
  const mobileMove = useSimulationStore((state) => state.mobileMove);
  const setMobileMove = useSimulationStore((state) => state.setMobileMove);
  const requestInteract = useSimulationStore((state) => state.requestInteract);
  const activePointer = useRef<number | null>(null);

  const updateJoystick = (event: ReactPointerEvent<HTMLDivElement>) => {
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
    setMobileMove(x, y);
  };

  const beginMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (briefingOpen || encounterOpen) return;
    event.preventDefault();
    event.stopPropagation();
    activePointer.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    updateJoystick(event);
  };

  const continueMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (activePointer.current !== event.pointerId) return;
    event.preventDefault();
    updateJoystick(event);
  };

  const endMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (activePointer.current !== event.pointerId) return;
    event.preventDefault();
    activePointer.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setMobileMove(0, 0);
  };

  if (briefingOpen || encounterOpen) return null;

  return (
    <div className="mobile-controls" aria-label="Touch hospital controls">
      <div
        className="mobile-joystick"
        role="application"
        aria-label="Move through the hospital"
        onPointerDown={beginMove}
        onPointerMove={continueMove}
        onPointerUp={endMove}
        onPointerCancel={endMove}
        onLostPointerCapture={() => {
          activePointer.current = null;
          setMobileMove(0, 0);
        }}
      >
        <div className="mobile-joystick-ring" aria-hidden="true" />
        <div
          className="mobile-joystick-thumb"
          aria-hidden="true"
          style={{
            transform: `translate(calc(-50% + ${mobileMove.x * THUMB_TRAVEL_PX}px), calc(-50% - ${mobileMove.y * THUMB_TRAVEL_PX}px))`,
          }}
        />
      </div>

      <div className="mobile-look-hint" aria-hidden="true">
        Drag the right side to look
      </div>

      <button
        type="button"
        className="mobile-interact"
        disabled={!prompt}
        aria-label={prompt ? prompt.replace("Interact · ", "") : "Nothing nearby to interact with"}
        onPointerDown={(event) => {
          event.stopPropagation();
        }}
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

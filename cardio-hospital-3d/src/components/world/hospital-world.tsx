import { PointerLockControls } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import { useEffect, useRef, useState, type ComponentRef } from "react";
import { useSimulationStore } from "@/lib/simulation-store";
import { HospitalArchitecture } from "./architecture";
import { InteractionSystem } from "./interaction-system";
import { VasovagalRoomActors } from "./patient-room-actors";
import { PlayerController } from "./player-controller";
import { RoomSignage } from "./room-signage";
import { TouchLookControls } from "./touch-look-controls";

export default function HospitalWorld() {
  const setControlsLocked = useSimulationStore((state) => state.setControlsLocked);
  const briefingOpen = useSimulationStore((state) => state.briefingOpen);
  const encounterOpen = useSimulationStore((state) => state.encounterOpen);
  const controls = useRef<ComponentRef<typeof PointerLockControls>>(null);
  const [desktopPointerLock, setDesktopPointerLock] = useState(false);

  useEffect(() => {
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    setDesktopPointerLock(finePointer && "pointerLockElement" in document);
  }, []);

  useEffect(() => {
    if (briefingOpen || encounterOpen) controls.current?.unlock();
  }, [briefingOpen, encounterOpen]);

  return (
    <>
      <color attach="background" args={["#0f171a"]} />
      <fog attach="fog" args={["#d9e0df", 18, 38]} />
      <ambientLight intensity={0.72} color="#dcecff" />
      <directionalLight
        castShadow
        position={[-7, 12, 7]}
        intensity={2.1}
        color="#fff3d7"
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.1}
        shadow-camera-far={36}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
      />
      <Physics gravity={[0, -18, 0]} timeStep="vary">
        <HospitalArchitecture />
        <PlayerController />
      </Physics>
      <RoomSignage />
      <VasovagalRoomActors />
      <InteractionSystem />
      <TouchLookControls />
      {desktopPointerLock && (
        <PointerLockControls
          ref={controls}
          selector="#simulation-canvas"
          onLock={() => setControlsLocked(true)}
          onUnlock={() => setControlsLocked(false)}
        />
      )}
    </>
  );
}

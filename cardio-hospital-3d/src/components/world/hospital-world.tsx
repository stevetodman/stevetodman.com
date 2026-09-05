import { PointerLockControls } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import { useEffect, useRef, useState, type ComponentRef } from "react";
import { useSimulationStore } from "@/lib/simulation-store";
import { AuthoredHospitalArchitecture } from "./authored-hospital-architecture";
import { AuthoredProofRoomLighting } from "./authored-proof-room";
import { AuthoredVasovagalRoomActors } from "./authored-vasovagal-room-actors";
import { HospitalClinicalDetails } from "./hospital-details";
import { HospitalRealismPass2 } from "./hospital-realism-pass-2";
import { HospitalRealismPass3 } from "./hospital-realism-pass-3";
import { InteractionSystem } from "./interaction-system";
import { PlayerController } from "./player-controller";
import { ProofRoomLegacyVisualMask } from "./proof-room-legacy-visual-mask";
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

      {/* Interior baseline only. The previous broad shadow-casting sun produced an outdoor-like diagonal shadow. */}
      <hemisphereLight intensity={0.58} color="#eef4f2" groundColor="#687174" />
      <ambientLight intensity={0.24} color="#dcecff" />
      <directionalLight position={[-4, 8, 5]} intensity={0.34} color="#fff2d8" />
      <AuthoredProofRoomLighting />

      <Physics gravity={[0, -18, 0]} timeStep="vary">
        <AuthoredHospitalArchitecture />
        <PlayerController />
      </Physics>

      <ProofRoomLegacyVisualMask>
        <HospitalClinicalDetails />
        <HospitalRealismPass2 />
        <HospitalRealismPass3 />
      </ProofRoomLegacyVisualMask>
      <RoomSignage />
      <AuthoredVasovagalRoomActors />
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

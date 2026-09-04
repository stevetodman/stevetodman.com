import { Html } from "@react-three/drei";

function RoomSign({
  label,
  sublabel,
  position,
}: {
  label: string;
  sublabel: string;
  position: [number, number, number];
}) {
  return (
    <Html transform sprite distanceFactor={7.5} position={position} zIndexRange={[2, 0]}>
      <div
        aria-hidden="true"
        style={{
          minWidth: 118,
          padding: "8px 11px 7px",
          border: "1px solid rgba(224, 239, 239, 0.8)",
          borderLeft: "5px solid #4fbfc0",
          borderRadius: 4,
          background: "rgba(22, 42, 46, 0.96)",
          boxShadow: "0 4px 14px rgba(0, 0, 0, 0.3)",
          color: "#f3f8f8",
          fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
          lineHeight: 1.05,
          pointerEvents: "none",
          whiteSpace: "nowrap",
        }}
      >
        <strong style={{ display: "block", fontSize: 17, letterSpacing: "0.01em" }}>{label}</strong>
        <span style={{ display: "block", marginTop: 4, color: "#b8cbcc", fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          {sublabel}
        </span>
      </div>
    </Html>
  );
}

/** High-contrast, glanceable wayfinding anchored to the actual clinical rooms. */
export function RoomSignage() {
  return (
    <>
      <RoomSign label="Room 1" sublabel="Exam room" position={[-2.02, 2.2, -3]} />
      <RoomSign label="Room 3" sublabel="Exam room" position={[2.02, 2.2, -3]} />
      <RoomSign label="Team Room" sublabel="Cardiology" position={[0, 2.25, 4.12]} />
    </>
  );
}

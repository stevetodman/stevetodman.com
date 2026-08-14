"use client";

import dynamic from "next/dynamic";

const CardioHospital = dynamic(() => import("@/components/cardio-hospital"), {
  ssr: false,
  loading: () => (
    <main className="loading-screen">
      <div className="loading-mark">CH</div>
      <p>Preparing the clinical world...</p>
    </main>
  ),
});

export default function SimulationLoader() {
  return <CardioHospital />;
}

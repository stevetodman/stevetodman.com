"use client";

import { useMemo, useState } from "react";
import { getActiveEncounter } from "@/lib/hospital-engine";
import { useHospitalStore } from "@/lib/hospital-store";

interface LeadProfile {
  q: number;
  r: number;
  s: number;
  t: number;
  p?: number;
}

const LEAD_PROFILES: Record<string, LeadProfile> = {
  I: { q: -0.34, r: 1.25, s: -0.18, t: -0.34 },
  aVR: { q: 0.06, r: -0.72, s: 0.16, t: 0.22, p: -0.08 },
  V1: { q: -0.04, r: 0.28, s: -0.9, t: -0.18 },
  V4: { q: -0.2, r: 1.75, s: -0.15, t: -0.28 },
  II: { q: -0.1, r: 1.05, s: -0.2, t: 0.3 },
  aVL: { q: -0.38, r: 1.15, s: -0.12, t: -0.4 },
  V2: { q: -0.08, r: 0.62, s: -0.78, t: -0.16 },
  V5: { q: -0.42, r: 1.95, s: -0.12, t: -0.48 },
  III: { q: -0.08, r: 0.62, s: -0.25, t: 0.2 },
  aVF: { q: -0.09, r: 0.78, s: -0.22, t: 0.2 },
  V3: { q: -0.13, r: 1.2, s: -0.42, t: -0.1 },
  V6: { q: -0.36, r: 1.62, s: -0.08, t: -0.42 },
};

const LEAD_LAYOUT = [
  ["I", "aVR", "V1", "V4"],
  ["II", "aVL", "V2", "V5"],
  ["III", "aVF", "V3", "V6"],
];

const FINDINGS = [
  ["sinus", "Sinus rhythm"],
  ["lvh", "LVH by voltage"],
  ["lateral_q", "Deep narrow lateral Q waves"],
  ["lateral_t", "Lateral T-wave inversion"],
  ["wpw", "Ventricular pre-excitation"],
  ["longqt", "Prolonged QTc"],
  ["st_elevation", "Diffuse ST elevation"],
] as const;

const CORRECT_FINDINGS = new Set(["sinus", "lvh", "lateral_q", "lateral_t"]);

function gaussian(phase: number, center: number, width: number): number {
  const distance = phase - center;
  return Math.exp(-(distance * distance) / (2 * width * width));
}

function waveform(phase: number, profile: LeadProfile): number {
  const p = profile.p ?? 0.12;
  return p * gaussian(phase, 0.12, 0.028)
    + profile.q * gaussian(phase, 0.235, 0.011)
    + profile.r * gaussian(phase, 0.258, 0.008)
    + profile.s * gaussian(phase, 0.285, 0.012)
    + profile.t * gaussian(phase, 0.53, 0.072);
}

function tracePath(
  x: number,
  baseline: number,
  width: number,
  profile: LeadProfile,
  cycles: number,
  gain: number
): string {
  const points = Math.max(420, Math.round(width * 1.7));
  const amplitudeScale = gain * 5;
  let path = "";
  for (let index = 0; index <= points; index += 1) {
    const fraction = index / points;
    const phasePosition = fraction * cycles;
    const phase = phasePosition - Math.floor(phasePosition);
    const value = waveform(phase, profile) + Math.sin(fraction * Math.PI * 2) * 0.008;
    const px = x + fraction * width;
    const py = baseline - value * amplitudeScale;
    path += `${index ? "L" : "M"}${px.toFixed(1)} ${py.toFixed(1)} `;
  }
  return path;
}

interface HcmEcgReaderProps {
  onClose: () => void;
}

export default function HcmEcgReader({ onClose }: HcmEcgReaderProps) {
  const encounter = useHospitalStore((state) => getActiveEncounter(state.hospital));
  const dispatch = useHospitalStore((state) => state.dispatch);
  const [speed, setSpeed] = useState(25);
  const [gain, setGain] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(encounter?.ecgInterpretation?.selectedFindings ?? [])
  );

  const traces = useMemo(() => {
    const segmentCycles = speed === 25 ? 2.75 : 1.375;
    const xPositions = [22, 316, 610, 904];
    const baselines = [112, 268, 424];
    return LEAD_LAYOUT.flatMap((row, rowIndex) =>
      row.map((lead, columnIndex) => ({
        lead,
        x: xPositions[columnIndex],
        baseline: baselines[rowIndex],
        path: tracePath(
          xPositions[columnIndex] + 4,
          baselines[rowIndex],
          270,
          LEAD_PROFILES[lead],
          segmentCycles,
          gain
        ),
      }))
    );
  }, [gain, speed]);

  if (!encounter) return null;

  const toggleFinding = (finding: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(finding)) next.delete(finding);
      else next.add(finding);
      return next;
    });
  };

  const commitInterpretation = () => {
    const missed = [...CORRECT_FINDINGS].filter((finding) => !selected.has(finding));
    const falsePositives = [...selected].filter((finding) => !CORRECT_FINDINGS.has(finding));
    const score = Math.round(((7 - missed.length - falsePositives.length) / 7) * 100);
    dispatch({
      type: "ECG_INTERPRETATION_COMMITTED",
      encounterId: encounter.encounterId,
      selectedFindings: [...selected],
      score,
    });
    dispatch({ type: "TEST_ORDERED", encounterId: encounter.encounterId, test: "ECG" });
    dispatch({ type: "RESULT_REVIEWED", encounterId: encounter.encounterId, result: "ECG" });
  };

  const committed = encounter.ecgInterpretation;
  const committedCorrect = committed
    ? committed.selectedFindings.length === CORRECT_FINDINGS.size
      && committed.selectedFindings.every((finding) => CORRECT_FINDINGS.has(finding))
    : false;

  return (
    <div className="ecg-backdrop" role="presentation">
      <section className="ecg-reader" role="dialog" aria-modal="true" aria-label="12-lead ECG reader">
        <header className="ecg-reader-header">
          <div>
            <p className="eyebrow">Diagnostic room · 12-lead ECG</p>
            <h3>Marcus Chen <small>14 years · HR 66 bpm</small></h3>
          </div>
          <button type="button" className="encounter-close" onClick={onClose} aria-label="Close ECG reader">×</button>
        </header>

        <div className="ecg-toolbar">
          <div>
            <span>Speed</span>
            {[25, 50].map((value) => (
              <button key={value} type="button" className={speed === value ? "selected" : ""} onClick={() => setSpeed(value)}>{value} mm/s</button>
            ))}
          </div>
          <div>
            <span>Gain</span>
            {[5, 10, 20].map((value) => (
              <button key={value} type="button" className={gain === value ? "selected" : ""} onClick={() => setGain(value)}>{value} mm/mV</button>
            ))}
          </div>
          <strong>{speed} mm/s · {gain} mm/mV</strong>
        </div>

        <div className="ecg-paper">
          <svg viewBox="0 0 1200 690" role="img" aria-label="Synthetic twelve-lead ECG for interpretation">
            <defs>
              <pattern id="smallGridReact" width="5" height="5" patternUnits="userSpaceOnUse">
                <path d="M 5 0 L 0 0 0 5" fill="none" stroke="#f5b7bd" strokeWidth="0.45" />
              </pattern>
              <pattern id="largeGridReact" width="25" height="25" patternUnits="userSpaceOnUse">
                <rect width="25" height="25" fill="url(#smallGridReact)" />
                <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#df7f8b" strokeWidth="0.9" />
              </pattern>
            </defs>
            <rect width="1200" height="690" fill="#fff9f5" />
            <rect width="1200" height="690" fill="url(#largeGridReact)" />
            {traces.map((trace) => (
              <g key={trace.lead}>
                <text x={trace.x + 4} y={trace.baseline - 60} fill="#51272c" fontSize="16" fontFamily="ui-monospace, monospace" fontWeight="700">{trace.lead}</text>
                <path d={trace.path} fill="none" stroke="#171717" strokeWidth="2" strokeLinejoin="round" />
              </g>
            ))}
            <text x="26" y="520" fill="#51272c" fontSize="16" fontFamily="ui-monospace, monospace" fontWeight="700">II rhythm</text>
            <path
              d={tracePath(26, 585, 1145, LEAD_PROFILES.II, speed === 25 ? 11 : 5.5, gain)}
              fill="none"
              stroke="#171717"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              d={`M26 665 L38 665 L38 ${665 - gain * 5} L88 ${665 - gain * 5} L88 665 L102 665`}
              fill="none"
              stroke="#171717"
              strokeWidth="2"
            />
            <text x="112" y="668" fill="#51272c" fontSize="13" fontFamily="ui-monospace, monospace">1 mV</text>
          </svg>
        </div>

        <div className="ecg-interpretation">
          <div>
            <p className="field-label">Commit your interpretation before revealing the teaching report.</p>
            <div className="finding-grid">
              {FINDINGS.map(([value, label]) => (
                <label key={value}>
                  <input type="checkbox" checked={selected.has(value)} onChange={() => toggleFinding(value)} />
                  {label}
                </label>
              ))}
            </div>
          </div>
          <div className="ecg-commit">
            <div className={`ecg-feedback${committedCorrect ? " correct" : ""}`}>
              {!committed
                ? "The machine interpretation is intentionally hidden."
                : committedCorrect
                  ? "Complete interpretation: sinus rhythm with LVH, deep narrow lateral Q waves, and lateral repolarization abnormality. QTc 432 ms."
                  : `Interpretation score ${committed.score ?? 0}%. Review the tracing and update your interpretation.`}
            </div>
            <button type="button" className="primary-action" onClick={commitInterpretation}>
              {committed ? "Update interpretation" : "Commit ECG interpretation"}
            </button>
          </div>
        </div>
        <small className="simulation-disclaimer">Synthetic teaching tracing — not a validated diagnostic ECG or substitute for source recordings.</small>
      </section>
    </div>
  );
}

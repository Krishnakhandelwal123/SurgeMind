import React from "react";
import { surgeHex } from "../utils/surge";

export default function SurgeRing({ score = 8.5, size = 120, label = "SURGE SCORE" }) {
  const pct = Math.min(100, (score / 10) * 100);
  const color = surgeHex(score);
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;

  return (
    <div style={{ textAlign: "center" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth="8" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circ}
          strokeDashoffset={circ - (pct / 100) * circ}
          strokeLinecap="round"
        />
      </svg>
      <div style={{ marginTop: -size * 0.72, fontFamily: "var(--font-display)", fontSize: size * 0.35 }}>
        {score}
      </div>
      {label && <div className="label" style={{ marginTop: 8 }}>{label}</div>}
    </div>
  );
}

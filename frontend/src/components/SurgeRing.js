import React from "react";
import { surgeHex } from "../utils/surge";

export default function SurgeRing({ score = 8.5, size = 120, label = "SURGE SCORE" }) {
  const pct = Math.min(100, (score / 10) * 100);
  const color = surgeHex(score);
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;

  return (
    <div
      style={{
        width: size,
        height: size,
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flex: "0 0 auto",
      }}
      aria-label={`${label}: ${score}`}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", display: "block" }}>
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
      <div
        style={{
          position: "absolute",
          inset: size * 0.18,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          pointerEvents: "none",
        }}
      >
        <div style={{ fontFamily: "var(--font-display)", fontSize: size * 0.34, lineHeight: 0.9 }}>
          {score}
        </div>
        {label && (
          <div
            className="label"
            style={{
              marginTop: Math.max(4, size * 0.05),
              fontSize: Math.max(9, size * 0.075),
              lineHeight: 1,
              letterSpacing: 0.5,
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </div>
        )}
      </div>
    </div>
  );
}

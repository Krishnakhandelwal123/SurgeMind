import React, { useEffect, useState } from "react";
import { analyticsApi } from "../api/client";
import { surgeColor } from "../utils/surge";

export default function AnalyticsPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    analyticsApi.get().then((r) => setData(r.data));
  }, []);

  if (!data) return <div className="shimmer skeleton" style={{ height: 300 }} />;

  const maxScore = Math.max(...(data.scoreHistory?.map((s) => s.score) || [10]), 10);

  return (
    <>
      <div className="page-header">
        <h1>Analytics</h1>
        <span className="badge badge-purple">Last 30 days ▾</span>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="card">
          <h3>Surge Score History</h3>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 120, marginTop: 20 }}>
            {(data.scoreHistory || []).map((s, i) => (
              <div
                key={i}
                title={`${s.score} — ${new Date(s.date).toLocaleDateString()}`}
                style={{
                  flex: 1, height: `${(s.score / maxScore) * 100}%`,
                  background: "linear-gradient(180deg, var(--teal), transparent)",
                  borderRadius: "4px 4px 0 0", minHeight: 4,
                }}
              />
            ))}
          </div>
        </div>

        <div className="card">
          <h3>Alert Types</h3>
          {Object.entries(data.typeCounts || {}).map(([type, count]) => (
            <div key={type} style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
              <span className="label">{type}</span>
              <strong>{count}</strong>
            </div>
          ))}
        </div>

        <div className="card">
          <h3>Revenue Opportunity</h3>
          <p style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "var(--purple)", marginTop: 16 }}>
            ${Math.round(data.totalMonth || 0).toLocaleString()}
          </p>
          <p className="muted">Total estimated this month</p>
          {(data.weeklyRevenue || []).map((w) => (
            <div key={w.week} style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ flex: 1, height: 8, background: "var(--surface-3)", borderRadius: 4 }}>
                <div style={{ width: `${Math.min(100, (w.revenue / (data.totalMonth || 1)) * 100 * 3)}%`, height: "100%", background: "var(--purple)" }} />
              </div>
              <span className="mono" style={{ fontSize: 11 }}>${Math.round(w.revenue)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3>Match Impact</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16, fontSize: 14 }}>
          <thead>
            <tr style={{ color: "var(--text-muted)", textAlign: "left" }}>
              <th style={{ padding: 12 }}>Date</th>
              <th>Match</th>
              <th>City</th>
              <th>Surge</th>
              <th>Est. Revenue</th>
            </tr>
          </thead>
          <tbody>
            {(data.matchImpact || []).map((row, i) => (
              <tr key={i} style={{ borderTop: "1px solid var(--border-subtle)" }}>
                <td style={{ padding: 12 }}>{new Date(row.date).toLocaleDateString()}</td>
                <td>{row.match}</td>
                <td>{row.city}</td>
                <td className={surgeColor(row.surgeScore)}>{row.surgeScore}</td>
                <td style={{ color: "var(--teal)" }}>${row.estRevenue?.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

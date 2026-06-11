import React, { useEffect, useState } from "react";
import { analyticsApi } from "../api/client";
import { surgeColor, formatHostDate } from "../utils/surge";

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = () => {
    setError("");
    analyticsApi.get()
      .then((r) => setData(r.data))
      .catch((e) => setError(e.response?.data?.error || "Could not load analytics"));
  };

  useEffect(() => {
    load();
  }, []);

  if (error) {
    return (
      <div className="card" style={{ borderColor: "var(--red)" }}>
        <p>{error}</p>
        <button type="button" className="btn btn-ghost btn-sm" onClick={load}>Retry</button>
      </div>
    );
  }

  if (!data) return <div className="shimmer skeleton" style={{ height: 300 }} />;

  const scoreHistory = data.scoreHistory || [];
  const matchImpact = data.matchImpact || [];
  const maxScore = Math.max(...scoreHistory.map((s) => s.score || 0), 10);
  const totalOpportunity = data.totalOpportunity ?? data.totalMonth ?? 0;

  return (
    <>
      <div className="page-header">
        <div>
          <p className="label" style={{ marginBottom: 4 }}>Generated-plan analytics</p>
          <h1>Analytics</h1>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={load}>Refresh</button>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="card">
          <h3>Plans Generated</h3>
          <p style={{ fontFamily: "var(--font-display)", fontSize: 34, color: "var(--gold)", margin: "16px 0 4px" }}>
            {data.generatedPlans || 0}
          </p>
          <p className="muted">
            Unique match plans
            {data.duplicatePlansIgnored ? ` / ${data.duplicatePlansIgnored} duplicate clicks ignored` : ""}
          </p>
        </div>

        <div className="card">
          <h3>Average Surge</h3>
          <p className={`kpi-value ${surgeColor(data.avgSurge || 0)}`} style={{ marginTop: 16 }}>
            {data.avgSurge || 0}
          </p>
          <p className="muted">Across generated plans</p>
        </div>

        <div className="card">
          <h3>Estimated Opportunity</h3>
          <p style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "var(--purple)", marginTop: 16 }}>
            ${Math.round(totalOpportunity).toLocaleString()}
          </p>
          <p className="muted">Not actual sales. Sum of estimated revenue ranges.</p>
        </div>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: "1.3fr 1fr", marginTop: 24 }}>
        <div className="card">
          <h3>Surge Score History</h3>
          {scoreHistory.length ? (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 140, marginTop: 20 }}>
              {scoreHistory.map((s, i) => (
                <div
                  key={`${s.label}-${i}`}
                  title={`${s.label}: ${s.score}`}
                  style={{
                    flex: 1,
                    height: `${((s.score || 0) / maxScore) * 100}%`,
                    background: "linear-gradient(180deg, var(--teal), transparent)",
                    borderRadius: "4px 4px 0 0",
                    minHeight: 4,
                  }}
                />
              ))}
            </div>
          ) : (
            <p className="muted" style={{ marginTop: 16 }}>Generate an alert to start tracking surge history.</p>
          )}
        </div>

        <div className="card">
          <h3>Plan Categories</h3>
          {Object.keys(data.typeCounts || {}).length ? (
            Object.entries(data.typeCounts).map(([type, count]) => (
              <div key={type} style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
                <span className="label">{type.replace("_", " ")}</span>
                <strong>{count}</strong>
              </div>
            ))
          ) : (
            <p className="muted" style={{ marginTop: 16 }}>No generated plans yet.</p>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3>Match Impact</h3>
        {matchImpact.length ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16, fontSize: 14 }}>
              <thead>
                <tr style={{ color: "var(--text-muted)", textAlign: "left" }}>
                  <th style={{ padding: 12 }}>Match Date</th>
                  <th>Match</th>
                  <th>City</th>
                  <th>Venue</th>
                  <th>Surge</th>
                  <th>Estimated Opportunity</th>
                </tr>
              </thead>
              <tbody>
                {matchImpact.map((row, i) => (
                  <tr key={`${row.match}-${i}`} style={{ borderTop: "1px solid var(--border-subtle)" }}>
                    <td style={{ padding: 12 }}>{formatHostDate(row.date, row.city)}</td>
                    <td>{row.match}</td>
                    <td>{row.city}</td>
                    <td>{row.venue || "-"}</td>
                    <td className={surgeColor(row.surgeScore)}>{row.surgeScore}</td>
                    <td style={{ color: "var(--teal)" }}>${row.estRevenue?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted" style={{ marginTop: 16 }}>No match impact yet. Generate a surge alert first.</p>
        )}
      </div>
    </>
  );
}

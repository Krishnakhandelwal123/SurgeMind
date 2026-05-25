import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { dashboardApi } from "../api/client";
import { surgeColor, formatTimeAgo, alertTypeBadge } from "../utils/surge";

export default function OverviewPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    dashboardApi.overview()
      .then((r) => { setData(r.data); setError(""); })
      .catch((e) => setError(e.response?.data?.error || "Could not load dashboard"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <>
        <div className="page-header"><h1>Overview</h1></div>
        <div className="kpi-grid">{[1,2,3,4].map((i) => <div key={i} className="card"><div className="shimmer skeleton" style={{ height: 60 }} /></div>)}</div>
      </>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ borderColor: "var(--red)", background: "rgba(244,63,94,0.1)" }}>
        <p>⚠ {error}</p>
        <button type="button" className="btn btn-ghost btn-sm" onClick={load}>Retry</button>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <h1>Overview</h1>
        <div className="page-meta">
          Last updated: 2 min ago
          <button type="button" className="link-btn" onClick={load}>↻ Refresh</button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="card kpi-card">
          <div className="kpi-icon" style={{ background: "rgba(0,212,160,0.15)" }}>📍</div>
          <div className="kpi-value">{data.citiesActive}</div>
          <div className="kpi-label">Cities Active</div>
          <small className="surge-low">{data.citiesTrend}</small>
        </div>
        <div className="card kpi-card">
          <div className="kpi-icon" style={{ background: "rgba(124,110,250,0.15)" }}>⚡</div>
          <div className={`kpi-value ${surgeColor(data.surgeScore)}`}>{data.surgeScore}</div>
          <div className="kpi-label">Current Surge Score</div>
          <small>{data.surgeCity} · Next 7 days</small>
        </div>
        <div className="card kpi-card">
          <div className="kpi-icon" style={{ background: "rgba(0,212,160,0.15)" }}>🔔</div>
          <div className="kpi-value">{data.alertsGenerated}</div>
          <div className="kpi-label">Alerts Generated</div>
          {data.alertsUnread > 0 && <small className="surge-mid">● {data.alertsUnread} unread</small>}
        </div>
        <div className="card kpi-card">
          <div className="kpi-icon" style={{ background: "rgba(34,197,94,0.15)" }}>💰</div>
          <div className="kpi-value" style={{ color: "var(--teal)" }}>${data.revenueEstimate?.toLocaleString()}</div>
          <div className="kpi-label">Est. Extra Revenue</div>
          <small>This match week</small>
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="page-header" style={{ marginBottom: 16 }}>
            <h3>Upcoming Surge Timeline</h3>
            <span className="badge badge-purple">Next 7 Days</span>
          </div>
          {data.timeline?.length ? data.timeline.map((m, i) => (
            <div key={m._id} className="timeline-row" style={{ background: i % 2 ? "var(--surface-2)" : "var(--surface-1)", padding: "12px 16px", borderRadius: 8, marginBottom: 8, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <span className="mono" style={{ fontSize: 12 }}>{new Date(m.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
              <span className="badge badge-purple">{m.city}</span>
              <span>{m.teams?.join(" vs ")}</span>
              <span className={`badge ${surgeColor(m.surgeScore)}`}>{m.surgeScore}</span>
              <span style={{ color: "var(--text-muted)", fontSize: 13 }}>{m.expectedCrowd?.toLocaleString()} expected</span>
              <Link to="/dashboard/alerts" style={{ marginLeft: "auto" }}>View Alert →</Link>
            </div>
          )) : (
            <p className="muted">No surges in the next 7 days. <Link to="/dashboard/calendar">View Full Calendar →</Link></p>
          )}
        </div>

        <div>
          <h3 style={{ marginBottom: 16 }}>Active Alerts</h3>
          {data.activeAlerts?.map((a) => (
            <div key={a._id} className="card" style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                {(a.types || []).map((t) => <span key={t} className={`badge ${alertTypeBadge(t)}`}>{t}</span>)}
              </div>
              <p style={{ fontSize: 14, color: "var(--text-muted)" }}>{a.summary || a.message?.slice(0, 80)}...</p>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontSize: 12, color: "var(--text-dim)" }}>
                <span>{formatTimeAgo(a.sentAt)}</span>
                <Link to={`/dashboard/alerts/${a._id}`}>View Full Plan →</Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>AI Surge Map</h3>
        <div className="map-grid" style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 20 }}>
          {(data.mapCities || []).map((c) => (
            <div
              key={c.city}
              className="map-dot"
              style={{
                padding: "12px 16px",
                background: "var(--surface-2)",
                borderRadius: 8,
                border: c.isUserCity ? "2px solid var(--purple)" : "1px solid var(--border)",
                boxShadow: c.isUserCity ? "0 0 20px #7C6EFA33" : "none",
              }}
            >
              <strong>{c.city}</strong>
              <div className="mono" style={{ fontSize: 11 }}>{c.matches} matches · surge {c.maxSurge}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { dashboardApi } from "../api/client";
import { surgeColor, formatTimeAgo, alertTypeBadge, formatHostDate } from "../utils/surge";

export default function OverviewPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    dashboardApi.overview()
      .then((r) => {
        setData(r.data);
        setError("");
      })
      .catch((e) => setError(e.response?.data?.error || "Could not load dashboard"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <>
        <div className="page-header"><h1>Overview</h1></div>
        <div className="kpi-grid">{[1, 2, 3, 4].map((i) => <div key={i} className="card"><div className="shimmer skeleton" style={{ height: 60 }} /></div>)}</div>
      </>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ borderColor: "var(--red)", background: "rgba(225,75,100,0.1)" }}>
        <p>{error}</p>
        <button type="button" className="btn btn-ghost btn-sm" onClick={load}>Retry</button>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <h1>Overview</h1>
        <div className="page-meta">
          Live operations workspace
          <button type="button" className="link-btn" onClick={load}>Refresh</button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="card kpi-card">
          <div className="kpi-icon">CT</div>
          <div className="kpi-value">{data.citiesActive}</div>
          <div className="kpi-label">Cities Active</div>
          <small className="surge-low">{data.citiesTrend}</small>
        </div>
        <div className="card kpi-card">
          <div className="kpi-icon">SC</div>
          <div className={`kpi-value ${surgeColor(data.surgeScore)}`}>{data.surgeScore}</div>
          <div className="kpi-label">Current Surge Score</div>
          <small>{data.surgeCity} - next window</small>
        </div>
        <div className="card kpi-card">
          <div className="kpi-icon">AL</div>
          <div className="kpi-value">{data.alertsGenerated}</div>
          <div className="kpi-label">Alerts Generated</div>
          {data.alertsUnread > 0 && <small className="surge-mid">{data.alertsUnread} unread</small>}
        </div>
        <div className="card kpi-card">
          <div className="kpi-icon">RV</div>
          <div className="kpi-value" style={{ color: "var(--gold)" }}>${Number(data.revenueEstimate || 0).toLocaleString()}</div>
          <div className="kpi-label">Est. Extra Revenue</div>
          <small>from generated plans</small>
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="page-header" style={{ marginBottom: 16 }}>
            <h3>Upcoming Surge Timeline</h3>
            <span className="badge badge-purple">Next window</span>
          </div>
          {data.timeline?.length ? data.timeline.map((m, i) => (
            <div key={m._id} className="timeline-row" style={{ background: i % 2 ? "rgba(255,255,255,0.035)" : "transparent", padding: "12px 16px", borderRadius: 8, marginBottom: 8, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <span className="mono" style={{ fontSize: 12 }}>{formatHostDate(m.date, m.city)}</span>
              <span className="badge badge-purple">{m.city}</span>
              <span>{m.teams?.join(" vs ")}</span>
              <span className={surgeColor(m.surgeScore)}>{m.surgeScore}/10</span>
              <span style={{ color: "var(--text-muted)", fontSize: 13 }}>{m.expectedCrowd?.toLocaleString()} venue-capacity estimate</span>
              <Link to="/dashboard/alerts" style={{ marginLeft: "auto" }}>View alerts</Link>
            </div>
          )) : (
            <div className="empty-state">
              <h3>No active surge window yet</h3>
              <p className="muted">Your match data is loaded. Open the calendar or generate a plan to prepare for the next host-city surge.</p>
              <Link className="btn btn-ghost btn-sm" to="/dashboard/calendar">Open calendar</Link>
            </div>
          )}
        </div>

        <div>
          <h3 style={{ marginBottom: 16 }}>Active Alerts</h3>
          {data.activeAlerts?.length ? data.activeAlerts.map((a) => (
            <div key={a._id} className="card" style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                {(a.types || []).map((t) => <span key={t} className={`badge ${alertTypeBadge(t)}`}>{t.replace("_", " ")}</span>)}
              </div>
              <p style={{ fontSize: 14, color: "var(--text-muted)" }}>{a.summary || a.message?.slice(0, 100)}...</p>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontSize: 12, color: "var(--text-dim)" }}>
                <span>{formatTimeAgo(a.sentAt)}</span>
                <Link to={`/dashboard/alerts/${a._id}`}>View plan</Link>
              </div>
            </div>
          )) : (
            <div className="card empty-state">
              <h3>No plans generated</h3>
              <p className="muted">Generate a surge alert to create your first action plan from live match data.</p>
              <Link className="btn btn-primary btn-sm" to="/dashboard/alerts">Generate plan</Link>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3>Host City Intelligence</h3>
        <div className="map-grid" style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 20 }}>
          {(data.mapCities || []).map((c) => (
            <div
              key={c.city}
              className="map-dot"
              style={{
                padding: "12px 16px",
                background: "rgba(255,255,255,0.035)",
                borderRadius: 8,
                border: c.isUserCity ? "2px solid var(--gold)" : "1px solid var(--border)",
                boxShadow: c.isUserCity ? "0 0 24px rgba(212,175,55,0.16)" : "none",
              }}
            >
              <strong>{c.city}</strong>
              <div className="mono" style={{ fontSize: 11 }}>{c.matches} matches - surge {c.maxSurge}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

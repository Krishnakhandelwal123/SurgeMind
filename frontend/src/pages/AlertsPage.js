import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { alertsApi } from "../api/client";
import { surgeColor, surgeHex, formatTimeAgo, alertTypeBadge } from "../utils/surge";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const load = () => {
    alertsApi.list().then((r) => setAlerts(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const generate = async () => {
    setGenerating(true);
    try {
      await alertsApi.generate({});
      load();
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <p className="label" style={{ marginBottom: 4 }}>Overview / Surge Alerts</p>
          <h1>Surge Alerts</h1>
        </div>
        <button type="button" className="btn btn-primary btn-sm" onClick={generate} disabled={generating}>
          {generating ? "Generating..." : "Generate New Alert +"}
        </button>
      </div>

      {!alerts.length && !loading && (
        <div className="card" style={{ border: "2px dashed rgba(124,110,250,0.4)", background: "rgba(124,110,250,0.08)", textAlign: "center", padding: 40 }}>
          <p>⚡ Generate your surge plan for this week</p>
          <button type="button" className="btn btn-primary" onClick={generate} disabled={generating}>Generate Plan</button>
        </div>
      )}

      {loading && <div className="shimmer skeleton" style={{ height: 120 }} />}

      {alerts.map((a) => (
        <Link key={a._id} to={`/dashboard/alerts/${a._id}`} style={{ textDecoration: "none", color: "inherit" }}>
          <div className="card alert-card" style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span>🌮 {a.city}</span>
              <span style={{ color: "var(--text-dim)", fontSize: 12 }}>{formatTimeAgo(a.sentAt)}</span>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              {(a.types || []).map((t) => <span key={t} className={`badge ${alertTypeBadge(t)}`}>{t}</span>)}
            </div>
            <p style={{ color: "var(--text-muted)", lineHeight: 1.6 }}>{a.summary || a.message?.slice(0, 200)}...</p>
            <div style={{ marginTop: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                <span>Surge Score</span>
                <span className={surgeColor(a.surgeScore)}>{a.surgeScore}/10</span>
              </div>
              <div style={{ height: 6, background: "var(--surface-3)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${(a.surgeScore / 10) * 100}%`, height: "100%", background: surgeHex(a.surgeScore) }} />
              </div>
              <p className="mono" style={{ marginTop: 8, fontSize: 12, color: "var(--text-dim)" }}>{a.matchLabel}</p>
            </div>
          </div>
        </Link>
      ))}
    </>
  );
}

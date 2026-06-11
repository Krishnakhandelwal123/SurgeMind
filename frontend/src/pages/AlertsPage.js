import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { alertsApi } from "../api/client";
import { surgeColor, surgeHex, formatTimeAgo, alertTypeBadge } from "../utils/surge";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    alertsApi.list()
      .then((r) => {
        setAlerts(r.data);
        setError("");
      })
      .catch((e) => setError(e.response?.data?.error || "Could not load alerts"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const generate = async () => {
    setGenerating(true);
    setError("");
    try {
      await alertsApi.generate({});
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Could not generate alert");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <p className="label" style={{ marginBottom: 4 }}>Operations / Surge Alerts</p>
          <h1>Surge Alerts</h1>
        </div>
        <button type="button" className="btn btn-primary btn-sm" onClick={generate} disabled={generating}>
          {generating ? "Generating..." : "Generate New Alert"}
        </button>
      </div>

      {error && (
        <div className="card" style={{ borderColor: "var(--red)", marginBottom: 16 }}>
          <p>{error}</p>
          <button type="button" className="btn btn-ghost btn-sm" onClick={load}>Retry</button>
        </div>
      )}

      {!alerts.length && !loading && (
        <div className="card empty-state" style={{ border: "1px dashed rgba(212,175,55,0.45)", textAlign: "center", padding: 44 }}>
          <h2>Create Your First Match-Day Plan</h2>
          <p className="muted">SurgeMind will read your business profile, query host-city match data, calculate the crowd surge, and generate a checklist.</p>
          <button type="button" className="btn btn-primary" onClick={generate} disabled={generating}>
            {generating ? "Generating..." : "Generate Plan"}
          </button>
        </div>
      )}

      {loading && <div className="shimmer skeleton" style={{ height: 120 }} />}

      {alerts.map((a) => (
        <Link key={a._id} to={`/dashboard/alerts/${a._id}`} style={{ textDecoration: "none", color: "inherit" }}>
          <div className="card alert-card" style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
              <span className="label">{a.city || "Host city"} / {a.severity || "LOW"}</span>
              <span style={{ color: "var(--text-dim)", fontSize: 12 }}>{formatTimeAgo(a.sentAt)}</span>
            </div>
            <h3 style={{ marginBottom: 10 }}>{a.matchLabel || "Upcoming FIFA surge"}</h3>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              {(a.types || []).map((t) => <span key={t} className={`badge ${alertTypeBadge(t)}`}>{t.replace("_", " ")}</span>)}
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
              <p className="mono" style={{ marginTop: 8, fontSize: 12, color: "var(--text-dim)" }}>
                Est. revenue ${a.revenueMin?.toLocaleString()} - ${a.revenueMax?.toLocaleString()}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </>
  );
}

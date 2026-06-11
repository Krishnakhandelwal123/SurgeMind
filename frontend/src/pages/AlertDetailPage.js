import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { alertsApi } from "../api/client";
import SurgeRing from "../components/SurgeRing";
import { surgeColor, alertTypeBadge, formatHostDate } from "../utils/surge";

export default function AlertDetailPage() {
  const { id } = useParams();
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    alertsApi.get(id)
      .then((r) => {
        setAlert(r.data);
        setError("");
      })
      .catch((e) => setError(e.response?.data?.error || "Alert not found"))
      .finally(() => setLoading(false));
  }, [id]);

  const toggleItem = async (itemId, completed) => {
    const { data } = await alertsApi.toggleChecklist(id, itemId, !completed);
    setAlert(data);
  };

  if (loading) return <div className="shimmer skeleton" style={{ height: 400 }} />;
  if (error || !alert) return <p>{error || "Alert not found"}</p>;

  return (
    <>
      <p className="label"><Link to="/dashboard/alerts">Back to Surge Alerts</Link></p>
      <div className="alert-detail-grid" style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 28, marginTop: 16 }}>
        <div>
          <div className="page-header" style={{ marginBottom: 16 }}>
            <div>
              <p className="label">{alert.city} / {alert.severity}</p>
              <h1>Action Plan</h1>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(alert.types || []).map((t) => <span key={t} className={`badge ${alertTypeBadge(t)}`}>{t.replace("_", " ")}</span>)}
            </div>
          </div>

          <div className="card" style={{ borderColor: "rgba(212,175,55,0.55)" }}>
            <strong className={surgeColor(alert.surgeScore)}>Surge incoming - score {alert.surgeScore}/10</strong>
            <p className="mono" style={{ marginTop: 8 }}>{alert.matchLabel} - {alert.venue}</p>
            {alert.dueDate && <p className="muted">Recommended prep deadline: {formatHostDate(alert.dueDate, alert.city, { weekday: undefined })}</p>}
          </div>

          {alert.fanBreakdown?.length > 0 && (
            <div className="card" style={{ marginTop: 16 }}>
              <h3>Fan Mix</h3>
              {alert.fanBreakdown.map((f) => (
                <div key={f.country} style={{ marginTop: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                    <span>{f.flag} {f.country}</span>
                    <span>{f.pct}%</span>
                  </div>
                  <div style={{ height: 6, background: "var(--surface-3)", borderRadius: 3, marginTop: 4, overflow: "hidden" }}>
                    <div style={{ width: `${f.pct}%`, height: "100%", background: "var(--gold)" }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="card" style={{ marginTop: 16, whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
            {alert.message}
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <h3>Execution Checklist</h3>
            {alert.checklist?.map((item) => (
              <label key={item._id} className="check-row" style={{ display: "flex", gap: 12, marginTop: 12, cursor: "pointer", alignItems: "flex-start" }}>
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => toggleItem(item._id, item.completed)}
                />
                <span style={{ textDecoration: item.completed ? "line-through" : "none", color: item.completed ? "var(--text-dim)" : "inherit" }}>
                  {item.text}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <div className="card" style={{ textAlign: "center" }}>
            <h3>Surge Intelligence</h3>
            <SurgeRing score={alert.surgeScore} size={160} />
            <p style={{ color: "var(--gold)", fontSize: 20, fontFamily: "var(--font-display)", marginTop: 16 }}>
              ${alert.revenueMin?.toLocaleString()} - ${alert.revenueMax?.toLocaleString()}
            </p>
            <p className="muted">estimated extra revenue</p>
            {alert.revenueRationale && <p style={{ color: "var(--text-muted)", fontSize: 13 }}>{alert.revenueRationale}</p>}
          </div>

          <div className="card mono" style={{ marginTop: 16, background: "rgba(255,255,255,0.035)", fontSize: 12 }}>
            <h3 style={{ fontFamily: "var(--font-ui)" }}>Agent Tool Trace</h3>
            {(alert.reasoningTrace || []).map((step, i) => (
              <div key={i} style={{ marginTop: 8, color: "var(--teal)" }}>
                {i + 1}. {step.step} {step.status === "done" ? "done" : "..."}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

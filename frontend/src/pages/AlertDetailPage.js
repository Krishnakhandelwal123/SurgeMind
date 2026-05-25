import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { alertsApi } from "../api/client";
import SurgeRing from "../components/SurgeRing";
import { surgeColor } from "../utils/surge";

export default function AlertDetailPage() {
  const { id } = useParams();
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    alertsApi.get(id).then((r) => setAlert(r.data)).finally(() => setLoading(false));
  }, [id]);

  const toggleItem = async (itemId, completed) => {
    const { data } = await alertsApi.toggleChecklist(id, itemId, !completed);
    setAlert(data);
  };

  if (loading) return <div className="shimmer skeleton" style={{ height: 400 }} />;
  if (!alert) return <p>Alert not found</p>;

  return (
    <>
      <p className="label"><Link to="/dashboard/alerts">← Surge Alerts</Link></p>
      <div className="alert-detail-grid" style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 28, marginTop: 16 }}>
        <div>
          <h1>AI Action Plan</h1>
          <div className="card" style={{ marginTop: 16, borderColor: "var(--purple)" }}>
            <strong className={surgeColor(alert.surgeScore)}>⚡ Surge incoming — Score {alert.surgeScore}/10</strong>
            <p className="mono" style={{ marginTop: 8 }}>{alert.matchLabel} · {alert.venue}</p>
          </div>

          {alert.fanBreakdown?.length > 0 && (
            <div className="card" style={{ marginTop: 16 }}>
              <h3>Fan nationality breakdown</h3>
              {alert.fanBreakdown.map((f) => (
                <div key={f.country} style={{ marginTop: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                    <span>{f.flag} {f.country}</span>
                    <span>{f.pct}%</span>
                  </div>
                  <div style={{ height: 6, background: "var(--surface-3)", borderRadius: 3, marginTop: 4 }}>
                    <div style={{ width: `${f.pct}%`, height: "100%", background: "var(--teal)" }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="card" style={{ marginTop: 16, whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
            {alert.message}
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <h3>Action checklist</h3>
            {alert.checklist?.map((item) => (
              <label key={item._id} style={{ display: "flex", gap: 12, marginTop: 12, cursor: "pointer" }}>
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
            <p style={{ color: "var(--teal)", fontSize: 20, fontFamily: "var(--font-display)", marginTop: 16 }}>
              ${alert.revenueMin?.toLocaleString()} – ${alert.revenueMax?.toLocaleString()}
            </p>
            <p className="muted">estimated extra revenue</p>
          </div>

          <div className="card mono" style={{ marginTop: 16, background: "var(--surface-2)", fontSize: 12 }}>
            <h3 style={{ fontFamily: "var(--font-ui)" }}>Agent reasoning trace</h3>
            {(alert.reasoningTrace || []).map((step, i) => (
              <div key={i} style={{ marginTop: 8, color: "var(--teal)" }}>
                {i + 1}. {step.step} {step.status === "done" ? "✓" : "…"}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

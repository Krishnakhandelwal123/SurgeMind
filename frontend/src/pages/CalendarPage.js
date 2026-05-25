import React, { useEffect, useState } from "react";
import { matchesApi, alertsApi } from "../api/client";
import { surgeHex } from "../utils/surge";

export default function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState({ matches: [], byDate: {} });
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState("month");

  useEffect(() => {
    matchesApi.calendar(year, month).then((r) => {
      setData(r.data);
      const today = new Date().toISOString().slice(0, 10);
      if (r.data.byDate[today]) setSelected(today);
    });
  }, [year, month]);

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();

  const prevMonth = () => {
    if (month === 1) { setYear(year - 1); setMonth(12); }
    else setMonth(month - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(year + 1); setMonth(1); }
    else setMonth(month + 1);
  };

  const selectedMatches = selected ? data.byDate[selected] || [] : [];

  return (
    <>
      <div className="page-header">
        <h1>Match Calendar</h1>
        <div style={{ display: "flex", gap: 8 }}>
          {["month", "list"].map((v) => (
            <button key={v} type="button" className={`btn btn-ghost btn-sm ${view === v ? "active" : ""}`} onClick={() => setView(v)}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: view === "list" ? "1fr" : "2fr 1fr", gap: 24 }}>
        <div className="card">
          {view === "month" ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={prevMonth}>←</button>
                <strong>{new Date(year, month - 1).toLocaleString("default", { month: "long", year: "numeric" })}</strong>
                <button type="button" className="btn btn-ghost btn-sm" onClick={nextMonth}>→</button>
              </div>
              <div className="cal-grid" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
                {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => <div key={d} className="label" style={{ textAlign: "center", padding: 8 }}>{d}</div>)}
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const key = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const dayMatches = data.byDate[key] || [];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelected(key)}
                      style={{
                        aspectRatio: "1", border: selected === key ? "2px solid var(--purple)" : "1px solid var(--border-subtle)",
                        borderRadius: 8, background: "var(--surface-2)", cursor: "pointer", color: "var(--text)", padding: 4,
                      }}
                    >
                      <div>{day}</div>
                      <div style={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
                        {dayMatches.slice(0, 3).map((m, j) => (
                          <span key={j} style={{ width: 6, height: 6, borderRadius: "50%", background: surgeHex(m.surgeScore || 5) }} />
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div style={{ maxHeight: 500, overflow: "auto" }}>
              {data.matches.map((m) => (
                <div key={m._id} style={{ padding: "12px 0", borderBottom: "1px solid var(--border-subtle)", display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <span className="mono">{new Date(m.date).toLocaleDateString()}</span>
                  <span>{m.teams?.join(" vs ")}</span>
                  <span className="badge badge-purple">{m.city}</span>
                  <span className="muted">{m.expectedCrowd?.toLocaleString()} fans</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {view === "month" && (
          <div className="card">
            <h3>{selected ? new Date(selected).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) : "Select a day"}</h3>
            {selectedMatches.map((m) => (
              <div key={m._id} style={{ marginTop: 16, paddingBottom: 16, borderBottom: "1px solid var(--border-subtle)" }}>
                <strong>{m.teams?.join(" vs ")}</strong>
                <p className="muted">{m.venue} · {new Date(m.date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</p>
                <p>{m.expectedCrowd?.toLocaleString()} expected · Surge {m.surgeScore}</p>
                <button type="button" className="btn btn-primary btn-sm" style={{ marginTop: 8 }} onClick={() => alertsApi.generate({ matchId: m._id })}>
                  Generate Alert for This Match
                </button>
              </div>
            ))}
            {!selectedMatches.length && selected && <p className="muted">No matches on this day.</p>}
          </div>
        )}
      </div>
    </>
  );
}

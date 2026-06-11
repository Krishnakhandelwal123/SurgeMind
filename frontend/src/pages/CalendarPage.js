import React, { useEffect, useState } from "react";
import { matchesApi, alertsApi } from "../api/client";
import { surgeHex, formatHostDate, formatHostTime } from "../utils/surge";

function defaultCalendarDate() {
  const now = new Date();
  if (now >= new Date("2026-06-01T00:00:00Z") && now <= new Date("2026-07-31T23:59:59Z")) {
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  }
  return { year: 2026, month: 6 };
}

export default function CalendarPage() {
  const initial = defaultCalendarDate();
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);
  const [data, setData] = useState({ matches: [], byDate: {} });
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState("month");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generatingId, setGeneratingId] = useState("");

  useEffect(() => {
    setLoading(true);
    matchesApi.calendar(year, month)
      .then((r) => {
        setData(r.data);
        setError("");
        const firstDate = Object.keys(r.data.byDate || {}).sort()[0];
        const today = new Date().toISOString().slice(0, 10);
        setSelected(r.data.byDate?.[today] ? today : firstDate || null);
      })
      .catch((e) => setError(e.response?.data?.error || "Could not load match calendar"))
      .finally(() => setLoading(false));
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

  const generateForMatch = async (match) => {
    setGeneratingId(match._id);
    try {
      await alertsApi.generate({ matchId: match._id, city: match.city });
    } finally {
      setGeneratingId("");
    }
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

      {error && (
        <div className="card" style={{ borderColor: "var(--red)", marginBottom: 16 }}>
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="shimmer skeleton" style={{ height: 360 }} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: view === "list" ? "1fr" : "2fr 1fr", gap: 24 }}>
          <div className="card">
            {view === "month" ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={prevMonth}>Prev</button>
                  <strong>{new Date(year, month - 1).toLocaleString("default", { month: "long", year: "numeric" })}</strong>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={nextMonth}>Next</button>
                </div>
                <div className="cal-grid" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => <div key={d} className="label" style={{ textAlign: "center", padding: 8 }}>{d}</div>)}
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
                          aspectRatio: "1",
                          border: selected === key ? "2px solid var(--purple)" : "1px solid var(--border-subtle)",
                          borderRadius: 8,
                          background: "var(--surface-2)",
                          cursor: "pointer",
                          color: "var(--text)",
                          padding: 4,
                        }}
                      >
                        <div>{day}</div>
                        <div style={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
                          {dayMatches.slice(0, 3).map((m) => (
                            <span key={m._id} style={{ width: 6, height: 6, borderRadius: "50%", background: surgeHex(m.surgeScore || 5) }} />
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <div style={{ maxHeight: 520, overflow: "auto" }}>
                {data.matches.map((m) => (
                  <div key={m._id} style={{ padding: "12px 0", borderBottom: "1px solid var(--border-subtle)", display: "flex", gap: 16, flexWrap: "wrap" }}>
                    <span className="mono">{formatHostDate(m.date, m.city)}</span>
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
              <h3>{selected ? new Date(`${selected}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" }) : "Select a day"}</h3>
              {selectedMatches.map((m) => (
                <div key={m._id} style={{ marginTop: 16, paddingBottom: 16, borderBottom: "1px solid var(--border-subtle)" }}>
                  <strong>{m.teams?.join(" vs ")}</strong>
                  <p className="muted">{m.venue} / {formatHostTime(m.date, m.city)}</p>
                  <p>{m.expectedCrowd?.toLocaleString()} venue-capacity estimate / Surge {m.surgeScore}</p>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    style={{ marginTop: 8 }}
                    onClick={() => generateForMatch(m)}
                    disabled={generatingId === m._id}
                  >
                    {generatingId === m._id ? "Generating..." : "Generate Alert for This Match"}
                  </button>
                </div>
              ))}
              {!selectedMatches.length && selected && <p className="muted">No matches on this day.</p>}
            </div>
          )}
        </div>
      )}
    </>
  );
}

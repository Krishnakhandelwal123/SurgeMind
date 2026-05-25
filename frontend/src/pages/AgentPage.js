import React, { useEffect, useState, useRef } from "react";
import { agentApi } from "../api/client";
import { useAuth } from "../context/AuthContext";
import "./AgentPage.css";

export default function AgentPage() {
  const { business } = useAuth();
  const [session, setSession] = useState(null);
  const [monitoring, setMonitoring] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    agentApi.session().then((r) => {
      setSession(r.data.session);
      setMonitoring(r.data.monitoring || []);
    });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    const msg = input.trim();
    setInput("");
    setSending(true);

    const optimistic = {
      ...session,
      messages: [...(session?.messages || []), { role: "user", content: msg }],
    };
    setSession(optimistic);

    try {
      const { data } = await agentApi.chat(msg, session?._id);
      setSession((s) => ({
        ...s,
        _id: data.sessionId,
        messages: [
          ...(s?.messages || []).filter((m) => m.content !== msg || m.role !== "user"),
          { role: "user", content: msg },
          { role: "assistant", content: data.reply, reasoningSteps: data.reasoningSteps },
        ],
      }));
    } finally {
      setSending(false);
    }
  };

  const samplePrompt = "What surges are coming for my business this week?";

  return (
    <div className="agent-page grid-bg">
      <div className="page-header">
        <div>
          <h1>🤖 SurgeMind Agent <span className="live-dot pulse" /></h1>
          <p className="muted">Active · Monitoring {monitoring.length} cities</p>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => agentApi.newSession().then((r) => setSession(r.data))}>
          New Session +
        </button>
      </div>

      <div className="agent-panels">
        <aside className="agent-side card">
          <h3 className="label">Agent Context</h3>
          {business && (
            <div className="biz-mini">
              <strong>{business.name}</strong>
              <div className="muted">{business.type} · {business.city}</div>
            </div>
          )}
          <h4 className="label" style={{ marginTop: 20 }}>Active Monitoring</h4>
          {monitoring.map((m) => (
            <div key={m.city} className="monitor-row">
              <span>{m.city}</span>
              <span className="muted">Next: {m.daysUntil ?? "—"}d</span>
              <span className="badge badge-purple">{m.surgeScore}</span>
            </div>
          ))}
          <h4 className="label" style={{ marginTop: 20 }}>Tools Available</h4>
          {["getUpcomingMatches", "getCrowdForecast", "getBusinessProfile", "generateAlert", "translateAlert"].map((t) => (
            <div key={t} className="mono tool-row"><span className="tool-dot" /> {t}</div>
          ))}
        </aside>

        <section className="agent-chat card">
          <div className="messages">
            {!session?.messages?.length && (
              <button type="button" className="sample-prompt" onClick={() => setInput(samplePrompt)}>
                Try: &quot;{samplePrompt}&quot;
              </button>
            )}
            {session?.messages?.map((m, i) => (
              <div key={i} className={m.role === "user" ? "msg-user" : "msg-agent"}>
                {m.reasoningSteps?.map((step, j) => (
                  <div key={j} className="mono reasoning-line">
                    ▸ {step.text} {step.status === "done" ? "✓" : "…"}
                  </div>
                ))}
                <div className={m.role === "user" ? "user-pill" : "agent-text"}>
                  {m.role === "assistant" && <strong>SURGEMIND:</strong>}
                  <pre style={{ whiteSpace: "pre-wrap", margin: m.role === "assistant" ? "8px 0 0" : 0, fontFamily: "inherit" }}>{m.content}</pre>
                </div>
              </div>
            ))}
            {sending && <p className="mono muted">SurgeMind is analyzing your surges...</p>}
            <div ref={bottomRef} />
          </div>
          <form className="chat-input" onSubmit={send}>
            <span>⚡</span>
            <input
              className="input"
              placeholder="Ask SurgeMind anything about your upcoming surges..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" className="btn btn-primary btn-sm" disabled={sending}>→</button>
          </form>
        </section>

        <aside className="agent-feed card">
          <h3 className="label">Live Data Feed</h3>
          <span className="badge" style={{ background: "var(--red)", color: "white" }}>LIVE</span>
          {monitoring.map((m) => (
            <div key={m.city} className="feed-item mono">
              {m.city}: {m.nextMatch?.teams?.join(" vs ") || "—"} · {m.nextMatch?.expectedCrowd?.toLocaleString() || 0} crowd
            </div>
          ))}
          <h4 className="label" style={{ marginTop: 20 }}>Recent Tool Calls</h4>
          {(session?.toolCalls || []).slice(-5).map((tc, i) => (
            <div key={i} className="mono feed-log">
              [{new Date(tc.at).toLocaleTimeString()}] {tc.tool}{tc.args} → {tc.result}
            </div>
          ))}
          <div className="agent-stats">
            <div>Queries: {session?.stats?.queriesRun || 0}</div>
          </div>
        </aside>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../api/client";
import { businessApi, settingsApi } from "../api/client";
import { BUSINESS_TYPES } from "../utils/surge";

const TABS = ["Profile", "Business", "Notifications", "Plan & Billing"];

export default function SettingsPage() {
  const { user, business, refreshUser } = useAuth();
  const [tab, setTab] = useState(0);
  const [cities, setCities] = useState([]);
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [bizForm, setBizForm] = useState({
    name: business?.name || "",
    type: business?.type || "restaurant",
    city: business?.city || "",
    monitoredCities: business?.monitoredCities || [],
    language: business?.language || "en",
    dailyCapacity: business?.dailyCapacity || 120,
    staffCount: business?.staffCount || 8,
    averageTicket: business?.averageTicket || 28,
    operatingHours: business?.operatingHours || "10:00 AM - 10:00 PM",
    topProducts: business?.topProducts?.join(", ") || "",
    alertLeadTimeDays: business?.alertLeadTimeDays || 7,
  });
  const [notif, setNotif] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    authApi.cities().then((r) => setCities(r.data)).catch(() => {});
    settingsApi.notifications().then((r) => setNotif(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (business) {
      setBizForm({
        name: business.name,
        type: business.type,
        city: business.city,
        monitoredCities: business.monitoredCities || [business.city],
        language: business.language || "en",
        dailyCapacity: business.dailyCapacity || 120,
        staffCount: business.staffCount || 8,
        averageTicket: business.averageTicket || 28,
        operatingHours: business.operatingHours || "10:00 AM - 10:00 PM",
        topProducts: business.topProducts?.join(", ") || "",
        alertLeadTimeDays: business.alertLeadTimeDays || 7,
      });
    }
  }, [business]);

  const saveProfile = async () => {
    await authApi.updateProfile({ name, email });
    await refreshUser();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const saveBusiness = async () => {
    await businessApi.update({
      ...bizForm,
      dailyCapacity: Number(bizForm.dailyCapacity),
      staffCount: Number(bizForm.staffCount),
      averageTicket: Number(bizForm.averageTicket),
      alertLeadTimeDays: Number(bizForm.alertLeadTimeDays),
      topProducts: String(bizForm.topProducts || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      monitoredCities: [bizForm.city],
    });
    await refreshUser();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const saveNotif = async () => {
    await settingsApi.updateNotifications(notif);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <>
      <div className="page-header"><h1>Settings</h1></div>
      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 32 }}>
        <nav>
          {TABS.map((t, i) => (
            <button
              key={t}
              type="button"
              className={`nav-item ${tab === i ? "active" : ""}`}
              style={{ width: "100%", marginBottom: 4, border: "none", cursor: "pointer", textAlign: "left" }}
              onClick={() => setTab(i)}
            >
              {t}
            </button>
          ))}
        </nav>

        <div className="card">
          {tab === 0 && (
            <>
              <h3>Profile</h3>
              <label className="label">Name</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
              <label className="label" style={{ marginTop: 16 }}>Email</label>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <button type="button" className="btn btn-primary btn-sm" style={{ marginTop: 20 }} onClick={saveProfile}>Save Changes</button>
            </>
          )}

          {tab === 1 && (
            <>
              <h3>Business Settings</h3>
              <label className="label">Business name</label>
              <input className="input" value={bizForm.name} onChange={(e) => setBizForm({ ...bizForm, name: e.target.value })} />
              <label className="label" style={{ marginTop: 16 }}>Type</label>
              <select className="select" value={bizForm.type} onChange={(e) => setBizForm({ ...bizForm, type: e.target.value })}>
                {BUSINESS_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
              <label className="label" style={{ marginTop: 16 }}>Primary city</label>
              <select
                className="select"
                value={bizForm.city}
                onChange={(e) => setBizForm({ ...bizForm, city: e.target.value, monitoredCities: [e.target.value] })}
              >
                {(cities.length ? cities : [bizForm.city]).filter(Boolean).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <label className="label" style={{ marginTop: 16 }}>Preferred language</label>
              <select className="select" value={bizForm.language} onChange={(e) => setBizForm({ ...bizForm, language: e.target.value })}>
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
              </select>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 16 }}>
                <label>
                  <span className="label">Daily capacity</span>
                  <input className="input" type="number" min="1" value={bizForm.dailyCapacity} onChange={(e) => setBizForm({ ...bizForm, dailyCapacity: e.target.value })} />
                </label>
                <label>
                  <span className="label">Staff count</span>
                  <input className="input" type="number" min="1" value={bizForm.staffCount} onChange={(e) => setBizForm({ ...bizForm, staffCount: e.target.value })} />
                </label>
                <label>
                  <span className="label">Average ticket</span>
                  <input className="input" type="number" min="1" value={bizForm.averageTicket} onChange={(e) => setBizForm({ ...bizForm, averageTicket: e.target.value })} />
                </label>
              </div>
              <label className="label" style={{ marginTop: 16 }}>Operating hours</label>
              <input className="input" value={bizForm.operatingHours} onChange={(e) => setBizForm({ ...bizForm, operatingHours: e.target.value })} />
              <label className="label" style={{ marginTop: 16 }}>Top products or services</label>
              <input className="input" value={bizForm.topProducts} onChange={(e) => setBizForm({ ...bizForm, topProducts: e.target.value })} />
              <label className="label" style={{ marginTop: 16 }}>Alert lead time</label>
              <select className="select" value={bizForm.alertLeadTimeDays} onChange={(e) => setBizForm({ ...bizForm, alertLeadTimeDays: e.target.value })}>
                <option value="7">7 days before</option>
                <option value="10">10 days before</option>
                <option value="14">14 days before</option>
                <option value="21">21 days before</option>
              </select>
              <p className="muted" style={{ marginTop: 16 }}>Monitored cities ({user?.plan === "pro" ? 3 : 1} max on {user?.plan} plan)</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                {bizForm.monitoredCities.map((c) => (
                  <span key={c} className="badge badge-purple">{c}</span>
                ))}
              </div>
              <button type="button" className="btn btn-primary btn-sm" style={{ marginTop: 20 }} onClick={saveBusiness}>Save Business</button>
            </>
          )}

          {tab === 2 && notif && (
            <>
              <h3>Notifications</h3>
              {[
                ["emailAlerts", "Email alerts"],
                ["inAppAlerts", "In-app alerts"],
              ].map(([key, label]) => (
                <label key={key} style={{ display: "flex", justifyContent: "space-between", marginTop: 16, alignItems: "center" }}>
                  {label}
                  <input
                    type="checkbox"
                    checked={notif[key]}
                    onChange={(e) => setNotif({ ...notif, [key]: e.target.checked })}
                  />
                </label>
              ))}
              <label className="label" style={{ marginTop: 24 }}>Alert timing</label>
              <select className="select" value={notif.timing} onChange={(e) => setNotif({ ...notif, timing: e.target.value })}>
                <option value="7">7 days before surge</option>
                <option value="3">3 days before</option>
                <option value="1">1 day before</option>
              </select>
              <button type="button" className="btn btn-primary btn-sm" style={{ marginTop: 20 }} onClick={saveNotif}>Save Notifications</button>
            </>
          )}

          {tab === 3 && (
            <>
              <h3>Plan & Billing</h3>
              <div className="card" style={{ background: "var(--surface-2)", marginTop: 16 }}>
                <strong>Current: {user?.plan === "pro" ? "SurgeMind Pro" : "Free"}</strong>
                <p className="muted">{user?.plan === "pro" ? "3 cities / all alert types" : "1 business / 1 city / basic alerts"}</p>
              </div>
              {user?.plan !== "pro" && (
                <div className="card" style={{ marginTop: 16, border: "2px solid var(--purple)", background: "rgba(124,110,250,0.08)" }}>
                  <h3>SurgeMind Pro - $29/month</h3>
                  <ul style={{ color: "var(--text-muted)", lineHeight: 2 }}>
                    <li>3 monitored cities</li>
                    <li>All alert types including PRICE_ADJUST</li>
                    <li>Priority AI agent</li>
                  </ul>
                  <button type="button" className="btn btn-primary" style={{ marginTop: 16 }}>Upgrade Now</button>
                </div>
              )}
            </>
          )}

          {saved && <p style={{ color: "var(--teal)", marginTop: 16 }}>Saved</p>}
        </div>
      </div>
    </>
  );
}

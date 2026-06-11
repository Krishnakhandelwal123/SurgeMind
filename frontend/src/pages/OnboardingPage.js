import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./OnboardingPage.css";

export default function OnboardingPage() {
  const { business, completeOnboarding } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [language, setLanguage] = useState(business?.language || "en");
  const [profile, setProfile] = useState({
    dailyCapacity: business?.dailyCapacity || 120,
    staffCount: business?.staffCount || 8,
    averageTicket: business?.averageTicket || 28,
    operatingHours: business?.operatingHours || "10:00 AM - 10:00 PM",
    topProducts: business?.topProducts?.join(", ") || "tacos, margaritas, lunch combo",
    alertLeadTimeDays: business?.alertLeadTimeDays || 10,
  });

  const updateProfile = (key, value) => {
    setProfile((current) => ({ ...current, [key]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setError("");

    try {
      await completeOnboarding({
        step: 3,
        complete: true,
        language,
        dailyCapacity: Number(profile.dailyCapacity),
        staffCount: Number(profile.staffCount),
        averageTicket: Number(profile.averageTicket),
        operatingHours: profile.operatingHours,
        topProducts: profile.topProducts.split(",").map((item) => item.trim()).filter(Boolean),
        alertLeadTimeDays: Number(profile.alertLeadTimeDays),
      });

      navigate("/dashboard", { replace: true });
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/signin", { replace: true });
        return;
      }
      setError(err.response?.data?.error || "Could not complete onboarding. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="onboard mesh-hero grid-bg">
      <form className="onboard-card card" onSubmit={submit}>
        <div className="onboard-icon">OPS</div>
        <p className="label">{business?.name || "Your business"} / {business?.city || "Host city"}</p>
        <h2>Calibrate the Agent</h2>
        <p className="muted">Add the numbers SurgeMind needs for real staffing, inventory, and revenue recommendations.</p>

        <div className="profile-grid">
          <label>
            Preferred language
            <select className="select" value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
            </select>
          </label>
          <label>
            Daily customer capacity
            <input className="input" type="number" min="1" required value={profile.dailyCapacity} onChange={(e) => updateProfile("dailyCapacity", e.target.value)} />
          </label>
          <label>
            Staff count
            <input className="input" type="number" min="1" required value={profile.staffCount} onChange={(e) => updateProfile("staffCount", e.target.value)} />
          </label>
          <label>
            Average ticket ($)
            <input className="input" type="number" min="1" required value={profile.averageTicket} onChange={(e) => updateProfile("averageTicket", e.target.value)} />
          </label>
          <label>
            Operating hours
            <input className="input" required value={profile.operatingHours} onChange={(e) => updateProfile("operatingHours", e.target.value)} />
          </label>
          <label>
            Alert lead time
            <select className="select" value={profile.alertLeadTimeDays} onChange={(e) => updateProfile("alertLeadTimeDays", e.target.value)}>
              <option value="7">7 days before</option>
              <option value="10">10 days before</option>
              <option value="14">14 days before</option>
              <option value="21">21 days before</option>
            </select>
          </label>
          <label className="wide">
            Top products or services
            <input className="input" required value={profile.topProducts} onChange={(e) => updateProfile("topProducts", e.target.value)} />
          </label>
        </div>

        {error && <div className="onboard-error">{error}</div>}

        <button type="submit" className="btn btn-primary" style={{ marginTop: 32 }} disabled={saving}>
          {saving ? "Saving..." : "Continue to Dashboard"}
        </button>
      </form>
    </div>
  );
}

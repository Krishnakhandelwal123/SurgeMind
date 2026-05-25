import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { alertsApi } from "../api/client";
import { BUSINESS_TYPES } from "../utils/surge";
import "./OnboardingPage.css";

export default function OnboardingPage() {
  const { business, completeOnboarding } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [language, setLanguage] = useState(business?.language || "en");
  const [progress, setProgress] = useState(0);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (step === 3 && !generating) {
      setGenerating(true);
      alertsApi.generate({}).catch(() => {});
    }
  }, [step, generating]);

  const next = async () => {
    if (step === 2) {
      await completeOnboarding({ step: 2, language });
      setStep(3);
      let p = 0;
      const iv = setInterval(() => {
        p += 12;
        setProgress(p);
        if (p >= 100) clearInterval(iv);
      }, 200);
      return;
    }
    if (step === 3) {
      await completeOnboarding({ step: 3, complete: true });
      navigate("/dashboard");
      return;
    }
    setStep(step + 1);
  };

  return (
    <div className="onboard mesh-hero grid-bg">
      <div className="onboard-card card">
        <div className="dots">
          {[1, 2, 3].map((s) => (
            <span key={s} className={step >= s ? "filled" : ""} />
          ))}
        </div>

        {step === 1 && (
          <>
            <div className="onboard-icon">🏪</div>
            <h2>Tell us about your business</h2>
            <p className="muted">We&apos;ve saved {business?.name} in {business?.city}. Confirm to continue.</p>
            <div className="type-grid">
              {BUSINESS_TYPES.map((t) => (
                <div key={t.id} className={`type-card ${business?.type === t.id ? "active" : ""}`}>
                  {t.icon} {t.label}
                </div>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="onboard-icon">🌍</div>
            <h2>What language do you prefer?</h2>
            <div className="lang-grid">
              {[
                ["en", "🇺🇸", "English"],
                ["es", "🇪🇸", "Español"],
                ["fr", "🇫🇷", "Français"],
              ].map(([code, flag, name]) => (
                <button
                  key={code}
                  type="button"
                  className={`lang-card ${language === code ? "active" : ""}`}
                  onClick={() => setLanguage(code)}
                >
                  <span>{flag}</span>
                  <strong>{name}</strong>
                  <small>Alerts in this language</small>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="onboard-icon glow">⚡</div>
            <h2>SurgeMind is watching for you</h2>
            <p className="muted">Your first surge report is being generated...</p>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </>
        )}

        <button type="button" className="btn btn-primary" onClick={next} style={{ marginTop: 32 }}>
          {step === 3 ? "Go to Dashboard →" : "Continue →"}
        </button>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { publicApi } from "../api/client";
import SurgeRing from "../components/SurgeRing";
import "./LandingPage.css";

export default function LandingPage() {
  const [stats, setStats] = useState({ cities: 16, matches: 104, categories: 5, languages: 3 });

  useEffect(() => {
    publicApi.stats().then((r) => setStats(r.data)).catch(() => {});
  }, []);

  const statItems = [
    [stats.cities, "Host cities"],
    [stats.matches, "Match slots"],
    [stats.categories, "Business types"],
    [stats.languages, "Languages"],
  ];

  return (
    <div className="landing">
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-copy">
            <span className="eyebrow">FIFA World Cup 2026 operations agent</span>
            <h1 className="hero-title">
              Turn match-day crowds into a clear business plan.
            </h1>
            <p className="hero-sub">
              SurgeMind connects FIFA 2026 host-city data with your business profile, then creates
              inventory, staffing, language, and revenue recommendations before fans arrive.
            </p>
            <div className="hero-ctas">
              <Link to="/signup" className="btn btn-primary">Start Planning</Link>
              <Link to="/signin" className="btn btn-ghost">Sign In</Link>
            </div>
            <div className="hero-stats" aria-label="Coverage stats">
              {statItems.map(([value, label]) => (
                <div key={label} className="hero-stat">
                  <strong>{value}</strong>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-preview" aria-label="SurgeMind product preview">
            <div className="preview-top">
              <div>
                <p className="label">Next monitored surge</p>
                <h2>Mexico City</h2>
              </div>
              <span className="status-pill">Live data</span>
            </div>
            <div className="preview-main">
              <SurgeRing score={8.5} size={132} />
              <div className="preview-match">
                <span className="label">Opening fixture</span>
                <strong>Mexico vs South Africa</strong>
                <p>Estadio Azteca / venue-capacity estimate</p>
              </div>
            </div>
            <div className="preview-actions">
              {[
                ["Inventory", "Stock fast-moving items for pre-match demand"],
                ["Staffing", "Add coverage before kickoff and after full time"],
                ["Language", "Prepare bilingual signage and quick-order menus"],
              ].map(([title, body]) => (
                <div key={title} className="preview-row">
                  <span>{title}</span>
                  <p>{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section container">
        <div className="section-head">
          <p className="section-label">How it works</p>
          <h2>One flow from schedule data to action.</h2>
        </div>
        <div className="steps">
          {[
            ["01", "Read match context", "Uses host city, venue, match date, fan mix, and venue-capacity estimates from the seeded backend."],
            ["02", "Score the surge", "Combines expected crowd, city baseline, and your business profile into a practical 0-10 score."],
            ["03", "Generate the plan", "Creates checklist items for stock, staffing, operations, language, hours, and revenue opportunity."],
          ].map(([num, title, desc]) => (
            <div key={title} className="step-card">
              <span className="step-num">{num}</span>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="business-strip">
        <div className="container business-strip-inner">
          {["Restaurant", "Bar & Brewery", "Hotel", "Retail", "Cafe"].map((item) => (
            <span key={item} className="biz-pill">{item}</span>
          ))}
        </div>
      </section>

      <section className="footer-cta">
        <div className="container footer-cta-inner">
          <div>
            <p className="section-label">Ready for kickoff</p>
            <h2>The World Cup runs June 11 to July 19, 2026.</h2>
          </div>
          <Link to="/signup" className="btn btn-primary">Create Your Plan</Link>
        </div>
      </section>
    </div>
  );
}

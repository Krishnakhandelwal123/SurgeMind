import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authApi, publicApi } from "../api/client";
import { BUSINESS_TYPES } from "../utils/surge";
import "./AuthPages.css";

function AuthSplit({ children }) {
  const [countdown, setCountdown] = useState(null);

  useEffect(() => {
    publicApi.nextMatch().then((r) => setCountdown(r.data)).catch(() => {});
  }, []);

  return (
    <div className="auth-split">
      <div className="auth-left mesh-hero grid-bg">
        <div className="auth-logo">SurgeMind</div>
        <div className="auth-quote">
          <h2>The surge is coming.<br />Will you be ready?</h2>
          {countdown?.match && (
            <div className="countdown card">
              <div className="label">Next FIFA 2026 Match</div>
              <strong>{countdown.match.teams?.join(" vs ")}</strong>
              <div>{countdown.match.city} / {countdown.match.venue}</div>
              <div className="countdown-nums mono">
                {countdown.days}d {countdown.hours}h {countdown.minutes}m
              </div>
            </div>
          )}
        </div>
        <p className="auth-proof">Built for all 16 FIFA 2026 host cities</p>
      </div>
      <div className="auth-right">
        <div className="auth-form-wrap">{children}</div>
      </div>
    </div>
  );
}

export function SignUpPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [cities, setCities] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    businessName: "",
    name: "",
    email: "",
    password: "",
    businessType: "restaurant",
    city: "Dallas",
  });

  useEffect(() => {
    authApi.cities().then((r) => setCities(r.data)).catch(() => {});
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await register(form);
      navigate("/onboarding");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplit>
      <h2>Create your account</h2>
      <p className="auth-sub">Get your first surge alert free. No credit card.</p>
      {error && <div className="auth-error">{error}</div>}
      <form onSubmit={submit}>
        <label>Business Name</label>
        <input className="input" required value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
        <label>Your Name</label>
        <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <label>Email</label>
        <input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <label>Password</label>
        <input className="input" type="password" required minLength={10} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <p className="muted" style={{ marginTop: 6 }}>Use at least 10 characters with a letter and a number.</p>
        <label>Business Type</label>
        <select className="select" value={form.businessType} onChange={(e) => setForm({ ...form, businessType: e.target.value })}>
          {BUSINESS_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
        <label>Host City</label>
        <select className="select" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}>
          {(cities.length ? cities : ["Dallas"]).map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: 16 }} disabled={loading}>
          {loading ? "Creating..." : "Create Account"}
        </button>
      </form>
      <p className="auth-footer">Already have an account? <Link to="/signin">Sign in</Link></p>
    </AuthSplit>
  );
}

export function SignInPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const user = await login(email, password);
      navigate(user.onboardingComplete ? "/dashboard" : "/onboarding");
    } catch {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplit>
      <h2>Welcome back</h2>
      {error && <div className="auth-error">{error}</div>}
      <form onSubmit={submit}>
        <label>Email</label>
        <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <label>Password</label>
        <input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: 16 }} disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
      <p className="auth-footer">New to SurgeMind? <Link to="/signup">Create account</Link></p>
    </AuthSplit>
  );
}

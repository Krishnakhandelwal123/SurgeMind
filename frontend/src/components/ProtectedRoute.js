import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, requireOnboarding = true }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
        <div className="shimmer skeleton" style={{ width: 200, height: 24 }} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  if (user.onboardingComplete && location.pathname.startsWith("/onboarding")) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireOnboarding && !user.onboardingComplete && !location.pathname.startsWith("/onboarding")) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}

import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function GuestRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
        <div className="shimmer skeleton" style={{ width: 200, height: 24 }} />
      </div>
    );
  }

  if (user) {
    return <Navigate to={user.onboardingComplete ? "/dashboard" : "/onboarding"} replace />;
  }

  return children;
}

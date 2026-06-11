import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./DashboardLayout.css";

const NAV = [
  { to: "/dashboard", label: "Overview", icon: "OV", end: true },
  { to: "/dashboard/alerts", label: "Surge Alerts", icon: "AL" },
  { to: "/dashboard/calendar", label: "Match Calendar", icon: "CA" },
  { to: "/dashboard/agent", label: "AI Agent", icon: "AI" },
  { to: "/dashboard/analytics", label: "Analytics", icon: "AN" },
  { to: "/dashboard/settings", label: "Settings", icon: "SE" },
];

export default function DashboardLayout() {
  const { user, business, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="dash-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">SurgeMind</div>
        {business && (
          <div className="sidebar-biz">
            {business.name} / {business.city}
          </div>
        )}
        <nav className="sidebar-nav">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
            >
              <span>{item.icon}</span> {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          {user?.plan === "free" && (
            <div className="upgrade-card">
              <strong>Upgrade to Pro</strong>
              <p>3 cities / all alert types</p>
            </div>
          )}
          <div className="user-row">
            <div className="avatar">{user?.name?.[0] || "U"}</div>
            <div>
              <div className="user-name">{user?.name}</div>
              <button type="button" className="link-btn" onClick={() => { logout(); navigate("/"); }}>
                Sign out
              </button>
            </div>
          </div>
        </div>
      </aside>
      <main className="dash-main">
        <Outlet />
      </main>
      <nav className="mobile-nav">
        {NAV.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end}>
            <div>{item.icon}</div>
            {item.label.split(" ")[0]}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

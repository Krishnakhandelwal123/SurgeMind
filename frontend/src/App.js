import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import GuestRoute from "./components/GuestRoute";
import DashboardLayout from "./components/DashboardLayout";
import LandingPage from "./pages/LandingPage";
import { SignUpPage, SignInPage } from "./pages/AuthPages";
import OnboardingPage from "./pages/OnboardingPage";
import OverviewPage from "./pages/OverviewPage";
import AlertsPage from "./pages/AlertsPage";
import AlertDetailPage from "./pages/AlertDetailPage";
import AgentPage from "./pages/AgentPage";
import CalendarPage from "./pages/CalendarPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SettingsPage from "./pages/SettingsPage";
import "./styles/global.css";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<GuestRoute><SignUpPage /></GuestRoute>} />
          <Route path="/signin" element={<GuestRoute><SignInPage /></GuestRoute>} />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute requireOnboarding={false}>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<OverviewPage />} />
            <Route path="alerts" element={<AlertsPage />} />
            <Route path="alerts/:id" element={<AlertDetailPage />} />
            <Route path="agent" element={<AgentPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

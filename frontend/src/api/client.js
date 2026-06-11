import axios from "axios";

const API_BASE =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === "production" ? "" : "http://localhost:3001");

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("surgemind_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authApi = {
  register: (data) => api.post("/api/auth/register", data),
  login: (data) => api.post("/api/auth/login", data),
  logout: () => api.post("/api/auth/logout"),
  me: () => api.get("/api/auth/me"),
  session: () => api.get("/api/auth/session"),
  cities: () => api.get("/api/auth/cities"),
  onboarding: (data) => api.patch("/api/auth/onboarding", data),
  updateProfile: (data) => api.patch("/api/auth/profile", data),
};

export const publicApi = {
  stats: () => api.get("/api/public/stats"),
  nextMatch: () => api.get("/api/matches/next/global"),
};

export const dashboardApi = {
  overview: () => api.get("/api/dashboard"),
};

export const alertsApi = {
  list: (params) => api.get("/api/alerts", { params }),
  get: (id) => api.get(`/api/alerts/${id}`),
  generate: (data) => api.post("/api/generate-alert", data),
  toggleChecklist: (alertId, itemId, completed) =>
    api.patch(`/api/alerts/${alertId}/checklist/${itemId}`, { completed }),
};

export const matchesApi = {
  list: (params) => api.get("/api/matches", { params }),
  calendar: (year, month) => api.get(`/api/matches/calendar/${year}/${month}`),
  byCity: (city) => api.get(`/api/matches/${city}`),
};

export const agentApi = {
  session: () => api.get("/api/agent/session"),
  chat: (message, sessionId) => api.post("/api/agent/chat", { message, sessionId }),
  newSession: () => api.post("/api/agent/new-session"),
};

export const analyticsApi = {
  get: () => api.get("/api/analytics"),
};

export const businessApi = {
  update: (data) => api.patch("/api/business", data),
};

export const settingsApi = {
  notifications: () => api.get("/api/settings/notifications"),
  updateNotifications: (data) => api.patch("/api/settings/notifications", data),
};

export default api;

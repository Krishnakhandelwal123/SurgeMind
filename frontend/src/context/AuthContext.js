import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authApi } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem("surgemind_token");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await authApi.me();
      setUser(data.user);
    } catch {
      localStorage.removeItem("surgemind_token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email, password) => {
    const { data } = await authApi.login({ email, password });
    localStorage.setItem("surgemind_token", data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (form) => {
    const { data } = await authApi.register(form);
    localStorage.setItem("surgemind_token", data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("surgemind_token");
    setUser(null);
  };

  const refreshUser = async () => {
    const { data } = await authApi.me();
    setUser(data.user);
    return data.user;
  };

  const completeOnboarding = async (payload) => {
    const { data } = await authApi.onboarding(payload);
    setUser(data.user);
    return data.user;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        business: user?.business,
        loading,
        login,
        register,
        logout,
        refreshUser,
        completeOnboarding,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

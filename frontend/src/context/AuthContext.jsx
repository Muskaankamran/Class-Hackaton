import React, { createContext, useContext, useState, useEffect } from "react";
import API from "../utils/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("clinic_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem("clinic_token") || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const res = await API.get("/api/auth/me");
          if (res.data?.user) {
            setUser(res.data.user);
            localStorage.setItem("clinic_user", JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.warn("Session expired or invalid:", err.response?.data?.message);
          // Only clear if 401 or 403
          if (err.response?.status === 401 || err.response?.status === 403) {
            logout();
          }
        }
      }
      setLoading(false);
    }
    loadUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await API.post("/api/auth/login", { email, password });
    const { token: receivedToken, user: receivedUser } = res.data;
    setToken(receivedToken);
    setUser(receivedUser);
    localStorage.setItem("clinic_token", receivedToken);
    localStorage.setItem("clinic_user", JSON.stringify(receivedUser));
    return receivedUser;
  };

  const register = async (userData) => {
    const res = await API.post("/api/auth/register", userData);
    const { token: receivedToken, user: receivedUser } = res.data;
    setToken(receivedToken);
    setUser(receivedUser);
    localStorage.setItem("clinic_token", receivedToken);
    localStorage.setItem("clinic_user", JSON.stringify(receivedUser));
    return receivedUser;
  };

  const logout = async () => {
    try {
      await API.post("/api/auth/logout");
    } catch {
      // ignore
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem("clinic_token");
    localStorage.removeItem("clinic_user");
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    isDoctor: user?.role === "doctor",
    isPatient: user?.role === "patient",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

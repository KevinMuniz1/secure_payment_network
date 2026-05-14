import React, { createContext, useContext, useState } from "react";
import type { FullAuthResponse } from "../api/auth";
import { logout as apiLogout } from "../api/auth";

interface User {
  email: string;
  role: string;
}

interface AuthContextType {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  login: (response: FullAuthResponse) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function loadFromStorage<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;
    return JSON.parse(item) as T;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem("jwt")
  );
  const [refreshToken, setRefreshToken] = useState<string | null>(
    () => localStorage.getItem("refreshToken")
  );
  const [user, setUser] = useState<User | null>(
    () => loadFromStorage<User>("user")
  );

  function login(response: FullAuthResponse) {
    const userObj: User = { email: response.email, role: response.role };
    localStorage.setItem("jwt", response.token);
    localStorage.setItem("refreshToken", response.refreshToken);
    localStorage.setItem("user", JSON.stringify(userObj));
    setToken(response.token);
    setRefreshToken(response.refreshToken);
    setUser(userObj);
  }

  async function logout() {
    if (refreshToken) {
      try {
        await apiLogout(refreshToken);
      } catch {
        // Ignore logout API errors — clear state regardless
      }
    }
    localStorage.removeItem("jwt");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setToken(null);
    setRefreshToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ token, refreshToken, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

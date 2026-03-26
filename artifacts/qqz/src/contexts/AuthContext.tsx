import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getToken, setToken, clearToken } from "@/lib/auth";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: "customer" | "professional" | "admin";
  suspended: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  setUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = getToken();
    if (!storedToken) {
      setLoading(false);
      return;
    }
    fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${storedToken}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(u => {
        if (u) {
          setUserState(u);
          setTokenState(storedToken);
        } else {
          clearToken();
        }
      })
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  function login(newToken: string, newUser: AuthUser) {
    setToken(newToken);
    setTokenState(newToken);
    setUserState(newUser);
  }

  function logout() {
    clearToken();
    setTokenState(null);
    setUserState(null);
  }

  function setUser(u: AuthUser) {
    setUserState(u);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";
import Constants from "expo-constants";

const TOKEN_KEY = "qqz_token";

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  suspended: boolean;
  phoneVerified: boolean;
  idVerified: boolean;
  faceVerified: boolean;
  createdAt: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  setUser: () => {},
});

export const API_BASE_URL: string =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  process.env.EXPO_PUBLIC_API_URL ??
  "";

if (API_BASE_URL) setBaseUrl(API_BASE_URL);

let _tokenRef: string | null = null;
setAuthTokenGetter(() => _tokenRef);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(TOKEN_KEY);
        if (stored) {
          _tokenRef = stored;
          setToken(stored);
          const url = API_BASE_URL ? `${API_BASE_URL}/api/auth/me` : "/api/auth/me";
          const res = await fetch(url, {
            headers: { Authorization: `Bearer ${stored}` },
          });
          if (res.ok) {
            setUserState(await res.json());
          } else {
            await AsyncStorage.removeItem(TOKEN_KEY);
            _tokenRef = null;
          }
        }
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function login(t: string, u: User) {
    _tokenRef = t;
    await AsyncStorage.setItem(TOKEN_KEY, t);
    setToken(t);
    setUserState(u);
  }

  async function logout() {
    _tokenRef = null;
    await AsyncStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUserState(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, setUser: setUserState }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

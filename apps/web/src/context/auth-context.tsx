"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { trpc } from "@/lib/trpc";
import { getAccessToken, setAccessToken } from "@/lib/auth-token";

type User = {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  emailVerified: boolean | null;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  register: (
    email: string,
    password: string,
    displayName?: string
  ) => Promise<{ emailVerified: boolean | null }>;
  login: (email: string, password: string) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const me = await trpc.auth.me.query();
      setUser(me);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    async function tryRefresh() {
      try {
        const result = await trpc.auth.refresh.mutate();
        setAccessToken(result.accessToken);
        await fetchUser();
      } catch {
        setAccessToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    tryRefresh();
  }, [fetchUser]);

  async function register(
    email: string,
    password: string,
    displayName?: string
  ) {
    const result = await trpc.auth.createUserWithEmailAndPassword.mutate({
      email,
      password,
      displayName,
    });
    setAccessToken(result.accessToken);
    await fetchUser();
    return { emailVerified: result.emailVerified };
  }

  async function login(email: string, password: string) {
    const result = await trpc.auth.signInUserWithEmailAndPassword.mutate({
      email,
      password,
    });
    setAccessToken(result.accessToken);
    await fetchUser();
  }

  async function googleLogin(idToken: string) {
    const result = await trpc.auth.googleLogin.mutate({ idToken });
    setAccessToken(result.accessToken);
    await fetchUser();
  }

  async function logout() {
    try {
      await trpc.auth.logoutUser.mutate();
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }

  async function refreshUser() {
    await fetchUser();
  }

  return (
    <AuthContext value={{ user, loading, register, login, googleLogin, logout, refreshUser }}>
      {children}
    </AuthContext>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

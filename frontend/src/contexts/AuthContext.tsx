import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import api from "@/lib/api";
import type { User, AuthResponse } from "@/types";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean; // always false with lazy init; kept for interface compatibility
  login: (email: string, password: string) => Promise<void>;
  /** Called after a successful register to hydrate state without a second login request. */
  setSession: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function decodeJwtPayload(token: string): { exp?: number; [key: string]: unknown } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    // JWT uses base64url — replace chars and pad to standard base64
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

interface AuthState {
  user: User | null;
  token: string | null;
}

/**
 * Lazy initializer — runs synchronously before the first render so auth state
 * is available immediately with no async gap and no flash of the login redirect.
 */
function getInitialAuthState(): AuthState {
  const stored = localStorage.getItem("taskflow_token");
  if (stored) {
    const payload = decodeJwtPayload(stored);
    if (payload && payload.exp && payload.exp * 1000 > Date.now()) {
      return {
        token: stored,
        user: {
          id: String(payload.sub ?? payload.user_id ?? ""),
          name: String(payload.name ?? ""),
          email: String(payload.email ?? ""),
          created_at: String(payload.created_at ?? ""),
        },
      };
    }
    // Expired or malformed — clear it
    localStorage.removeItem("taskflow_token");
  }
  return { user: null, token: null };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Lazy initializer reads localStorage once, synchronously, before first render
  const [{ user, token }, setAuthState] = useState<AuthState>(getInitialAuthState);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<AuthResponse>("/auth/login", { email, password });
    localStorage.setItem("taskflow_token", data.token);
    setAuthState({ user: data.user, token: data.token });
  }, []);

  const setSession = useCallback((newToken: string, newUser: User) => {
    localStorage.setItem("taskflow_token", newToken);
    setAuthState({ user: newUser, token: newToken });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("taskflow_token");
    setAuthState({ user: null, token: null });
    window.location.href = "/login";
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: user !== null,
        isLoading: false, // synchronous init — never in a loading state
        login,
        setSession,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { fetchMe, loginRequest, logoutRequest } from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore the session: the browser sends the httpOnly cookie automatically.
  useEffect(() => {
    let cancelled = false;

    async function restore() {
      try {
        const { user } = await fetchMe();
        if (!cancelled) setUser(user);
      } catch {
        if (!cancelled) setUser(null); // no cookie / expired → api.js fired auth:expired
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  // Any 401 from the API signs the user out everywhere
  useEffect(() => {
    function handleExpired() {
      setUser(null);
    }
    window.addEventListener("auth:expired", handleExpired);
    return () => window.removeEventListener("auth:expired", handleExpired);
  }, []);

  const login = useCallback(async (email, password) => {
    const { user } = await loginRequest(email, password);
    setUser(user);
    return user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest(); // server clears the cookie
    } catch {
      /* session may already be gone — clear locally anyway */
    }
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

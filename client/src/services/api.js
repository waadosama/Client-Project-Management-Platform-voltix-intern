const BASE = import.meta.env.VITE_API_URL || "";

/**
 * The session is an httpOnly cookie set by the server — JavaScript cannot
 * read it (no localStorage, no Authorization header built in the browser).
 * `credentials: "include"` makes the browser attach it automatically.
 */
export async function api(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };

  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      credentials: auth ? "include" : "same-origin",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Cannot reach the server");
  }

  let payload = null;
  try {
    payload = await res.json();
  } catch {
    /* non-JSON response */
  }

  if (!res.ok) {
    if (res.status === 401 && auth) {
      // Session missing/expired — tell the auth context to drop the user.
      window.dispatchEvent(new CustomEvent("auth:expired"));
    }
    const error = new Error(payload?.error || `Request failed (${res.status})`);
    error.status = res.status;
    throw error;
  }

  return payload;
}

/* ---- Auth (cookie-based sessions) ---- */
export const loginRequest = (email, password) =>
  api("/api/auth/login", { method: "POST", body: { email, password } });

export const fetchMe = () => api("/api/auth/me");

export const logoutRequest = () => api("/api/auth/logout", { method: "POST" });

/* ---- Pages ---- */
export const fetchIntro = () => api("/api/intro", { auth: false });

export const fetchProjects = () => api("/api/projects");

export const createProject = (data) =>
  api("/api/projects", { method: "POST", body: data });

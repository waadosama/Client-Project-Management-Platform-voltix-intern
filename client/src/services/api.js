const BASE = import.meta.env.VITE_API_URL || "";

async function request(path, options) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

/** Intro page content: { source: "database" | "defaults", data } */
export function fetchIntro() {
  return request("/api/intro");
}

export function fetchHealth() {
  return request("/api/health");
}

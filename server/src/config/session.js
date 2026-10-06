/** Session cookie shared by the auth controller and the auth middleware. */
export const SESSION_COOKIE = "cpmp_token";

/** Turn "7d" / "12h" / "30m" into milliseconds (defaults to 7 days). */
export function sessionMaxAgeMs() {
  const raw = process.env.JWT_EXPIRES_IN || "7d";
  const match = /^(\d+)\s*([smhd])$/i.exec(String(raw).trim());
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const factor = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[
    match[2].toLowerCase()
  ];
  return Number(match[1]) * factor;
}

/**
 * httpOnly: invisible to JavaScript/localStorage/devtools sources.
 * sameSite=lax: not sent on cross-site POSTs (CSRF mitigation).
 * secure: HTTPS-only once NODE_ENV=production.
 */
export function sessionCookieOptions(maxAgeMs = sessionMaxAgeMs()) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeMs,
  };
}

export function clearedCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  };
}

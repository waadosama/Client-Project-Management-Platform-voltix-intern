import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { SESSION_COOKIE } from "../config/session.js";

/**
 * Accepts the session two ways:
 *  1. the httpOnly cookie (browser — the token is never visible to JS)
 *  2. `Authorization: Bearer <jwt>` (server-to-server tools: curl, Postman, CI)
 */
function extractToken(req) {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) return header.slice(7).trim();
  if (req.cookies && typeof req.cookies[SESSION_COOKIE] === "string") {
    return req.cookies[SESSION_COOKIE];
  }
  return null;
}

/**
 * Verifies the JWT and attaches the current user to the request.
 * Blocks the request with 401 when the token is missing, invalid or expired.
 */
export async function requireAuth(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      const reason = err.name === "TokenExpiredError" ? "Token expired" : "Invalid token";
      return res.status(401).json({ error: reason });
    }

    const user = await User.findById(payload.sub);
    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Account not found or deactivated" });
    }

    req.user = user;
    req.token = token;
    return next();
  } catch (error) {
    return res.status(401).json({ error: "Authentication failed" });
  }
}

/** Role gate — use after requireAuth: requireRole("admin"). */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Authentication required" });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "You do not have permission to do that" });
    }
    return next();
  };
}

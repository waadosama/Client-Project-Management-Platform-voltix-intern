import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import {
  SESSION_COOKIE,
  sessionCookieOptions,
  sessionMaxAgeMs,
  clearedCookieOptions,
} from "../config/session.js";

const SALT_ROUNDS = 10;

function signToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // Surfaced in the server log (the response stays a generic 500).
    throw new Error("JWT_SECRET is not set — add it to server/.env");
  }

  return jwt.sign(
    { sub: user._id.toString(), email: user.email, role: user.role },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

/** POST /api/auth/login — sets the session cookie, returns only the user. */
export async function login(req, res) {
  try {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email: String(email).toLowerCase() }).select(
      "+passwordHash"
    );

    const valid =
      user && user.isActive && (await bcrypt.compare(String(password), user.passwordHash));

    if (!valid) {
      // Same message for wrong email and wrong password — no user enumeration.
      return res.status(401).json({ error: "Invalid email or password" });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = signToken(user);
    const maxAge = sessionMaxAgeMs();
    res.cookie(SESSION_COOKIE, token, sessionCookieOptions(maxAge));

    // No token in the response body — only the safe user profile.
    return res.json({
      user: user.toSafeJSON(),
      expiresAt: new Date(Date.now() + maxAge).toISOString(),
    });
  } catch (error) {
    console.error("[auth] login failed:", error.message);
    return res.status(500).json({ error: "Login failed" });
  }
}

/** GET /api/auth/me — current authenticated user. */
export async function me(req, res) {
  return res.json({ user: req.user.toSafeJSON() });
}

/**
 * POST /api/auth/register — public self-service sign-up.
 *
 * The role is hard-coded to "member": the request body is never trusted for
 * roles, so nobody can sign their way to admin. The new account is signed in
 * immediately, exactly like a login.
 */
export async function register(req, res) {
  try {
    const { name, email, password } = req.body ?? {};

    const cleanName = typeof name === "string" ? name.trim() : "";
    if (!cleanName || !email || !password) {
      return res.status(400).json({ error: "Name, email and password are required" });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const normalized = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      return res.status(400).json({ error: "Enter a valid email address" });
    }

    const exists = await User.findOne({ email: normalized });
    if (exists) {
      return res.status(409).json({ error: "An account with that email already exists" });
    }

    const user = await User.create({
      name: cleanName,
      email: normalized,
      passwordHash: await bcrypt.hash(String(password), SALT_ROUNDS),
      role: "member", // public sign-up can never create an admin
    });

    user.lastLoginAt = new Date();
    await user.save();

    const token = signToken(user);
    const maxAge = sessionMaxAgeMs();
    res.cookie(SESSION_COOKIE, token, sessionCookieOptions(maxAge));

    return res.status(201).json({
      user: user.toSafeJSON(),
      expiresAt: new Date(Date.now() + maxAge).toISOString(),
    });
  } catch (error) {
    // 11000 = two sign-ups raced on the same email
    if (error?.code === 11000) {
      return res.status(409).json({ error: "An account with that email already exists" });
    }
    console.error("[auth] register failed:", error.message);
    return res.status(500).json({ error: "Could not create the account" });
  }
}

/** POST /api/auth/logout — clears the session cookie. */
export async function logout(_req, res) {
  res.clearCookie(SESSION_COOKIE, clearedCookieOptions());
  return res.json({ message: "Logged out" });
}

/** POST /api/auth/users — admin only, creates an account. */
export async function createUser(req, res) {
  try {
    const { name, email, password, role } = req.body ?? {};

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email and password are required" });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const normalized = String(email).toLowerCase();
    const exists = await User.findOne({ email: normalized });
    if (exists) {
      return res.status(409).json({ error: "An account with that email already exists" });
    }

    const user = await User.create({
      name,
      email: normalized,
      passwordHash: await bcrypt.hash(String(password), SALT_ROUNDS),
      role: role === "admin" ? "admin" : "member",
    });

    return res.status(201).json({ user: user.toSafeJSON() });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

/**
 * GET /api/auth/users — active accounts, for picking project team members.
 * Any signed-in user may see the team directory (name/email/role only);
 * passwords and inactive accounts are never exposed.
 */
export async function listUsers(_req, res) {
  try {
    const users = await User.find({ isActive: true }).sort({ name: 1 }).lean();
    return res.json({
      data: users.map((u) => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        role: u.role,
      })),
      count: users.length,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/** Hash + compare helpers used by the seed script. */
export async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

import "../config/env.js"; // server/.env — works from any working directory
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { User } from "../models/User.js";

/**
 * Generate a JWT for a user without going through HTTP.
 *
 *   npm run token                          -> admin from .env (ADMIN_EMAIL)
 *   npm run token -- jane@clientflow.io
 *   npm run token -- jane@clientflow.io Member123!   (verifies the password)
 *   npm run token -- secret                -> print a fresh JWT_SECRET value
 *       ("secret" rather than "--secret", because npm eats dashed flags)
 *
 * The token is printed raw so it can be pasted straight into
 * `Authorization: Bearer <token>` (curl, Postman, etc.).
 */

const args = process.argv.slice(2);
const wantsSecret = ["secret", "--secret", "new-secret"].includes(args[0]);

if (wantsSecret) {
  const { randomBytes } = await import("node:crypto");
  console.log(randomBytes(48).toString("hex"));
  process.exit(0);
}

const secret = process.env.JWT_SECRET;
if (!secret) {
  console.error("[token] JWT_SECRET is not set in server/.env");
  process.exit(1);
}

const email = (args[0] || process.env.ADMIN_EMAIL || "admin@clientflow.io").toLowerCase();
const password = args[1];

let exitCode = 0;

try {
  await mongoose.connect(
    process.env.MONGO_URI || "mongodb://127.0.0.1:27017/client_project_management"
  );

  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user) {
    console.error(`[token] No user with email "${email}"`);
    exitCode = 1;
  } else if (password !== undefined) {
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      console.error(`[token] Wrong password for ${email}`);
      exitCode = 1;
    }
  }

  if (exitCode === 0) {
    const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
    const token = jwt.sign(
      { sub: user._id.toString(), email: user.email, role: user.role },
      secret,
      { expiresIn }
    );

    const decoded = jwt.verify(token, secret);
    console.log(`user : ${user.email} (${user.role})`);
    console.log(`exp  : ${new Date(decoded.exp * 1000).toISOString()}`);
    console.log("token:");
    console.log(token);
  }
} catch (error) {
  console.error("[token] Failed:", error.message);
  exitCode = 1;
} finally {
  await mongoose.disconnect().catch(() => {});
  process.exit(exitCode);
}

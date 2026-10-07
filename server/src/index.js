import "./config/env.js"; // server/.env — works from any working directory
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db.js";
import introRoutes from "./routes/introRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import clientRoutes from "./routes/clientRoutes.js";

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

app.use(cors({ origin: [CLIENT_URL, "http://localhost:5173"], credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser()); // reads the httpOnly session cookie

app.get("/api/health", (_req, res) =>
  res.json({ status: "ok", service: "client-project-management-api" })
);

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes); // protected
app.use("/api/clients", clientRoutes); // protected
app.use("/api", introRoutes);

app.use((_req, res) => res.status(404).json({ error: "Route not found" }));

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error("[error]", err);
  res.status(500).json({ error: "Internal server error" });
});

async function start() {
  const connected = await connectDB(
    process.env.MONGO_URI || "mongodb://127.0.0.1:27017/client_project_management"
  );

  if (!process.env.JWT_SECRET) {
    console.warn(
      "[auth] JWT_SECRET is missing — login will fail with 500 until it is set.\n" +
        "       Add it to server/.env (generate one: npm run token -- secret)"
    );
  }

  app.listen(PORT, () => {
    console.log(`[server] API running on http://localhost:${PORT}`);
    console.log(`[server] Health check: http://localhost:${PORT}/api/health`);
    console.log(`[server] Intro content: http://localhost:${PORT}/api/intro`);
    console.log(`[server] Login: POST http://localhost:${PORT}/api/auth/login`);
    if (!connected) console.warn("[server] Running WITHOUT database — auth will fail.");
  });
}

start();

import "dotenv/config";
import mongoose from "mongoose";
import { Intro, DEFAULT_INTRO } from "../models/Intro.js";
import { User } from "../models/User.js";
import { Project } from "../models/Project.js";
import { hashPassword } from "../controllers/authController.js";

const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/client_project_management";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@clientflow.io";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin123!";
const ADMIN_NAME = process.env.ADMIN_NAME || "Admin User";

const SAMPLE_PROJECTS = [
  { name: "Acme Rebrand", client: "Acme Corp", status: "in-progress", progress: 62, budget: 24000 },
  { name: "Northwind Website", client: "Northwind LLC", status: "review", progress: 88, budget: 15500 },
  { name: "Globex Mobile App", client: "Globex Inc.", status: "planning", progress: 12, budget: 46000 },
  { name: "Initech Campaign", client: "Initech", status: "delivered", progress: 100, budget: 9800 },
];

async function seed() {
  try {
    await mongoose.connect(uri);
    console.log("[seed] Connected to MongoDB");

    // 1. Intro landing page content
    await Intro.findOneAndUpdate(
      { key: "intro" },
      { $setOnInsert: DEFAULT_INTRO },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`[seed] Intro documents: ${await Intro.countDocuments()}`);

    // 2. Admin account
    let admin = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
    if (!admin) {
      admin = await User.create({
        name: ADMIN_NAME,
        email: ADMIN_EMAIL.toLowerCase(),
        passwordHash: await hashPassword(ADMIN_PASSWORD),
        role: "admin",
      });
      console.log(`[seed] Created admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
    } else {
      console.log(`[seed] Admin already exists: ${ADMIN_EMAIL}`);
    }

    // 3. Sample projects for the admin
    const existing = await Project.countDocuments({ owner: admin._id });
    if (existing === 0) {
      await Project.insertMany(
        SAMPLE_PROJECTS.map((p) => ({
          ...p,
          owner: admin._id,
          dueDate: new Date(Date.now() + (30 + Math.round(Math.random() * 60)) * 86400000),
        }))
      );
      console.log(`[seed] Inserted ${SAMPLE_PROJECTS.length} sample projects`);
    } else {
      console.log(`[seed] Projects already present: ${existing}`);
    }

    console.log("[seed] Done.");
  } catch (error) {
    console.error("[seed] Failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seed();

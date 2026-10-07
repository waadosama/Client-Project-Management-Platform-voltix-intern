import "../config/env.js"; // server/.env — works from any working directory
import mongoose from "mongoose";
import { Intro, DEFAULT_INTRO } from "../models/Intro.js";
import { User } from "../models/User.js";
import { Client } from "../models/Client.js";
import { Project } from "../models/Project.js";
import { hashPassword } from "../controllers/authController.js";

const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/client_project_management";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@clientflow.io";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin123!";
const ADMIN_NAME = process.env.ADMIN_NAME || "Admin User";

// Team member used to demo project assignments (README "Seeded accounts").
const MEMBER_EMAIL = process.env.MEMBER_EMAIL || "jane@clientflow.io";
const MEMBER_PASSWORD = process.env.MEMBER_PASSWORD || "Member123!";
const MEMBER_NAME = process.env.MEMBER_NAME || "Jane Doe";

const SAMPLE_CLIENTS = [
  { name: "Acme Corp", contactName: "Riley Acme", email: "riley@acme.example" },
  { name: "Northwind LLC", contactName: "Avery Northwind", email: "avery@northwind.example" },
  { name: "Globex Inc.", contactName: "Sam Globex", email: "sam@globex.example" },
  { name: "Initech", contactName: "Pat Initech", email: "pat@initech.example" },
];

const SAMPLE_PROJECTS = [
  {
    name: "Acme Rebrand",
    client: "Acme Corp",
    description: "Full identity refresh: logo, palette, voice and launch toolkit.",
    status: "in-progress",
    progress: 62,
    budget: 24000,
    assign: true,
  },
  {
    name: "Northwind Website",
    client: "Northwind LLC",
    description: "Marketing site rebuild with CMS, SEO and analytics.",
    status: "review",
    progress: 88,
    budget: 15500,
    assign: true,
  },
  {
    name: "Globex Mobile App",
    client: "Globex Inc.",
    description: "Cross-platform companion app for field teams.",
    status: "planning",
    progress: 12,
    budget: 46000,
    assign: false,
  },
  {
    name: "Initech Campaign",
    client: "Initech",
    description: "Q3 paid-media campaign, delivered and handed over.",
    status: "delivered",
    progress: 100,
    budget: 9800,
    assign: false,
  },
];

/** Find (or create) a client by case-insensitive name. */
async function ensureClient(name, extra = {}) {
  const trimmed = String(name ?? "").trim();
  if (!trimmed) throw new Error("Cannot create a client without a name");

  const normalizedName = trimmed.toLowerCase();
  const existing = await Client.findOne({ normalizedName }).select("_id");
  if (existing) return existing._id;

  const client = await Client.create({ ...extra, name: trimmed });
  console.log(`[seed] Created client: ${client.name}`);
  return client._id;
}

async function ensureUser({ name, email, password, role }) {
  const normalized = String(email).toLowerCase();
  const existing = await User.findOne({ email: normalized });
  if (existing) {
    console.log(`[seed] ${role} already exists: ${email}`);
    return existing;
  }

  const user = await User.create({
    name,
    email: normalized,
    passwordHash: await hashPassword(password),
    role,
  });
  console.log(`[seed] Created ${role}: ${email} / ${password}`);
  return user;
}

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

    // 2. Accounts
    const admin = await ensureUser({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: "admin",
    });
    const member = await ensureUser({
      name: MEMBER_NAME,
      email: MEMBER_EMAIL,
      password: MEMBER_PASSWORD,
      role: "member",
    });

    // 3. Clients
    for (const client of SAMPLE_CLIENTS) await ensureClient(client.name, client);
    console.log(`[seed] Client documents: ${await Client.countDocuments()}`);

    // 4a. Legacy data fix: older projects stored the client as plain text.
    //     Read the raw collection — Mongoose would cast the string away.
    const rawProjects = await mongoose.connection.db
      .collection("projects")
      .find({ client: { $type: "string" } }, { projection: { _id: 1, client: 1 } })
      .toArray();

    for (const doc of rawProjects) {
      const clientId = await ensureClient(doc.client);
      await mongoose.connection.db
        .collection("projects")
        .updateOne({ _id: doc._id }, { $set: { client: clientId } });
    }
    if (rawProjects.length) {
      console.log(`[seed] Migrated ${rawProjects.length} project(s) to client references`);
    }

    // 4b. Repair projects whose client reference no longer resolves.
    const knownClients = new Set(
      (await Client.find().select("_id").lean()).map((c) => String(c._id))
    );
    const withRefs = await mongoose.connection.db
      .collection("projects")
      .find({ client: { $type: "objectId" } }, { projection: { _id: 1, name: 1, client: 1 } })
      .toArray();

    for (const doc of withRefs) {
      if (knownClients.has(String(doc.client))) continue;
      const sample = SAMPLE_PROJECTS.find((p) => p.name === doc.name);
      if (!sample) continue;
      const clientId = await ensureClient(sample.client);
      await mongoose.connection.db
        .collection("projects")
        .updateOne({ _id: doc._id }, { $set: { client: clientId } });
      console.log(`[seed] Repaired "${doc.name}" → client "${sample.client}"`);
    }

    // 5. Sample projects for the admin
    const existing = await Project.countDocuments({ owner: admin._id });
    if (existing === 0) {
      const rows = [];
      for (const p of SAMPLE_PROJECTS) {
        rows.push({
          owner: admin._id,
          name: p.name,
          description: p.description,
          client: await ensureClient(p.client),
          teamMembers: p.assign ? [member._id] : [],
          status: p.status,
          progress: p.progress,
          budget: p.budget,
          dueDate: new Date(Date.now() + (30 + Math.round(Math.random() * 60)) * 86400000),
        });
      }
      await Project.insertMany(rows);
      console.log(`[seed] Inserted ${rows.length} sample projects`);
    } else {
      console.log(`[seed] Projects already present: ${existing}`);
    }

    // 5b. Top up team assignments missing from older seeds — only when empty,
    //     so re-running the seed never clobbers real assignments.
    for (const p of SAMPLE_PROJECTS) {
      if (!p.assign) continue;
      await mongoose.connection.db.collection("projects").updateMany(
        {
          owner: admin._id,
          name: p.name,
          $or: [{ teamMembers: { $size: 0 } }, { teamMembers: { $exists: false } }],
        },
        { $set: { teamMembers: [member._id] } }
      );
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

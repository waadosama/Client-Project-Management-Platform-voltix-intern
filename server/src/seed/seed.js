import "dotenv/config";
import mongoose from "mongoose";
import { Intro, DEFAULT_INTRO } from "../models/Intro.js";

const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/client_project_management";

async function seed() {
  try {
    await mongoose.connect(uri);
    console.log("[seed] Connected to MongoDB");

    await Intro.findOneAndUpdate(
      { key: "intro" },
      { $setOnInsert: DEFAULT_INTRO },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const count = await Intro.countDocuments();
    console.log(`[seed] Intro documents in collection: ${count}`);
    console.log("[seed] Done.");
  } catch (error) {
    console.error("[seed] Failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seed();

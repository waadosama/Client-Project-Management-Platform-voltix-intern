import mongoose from "mongoose";

/**
 * Connect to MongoDB. The app still boots if the database is unreachable so
 * the intro page can fall back to the built-in default content.
 */
export async function connectDB(uri) {
  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log(`[db] MongoDB connected: ${mongoose.connection.host}`);
    return true;
  } catch (error) {
    console.warn(`[db] MongoDB connection failed: ${error.message}`);
    console.warn("[db] Serving default intro content instead.");
    return false;
  }
}

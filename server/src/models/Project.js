import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    client: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["planning", "in-progress", "review", "delivered"],
      default: "in-progress",
    },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    budget: { type: Number, default: 0 },
    dueDate: { type: Date },
  },
  { timestamps: true }
);

export const Project = mongoose.model("Project", projectSchema);

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
    description: { type: String, trim: true, default: "" },
    /** The client this project belongs to. */
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },
    /** Team members working on the project (many-to-many with User). */
    teamMembers: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },
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

projectSchema.index({ teamMembers: 1 });

export const Project = mongoose.model("Project", projectSchema);

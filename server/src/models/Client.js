import mongoose from "mongoose";

/**
 * A client (company / organisation) that projects are assigned to.
 * Projects reference this collection through `Project.client`.
 */
const clientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    /** lower-cased copy of `name` — keeps "Acme" and "acme" from duplicating. */
    normalizedName: { type: String, trim: true, lowercase: true, select: false },
    contactName: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    notes: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

clientSchema.index({ normalizedName: 1 }, { unique: true, sparse: true });

clientSchema.pre("validate", function (next) {
  if (this.name) this.normalizedName = this.name.trim().toLowerCase();
  next();
});

export const Client = mongoose.model("Client", clientSchema);

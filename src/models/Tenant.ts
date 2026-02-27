import mongoose, { Schema } from "mongoose";

const TenantSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ["active", "suspended", "deleted"],
      default: "active",
    },
    deletedAt: Date,
    plan: {
      type: String,
      enum: ["free", "pro", "enterprise"],
      default: "free",
    },
  },
  { timestamps: true },
);

TenantSchema.index({ slug: 1 }, { unique: true });

export const Tenant =
  mongoose.models.Tenant || mongoose.model("Tenant", TenantSchema);

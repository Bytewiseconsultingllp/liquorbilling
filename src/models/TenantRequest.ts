import mongoose, { Schema } from "mongoose"

const TenantRequestSchema = new Schema(
  {
    companyName: String,
    requestedSlug: { type: String, unique: true },
    requestedByEmail: String,
    passwordHash: String,
    phone: String,
    address: String,
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    rejectionReason: String,
    reviewedBy: { type: Schema.Types.ObjectId },
    reviewedAt: Date,
  },
  { timestamps: true }
)

export const TenantRequest =
  mongoose.models.TenantRequest ||
  mongoose.model("TenantRequest", TenantRequestSchema)
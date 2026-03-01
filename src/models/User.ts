import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    employmentType: {
      type: String,
      enum: ["employee", "non-employee"],
      default: "employee",
    },

    salary: {
      type: Number,
      default: 0,
    },

    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: false, // platform admin has none
      index: true,
    },

    role: {
      type: String,
      enum: ["owner", "admin", "manager", "sales", "accountant", "tax_officer"],
      default: "sales",
    },

    isPlatformAdmin: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["active", "disabled", "deleted"],
      default: "active",
    },

    deletedAt: Date,

  },
  { timestamps: true },
);
userSchema.index({ tenantId: 1, email: 1 });
export const User = mongoose.models.User || mongoose.model("User", userSchema);

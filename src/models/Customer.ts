import mongoose from "mongoose"

const customerSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },

    name: { type: String, required: true, index: true },

    type: {
      type: String,
      enum: ["Retail", "Wholesale", "Walk-In", "B2B"],
      required: true,
    },

    contactInfo: {
      phone: String,
      email: String,
      address: String,
      gstin: String,
    },

    maxDiscountPercentage: Number,

    walletBalance: {
      type: Number,
      default: 0,
    },

    creditLimit: {
      type: Number,
      default: 0,
    },

    outstandingBalance: {
      type: Number,
      default: 0,
    },

    lastTransactionDate: Date,
    openingBalance: Number,

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    notes: String,

    // Soft delete
    status: {
      type: String,
      enum: ["active", "deleted"],
      default: "active",
      index: true,
    },

    deletedAt: Date,
  },
  { timestamps: true }
)

customerSchema.index({ organizationId: 1, name: 1 })
customerSchema.index({ organizationId: 1, "contactInfo.phone": 1 })

export const Customer =
  mongoose.models.Customer ||
  mongoose.model("Customer", customerSchema)
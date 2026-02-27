import mongoose from "mongoose"

const bankDetailsSchema = new mongoose.Schema(
  {
    accountName: String,
    accountNumber: String,
    bankName: String,
    ifscCode: String,
  },
  { _id: false }
)

const contactInfoSchema = new mongoose.Schema(
  {
    phone: String,
    email: String,
    address: String,
  },
  { _id: false }
)

const vendorSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },

    name: { type: String, required: true, index: true },
    tin: { type: String, required: true },
    cin: String,
    gstin: String,

    contactPerson: String,
    email: String,
    phone: String,
    address: String,
    city: String,
    state: String,
    pincode: String,

    contactInfo: contactInfoSchema,

    paymentTerms: String,
    bankDetails: bankDetailsSchema,

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    notes: String,

    priority: {
      type: Number,
      required: true,
    },

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

// UNIQUE PRIORITY PER TENANT
vendorSchema.index(
  { organizationId: 1, priority: 1 },
  { unique: true }
)

export const Vendor =
  mongoose.models.Vendor ||
  mongoose.model("Vendor", vendorSchema)
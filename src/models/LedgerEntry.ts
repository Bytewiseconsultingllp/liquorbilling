import mongoose from "mongoose"

const ledgerEntrySchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tenant",
    required: true,
    index: true,
  },

  entityType: {
    type: String,
    enum: ["customer", "vendor"],
    required: true,
  },

  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },

  referenceType: {
    type: String,
    enum: [
      "sale",
      "sale_return",
      "purchase",
      "purchase_return",
      "payment",
      "closing_adjustment",
    ],
  },

  referenceId: mongoose.Schema.Types.ObjectId,

  debit: {
    type: Number,
    default: 0,
  },

  credit: {
    type: Number,
    default: 0,
  },

  balanceAfter: Number,

  description: String,

}, { timestamps: true })

export const LedgerEntry =
  mongoose.models.LedgerEntry ||
  mongoose.model("LedgerEntry", ledgerEntrySchema)
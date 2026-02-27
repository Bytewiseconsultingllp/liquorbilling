import mongoose from "mongoose"

const cashbookSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tenant",
    required: true,
  },

  date: {
    type: Date,
    required: true,
    index: true,
  },

  sourceType: {
    type: String,
    enum: ["sale", "purchase", "closing"],
  },

  referenceId: mongoose.Schema.Types.ObjectId,

  cashIn: {
    type: Number,
    default: 0,
  },

  cashOut: {
    type: Number,
    default: 0,
  },

  onlineIn: {
    type: Number,
    default: 0,
  },

  onlineOut: {
    type: Number,
    default: 0,
  },

  description: String,

}, { timestamps: true })

export const CashbookEntry =
  mongoose.models.CashbookEntry ||
  mongoose.model("CashbookEntry", cashbookSchema)
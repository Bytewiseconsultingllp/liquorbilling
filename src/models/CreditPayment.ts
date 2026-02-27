import mongoose from "mongoose"

const creditPaymentSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tenant",
    required: true,
  },

  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
  },

  amount: {
    type: Number,
    required: true,
  },

  cashAmount: {
    type: Number,
    default: 0,
  },

  onlineAmount: {
    type: Number,
    default: 0,
  },

  note: String,

  creditDate: {
    type: Date,
    default: Date.now,
  },

  status: {
    type: String,
    enum: ["active", "cancelled"],
    default: "active",
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

}, { timestamps: true })

export const CreditPayment =
  mongoose.models.CreditPayment ||
  mongoose.model("CreditPayment", creditPaymentSchema)
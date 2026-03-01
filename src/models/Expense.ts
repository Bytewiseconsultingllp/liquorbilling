import mongoose from "mongoose"

/* ─── Category Schema ─── */
const expenseCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
)

expenseCategorySchema.index({ name: 1, organizationId: 1 }, { unique: true })

/* ─── Expense Schema ─── */
const expenseSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    expenseNumber: { type: String, required: true, trim: true },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExpenseCategory",
      required: true,
    },
    categoryName: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    description: { type: String, trim: true },
    expenseDate: { type: Date, required: true, default: Date.now },
    paymentMode: {
      type: String,
      enum: ["Cash", "Online", "Credit", "Cheque"],
      required: true,
    },
    transactionId: { type: String, trim: true },
    receiptUrl: { type: String, trim: true },
    notes: { type: String, trim: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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

expenseSchema.index({ organizationId: 1, expenseDate: -1 })
expenseSchema.index({ organizationId: 1, expenseNumber: 1 }, { unique: true })
expenseSchema.index({ categoryId: 1 })
expenseSchema.index({ paymentMode: 1 })

export const ExpenseCategory =
  mongoose.models.ExpenseCategory ||
  mongoose.model("ExpenseCategory", expenseCategorySchema)

export const Expense =
  mongoose.models.Expense || mongoose.model("Expense", expenseSchema)

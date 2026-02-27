import mongoose from "mongoose"

const stockClosingItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productName: String,
    morningStock: Number,
    purchases: Number,
    sales: Number,
    systemStock: Number,
    closingStock: Number,
    physicalStock: Number,
    difference: Number,
    discrepancy: Number,
    discrepancyValue: Number,
  },
  { _id: false }
)

const stockClosingSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },

    closingDate: {
      type: Date,
      required: true,
      index: true,
    },

    items: [stockClosingItemSchema],

    totalDifferenceValue: Number,

    saleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sale",
    },

    cashAmount: Number,
    onlineAmount: Number,
  },
  { timestamps: true }
)

export const StockClosing =
  mongoose.models.StockClosing ||
  mongoose.model("StockClosing", stockClosingSchema)
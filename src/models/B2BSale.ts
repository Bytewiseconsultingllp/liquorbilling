import mongoose from "mongoose"

const b2bSaleItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productName: String,
    brand: String,
    volumeML: Number,
    bottlesPerCaret: Number,
    carets: { type: Number, default: 0 },
    bottles: { type: Number, default: 0 },
    totalBottles: Number,
    purchasePricePerCaret: Number,
    amount: Number,
  },
  { _id: false }
)

const b2bSaleSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },

    saleNumber: {
      type: String,
      required: true,
      unique: true,
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },
    customerName: String,
    saleDate: Date,

    items: [b2bSaleItemSchema],

    subtotal: Number,

    // Tax
    vatRate: { type: Number, default: 35 },
    vatAmount: { type: Number, default: 0 },
    tcsRate: { type: Number, default: 1 },
    tcsAmount: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },

    totalAmount: Number,

    paymentStatus: {
      type: String,
      enum: ["pending", "partial", "paid"],
      default: "pending",
    },

    paidAmount: Number,
    dueAmount: Number,

    paymentMode: {
      type: String,
      enum: ["cash", "credit"],
      default: "cash",
    },
    cashAmount: { type: Number, default: 0 },
    onlineAmount: { type: Number, default: 0 },
    creditAmount: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ["active", "voided"],
      default: "active",
    },

    createdBy: String,
  },
  { timestamps: true }
)

export const B2BSale =
  mongoose.models.B2BSale || mongoose.model("B2BSale", b2bSaleSchema)

import mongoose from "mongoose"

const purchaseItemSchema = new mongoose.Schema(
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
    totalBottles: Number, // carets * bottlesPerCaret + bottles
    purchasePricePerCaret: Number,
    amount: Number, // carets * purchasePricePerCaret
  },
  { _id: false }
)

const purchaseSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },

    purchaseNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },

    vendorName: String,
    purchaseDate: Date,

    items: [purchaseItemSchema],

    subtotal: Number,
    vatRate: { type: Number, default: 35 },
    vatAmount: Number,
    tcsRate: { type: Number, default: 1 },
    tcsAmount: Number,
    taxAmount: Number, // vatAmount + tcsAmount
    totalAmount: Number, // subtotal + taxAmount

    paymentStatus: {
      type: String,
      enum: ["pending", "partial", "paid"],
      default: "pending",
    },

    paidAmount: Number,
    dueAmount: Number,

    notes: String,
    invoiceNumber: String,

    isReturned: { type: Boolean, default: false },
    returnedAt: Date,
    returnedBy: String,

    createdBy: String,
  },
  { timestamps: true }
)

export const Purchase =
  mongoose.models.Purchase ||
  mongoose.model("Purchase", purchaseSchema)
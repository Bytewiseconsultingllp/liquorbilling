import mongoose from "mongoose";

const vendorAllocationSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
    vendorName: String,
    quantity: Number,
  },
  { _id: false },
);

const saleItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    productName: String,

    quantity: Number,
    pricePerUnit: Number,

    // 🔥 NEW FIELDS
    discountType: {
      type: String,
      enum: ["percentage", "amount"],
      default: "percentage",
    },

    discountValue: {
      type: Number,
      default: 0,
    },

    discountAmount: {
      type: Number,
      default: 0,
    },

    totalAmount: Number,

    vendorAllocations: [vendorAllocationSchema],
  },
  { _id: false },
);

const subBillItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productName: String,
    quantity: Number,
    pricePerUnit: Number,
    discountType: {
      type: String,
      enum: ["percentage", "amount"],
      default: "percentage",
    },
    discountValue: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    totalAmount: Number,
  },
  { _id: false },
);

const subBillSchema = new mongoose.Schema(
  {
    items: [subBillItemSchema],
    subTotalAmount: Number,
    totalDiscountAmount: Number,
    totalAmount: Number,
    paymentMode: {
      type: String,
      enum: ["cash", "credit"],
      default: "cash",
    },
    cashPaidAmount: { type: Number, default: 0 },
    onlinePaidAmount: { type: Number, default: 0 },
    creditPaidAmount: { type: Number, default: 0 },
  },
  { _id: false },
);

const saleSchema = new mongoose.Schema(
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

    items: [saleItemSchema],

    subBills: [subBillSchema],

    subtotal: Number,
    taxAmount: Number,
    totalAmount: Number,

    // 🔥 NEW FIELDS
    billDiscountAmount: {
      type: Number,
      default: 0,
    },

    totalDiscount: {
      type: Number,
      default: 0,
    },

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

    type: {
      type: String,
      enum: ["sale", "return", "adjustment"],
      default: "sale",
    },

    referenceSaleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sale",
    },

    isReturned: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["active", "voided"],
      default: "active",
    },

    createdBy: String,
  },
  { timestamps: true },
);

export const Sale = mongoose.models.Sale || mongoose.model("Sale", saleSchema);

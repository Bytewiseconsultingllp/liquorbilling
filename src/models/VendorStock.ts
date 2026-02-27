import mongoose from "mongoose"

const vendorStockSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },

    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
      index: true,
    },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },

    productName: String,
    brand: String,
    volumeML: Number,

    currentStock: {
      type: Number,
      default: 0,
    },

    lastPurchasePrice: Number,
    lastPurchaseDate: Date,
  },
  { timestamps: true }
)

vendorStockSchema.index(
  { organizationId: 1, vendorId: 1, productId: 1 },
  { unique: true }
)

export const VendorStock =
  mongoose.models.VendorStock ||
  mongoose.model("VendorStock", vendorStockSchema)
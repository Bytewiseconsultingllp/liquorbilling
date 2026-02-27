import mongoose from "mongoose"

const purchasePriceSchema = new mongoose.Schema(
  {
    purchasePrice: { type: Number, required: true },
    batchNumber: String,
    effectiveFrom: { type: Date, required: true },
    effectiveTo: Date,
  },
  { timestamps: true }
)

const barcodeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true },
    createdBy: String,
  },
  { timestamps: true }
)

const taxInfoSchema = new mongoose.Schema(
  {
    vat: Number,
    tcs: Number,
    gst: Number,
    cess: Number,
  },
  { _id: false }
)

const productSchema = new mongoose.Schema(
  {
    // Tenant isolation
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },

    // Basic Info
    name: { type: String, required: true, index: true },
    description: String,
    imageUrl: String,
    imageBase64: String,
    imageMimeType: String,
    sku: { type: String, index: true },
    barcodes: [barcodeSchema],
    brand: { type: String, index: true },
    category: { type: String, index: true },

    // Inventory
    currentStock: { type: Number, default: 0 },
    volumeML: { type: Number, required: true },
    reorderLevel: Number,
    morningStock: Number,
    morningStockLastUpdatedDate: Date,
    eveningStock: Number,

    // Pricing
    pricePerUnit: { type: Number, required: true },
    purchasePricePerUnit: [purchasePriceSchema],

    // Tax
    taxInfo: taxInfoSchema,

    // Batch
    batchNumber: String,
    expiryDate: Date,

    // Box Mapping
    bottlesPerCaret: Number,
    noOfCarets: Number,
    noOfBottlesPerCaret: Number,
    purchasePricePerCaret: Number,

    // Status
    isActive: { type: Boolean, default: true },
    location: String,

    // Soft delete
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

productSchema.index({ organizationId: 1, name: 1 })
productSchema.index({ organizationId: 1, sku: 1 })

export const Product =
  mongoose.models.Product ||
  mongoose.model("Product", productSchema)
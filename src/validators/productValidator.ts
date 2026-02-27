import { z } from "zod"

export const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  brand: z.string().min(1, "Brand is required"),
  category: z.string().min(1, "Category is required"),
  volumeML: z.number().positive("Volume must be greater than 0"),
  pricePerUnit: z.number().positive("Price must be greater than 0"),
  currentStock: z.number().min(0, "Stock cannot be negative"),
  bottlesPerCaret: z.number().int().min(1, "Must be at least 1").optional(),
  reorderLevel: z.number().int().min(0, "Cannot be negative").optional(),
  purchasePricePerCaret: z.number().min(0, "Cannot be negative").optional(),
  imageUrl: z.string().url().optional(),
})

export const updateProductSchema = z.object({
  name: z.string().min(1, "Product name is required").optional(),
  brand: z.string().min(1, "Brand is required").optional(),
  category: z.string().min(1, "Category is required").optional(),
  volumeML: z.number().positive("Volume must be greater than 0").optional(),
  pricePerUnit: z.number().positive("Price must be greater than 0").optional(),
  currentStock: z.number().min(0, "Stock cannot be negative").optional(),
  bottlesPerCaret: z.number().int().min(1).optional(),
  reorderLevel: z.number().int().min(0).optional(),
  purchasePricePerCaret: z.number().min(0).optional(),
})

export const bulkProductSchema = z.array(
  z.object({
    name: z.string().min(1),
    brand: z.string().min(1),
    category: z.string().min(1),
    volumeML: z.coerce.number().positive(),
    pricePerUnit: z.coerce.number().positive(),
    currentStock: z.coerce.number().min(0),
    bottlesPerCaret: z.coerce.number().int().min(1).optional(),
    reorderLevel: z.coerce.number().int().min(0).optional(),
    purchasePricePerCaret: z.coerce.number().min(0).optional(),
    barcodes: z.string().optional(),
    imageUrl: z.string().optional(),
    morningStock: z.coerce.number().min(0).optional(),
    morningStockLastUpdatedDate: z.string().optional(),
  })
)
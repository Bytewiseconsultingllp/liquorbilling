import { z } from "zod"

export const createCustomerSchema = z.object({
  name: z.string().min(1, "Customer name is required"),

  type: z.enum(["Retail", "Wholesale", "B2B"], { required_error: "Customer type is required" }),

  contactInfo: z.object({
    phone: z.string().min(1, "Phone is required"),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    address: z.string().optional(),
    gstin: z.string().optional(),
  }),

  maxDiscountPercentage: z.number().min(0).max(100).optional(),

  creditLimit: z.number().min(0, "Cannot be negative").max(1000000, "Credit limit cannot exceed ₹10,00,000").optional(),

  openingBalance: z.number().min(0, "Cannot be negative").optional(),

  notes: z.string().optional(),
})

export const updateCustomerSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(["Retail", "Wholesale", "B2B"]).optional(),
  contactInfo: z.object({
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    address: z.string().optional(),
    gstin: z.string().optional(),
  }).optional(),
  maxDiscountPercentage: z.number().min(0).max(100).optional(),
  creditLimit: z.number().min(0).max(1000000).optional(),
  openingBalance: z.number().min(0).optional(),
  notes: z.string().optional(),
})

export const bulkCustomerSchema = z.array(
  z.object({
    name: z.string().min(1),
    type: z.enum(["Retail", "Wholesale", "B2B"]),
    phone: z.string().min(1),
    email: z.string().optional(),
    address: z.string().optional(),
    gstin: z.string().optional(),
    creditLimit: z.coerce.number().min(0).max(1000000).optional(),
    maxDiscountPercentage: z.coerce.number().min(0).max(100).optional(),
    openingBalance: z.coerce.number().min(0).optional(),
    notes: z.string().optional(),
  })
)
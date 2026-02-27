import { z } from "zod"

export const createVendorSchema = z.object({
  name: z.string().min(1, "Vendor name is required"),
  tin: z.string().min(1, "TIN is required"),
  cin: z.string().optional(),
  gstin: z.string().optional(),
  priority: z.number().int().min(1, "Priority must be at least 1"),
  contactPerson: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  bankDetails: z.object({
    accountName: z.string().optional(),
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
    ifscCode: z.string().optional(),
  }).optional(),
})

export const updateVendorSchema = z.object({
  name: z.string().min(1).optional(),
  tin: z.string().min(1).optional(),
  cin: z.string().optional(),
  gstin: z.string().optional(),
  priority: z.number().int().min(1).optional(),
  contactPerson: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  bankDetails: z.object({
    accountName: z.string().optional(),
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
    ifscCode: z.string().optional(),
  }).optional(),
})

export const bulkVendorSchema = z.array(
  z.object({
    name: z.string().min(1),
    tin: z.string().min(1),
    cin: z.string().optional(),
    gstin: z.string().optional(),
    priority: z.coerce.number().int().min(1),
    contactPerson: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    bankAccountName: z.string().optional(),
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
    ifscCode: z.string().optional(),
  })
)

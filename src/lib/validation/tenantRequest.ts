import { z } from "zod"

export const tenantRequestSchema = z.object({
  companyName: z.string().min(2),
  slug: z
    .string()
    .min(3)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase and URL safe"),
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
  address: z.string().optional(),
})
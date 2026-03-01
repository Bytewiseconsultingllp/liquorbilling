import { z } from "zod"

export const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["owner", "admin", "manager", "sales", "accountant", "tax_officer"], { required_error: "Role is required" }),
  employmentType: z.enum(["employee", "non-employee"], { required_error: "Employment type is required" }),
  salary: z.number().min(0, "Salary cannot be negative").optional(),
}).refine(data => {
  if (data.employmentType === "employee" && (!data.salary || data.salary <= 0)) return false
  return true
}, { message: "Salary is required for employees", path: ["salary"] })

export const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email address").optional(),
  role: z.enum(["owner", "admin", "manager", "sales", "accountant", "tax_officer"]).optional(),
  employmentType: z.enum(["employee", "non-employee"]).optional(),
  salary: z.number().min(0, "Salary cannot be negative").optional(),
  status: z.enum(["active", "disabled"]).optional(),
})

export const bulkUserSchema = z.array(
  z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.enum(["owner", "admin", "manager", "sales", "accountant", "tax_officer"]),
    employmentType: z.enum(["employee", "non-employee"]),
    salary: z.coerce.number().min(0).optional(),
  })
)
import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email?: string | null
      isPlatformAdmin?: boolean
      tenantId?: string | null
      tenantSlug?: string | null
      role?: "owner" | "admin" | "manager" | "sales" | "accountant" | "tax_officer"
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    email?: string | null
    isPlatformAdmin?: boolean
    tenantId?: string | null
    tenantSlug?: string | null
    role?: "owner" | "admin" | "manager" | "sales" | "accountant" | "tax_officer"
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    isPlatformAdmin?: boolean
    tenantId?: string | null
    tenantSlug?: string | null
    role?: "owner" | "admin" | "manager" | "sales" | "accountant" | "tax_officer"
  }
}
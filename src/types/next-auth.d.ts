import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email?: string | null
      isPlatformAdmin?: boolean
      tenantId?: string | null
      tenantSlug?: string | null
      role?: "owner" | "admin" | "member"
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    email?: string | null
    isPlatformAdmin?: boolean
    tenantId?: string | null
    tenantSlug?: string | null
    role?: "owner" | "admin" | "member"
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    isPlatformAdmin?: boolean
    tenantId?: string | null
    tenantSlug?: string | null
    role?: "owner" | "admin" | "member"
  }
}
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectDB } from "@/db/connection";
import { User } from "@/models/User";
import bcrypt from "bcrypt";
import { Tenant } from "@/models/Tenant";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },

  // cookies: {
  //   sessionToken: {
  //     name: "next-auth.session-token",
  //     options: {
  //       httpOnly: true,
  //       sameSite: "lax",
  //       path: "/",
  //       secure: process.env.NODE_ENV === "production",
  //       domain:
  //         process.env.NODE_ENV === "production"
  //           ? process.env.VERCEL === "1"
  //             ? ".vercel.app"
  //             : ".liquorbilling.in"
  //           : undefined,
  //     },
  //   },
  // },

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        await connectDB();

        const user = await User.findOne({
          email: credentials.email,
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash,
        );

        console.log("User:", user);
        console.log("Password match:", isValid);
        if (!isValid) return null;

        const tenant = user.tenantId
          ? await Tenant.findById(user.tenantId)
          : null;

        return {
          id: user._id.toString(),
          email: user.email,
          isPlatformAdmin: user.isPlatformAdmin,
          tenantId: user.tenantId?.toString() ?? null,
          tenantSlug: tenant?.slug ?? null,
          role: user.role, // ← ADD THIS
        };
      },
    }),
  ],

  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.isPlatformAdmin = token.isPlatformAdmin as boolean;
        session.user.tenantId = token.tenantId as string | null;
        session.user.tenantSlug = token.tenantSlug as string | null;
        session.user.role = token.role as "owner" | "admin" | "member";
      }

      return session;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isPlatformAdmin = user.isPlatformAdmin;
        token.tenantId = user.tenantId;
        token.tenantSlug = user.tenantSlug;
        token.role = user.role; // ← ADD THIS
      }

      return token;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

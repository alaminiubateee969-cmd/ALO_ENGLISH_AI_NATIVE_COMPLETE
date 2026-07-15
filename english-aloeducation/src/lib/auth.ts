import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { getServerSession as getServerSessionInner } from "next-auth";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

/**
 * NextAuth configuration for the English.ALOEducation Web_CRM.
 *
 * - Uses the Prisma adapter for persistent sessions/accounts.
 * - Credentials (email + password) verified against the User table
 *   with bcryptjs.
 * - The user's `role` is propagated into the JWT token and the
 *   session callback so middleware / server components can enforce
 *   role-based access control.
 */
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        if (user.status !== "active") {
          throw new Error("Account is not active. Please contact support.");
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        // Track last login timestamp.
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        } as {
          id: string;
          email: string;
          name: string;
          role: string;
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // `user` is the object returned from `authorize`.
        const u = user as { id: string; role: string };
        token.id = u.id;
        token.role = u.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? session.user.id;
        session.user.role = (token.role as string) ?? session.user.role;
      }
      return session;
    },
  },
};

/**
 * Re-exported `getServerSession` with our auth options baked in so
 * route handlers / server components can do:
 *   import { getServerSession } from "@/lib/auth";
 *   const session = await getServerSession();
 */
export async function getServerSession() {
  return getServerSessionInner(authOptions);
}

/**
 * Augment the NextAuth types so `session.user.role` and
 * `session.user.id` are typed throughout the app.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
  }
}

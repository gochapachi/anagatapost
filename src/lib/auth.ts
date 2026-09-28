import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { env } from "./env";
import { store } from "./db";
import { Role } from "./types";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login",
  },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    CredentialsProvider({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "name@company.in" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter both email and password");
        }

        const normalizedEmail = credentials.email.toLowerCase().trim();
        const user = await store.findUserByEmail(normalizedEmail);

        if (!user) {
          throw new Error("No account found with this email");
        }

        if (user.password) {
          const isValid = await bcrypt.compare(credentials.password, user.password);
          if (!isValid) {
            throw new Error("Invalid password");
          }
        }

        // Fire-and-forget before the session is issued: a failed audit write must
        // not lock a user out of their own account.
        void store.logAudit("USER_LOGIN", `User ${user.email} logged in`, user.id);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          balancePaise: user.balancePaise,
          company: user.company,
          gstin: user.gstin,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || "USER";
        token.balancePaise = (user as any).balancePaise || 50000;
        token.company = (user as any).company || null;
        token.gstin = (user as any).gstin || null;
      }
      if (trigger === "update" && session) {
        if (session.balancePaise !== undefined) token.balancePaise = session.balancePaise;
        if (session.role) token.role = session.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id as string;
        // ADMIN_EMAILS keeps working as an emergency bootstrap for the first
        // operator before roles live in Postgres (PR-1).
        const email = session.user.email?.toLowerCase().trim();
        const isAdmin = email !== undefined && env.adminEmails.includes(email);
        (session.user as any).role = isAdmin
          ? "ADMIN"
          : ((token.role as Role) || "USER");
        (session.user as any).balancePaise = (token.balancePaise as number) || 50000;
        (session.user as any).company = token.company as string | null;
        (session.user as any).gstin = token.gstin as string | null;
      }
      return session;
    },
  },
  // `env` refuses to boot production without NEXTAUTH_SECRET; the repository
  // previously shipped a hard-coded signing key, which let anyone forge sessions.
  secret: env.nextauthSecret,
};

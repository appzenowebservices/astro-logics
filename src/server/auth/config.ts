import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { timingSafeEqual } from "node:crypto";
import { db } from "~/server/db";
import { PrismaAdapter } from "@auth/prisma-adapter";

/**
 * Constant-time comparison for the environment-backed admin credentials.
 */
function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/**
 * Verifies a supplied password against the stored hash.
 *
 * Legacy accounts created before hashing was wired up stored the placeholder
 * `hashed_<plaintext>`; those are accepted once so existing users can still
 * sign in, and are migrated to a bcrypt hash on their next registration.
 */
async function verifyPassword(
  stored: string | null,
  supplied: string,
): Promise<boolean> {
  if (!stored) return false;
  if (stored.startsWith("hashed_")) {
    return stored === `hashed_${supplied}`;
  }
  return compare(supplied, stored);
}

export const authConfig = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        mobile: { label: "Email or mobile", type: "text" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        const identifier = credentials?.mobile?.trim().toLowerCase();
        const password = credentials?.password;

        if (!identifier || !password) return null;

        const user = await db.user.findFirst({
          where: {
            OR: [{ email: identifier }, { mobile: identifier }],
          },
        });

        if (!user || !user.passwordHash) return null;
        if (!(await verifyPassword(user.passwordHash, password))) return null;
        if (user.status === "SUSPENDED" || user.isDeleted) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
        };
      },
    }),
    /**
     * Environment-backed administrator login.
     *
     * Credentials live in ADMIN_EMAIL / ADMIN_PASSWORD (server-only, never
     * NEXT_PUBLIC_*). On success the matching database user is created or
     * promoted to ADMIN so the rest of the RBAC layer keeps working from the
     * database, not from the env.
     */
    CredentialsProvider({
      id: "admin-credentials",
      name: "Administrator",
      credentials: {
        email: { label: "Admin email", type: "email" },
        password: { label: "Admin password", type: "password" },
      },

      async authorize(credentials) {
        const envEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
        const envPassword = process.env.ADMIN_PASSWORD;

        // No env credentials configured -> the route is unusable.
        if (!envEmail || !envPassword) return null;

        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;
        if (!email || !password) return null;

        const emailOk = safeEqual(email, envEmail);
        const passwordOk = safeEqual(password, envPassword);
        if (!emailOk || !passwordOk) return null;

        let user = await db.user.findUnique({ where: { email: envEmail } });

        if (!user) {
          user = await db.user.create({
            data: {
              name: "Administrator",
              email: envEmail,
              role: "ADMIN",
              plan: "ENTERPRISE",
              status: "ACTIVE",
            },
          });
        } else if (
          user.role !== "ADMIN" ||
          user.status !== "ACTIVE" ||
          user.isDeleted
        ) {
          user = await db.user.update({
            where: { id: user.id },
            data: { role: "ADMIN", status: "ACTIVE", isDeleted: false },
          });
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
        };
      },
    }),
  ],
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt", // 👈 forces JWT sessions instead of DB
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.mobile = user.mobile;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.mobile = token.mobile as string;
      }
      return session;
    },
  },
};

import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "~/server/db";
import { PrismaAdapter } from "@auth/prisma-adapter";

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

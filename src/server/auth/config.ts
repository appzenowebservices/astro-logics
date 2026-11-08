import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { timingSafeEqual } from "node:crypto";
import { db } from "~/server/db";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Adapter } from "next-auth/adapters";

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

const googleId = process.env.GOOGLE_CLIENT_ID;
const googleSecret = process.env.GOOGLE_CLIENT_SECRET;

/**
 * Environment-backed administrator authentication. Shared by the dedicated
 * `/admin/login` provider and the member sign-in form so the admin can enter
 * through either door.
 */
async function authorizeEnvAdmin(email: string, password: string) {
  const envEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const envPassword = process.env.ADMIN_PASSWORD;
  if (!envEmail || !envPassword) return null;

  if (!safeEqual(email, envEmail) || !safeEqual(password, envPassword)) {
    return null;
  }

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

  return { id: user.id, name: user.name, email: user.email };
}

/**
 * Auth.js speaks `image` (profile picture URL) and `emailVerified: Date | null`,
 * while this database stores the picture as `avatar` and verification as a
 * boolean. Translate at the adapter boundary so the rest of the app and the
 * existing rows keep their shape.
 */
const prismaAdapter = PrismaAdapter(db);

const adapter: Adapter = {
  ...prismaAdapter,

  createUser: async (profile) => {
    const user = await db.user.create({
      data: {
        name:
          profile.name ?? profile.email.split("@")[0] ?? "Kaalvanta member",
        email: profile.email,
        image: profile.image ?? null,
        avatar: profile.image ?? null,
        emailVerified: Boolean(profile.emailVerified),
      },
    });

    return {
      ...user,
      emailVerified: user.emailVerified ? new Date() : null,
    };
  },

  updateUser: async (profile) => {
    const user = await db.user.update({
      where: { id: profile.id },
      data: {
        ...(profile.name != null ? { name: profile.name } : {}),
        ...(profile.email != null ? { email: profile.email } : {}),
        ...(profile.image !== undefined
          ? { image: profile.image, avatar: profile.image }
          : {}),
        ...(profile.emailVerified !== undefined
          ? { emailVerified: Boolean(profile.emailVerified) }
          : {}),
      },
    });

    return {
      ...user,
      emailVerified: user.emailVerified ? new Date() : null,
    };
  },
};

export const authConfig = {
  providers: [
    ...(googleId && googleSecret
      ? [
          GoogleProvider({
            clientId: googleId,
            clientSecret: googleSecret,
            // Link a Google identity to an existing password account with the
            // same verified email instead of erroring with OAuthAccountNotLinked.
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    /**
     * Google Identity Services token flow.
     *
     * The browser obtains a short-lived Google access token via
     * `google.accounts.oauth2` (no client secret involved) and posts it here.
     * We verify it with Google's tokeninfo endpoint and confirm it was issued
     * to our client before creating or refreshing the local user.
     */
    CredentialsProvider({
      id: "google-token",
      name: "Google",
      credentials: {
        accessToken: { label: "Google access token", type: "text" },
      },

      async authorize(credentials) {
        const accessToken = credentials?.accessToken;
        if (!accessToken) return null;

        try {
          const response = await fetch(
            `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`,
            { cache: "no-store" },
          );
          if (!response.ok) return null;

          const info = (await response.json()) as {
            aud?: string;
            email?: string;
            email_verified?: string | boolean;
            name?: string;
            picture?: string;
          };

          if (!info.email || info.aud !== process.env.GOOGLE_CLIENT_ID) {
            return null;
          }
          if (
            info.email_verified !== true &&
            info.email_verified !== "true"
          ) {
            return null;
          }

          const email = info.email.toLowerCase();
          let user = await db.user.findUnique({ where: { email } });

          if (user && (user.status === "SUSPENDED" || user.isDeleted)) {
            return null;
          }

          if (!user) {
            user = await db.user.create({
              data: {
                name: info.name?.trim() || email.split("@")[0] || "Kaalvanta member",
                email,
                image: info.picture ?? null,
                avatar: info.picture ?? null,
                emailVerified: true,
                status: "ACTIVE",
              },
            });
          } else if (info.picture && user.avatar !== info.picture) {
            user = await db.user.update({
              where: { id: user.id },
              data: { image: info.picture, avatar: info.picture },
            });
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image ?? undefined,
          };
        } catch {
          return null;
        }
      },
    }),
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

        // Administrators can sign in from the member form too; the env
        // credentials take precedence over a (possibly absent) DB password.
        const admin = await authorizeEnvAdmin(identifier, password);
        if (admin) return admin;

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
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;
        if (!email || !password) return null;

        return authorizeEnvAdmin(email, password);
      },
    }),
  ],
  adapter,
  session: {
    strategy: "jwt", // 👈 forces JWT sessions instead of DB
  },
  callbacks: {
    async signIn({ user }) {
      const email = user.email?.toLowerCase();
      if (!email) return false;

      const existing = await db.user.findUnique({
        where: { email },
        select: { status: true, isDeleted: true },
      });

      // Suspended or deleted accounts cannot sign in through any provider.
      if (existing && (existing.status === "SUSPENDED" || existing.isDeleted)) {
        return false;
      }

      return true;
    },

    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.mobile = user.mobile;

        // The adapter only writes the profile picture when it creates the
        // account. Persist it on every OAuth sign-in so the admin roster and
        // API responses can render the avatar too.
        if (account && user.image) {
          try {
            await db.user.update({
              where: { id: user.id },
              data: { image: user.image, avatar: user.image },
            });
          } catch {
            /* non-fatal — never block a valid sign-in on a profile write */
          }
          token.picture = user.image;
        }
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

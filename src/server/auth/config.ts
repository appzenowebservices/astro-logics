// import CredentialsProvider from "next-auth/providers/credentials";
// import { compare } from "bcryptjs";
// import { db } from "~/server/db";
// import { PrismaAdapter } from "@auth/prisma-adapter";

// export const authConfig = {
//   providers: [
//     CredentialsProvider({
//       name: "Credentials",
//       credentials: {
//         mobile: { label: "Mobile", type: "text" },
//         password: { label: "Password", type: "password" },
//       },
//       async authorize(credentials) {
//         const identifier = credentials?.mobile?.trim();
//         const password = credentials?.password;
//         if (!identifier || !password) return null;

//         const user = await db.user.findFirst({
//           where: {
//             OR: [{ mobile: identifier }, { email: identifier }],
//           },
//         });

//         if (!user) return null;

//         const valid = await compare(password, user.passwordHash);
//         if (!valid) return null;

//         return { id: user.id, name: user.name, email: user.email, mobile: user.mobile };
//       },
//     }),
//   ],
//   adapter: PrismaAdapter(db),
//   session: {
//     strategy: "jwt", // 👈 forces JWT sessions instead of DB
//   },
//   callbacks: {
//     async jwt({ token, user }) {
//       if (user) {
//         token.id = user.id ?? token.sub;
//         token.mobile = user.mobile;
//       }
//       return token;
//     },
//     async session({ session, token }) {
//       if (token) {
//         session.user.id = (token.id ?? token.sub) as string;
//         session.user.mobile = token.mobile as string;
//       }
//       return session;
//     },
//   },

// };

import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "~/server/db";
import { PrismaAdapter } from "@auth/prisma-adapter";

export const authConfig = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        mobile: { label: "Mobile", type: "text" },
        // password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        console.log("=======wewewewe", credentials);
        if (!credentials?.mobile) return null;

        const user = await db.user.findFirst({
          where: { email: credentials.mobile },
        });

        if (!user) return null;

        // const valid = await compare(credentials.password, user.passwordHash);
        // if (!valid) return null;

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

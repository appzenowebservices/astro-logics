// import { PrismaClient } from "@prisma/client";

// import { env } from "~/env";

// const createPrismaClient = () =>
//   new PrismaClient({
//     log:
//       env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
//   });

// const globalForPrisma = globalThis as unknown as {
//   prisma: ReturnType<typeof createPrismaClient> | undefined;
// };

// export const db = globalForPrisma.prisma ?? createPrismaClient();

// if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;

// // src/server/db.ts
// // import prisma from "../../shared/prisma/client"; // path to shared client
// // import prisma from "../../shared/prisma/client"; // path to shared client

// // export const db = prisma; // use shared Prisma client

// // import { prisma } from "../../../db/src/client"
// // export const db = prisma; // use shared Prisma client

// // export default prisma;

// import { PrismaClient } from "@prisma/client";

// import { env } from "~/env";

// const createPrismaClient = () =>
//   new PrismaClient({
//     log:
//       env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
//   });

// const globalForPrisma = globalThis as unknown as {
//   prisma: ReturnType<typeof createPrismaClient> | undefined;
// };

// export const db = globalForPrisma.prisma ?? createPrismaClient();

// if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;

// src/server/db.ts
// import prisma from "../../shared/prisma/client"; // path to shared client
import prisma from "../../prisma-client/client"; // path to shared client

export const db = prisma; // use shared Prisma client

// shared/prisma/client.ts
// import { PrismaClient as PrismaClientCJS } from "./.client"; // generated CommonJS client
import { PrismaClient as PrismaClientCJS } from "./binaries"; // generated CommonJS client

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClientCJS };
const prisma =
  globalForPrisma.prisma ??
  new PrismaClientCJS({
    log: ["query", "error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;

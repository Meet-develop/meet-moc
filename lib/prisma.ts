import { PrismaClient } from "@prisma/client";

const databaseUrl = (process.env.DATABASE_URL ?? "").trim();
const isLocalDbUrl =
  databaseUrl.includes("@db:5432/") ||
  databaseUrl.includes("@localhost:") ||
  databaseUrl.includes("@127.0.0.1:");
const allowNonLocalDbInDev = process.env.ALLOW_NON_LOCAL_DB_IN_DEV === "true";

if (
  process.env.NODE_ENV !== "production" &&
  databaseUrl &&
  !isLocalDbUrl &&
  !allowNonLocalDbInDev
) {
  throw new Error(
    "[prisma] Refusing non-local DATABASE_URL in development. Set ALLOW_NON_LOCAL_DB_IN_DEV=true only for intentional operations."
  );
}

const globalForPrisma = globalThis as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

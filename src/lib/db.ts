import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL environment variable is not set. " +
        "Configure it in Render Dashboard → Environment Variables.",
    );
  }

  const adapter = new PrismaPg({ connectionString: databaseUrl });

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

/** Lazy singleton — Prisma no se inicializa hasta el primer uso */
export function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

// Backward compat para imports existentes
export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop) {
    const client = getPrisma();
    return Reflect.get(client, prop, client);
  },
});

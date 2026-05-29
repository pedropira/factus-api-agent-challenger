import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  console.log("DATABASE_URL:", process.env.DATABASE_URL?.substring(0, 40) + "...");

  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });

  const prisma = new PrismaClient({
    adapter,
    log: ["query", "error", "warn", "info"],
  });

  await prisma.$connect();
  console.log("Connected!");

  try {
    const customers = await prisma.customers.findMany({ take: 10 });
    console.log("Customers:", JSON.stringify(customers));
  } catch (e) {
    console.error("Customers error:", e.message);
    if (e.code) console.error("Error code:", e.code);
    if (e.meta) console.error("Meta:", JSON.stringify(e.meta));
  }

  try {
    const products = await prisma.products.findMany({ take: 10 });
    console.log("Products:", JSON.stringify(products));
  } catch (e) {
    console.error("Products error:", e.message);
    if (e.code) console.error("Error code:", e.code);
  }

  await prisma.$disconnect();
}
main().catch(e => console.error("Fatal:", e.message));

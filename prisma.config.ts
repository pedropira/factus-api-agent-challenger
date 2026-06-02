import { defineConfig } from "@prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Fallback allows prisma generate to work during Docker build
    // where DATABASE_URL is not yet available. Actual DB operations
    // (db push, migrate) require the real DATABASE_URL at runtime.
    url: process.env.DATABASE_URL ?? "postgresql://placeholder:placeholder@localhost:5432/postgres",
  },
});

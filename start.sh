#!/bin/sh
# Render entrypoint — syncs Prisma schema and starts the app

echo "→ Running prisma db push..."
npx prisma db push --skip-generate 2>&1 || echo "⚠️  prisma db push failed — check DATABASE_URL"

echo "→ Starting Next.js standalone server..."
exec node server.js

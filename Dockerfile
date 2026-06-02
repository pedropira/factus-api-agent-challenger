FROM node:20-alpine AS base

# Install OpenSSL — required by Prisma on Alpine
RUN apk add --no-cache openssl

# ── Dependencies ──────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
# --ignore-scripts: skip postinstall (prisma generate) because prisma/ schema isn't here yet
RUN npm ci --ignore-scripts

# ── Builder ───────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app

# Build-time args — NEXT_PUBLIC vars MUST be available at build time.
# Render passes env vars as --build-arg automatically.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN NEXT_PUBLIC_SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL}" \
    NEXT_PUBLIC_SUPABASE_ANON_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
    npx prisma generate && npm run build

# Strip devDependencies — only keep production deps (prisma included)
# This gives us a clean node_modules for the runner
RUN npm prune --production

# ── Runner ────────────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone build output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy production node_modules (includes prisma CLI + all deps transitives)
# This replaces the individual package copies — prisma 7+ requires many
# transitive deps (effect, @prisma/config, get-platform, engines, etc.)
COPY --from=builder /app/node_modules ./node_modules

# Copy Prisma schema so entrypoint can sync the database
COPY --from=builder /app/prisma ./prisma

# Copy entrypoint script
COPY start.sh /start.sh
RUN chmod +x /start.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["/start.sh"]

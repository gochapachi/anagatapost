# Production Dockerfile for AnagataPost on Coolify / Ubuntu 24.04
FROM node:20-alpine AS base

# Prisma's query engine is a native binary. It needs libssl + the musl libc shim
# at RUNTIME, not only while generating the client. The app used to construct a
# PrismaClient without ever connecting, so a runner stage without these libraries
# still "worked" — the first real query in production would have failed with
# "Could not find the required Prisma engine".
RUN apk add --no-cache libc6-compat openssl

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci || npm install

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . ./

# Environment variable for build time
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js application
RUN npm run build

# One-shot image for schema work. The runner below carries only `.next`, so
# `prisma migrate deploy` and `prisma/seed.js` physically cannot run inside the
# app container — this stage exists to be run once, before the app rolls out:
#   docker compose run --rm migrate
# It keeps the Prisma CLI, the schema and prisma/migrations.
FROM base AS migrate
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . ./
RUN npx prisma generate
CMD ["npx", "prisma", "migrate", "deploy"]

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# Reports unhealthy until the app AND its database are actually answering.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "server.js"]

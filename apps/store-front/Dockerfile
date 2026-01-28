# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/store-front/package.json ./apps/store-front/
COPY packages/ ./packages/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/store-front/node_modules ./apps/store-front/node_modules
COPY --from=deps /app/packages ./packages
COPY . .

# Generate Prisma client (dummy URL - no actual connection during build)
RUN cd packages/database && DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate

# Build the app
ENV NEXT_TELEMETRY_DISABLED 1
RUN pnpm --filter @framex/store-front build

# Ensure public directory exists to avoid COPY failure
RUN mkdir -p apps/store-front/public

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/apps/store-front/public ./apps/store-front/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/store-front/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/store-front/.next/static ./apps/store-front/.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]

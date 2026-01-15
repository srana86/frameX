# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/server/package.json ./apps/server/
COPY packages/ ./packages/

# Install dependencies with shamefully-hoist to flatten node_modules
RUN pnpm install --frozen-lockfile --shamefully-hoist

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/server/node_modules ./apps/server/node_modules
COPY --from=deps /app/packages ./packages
COPY . .

# Generate Prisma client (dummy URL - no actual connection during build)
RUN cd packages/database && DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate

# Build the app
RUN pnpm --filter @framex/server build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 expressjs

# Copy built application and dependencies
COPY --from=builder --chown=expressjs:nodejs /app/apps/server/dist ./dist
COPY --from=builder --chown=expressjs:nodejs /app/apps/server/package.json ./
COPY --from=builder --chown=expressjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=expressjs:nodejs /app/packages/database ./packages/database

USER expressjs

EXPOSE 8081

ENV PORT=8081

# Run directly with node (simpler than PM2 for development)
CMD ["node", "dist/server.js"]

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/store-api/package.json ./apps/store-api/
COPY packages/ ./packages/

# Install ALL dependencies (needed for build)
RUN pnpm install --frozen-lockfile --shamefully-hoist

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/store-api/node_modules ./apps/store-api/node_modules
COPY --from=deps /app/packages ./packages
COPY . .

# Generate Prisma client
RUN cd packages/database && DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate

# Build the app
RUN pnpm --filter @framex/store-api build

# --- NEW STEP: Prune Dev Dependencies ---
# Removes devDependencies so only production code remains
RUN pnpm prune --prod --no-optional

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 expressjs

# Copy built application
COPY --from=builder --chown=expressjs:nodejs /app/apps/store-api/dist ./dist
COPY --from=builder --chown=expressjs:nodejs /app/apps/store-api/package.json ./

# Copy ONLY production node_modules from builder (after prune)
COPY --from=builder --chown=expressjs:nodejs /app/node_modules ./node_modules
# Check if you really need to copy packages/database in runner (usually not if built correctly, but safe to keep if unsure)
COPY --from=builder --chown=expressjs:nodejs /app/packages/database ./packages/database

USER expressjs

EXPOSE 8080

ENV PORT=8080

CMD ["node", "dist/server.js"]
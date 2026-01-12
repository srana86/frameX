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

# Install dependencies
RUN pnpm install --frozen-lockfile

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/store-api/node_modules ./apps/store-api/node_modules
COPY --from=deps /app/packages ./packages
COPY . .
# Copy ecosystem file
COPY apps/store-api/ecosystem.config.js ./apps/store-api/ecosystem.config.js

# Generate Prisma client
RUN cd packages/database && npx prisma generate

# Build the app
RUN pnpm --filter @framex/store-api build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

# Install pm2 globally
RUN npm install --global pm2

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 expressjs

# Copy built application
COPY --from=builder --chown=expressjs:nodejs /app/apps/store-api/dist ./dist
COPY --from=builder /app/apps/store-api/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/database ./packages/database

USER expressjs

EXPOSE 5000

ENV PORT 5000

COPY --from=builder --chown=expressjs:nodejs /app/apps/store-api/ecosystem.config.js ./ecosystem.config.js

CMD ["pm2-runtime", "start", "ecosystem.config.js"]

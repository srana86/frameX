# =============================================================================
# Multi-Tenant SSL Dockerfile
# =============================================================================
# Production-ready Docker image for the domain management API.
# Uses multi-stage build for minimal final image size.
# 
# BUILD FROM MONOREPO ROOT:
#   docker build -f apps/multi-tenant-ssl/Dockerfile -t multi-tenant-ssl .
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1: Base image with pnpm
# ---------------------------------------------------------------------------
FROM node:20-alpine AS base

# Install pnpm and build dependencies
RUN corepack enable pnpm && \
    apk add --no-cache openssl curl bash

WORKDIR /app

# ---------------------------------------------------------------------------
# Stage 2: Install dependencies
# ---------------------------------------------------------------------------
FROM base AS deps

# Copy workspace configuration
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY package.json ./

# Copy package.json files for workspaces we need
COPY apps/multi-tenant-ssl/package.json ./apps/multi-tenant-ssl/
COPY packages/database/package.json ./packages/database/

# Install all dependencies (including dev for build)
RUN pnpm install --frozen-lockfile

# ---------------------------------------------------------------------------
# Stage 3: Build
# ---------------------------------------------------------------------------
FROM base AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/multi-tenant-ssl/node_modules ./apps/multi-tenant-ssl/node_modules
COPY --from=deps /app/packages/database/node_modules ./packages/database/node_modules

# Copy source files
COPY packages/database ./packages/database
COPY apps/multi-tenant-ssl ./apps/multi-tenant-ssl
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY tsconfig.json* ./

# Generate Prisma client (dummy URL - no actual connection during build)
WORKDIR /app/packages/database
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate

# Build the application
WORKDIR /app/apps/multi-tenant-ssl
RUN pnpm build

# ---------------------------------------------------------------------------
# Stage 4: Production
# ---------------------------------------------------------------------------
FROM node:20-alpine AS runner

# Install runtime dependencies
RUN apk add --no-cache openssl curl bash nginx

# Create app user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

WORKDIR /app

# Copy built application
COPY --from=builder --chown=appuser:nodejs /app/apps/multi-tenant-ssl/dist ./dist
COPY --from=builder --chown=appuser:nodejs /app/apps/multi-tenant-ssl/package.json ./
COPY --from=builder --chown=appuser:nodejs /app/apps/multi-tenant-ssl/nginx ./nginx
COPY --from=builder --chown=appuser:nodejs /app/apps/multi-tenant-ssl/scripts ./scripts

# Copy node_modules (production only would be better, but we need workspace links)
COPY --from=builder --chown=appuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:nodejs /app/packages/database ./packages/database

# Install acme.sh (optional - can be disabled for dev)
RUN curl -s https://get.acme.sh | sh -s email=admin@example.com || true

# Create directories for SSL and nginx
RUN mkdir -p /etc/ssl/tenants /var/www/acme /etc/nginx/sites-enabled /var/log/multi-tenant-ssl && \
    chown -R appuser:nodejs /etc/ssl/tenants /var/www/acme /var/log/multi-tenant-ssl

# Make scripts executable
RUN chmod +x ./scripts/*.sh 2>/dev/null || true

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Run as non-root user
USER appuser

# Start application
CMD ["node", "dist/index.js"]

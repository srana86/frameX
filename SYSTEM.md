# FrameX - Multi-Tenant E-Commerce Platform

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         NGINX (OpenResty)                       │
│                    Reverse Proxy & Load Balancer                │
│         *.framextech.local → store | localhost → dashboard│
└─────────────────────────────────────────────────────────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        ▼                          ▼                          ▼
┌───────────────┐        ┌───────────────┐          ┌───────────────┐
│   Dashboard   │        │     Store     │          │    Server     │
│   (Next.js)   │        │   (Next.js)   │          │   (Express)   │
│   Port: 3001  │        │   Port: 3000  │          │   Port: 8081  │
│  Admin Panel  │        │  Tenant Store │          │  Platform API │
└───────────────┘        └───────────────┘          └───────────────┘
                                   │
                                   ▼
                         ┌───────────────┐
                         │   Store-API   │
                         │   (Express)   │
                         │   Port: 8080  │
                         │  Tenant API   │
                         └───────────────┘
                                   │
            ┌──────────────────────┼──────────────────────┐
            ▼                      ▼                      ▼
    ┌───────────────┐      ┌───────────────┐      ┌───────────────┐
    │  PostgreSQL   │      │     Redis     │      │  Cloudinary   │
    │   Database    │      │    Cache      │      │    Media      │
    │   Port: 5432  │      │   Port: 6379  │      │   Storage     │
    └───────────────┘      └───────────────┘      └───────────────┘
```

---

## Apps

| App                  | Port | Purpose                             | Stack                |
| -------------------- | ---- | ----------------------------------- | -------------------- |
| **dashboard**        | 3001 | Admin panel for platform management | Next.js 16, React 19 |
| **store**            | 3000 | Multi-tenant storefront             | Next.js 16, React 19 |
| **store-api**        | 8080 | Tenant store REST API               | Express, Better Auth |
| **server**           | 8081 | Platform-level API                  | Express, Better Auth |
| **multi-tenant-ssl** | 3002 | SSL certificate management          | Node.js              |

---

## Multi-Tenancy

### Domain Resolution

```
Request → Nginx → X-Tenant-Subdomain header → Store/Store-API
```

**Resolution Priority:**

1. `x-domain` header
2. `x-forwarded-domain` header
3. `Origin` header hostname
4. `x-tenant-id` header

### Tenant Structure

```
Tenant
├── TenantDomain[] (hostname, subdomain, customDomain)
├── TenantSettings (brandName, logo, theme, currency)
├── Users, Products, Orders, Customers...
└── Config (Brand, Delivery, OAuth, Ads)
```

---

## Authentication

**Library:** Better Auth (session-based)

### Flow

```
User → signUp/signIn → Session Cookie → Redis (primary) + PostgreSQL (backup)
```

### Roles

- `SUPER_ADMIN` - Platform admin
- `ADMIN` - Tenant admin
- `MERCHANT` - Store owner
- `STAFF` - Tenant employee
- `CUSTOMER` - End user

### Session

- **Duration:** 7 days
- **Refresh:** Every 24 hours
- **Storage:** Redis (fast) + PostgreSQL (persistent)

---

## Database Schema

### Core Models

```prisma
Tenant → TenantDomain, TenantSettings
User → Session, Account (Better Auth)
Product → Category, Inventory, Review
Order → OrderItem, Payment, Customer
```

### Key Relationships

- All tenant data includes `tenantId` for isolation
- Users linked to tenants via `tenantId` (null = super admin)
- Cascade delete on tenant removal

---

## API Modules (store-api)

| Module            | Description                          |
| ----------------- | ------------------------------------ |
| **Config**        | Brand, Delivery, OAuth, Ads settings |
| **Product**       | CRUD, inventory, categories          |
| **Order**         | Orders, status, courier integration  |
| **Customer**      | Customer management, blocking        |
| **Payment**       | SSLCommerz, payment processing       |
| **Coupon**        | Discount codes, usage tracking       |
| **Content**       | Pages, Hero slides, Banners          |
| **EmailTemplate** | Transactional email templates        |
| **Affiliate**     | Referral program, commissions        |
| **Statistics**    | Dashboard analytics                  |
| **AI**            | Product descriptions, etc.           |

---

## Docker

### Development

```bash
docker-compose up -d
```

### Production

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Services

| Service   | Image              | Purpose        |
| --------- | ------------------ | -------------- |
| postgres  | postgres:16-alpine | Database       |
| redis     | redis:7-alpine     | Cache/Sessions |
| nginx     | openresty:alpine   | Reverse proxy  |
| store     | framex/store       | Storefront     |
| store-api | framex/store-api   | Store API      |
| dashboard | framex/dashboard   | Admin panel    |
| server    | framex/server      | Platform API   |

---

## Nginx Setup

### Routing Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    NGINX (OpenResty)                        │
│                      Port 80 / 443                          │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ framextech.*  │   │ *.framextech.*│   │   fallback    │
│   Dashboard   │   │ Tenant Stores │   │     404       │
└───────────────┘   └───────────────┘   └───────────────┘
        │                   │
        ▼                   ▼
   /api/* → server:8081    /api/* → store-api:8080
   /*    → dashboard:3001  /*    → store:3000
```

### Local Development

#### 1. Update /etc/hosts

```bash
sudo nano /etc/hosts
```

Add:

```
127.0.0.1 framextech.local
127.0.0.1 demo.framextech.local
127.0.0.1 shop.framextech.local
127.0.0.1 demo.localhost
```

#### 2. Start Nginx

```bash
docker-compose up -d nginx
```

#### 3. Access URLs

| URL                                  | Routes To         |
| ------------------------------------ | ----------------- |
| `http://framextech.local`            | Dashboard         |
| `http://framextech.local/api/*`      | Server API (8081) |
| `http://demo.framextech.local`       | Demo tenant store |
| `http://demo.framextech.local/api/*` | Store API (8080)  |

#### 4. Without Nginx (Direct)

```
http://localhost:3001  → Dashboard
http://localhost:3000  → Store
http://localhost:8080  → Store API
http://localhost:8081  → Server API
```

### Production Setup

#### 1. DNS Configuration

```
framextech.com      → A Record → Server IP
*.framextech.com    → A Record → Server IP (wildcard)
```

#### 2. SSL with Let's Encrypt

```bash
# Install certbot
apt install certbot python3-certbot-nginx

# Get wildcard certificate
certbot certonly --manual --preferred-challenges=dns \
  -d framextech.com -d *.framextech.com

# Test auto-renewal
certbot renew --dry-run
```

#### 3. Production Nginx Config

```nginx
# HTTP → HTTPS redirect
server {
    listen 80;
    server_name framextech.com *.framextech.com;
    return 301 https://$host$request_uri;
}

# Main platform (HTTPS)
server {
    listen 443 ssl http2;
    server_name framextech.com;

    ssl_certificate /etc/letsencrypt/live/framextech.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/framextech.com/privkey.pem;

    location /api/ { proxy_pass http://server_api/; }
    location / { proxy_pass http://dashboard_servers; }
}

# Tenant subdomains (HTTPS)
server {
    listen 443 ssl http2;
    server_name ~^(?<subdomain>[^.]+)\.framextech\.com$;

    ssl_certificate /etc/letsencrypt/live/framextech.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/framextech.com/privkey.pem;

    location /api/ {
        proxy_pass http://store_api_servers/;
        proxy_set_header X-Tenant-Subdomain $subdomain;
    }
    location / {
        proxy_pass http://store_servers;
        proxy_set_header X-Tenant-Subdomain $subdomain;
    }
}
```

#### 4. Deploy Commands

```bash
# Build and start
docker-compose -f docker-compose.prod.yml up -d --build

# Check logs
docker logs framex-nginx -f

# Reload config (no downtime)
docker exec framex-nginx nginx -s reload

# Test config
docker exec framex-nginx nginx -t
```

### Configuration Files

```
docker/nginx/
├── Dockerfile           # OpenResty Alpine
├── nginx.conf           # Main config (gzip, rate limiting)
├── conf.d/default.conf  # Server blocks & upstreams
└── html/404.html        # Error page
```

### Troubleshooting

| Issue                     | Solution                             |
| ------------------------- | ------------------------------------ |
| `502 Bad Gateway`         | Check if upstream service is running |
| `mime.types not found`    | Dockerfile handles this              |
| `connection refused`      | Verify Docker network                |
| `subdomain not resolving` | Check /etc/hosts or DNS              |

---

## Local Development

### Prerequisites

- Node.js 18+
- pnpm 10+
- Docker & Docker Compose

### Setup

```bash
# Install dependencies
pnpm install

# Start databases (postgres + redis only)
docker-compose up -d

# Generate Prisma client
cd packages/database && pnpm prisma generate

# Run migrations
pnpm prisma migrate dev

# Seed data
pnpm prisma db seed

# Start all apps (runs locally, NOT in Docker)
pnpm dev
```

### Docker Compose Files

| File                      | Purpose                                         |
| ------------------------- | ----------------------------------------------- |
| `docker-compose.yml`      | **Local dev** - postgres, redis, nginx (router) |
| `docker-compose.full.yml` | All services in Docker (slow, for testing)      |
| `docker-compose.prod.yml` | Production deployment                           |

### Local Domains

No DNS setup needed! Browsers automatically resolve `*.localhost` to `127.0.0.1`.

| URL                          | Routes to              |
| ---------------------------- | ---------------------- |
| `http://localhost/`          | Dashboard (port 3001)  |
| `http://demo.localhost/`     | Demo Store (port 3000) |
| `http://shop.localhost/`     | Shop Store (port 3000) |
| `http://[tenant].localhost/` | Tenant's store         |

---

## Environment Variables

### Store-API

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/framex
REDIS_URL=redis://localhost:6379
PORT=8080
BETTER_AUTH_SECRET=your-secret
BETTER_AUTH_URL=http://localhost:8080
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
```

### Store

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

---

## Tech Stack

| Layer         | Technology                           |
| ------------- | ------------------------------------ |
| **Monorepo**  | Turborepo + pnpm workspaces          |
| **Frontend**  | Next.js 16, React 19, Tailwind CSS 4 |
| **Backend**   | Express.js, Zod validation           |
| **Auth**      | Better Auth (sessions + OAuth)       |
| **Database**  | PostgreSQL 16 + Prisma ORM           |
| **Cache**     | Redis 7                              |
| **Real-time** | Socket.io + Redis Adapter            |
| **Media**     | Cloudinary                           |
| **Email**     | SendGrid, AWS SES, Postmark          |
| **Payments**  | SSLCommerz                           |
| **Courier**   | Steadfast, Pathao, RedX              |

---

## Project Structure

```
frameX/
├── apps/
│   ├── dashboard/     # Admin panel (Next.js)
│   ├── store/         # Tenant storefront (Next.js)
│   ├── store-api/     # Tenant API (Express)
│   ├── server/        # Platform API (Express)
│   └── multi-tenant-ssl/  # SSL management
├── packages/
│   ├── database/      # Prisma schema & client
│   ├── ui/            # Shared UI components
│   ├── typescript-config/
│   └── eslint-config/
├── docker/
│   ├── nginx/         # OpenResty config
│   └── postgres/      # Init scripts
├── docker-compose.yml
├── docker-compose.prod.yml
├── turbo.json
└── package.json
```

---

## Scripts

```bash
pnpm dev          # Start all apps in dev mode
pnpm build        # Build all apps
pnpm lint         # Lint all apps
pnpm format       # Format with Prettier
```

---

## Deployment Checklist

- [ ] Set production environment variables
- [ ] Configure SSL certificates
- [ ] Set up DNS for custom domains
- [ ] Configure Cloudinary
- [ ] Set up payment gateway credentials
- [ ] Configure email provider
- [ ] Set up monitoring (optional)
- [ ] Run database migrations

---

## Key Features

✅ Multi-tenant architecture with domain isolation  
✅ Session-based auth with Better Auth  
✅ Custom domain support with SSL  
✅ Real-time updates via Socket.io  
✅ Affiliate/referral system  
✅ Multiple payment gateways  
✅ Courier service integrations  
✅ Email template management  
✅ Product inventory tracking  
✅ Analytics dashboard

# Multi-Tenant SSL System

A production-ready multi-tenant HTTPS system for SaaS platforms that enables tenants to use custom domains with automatic SSL certificate issuance and renewal via Let's Encrypt.

## Features

- 🔐 **Automatic SSL** - Let's Encrypt certificates via acme.sh
- 🌐 **Custom Domains** - Each tenant can add their own domains
- 🃏 **Wildcard SSL** - Single cert for all subdomains (*.framextech.com)
- 🔄 **Zero Downtime** - Graceful Nginx reloads, no dropped connections
- 📊 **Scalable** - Supports thousands of tenant domains
- ☁️ **Cloudflare Support** - DNS-01 challenge for wildcard certs
- 🔒 **Security First** - TLS 1.2+, HSTS, security headers
- 📋 **Full API** - RESTful API for domain management

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Internet                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Nginx Reverse Proxy                           │
│              (SSL Termination, SNI Routing)                      │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
    ┌──────────┐        ┌──────────┐        ┌──────────┐
    │ Tenant A │        │ Tenant B │        │ Tenant N │
    │  App     │        │  App     │        │  App     │
    └──────────┘        └──────────┘        └──────────┘
```

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- Redis 7+
- Nginx
- acme.sh (installed automatically by setup script)

### Installation

```bash
# Clone and navigate
cd apps/multi-tenant-ssl

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Run database migrations
pnpm db:migrate

# Start development server
pnpm dev
```

### Production Setup

```bash
# Run setup script (as root)
sudo ./scripts/setup.sh

# Deploy with Docker
docker-compose up -d
```

## Docker Usage

### Option 1: Standalone Mode (includes PostgreSQL & Redis)

```bash
cd apps/multi-tenant-ssl

# Start all services including database
docker-compose --profile standalone up -d

# View logs
docker-compose logs -f api

# Stop all services
docker-compose down
```

### Option 2: Integrated Mode (use root docker-compose)

```bash
# From monorepo root - start all FrameX services
docker-compose up -d

# Or start just the SSL service (after postgres/redis are running)
docker-compose up -d multi-tenant-ssl

# The service will be available at http://localhost:3002
```

### Option 3: Build Only

```bash
# From monorepo root
docker build -f apps/multi-tenant-ssl/Dockerfile -t multi-tenant-ssl .
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | - | PostgreSQL connection string |
| `REDIS_URL` | - | Redis connection string |
| `API_KEY` | - | API key for authentication |
| `ACME_EMAIL` | - | Email for Let's Encrypt |
| `ACME_DIRECTORY` | staging | ACME server URL |

### Production Notes

> ⚠️ **Important**: For production SSL certificate issuance:
> - The API container handles domain/certificate management
> - Nginx and acme.sh should run on the host for port 80 access
> - Or use a reverse proxy that handles SSL termination


## API Endpoints

### Domains

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/domains` | List all domains |
| POST | `/api/v1/domains` | Add new domain |
| GET | `/api/v1/domains/:id` | Get domain details |
| DELETE | `/api/v1/domains/:id` | Remove domain |
| POST | `/api/v1/domains/:id/verify` | Verify DNS |
| POST | `/api/v1/domains/:id/issue-cert` | Issue SSL certificate |

### Tenants

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/tenants` | List tenants |
| POST | `/api/v1/tenants` | Create tenant |
| GET | `/api/v1/tenants/:id` | Get tenant |
| PATCH | `/api/v1/tenants/:id` | Update tenant |
| DELETE | `/api/v1/tenants/:id` | Delete tenant |

### Certificates

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/certificates/summary` | Certificate stats |
| GET | `/api/v1/certificates/expiring` | Expiring certs |
| POST | `/api/v1/certificates/renew-all` | Trigger bulk renewal |

## Adding a Custom Domain

### 1. Create the domain via API

```bash
curl -X POST http://localhost:3000/api/v1/domains \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "hostname": "shop.example.com",
    "tenantId": "tenant-id-here"
  }'
```

### 2. Configure DNS

Add a TXT record for verification:
```
_framex-verification.shop.example.com TXT "framex-verify-abc123"
```

Add A or CNAME record:
```
shop.example.com A YOUR_SERVER_IP
# OR
shop.example.com CNAME proxy.yourplatform.com
```

### 3. Verify ownership

```bash
curl -X POST http://localhost:3000/api/v1/domains/:id/verify \
  -H "X-API-Key: your-api-key"
```

### 4. Issue SSL certificate

```bash
curl -X POST http://localhost:3000/api/v1/domains/:id/issue-cert \
  -H "X-API-Key: your-api-key"
```

## Wildcard SSL (*.framextech.com)

For subdomain-based multi-tenancy, use a single wildcard certificate instead of per-domain certificates.

### Prerequisites

1. **Cloudflare account** with your domain
2. **Cloudflare API token** with DNS:Edit permission
3. **acme.sh** installed on the server

### Issue Wildcard Certificate

```bash
# Set Cloudflare credentials
export CF_Token="your-cloudflare-api-token"
export CF_Zone_ID="your-zone-id"

# Run the script
./scripts/issue-wildcard.sh
```

### Enable Wildcard Routing

```bash
# Copy the wildcard nginx config
cp nginx/sites-available/wildcard.framextech.com.conf /etc/nginx/sites-enabled/

# Test and reload nginx
nginx -t && nginx -s reload
```

### How It Works

1. **Single Certificate**: One cert for `*.framextech.com` covers all subdomains
2. **Subdomain Extraction**: Nginx extracts `tenant1` from `tenant1.framextech.com`
3. **Header Injection**: Backend receives `X-Tenant-Subdomain: tenant1` header
4. **Tenant Routing**: Your app uses the header to identify the tenant

```
tenant1.framextech.com ──┐
tenant2.framextech.com ──┼──► *.framextech.com cert ──► X-Tenant-Subdomain header ──► Backend
tenant3.framextech.com ──┘
```

### Certificate Renewal

Wildcard certificates auto-renew via acme.sh cron job. To manually renew:

```bash
export CF_Token="your-token"
acme.sh --renew -d "*.framextech.com" --dns dns_cf
```

## Configuration

See [.env.example](.env.example) for all available configuration options.

Key settings:

| Variable | Description |
|----------|-------------|
| `ACME_EMAIL` | Email for Let's Encrypt notifications |
| `ACME_DIRECTORY` | ACME server (staging or production) |
| `NGINX_SITES_PATH` | Path to Nginx sites-enabled |
| `SSL_CERT_PATH` | Path to store certificates |
| `CERT_RENEWAL_DAYS` | Days before expiry to renew |

## Scripts

| Script | Description |
|--------|-------------|
| `scripts/setup.sh` | Initial server setup |
| `scripts/acme-issue.sh` | Issue certificate manually |
| `scripts/acme-renew.sh` | Renew all certificates |
| `scripts/issue-wildcard.sh` | Issue wildcard cert for *.framextech.com |

## Documentation

- [DNS Instructions](docs/DNS_INSTRUCTIONS.md) - Guide for tenants
- [Architecture](docs/ARCHITECTURE.md) - System design
- [Security](docs/SECURITY.md) - Security guidelines

## How SNI Works

Server Name Indication (SNI) allows multiple SSL certificates on a single IP:

1. Client initiates TLS handshake with `ClientHello`
2. `ClientHello` includes the target hostname (SNI extension)
3. Nginx reads SNI before decrypting
4. Nginx selects the correct certificate and backend
5. Connection established with proper certificate

This enables hosting thousands of HTTPS domains on a single IP address.

## Security

- TLS 1.2 and 1.3 only
- Strong cipher suites (AEAD only)
- HSTS with preload
- Security headers (X-Frame-Options, CSP, etc.)
- Rate limiting (10 req/s default)
- API key authentication
- Timing-safe key comparison

## License

MIT

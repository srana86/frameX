# 🔑 Super Admin - Complete Environment Variables Setup

## Quick Setup

### Step 1: Create .env File

```bash
cd super-admin
cp .env.example .env
```

### Step 2: Fill in Values

Edit `super-admin/.env` with your configuration.

---

## 📋 Required Variables

### Database Connection

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/shoestore_main` |
| `MONGODB_DB` | Database name | `shoestore_main` |

---

## 🔧 Vercel Deployment Variables

These are required if you want to deploy tenant apps to Vercel.

| Variable | Description | Example |
|----------|-------------|---------|
| `VERCEL_TOKEN` | Vercel API token | `vercel_xxxxx` |
| `VERCEL_TEAM_ID` | Vercel team ID (optional) | `team_xxxxx` |
| `GITHUB_REPO` | GitHub repository (org/repo format) | `myorg/tenant-app` |
| `BASE_DOMAIN` | Base domain for tenant subdomains | `framextech.com` |

---

## 🌐 Super Admin URL (Critical for Multi-Tenant)

| Variable | Description | Example |
|----------|-------------|---------|
| `SUPER_ADMIN_URL` | Public URL of super-admin | `https://admin.framextech.com` |
| `NEXT_PUBLIC_SUPER_ADMIN_URL` | Same as above (for client-side) | `https://admin.framextech.com` |

> **Important**: This URL is passed to all tenant deployments so they can call central APIs (Cloudinary, etc.)

---

## 🖼️ Cloudinary (Central Image Service)

Super-admin provides a central Cloudinary API for all tenant apps.

| Variable | Description | Example |
|----------|-------------|---------|
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | `your_cloud_name` |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `123456789012345` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `your_secret` |

### Cloudinary API Endpoints (for tenant apps)

- **Upload**: `POST /api/cloudinary/upload`
- **Delete**: `POST /api/cloudinary/delete`
- **Config**: `GET /api/cloudinary/config`

---

## 🔐 Authentication & Security

| Variable | Description | Example |
|----------|-------------|---------|
| `JWT_SECRET` | Secret key for JWT tokens | `your_random_secret_key` |
| `ENCRYPTION_KEY` | Key for encrypting sensitive data | `your_encryption_key` |

---

## 🛡️ FraudShield API

| Variable | Description | Example |
|----------|-------------|---------|
| `FRAUDSHIELD_API_KEY` | FraudShield API key | `fs_xxxxx` |
| `FRAUDSHIELD_API_BASE_URL` | FraudShield base URL | `https://fraudshieldbd.site` |

---

## 📦 Courier Credentials (for Fraud Check)

| Variable | Description | Example |
|----------|-------------|---------|
| `PATHAO_USER` | Pathao login email | `your@email.com` |
| `PATHAO_PASSWORD` | Pathao password | `password` |
| `REDX_PHONE` | RedX phone number | `01712345678` |
| `REDX_PASSWORD` | RedX password | `password` |
| `STEADFAST_USER` | Steadfast login email | `your@email.com` |
| `STEADFAST_PASSWORD` | Steadfast password | `password` |

---

## 🎯 Complete .env Example

```env
# ============================================
# DATABASE CONFIGURATION (Required)
# ============================================
MONGODB_URI=mongodb://localhost:27017/shoestore_main
MONGODB_DB=shoestore_main

# ============================================
# SUPER ADMIN PUBLIC URL (Required for multi-tenant)
# ============================================
SUPER_ADMIN_URL=https://admin.framextech.com
NEXT_PUBLIC_SUPER_ADMIN_URL=https://admin.framextech.com

# ============================================
# VERCEL DEPLOYMENT (Required for auto-deploy)
# ============================================
VERCEL_TOKEN=vercel_xxxxx
VERCEL_TEAM_ID=team_xxxxx
GITHUB_REPO=myorg/tenant-app
BASE_DOMAIN=framextech.com

# Set to "true" to skip Vercel deployment during simulation
SKIP_VERCEL_DEPLOYMENT=false

# ============================================
# CLOUDINARY (Central Image Service)
# ============================================
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# ============================================
# AUTHENTICATION & SECURITY
# ============================================
JWT_SECRET=your_super_secret_jwt_key_here
ENCRYPTION_KEY=your_32_character_encryption_key

# ============================================
# FRAUDSHIELD API
# ============================================
FRAUDSHIELD_API_KEY=your_fraudshield_api_key
FRAUDSHIELD_API_BASE_URL=https://fraudshieldbd.site

# ============================================
# COURIER CREDENTIALS (for Fraud Check)
# ============================================
PATHAO_USER=your_pathao_email
PATHAO_PASSWORD=your_pathao_password
REDX_PHONE=01712345678
REDX_PASSWORD=your_redx_password
STEADFAST_USER=your_steadfast_email
STEADFAST_PASSWORD=your_steadfast_password
```

---

## 🚀 Environment Variables Passed to Tenant Deployments

When deploying a tenant app via simulation, these variables are automatically set:

| Variable | Source | Description |
|----------|--------|-------------|
| `TENANT_ID` | Generated | Unique tenant identifier |
| `NEXT_PUBLIC_TENANT_ID` | Generated | Same, for client-side |
| `TENANT_DB_NAME` | Generated | Tenant's database name |
| `MONGODB_DB` | Generated | Same as TENANT_DB_NAME |
| `MONGODB_URI` | Generated | Connection string to tenant DB |
| `SUPER_ADMIN_URL` | From super-admin | Central API URL |
| `NEXT_PUBLIC_SUPER_ADMIN_URL` | From super-admin | Same, for client-side |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | From super-admin | For image display |
| `JWT_SECRET` | From super-admin | For authentication |
| `ENCRYPTION_KEY` | From super-admin | For encryption |
| `FRAUDSHIELD_API_KEY` | From super-admin | For fraud detection |
| `FRAUDSHIELD_API_BASE_URL` | From super-admin | FraudShield API URL |
| `PATHAO_USER` | From super-admin | Courier credentials |
| `PATHAO_PASSWORD` | From super-admin | Courier credentials |
| `REDX_PHONE` | From super-admin | Courier credentials |
| `REDX_PASSWORD` | From super-admin | Courier credentials |
| `STEADFAST_USER` | From super-admin | Courier credentials |
| `STEADFAST_PASSWORD` | From super-admin | Courier credentials |

---

## 🏗️ Architecture: Central Services

### Cloudinary (Image Uploads)

Tenant apps don't need their own Cloudinary credentials. Instead:

1. Tenant app calls: `${SUPER_ADMIN_URL}/api/cloudinary/upload`
2. Super-admin handles the upload with central credentials
3. Response includes the Cloudinary URL

This approach:
- ✅ Centralizes credential management
- ✅ Allows usage tracking per tenant
- ✅ Simplifies tenant app setup

### How It Works in Tenant Apps

The tenant app's `/api/upload` route automatically:
1. Checks if `SUPER_ADMIN_URL` is set
2. If yes, proxies upload to super-admin's Cloudinary API
3. If no, uses local Cloudinary credentials (fallback)

---

## 📡 Public APIs for Tenant Apps

### Get Tenant Subscription & Plan

**Endpoint:** `GET /api/tenant-subscription`

**Usage:**
```bash
# Via query parameter
GET https://framextech.com/api/tenant-subscription?tenantId=tenant_xxxxx

# Via header
GET https://framextech.com/api/tenant-subscription
X-Tenant-ID: tenant_xxxxx
```

**Response:**
```json
{
  "tenant": {
    "id": "tenant_xxxxx",
    "name": "Store Name",
    "email": "store@example.com",
    "status": "active"
  },
  "subscription": {
    "tenantId": "tenant_xxxxx",
    "planId": "plan_pro",
    "status": "active",
    "startDate": "2025-01-01",
    "endDate": "2025-12-31"
  },
  "plan": {
    "id": "plan_pro",
    "name": "Pro Plan",
    "price": 99,
    "features": ["feature1", "feature2"]
  }
}
```

### Cloudinary Upload

**Endpoint:** `POST /api/cloudinary/upload`

See Cloudinary section above for details.

---

## 🔒 Security Notes

- Never commit `.env` file to version control
- Use strong, unique values for `JWT_SECRET` and `ENCRYPTION_KEY`
- Rotate credentials periodically
- Consider using environment variable management services in production

---

## 🚀 Running Super Admin

```bash
cd super-admin
npm install
cp .env.example .env
# Edit .env with your values
npm run dev
```

Access at: `http://localhost:3001`

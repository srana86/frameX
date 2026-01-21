# 🔑 Complete Environment Variables Reference

## Required Variables

### Database

- `MONGODB_URI` - MongoDB connection string
- `MONGODB_DB` - Database name

### Authentication

- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRES_IN` - Token expiration (optional, default: 7d)

### Encryption

- `ENCRYPTION_KEY` - Key for encrypting database connection strings

## Optional Variables

### AI Assistant (Gemini)

- `GEMINI_API_KEY` - Google Gemini API key for AI assistant functionality
  - Get your API key from: https://makersuite.google.com/app/apikey

### Super Admin Integration

- `SUPER_ADMIN_URL` or `NEXT_PUBLIC_SUPER_ADMIN_URL` - Super admin API base URL
  - Default: `https://framextech.com`
  - Used for central Cloudinary uploads

### Vercel (for Auto-Deployment)

- `VERCEL_TOKEN` - Vercel API token
- `VERCEL_TEAM_ID` - Vercel team ID (optional)

### GitHub (for GitHub API)

- `GITHUB_TOKEN` - GitHub personal access token
- `GITHUB_REPO` - Repository name (format: username/repo)

### Fraud Check (Courier Credentials)

- `PATHAO_USER` - Pathao username (email)
- `PATHAO_PASSWORD` - Pathao password
- `REDX_PHONE` - Redx login phone (local format, e.g. 017xxxxxxx)
- `REDX_PASSWORD` - Redx password
- `STEADFAST_USER` - Steadfast login email
- `STEADFAST_PASSWORD` - Steadfast password

### Onecodesoft Fraud Checker API (for Fraud Detection)

- `ONECODESOFT_FRAUD_CHECK_API_KEY` - Onecodesoft Fraud Checker API key (e.g., `2e09709be0dccb1a3aa75ac3`)
- `ONECODESOFT_DOMAIN` - Your whitelisted domain (optional, will use request origin if not set)
- `ONECODESOFT_FRAUD_CHECK_API_BASE_URL` - API base URL (optional, default: https://fraudchecker.onecodesoft.com)

**Legacy Support:**

- `FRAUDSHIELD_API_KEY` - Still supported for backward compatibility (will be used if ONECODESOFT_FRAUD_CHECK_API_KEY is not set)

## Multi-Tenant Setup (Auto-Deployed Tenants)

When deployed via super-admin simulation, these variables are automatically set:

| Variable                    | Description                              |
| --------------------------- | ---------------------------------------- |
| `TENANT_ID`               | Unique tenant identifier               |
| `NEXT_PUBLIC_TENANT_ID`   | Same, for client-side                    |
| `TENANT_DB_NAME`          | Tenant's database name                 |
| `MONGODB_DB`                | Same as TENANT_DB_NAME                 |
| `MONGODB_URI`               | Connection string to tenant DB         |
| `SUPER_ADMIN_URL`           | Central API URL (https://framextech.com) |
| `JWT_SECRET`                | For authentication                       |
| `ENCRYPTION_KEY`            | For encryption                           |
| All fraud check credentials | Passed from super-admin                  |

## Quick Reference

```env
# Required
MONGODB_URI=mongodb://localhost:27017/shoestore_main
MONGODB_DB=shoestore_main
JWT_SECRET=your_random_secret
ENCRYPTION_KEY=your_random_key

# Multi-Tenant (set by super-admin during deployment)
TENANT_ID=tenant_xxxxx
NEXT_PUBLIC_TENANT_ID=tenant_xxxxx
TENANT_DB_NAME=tenant_xxxxx_db

# Super Admin URL (optional - defaults to https://framextech.com)
# SUPER_ADMIN_URL=https://framextech.com

# Optional - Vercel
VERCEL_TOKEN=vercel_xxxxx
VERCEL_TEAM_ID=team_xxxxx

# Optional - GitHub
GITHUB_TOKEN=ghp_xxxxx
GITHUB_REPO=username/repo

# Optional - Fraud Check (Courier Credentials)
PATHAO_USER=your_pathao_email
PATHAO_PASSWORD=your_pathao_password
REDX_PHONE=01712345678
REDX_PASSWORD=your_redx_password
STEADFAST_USER=your_steadfast_email
STEADFAST_PASSWORD=your_steadfast_password

# Optional - Onecodesoft Fraud Checker API
ONECODESOFT_FRAUD_CHECK_API_KEY=2e09709be0dccb1a3aa75ac3
ONECODESOFT_DOMAIN=yourdomain.com
ONECODESOFT_FRAUD_CHECK_API_BASE_URL=https://fraudchecker.onecodesoft.com

# Legacy (backward compatibility)
FRAUDSHIELD_API_KEY=your_old_api_key

# Optional - AI Assistant
GEMINI_API_KEY=your_gemini_api_key
```

## Image Upload Architecture

### How It Works

my-app framextech.com (super-admin)
| |
| POST /api/upload |
| (with file) |
| |
|----------------------------------->|
| POST /api/cloudinary/upload |
| X-Tenant-ID: tenant_xxx |
| |
| |---> Cloudinary API
| | (credentials on super-admin)
| |<---
|<-----------------------------------|
| { secure_url, public_id, ... } |
| |
| Save secure_url to database |

```

### Key Points

1. **No Cloudinary credentials needed in tenant apps**
2. **Images saved as full URLs** - Store `secure_url` directly in database
3. **Display images using standard `<img>` or Next.js `<Image>`** - No special Cloudinary SDK needed
4. **Central tracking** - All uploads tracked by tenant ID
```

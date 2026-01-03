# Quick Start Guide - Auto-Deployment System

## 🚀 Setup in 5 Steps

### Step 1: Environment Variables

Add to your `.env` file:

```env
# MongoDB - Main Database
MONGODB_URI=mongodb://.../shoestore_main
MONGODB_DB=shoestore_main

# Vercel API
VERCEL_TOKEN=your_vercel_token_here
VERCEL_TEAM_ID=your_team_id_here
GITHUB_REPO=username/shoestore

# Encryption (for storing connection strings)
ENCRYPTION_KEY=your_secure_random_key_here
```

### Step 2: Get Vercel Credentials

1. **Vercel Token:**
   - Go to https://vercel.com/account/tokens
   - Click "Create Token"
   - Copy token → Add to `.env`

2. **Team ID:**
   - Go to Team Settings
   - Copy Team ID → Add to `.env`

3. **GitHub Repo:**
   - Your repository URL (e.g., `username/shoestore`)
   - Add to `.env`

### Step 3: Test Database Creation

```typescript
// Test in API route or script
import { createMerchantDatabase } from "@/lib/database-service";

const db = await createMerchantDatabase("test_merchant_123");
console.log("Database created:", db.databaseName);
```

### Step 4: Test Deployment

```typescript
// Test deployment creation
import { createVercelProject, deployToVercel } from "@/lib/vercel-service";

const project = await createVercelProject("test_merchant", "Test Merchant");
const deployment = await deployToVercel(project.id, "test_merchant", "db_name", "connection_string");
console.log("Deployed to:", deployment.url);
```

### Step 5: Test Complete Flow

```bash
# Create subscription with deployment
curl -X POST http://localhost:3000/api/subscriptions/create-with-deployment \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "starter",
    "trialDays": 14
  }'
```

## ✅ What Happens Automatically

1. **Subscription Created** → Record in database
2. **MongoDB Database Created** → `merchant_123_db`
3. **Collections Initialized** → Products, orders, etc.
4. **Vercel Project Created** → `merchant-123`
5. **Deployment Triggered** → Builds and deploys
6. **Environment Variables Set** → Merchant-specific config
7. **Subdomain Generated** → `merchant-123.vercel.app`

## 🌐 Domain Configuration

### Merchant Side:
1. Go to `/merchant/domain`
2. Enter domain: `shop.example.com`
3. Click "Configure"
4. Get DNS instructions
5. Add DNS records to domain provider
6. Wait for SSL (automatic)

### System Side:
1. Validates domain
2. Configures in Vercel
3. Generates DNS records
4. Stores configuration
5. Monitors verification
6. Issues SSL certificate

## 📊 Database Structure

### Main Database (`shoestore_main`)
- Manages all merchants
- Stores deployment configs
- Tracks subscriptions

### Merchant Databases (`merchant_123_db`)
- Isolated data per merchant
- Products, orders, configs
- Complete separation

## 🔧 Troubleshooting

### Database Creation Fails
- Check MongoDB connection string
- Verify database permissions
- Check encryption key

### Vercel Deployment Fails
- Verify Vercel token
- Check team ID
- Ensure GitHub repo is connected

### Domain Configuration Fails
- Verify domain format
- Check DNS propagation
- Verify Vercel domain limits

## 🎯 Next Steps

1. ✅ Set up environment variables
2. ✅ Test database creation
3. ✅ Test Vercel deployment
4. ✅ Test complete flow
5. ✅ Build merchant UI
6. ✅ Build admin panel

## 📚 Key Files

- `lib/database-service.ts` - Database management
- `lib/vercel-service.ts` - Vercel integration
- `lib/domain-service.ts` - Domain management
- `app/api/subscriptions/create-with-deployment/route.ts` - Main flow

## 💡 Tips

1. **Start with test merchant** before production
2. **Monitor Vercel deployments** in dashboard
3. **Check MongoDB** for database creation
4. **Test domain configuration** with test domain
5. **Set up webhooks** for deployment status

You're ready to go! 🚀


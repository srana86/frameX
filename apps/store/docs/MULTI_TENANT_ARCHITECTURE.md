# Multi-Tenant Architecture Plan

## 🎯 Overview

Each merchant will have their own separate deployment (for custom domain support) with a centralized super admin panel to manage all merchants.

## 🏗️ Architecture Options

### Option 1: Shared Database with Tenant Isolation (Recommended)
- **Single MongoDB database** with `merchantId` field in all collections
- **Pros**: Cost-effective, easier management, shared resources
- **Cons**: Requires careful data isolation
- **Best for**: Most SaaS platforms

### Option 2: Separate Database Per Merchant
- **Each merchant gets their own MongoDB database**
- **Pros**: Complete isolation, easier to migrate/backup individual merchants
- **Cons**: More expensive, complex management
- **Best for**: Enterprise customers or high-security requirements

### Option 3: Hybrid Approach (Recommended for Your Case)
- **Shared database for core data** (users, subscriptions, etc.)
- **Separate database/collections for merchant-specific data** (products, orders, etc.)
- **Pros**: Balance of isolation and cost
- **Cons**: More complex queries

## 📊 Recommended Database Structure

### Core Collections (Shared)

#### `merchants`
Stores merchant account information and configuration
```typescript
{
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: "active" | "suspended" | "trial" | "inactive";
  customDomain?: string;
  deploymentUrl?: string; // e.g., "merchant1.shoestore.com"
  subscriptionId?: string;
  settings: {
    brandName: string;
    logo?: string;
    theme?: object;
    // ... other brand config
  };
  createdAt: string;
  updatedAt: string;
}
```

#### `merchant_deployments`
Track each merchant's deployment configuration
```typescript
{
  id: string;
  merchantId: string;
  deploymentType: "subdomain" | "custom_domain";
  subdomain?: string; // e.g., "merchant1"
  customDomain?: string; // e.g., "shop.example.com"
  deploymentStatus: "pending" | "active" | "failed";
  deploymentUrl: string;
  environmentVariables: Record<string, string>;
  lastDeployedAt?: string;
  createdAt: string;
}
```

#### `merchant_databases`
Track database connections per merchant (if using separate DBs)
```typescript
{
  id: string;
  merchantId: string;
  databaseName: string; // e.g., "merchant1_db"
  connectionString: string; // Encrypted
  status: "active" | "inactive";
  createdAt: string;
}
```

### Merchant-Specific Collections (Per Merchant)

Each merchant's data is isolated by `merchantId`:

- `products` - Products (with merchantId)
- `orders` - Orders (with merchantId)
- `categories` - Categories (with merchantId)
- `inventory` - Inventory (with merchantId)
- `brand_config` - Brand config (with merchantId)
- `sslcommerz_config` - Payment config (with merchantId)
- `ads_config` - Ads config (with merchantId)
- `pages` - Custom pages (with merchantId)
- `hero_slides` - Hero slides (with merchantId)

## 🔐 Data Isolation Strategy

### Method 1: Merchant ID in Every Query
```typescript
// Always filter by merchantId
const products = await collection.find({ merchantId, ...otherFilters });
```

### Method 2: Middleware to Inject Merchant Context
```typescript
// Middleware automatically adds merchantId to queries
export async function getMerchantCollection(collectionName: string, merchantId: string) {
  const col = await getCollection(collectionName);
  return {
    find: (query: any) => col.find({ ...query, merchantId }),
    findOne: (query: any) => col.findOne({ ...query, merchantId }),
    // ... other methods
  };
}
```

### Method 3: Database-Level Isolation (Separate DBs)
```typescript
// Each merchant has their own database
export async function getMerchantDb(merchantId: string) {
  const dbName = `merchant_${merchantId}`;
  const client = await clientPromise;
  return client.db(dbName);
}
```

## 🎛️ Super Admin Panel Structure

### Pages Needed

1. **Dashboard** (`/super-admin`)
   - Total merchants count
   - Active subscriptions
   - Revenue metrics
   - Recent activity

2. **Merchants Management** (`/super-admin/merchants`)
   - List all merchants
   - Create new merchant
   - Edit merchant details
   - Suspend/Activate merchants
   - View merchant subscription

3. **Deployments** (`/super-admin/deployments`)
   - View all deployments
   - Create new deployment
   - Configure custom domains
   - View deployment status
   - Trigger redeployments

4. **Subscriptions** (`/super-admin/subscriptions`)
   - View all subscriptions
   - Manage plans
   - Manual subscription adjustments
   - Billing overview

5. **System Settings** (`/super-admin/settings`)
   - Global settings
   - Feature flags
   - System configuration

## 🚀 Deployment Strategy

### For Each Merchant Deployment

1. **Environment Variables Per Merchant**
   ```env
   MERCHANT_ID=merchant_123
   MERCHANT_DB_NAME=merchant_123_db
   CUSTOM_DOMAIN=shop.example.com
   ```

2. **Deployment Process**
   - Admin creates merchant in super admin
   - System generates deployment config
   - Deploy to Vercel/Netlify with merchant-specific env vars
   - Configure custom domain (if applicable)
   - Set up database connection

3. **Database Connection Per Merchant**
   ```typescript
   // lib/mongodb.ts - Modified for multi-tenant
   export async function getMerchantDb(merchantId?: string) {
     const dbName = merchantId 
       ? `merchant_${merchantId}` 
       : process.env.MERCHANT_DB_NAME || "shoestore";
     const client = await clientPromise;
     return client.db(dbName);
   }
   ```

## 📋 Implementation Plan

### Phase 1: Database Structure
- [ ] Create `merchants` collection
- [ ] Create `merchant_deployments` collection
- [ ] Add `merchantId` to all existing collections
- [ ] Create migration script to add merchantId to existing data

### Phase 2: Super Admin Panel
- [ ] Create super admin layout
- [ ] Merchants management page
- [ ] Deployments management page
- [ ] Subscription management

### Phase 3: Multi-Tenant Helpers
- [ ] Merchant context middleware
- [ ] Database connection per merchant
- [ ] Query helpers with automatic merchantId injection

### Phase 4: Deployment Automation
- [ ] API to create deployments
- [ ] Integration with Vercel/Netlify API
- [ ] Custom domain configuration
- [ ] Environment variable management

## 🔄 Data Flow

### Merchant Registration Flow
1. Super admin creates merchant account
2. System creates merchant database/collection
3. System generates deployment configuration
4. Deploy merchant instance
5. Configure custom domain (if applicable)
6. Merchant receives credentials

### Merchant Login Flow
1. Merchant logs in with credentials
2. System identifies merchant from email/domain
3. Load merchant-specific database
4. Set merchant context for all queries
5. Redirect to merchant dashboard

## 🛡️ Security Considerations

1. **Data Isolation**: Never allow cross-merchant data access
2. **Authentication**: Separate auth for super admin vs merchants
3. **API Security**: Validate merchantId on all API calls
4. **Database Access**: Use connection strings per merchant
5. **Deployment Security**: Secure environment variables

## 💡 Recommended Approach for Your Use Case

**Hybrid Approach:**
- Use **shared database** with `merchantId` field (simpler, cost-effective)
- Each merchant gets **separate deployment** (for custom domain)
- **Super admin panel** manages all merchants centrally
- **Environment variables** per deployment link to merchant

This gives you:
- ✅ Custom domain support (separate deployments)
- ✅ Cost-effective database (shared)
- ✅ Centralized management (super admin)
- ✅ Easy scaling (add merchants easily)


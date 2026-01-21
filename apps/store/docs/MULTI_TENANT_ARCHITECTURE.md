# Multi-Tenant Architecture Plan

## 🎯 Overview

Each tenant will have their own separate deployment (for custom domain support) with a centralized super admin panel to manage all tenants.

## 🏗️ Architecture Options

### Option 1: Shared Database with Tenant Isolation (Recommended)
- **Single MongoDB database** with `tenantId` field in all collections
- **Pros**: Cost-effective, easier management, shared resources
- **Cons**: Requires careful data isolation
- **Best for**: Most SaaS platforms

### Option 2: Separate Database Per Tenant
- **Each tenant gets their own MongoDB database**
- **Pros**: Complete isolation, easier to migrate/backup individual tenants
- **Cons**: More expensive, complex management
- **Best for**: Enterprise customers or high-security requirements

### Option 3: Hybrid Approach (Recommended for Your Case)
- **Shared database for core data** (users, subscriptions, etc.)
- **Separate database/collections for tenant-specific data** (products, orders, etc.)
- **Pros**: Balance of isolation and cost
- **Cons**: More complex queries

## 📊 Recommended Database Structure

### Core Collections (Shared)

#### `tenants`
Stores tenant account information and configuration
```typescript
{
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: "active" | "suspended" | "trial" | "inactive";
  customDomain?: string;
  deploymentUrl?: string; // e.g., "tenant1.shoestore.com"
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

#### `tenant_deployments`
Track each tenant's deployment configuration
```typescript
{
  id: string;
  tenantId: string;
  deploymentType: "subdomain" | "custom_domain";
  subdomain?: string; // e.g., "tenant1"
  customDomain?: string; // e.g., "shop.example.com"
  deploymentStatus: "pending" | "active" | "failed";
  deploymentUrl: string;
  environmentVariables: Record<string, string>;
  lastDeployedAt?: string;
  createdAt: string;
}
```

#### `tenant_databases`
Track database connections per tenant (if using separate DBs)
```typescript
{
  id: string;
  tenantId: string;
  databaseName: string; // e.g., "tenant1_db"
  connectionString: string; // Encrypted
  status: "active" | "inactive";
  createdAt: string;
}
```

### Tenant-Specific Collections (Per Tenant)

Each tenant's data is isolated by `tenantId`:

- `products` - Products (with tenantId)
- `orders` - Orders (with tenantId)
- `categories` - Categories (with tenantId)
- `inventory` - Inventory (with tenantId)
- `brand_config` - Brand config (with tenantId)
- `sslcommerz_config` - Payment config (with tenantId)
- `ads_config` - Ads config (with tenantId)
- `pages` - Custom pages (with tenantId)
- `hero_slides` - Hero slides (with tenantId)

## 🔐 Data Isolation Strategy

### Method 1: Tenant ID in Every Query
```typescript
// Always filter by tenantId
const products = await collection.find({ tenantId, ...otherFilters });
```

### Method 2: Middleware to Inject Tenant Context
```typescript
// Middleware automatically adds tenantId to queries
export async function getTenantCollection(collectionName: string, tenantId: string) {
  const col = await getCollection(collectionName);
  return {
    find: (query: any) => col.find({ ...query, tenantId }),
    findOne: (query: any) => col.findOne({ ...query, tenantId }),
    // ... other methods
  };
}
```

### Method 3: Database-Level Isolation (Separate DBs)
```typescript
// Each tenant has their own database
export async function getTenantDb(tenantId: string) {
  const dbName = `tenant_${tenantId}`;
  const client = await clientPromise;
  return client.db(dbName);
}
```

## 🎛️ Super Admin Panel Structure

### Pages Needed

1. **Dashboard** (`/super-admin`)
   - Total tenants count
   - Active subscriptions
   - Revenue metrics
   - Recent activity

2. **Tenants Management** (`/super-admin/tenants`)
   - List all tenants
   - Create new tenant
   - Edit tenant details
   - Suspend/Activate tenants
   - View tenant subscription

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

### For Each Tenant Deployment

1. **Environment Variables Per Tenant**
   ```env
   TENANT_ID=tenant_123
   TENANT_DB_NAME=tenant_123_db
   CUSTOM_DOMAIN=shop.example.com
   ```

2. **Deployment Process**
   - Admin creates tenant in super admin
   - System generates deployment config
   - Deploy to Vercel/Netlify with tenant-specific env vars
   - Configure custom domain (if applicable)
   - Set up database connection

3. **Database Connection Per Tenant**
   ```typescript
   // lib/mongodb.ts - Modified for multi-tenant
   export async function getTenantDb(tenantId?: string) {
     const dbName = tenantId 
       ? `tenant_${tenantId}` 
       : process.env.TENANT_DB_NAME || "shoestore";
     const client = await clientPromise;
     return client.db(dbName);
   }
   ```

## 📋 Implementation Plan

### Phase 1: Database Structure
- [ ] Create `tenants` collection
- [ ] Create `tenant_deployments` collection
- [ ] Add `tenantId` to all existing collections
- [ ] Create migration script to add tenantId to existing data

### Phase 2: Super Admin Panel
- [ ] Create super admin layout
- [ ] Tenants management page
- [ ] Deployments management page
- [ ] Subscription management

### Phase 3: Multi-Tenant Helpers
- [ ] Tenant context middleware
- [ ] Database connection per tenant
- [ ] Query helpers with automatic tenantId injection

### Phase 4: Deployment Automation
- [ ] API to create deployments
- [ ] Integration with Vercel/Netlify API
- [ ] Custom domain configuration
- [ ] Environment variable management

## 🔄 Data Flow

### Tenant Registration Flow
1. Super admin creates tenant account
2. System creates tenant database/collection
3. System generates deployment configuration
4. Deploy tenant instance
5. Configure custom domain (if applicable)
6. Tenant receives credentials

### Tenant Login Flow
1. Tenant logs in with credentials
2. System identifies tenant from email/domain
3. Load tenant-specific database
4. Set tenant context for all queries
5. Redirect to tenant dashboard

## 🛡️ Security Considerations

1. **Data Isolation**: Never allow cross-tenant data access
2. **Authentication**: Separate auth for super admin vs tenants
3. **API Security**: Validate tenantId on all API calls
4. **Database Access**: Use connection strings per tenant
5. **Deployment Security**: Secure environment variables

## 💡 Recommended Approach for Your Use Case

**Hybrid Approach:**
- Use **shared database** with `tenantId` field (simpler, cost-effective)
- Each tenant gets **separate deployment** (for custom domain)
- **Super admin panel** manages all tenants centrally
- **Environment variables** per deployment link to tenant

This gives you:
- ✅ Custom domain support (separate deployments)
- ✅ Cost-effective database (shared)
- ✅ Centralized management (super admin)
- ✅ Easy scaling (add tenants easily)


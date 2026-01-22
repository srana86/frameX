# Complete SaaS Architecture Plan
## Auto-Deployment & Database Management System

## 🎯 Overview

When a tenant purchases a subscription plan, the system will:
1. ✅ Automatically create a MongoDB database for the tenant
2. ✅ Automatically deploy to Vercel with tenant-specific configuration
3. ✅ Allow tenant to configure custom domain from their panel
4. ✅ Track everything in the central database

## 🏗️ Architecture Flow

### Subscription → Deployment Flow

```
Tenant Purchases Plan
    ↓
Create Subscription Record
    ↓
Create MongoDB Database (tenant_123_db)
    ↓
Generate Deployment Configuration
    ↓
Deploy to Vercel (via API)
    ↓
Configure Environment Variables
    ↓
Set Up Subdomain (tenant1.shoestore.com)
    ↓
Tenant Receives Credentials
    ↓
Tenant Configures Custom Domain (optional)
```

## 📊 Database Architecture

### Central Database (Main)
**Database Name:** `shoestore_main`

**Collections:**
- `tenants` - All tenant accounts
- `tenant_databases` - MongoDB database configs per tenant
- `tenant_deployments` - Vercel deployment configs
- `subscription_plans` - Available plans
- `tenant_subscriptions` - Active subscriptions
- `subscription_invoices` - Billing records
- `domain_configurations` - Custom domain configs

### Tenant Databases (Per Tenant)
**Database Name Pattern:** `tenant_{tenantId}_db`

**Collections (Each Tenant):**
- `products` - Products
- `orders` - Orders
- `categories` - Categories
- `inventory` - Inventory
- `brand_config` - Brand configuration
- `sslcommerz_config` - Payment config
- `ads_config` - Ads config
- `pages` - Custom pages
- `hero_slides` - Hero slides
- `users` - Tenant's customers (if needed)

## 🔧 System Components

### 1. Database Management Service

**File:** `lib/database-service.ts`

Responsibilities:
- Create MongoDB database for new tenant
- Generate connection strings
- Store database credentials securely
- Handle database deletion (on cancellation)

### 2. Vercel Deployment Service

**File:** `lib/vercel-service.ts`

Responsibilities:
- Create Vercel project
- Deploy tenant instance
- Configure environment variables
- Set up subdomain
- Handle custom domain configuration
- Redeploy on updates

### 3. Domain Management Service

**File:** `lib/domain-service.ts`

Responsibilities:
- Validate domain ownership
- Configure DNS records
- Set up SSL certificates
- Link domain to Vercel deployment

## 🚀 Implementation Plan

### Phase 1: Database Automation

#### Step 1: MongoDB Database Creation
```typescript
// When tenant subscribes
1. Generate unique database name: tenant_{tenantId}_db
2. Create database in MongoDB
3. Initialize collections
4. Store connection string (encrypted)
5. Create database record in central DB
```

#### Step 2: Connection Management
```typescript
// Each tenant deployment uses their own DB
TENANT_DB_NAME=tenant_123_db
MONGODB_URI=mongodb://.../tenant_123_db
```

### Phase 2: Vercel Deployment Automation

#### Step 1: Project Creation
```typescript
// Create Vercel project for tenant
1. Create project via Vercel API
2. Link to GitHub repository
3. Configure build settings
4. Set environment variables
```

#### Step 2: Environment Variables
```typescript
// Auto-configured per tenant
TENANT_ID=tenant_123
TENANT_DB_NAME=tenant_123_db
MONGODB_URI=mongodb://.../tenant_123_db
CUSTOM_DOMAIN=shop.example.com (if configured)
```

### Phase 3: Domain Management

#### Step 1: Subdomain Setup
```typescript
// Automatic subdomain
tenant1.shoestore.com
tenant2.shoestore.com
```

#### Step 2: Custom Domain (Tenant Panel)
```typescript
// Tenant configures from panel
1. Tenant enters domain: shop.example.com
2. System validates domain
3. Provides DNS instructions
4. Verifies domain ownership
5. Configures SSL
6. Links to Vercel deployment
```

## 📋 Database Schema

### tenant_databases Collection
```typescript
{
  id: string;
  tenantId: string;
  databaseName: string; // "tenant_123_db"
  connectionString: string; // Encrypted
  status: "active" | "inactive" | "suspended";
  createdAt: string;
  updatedAt: string;
}
```

### tenant_deployments Collection
```typescript
{
  id: string;
  tenantId: string;
  vercelProjectId: string;
  vercelDeploymentId: string;
  deploymentUrl: string; // "tenant1.shoestore.com"
  customDomain?: string; // "shop.example.com"
  domainStatus: "pending" | "active" | "failed";
  environmentVariables: Record<string, string>;
  deploymentStatus: "pending" | "active" | "failed";
  lastDeployedAt: string;
  createdAt: string;
  updatedAt: string;
}
```

### domain_configurations Collection
```typescript
{
  id: string;
  tenantId: string;
  domain: string; // "shop.example.com"
  domainType: "custom" | "subdomain";
  dnsRecords: {
    type: string;
    name: string;
    value: string;
  }[];
  sslStatus: "pending" | "active" | "failed";
  verified: boolean;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

## 🔄 Complete Flow Implementation

### 1. Subscription Purchase Flow

```typescript
POST /api/subscriptions/create
  ↓
1. Create subscription record
2. Create MongoDB database
3. Initialize database collections
4. Create Vercel project
5. Deploy to Vercel
6. Configure subdomain
7. Send credentials to tenant
```

### 2. Custom Domain Setup Flow

```typescript
POST /api/tenant/domain/configure
  ↓
1. Validate domain format
2. Check domain availability
3. Generate DNS records
4. Store domain configuration
5. Configure in Vercel
6. Verify domain ownership
7. Set up SSL certificate
8. Update deployment
```

## 🛠️ Required Services

### 1. MongoDB Management
- Create databases programmatically
- Manage connection strings
- Initialize collections
- Handle database deletion

### 2. Vercel API Integration
- Create projects
- Deploy applications
- Configure domains
- Manage environment variables
- Handle webhooks

### 3. Domain Management
- DNS record management
- SSL certificate provisioning
- Domain verification
- Domain health monitoring

## 📝 Environment Variables Structure

### Central Admin Panel
```env
MONGODB_URI=mongodb://.../shoestore_main
VERCEL_TOKEN=your_vercel_token
VERCEL_TEAM_ID=your_team_id
GITHUB_REPO=your_repo_url
```

### Each Tenant Deployment
```env
TENANT_ID=tenant_123
TENANT_DB_NAME=tenant_123_db
MONGODB_URI=mongodb://.../tenant_123_db
CUSTOM_DOMAIN=shop.example.com
NEXT_PUBLIC_TENANT_ID=tenant_123
```

## 🔐 Security Considerations

1. **Database Isolation**: Each tenant has separate database
2. **Connection Strings**: Encrypted storage in central DB
3. **Vercel Tokens**: Secure storage, never exposed
4. **Domain Verification**: Prevent domain hijacking
5. **Access Control**: Tenant can only access their own data

## 📊 Monitoring & Management

### Super Admin Dashboard
- View all tenant deployments
- Monitor database usage
- Track deployment status
- Manage domains
- View system health

### Tenant Panel
- View deployment status
- Configure custom domain
- View database info
- Monitor usage
- Access deployment logs

## 🚀 Deployment Checklist

### When Tenant Subscribes:
- [ ] Create MongoDB database
- [ ] Initialize collections
- [ ] Create Vercel project
- [ ] Configure environment variables
- [ ] Deploy application
- [ ] Set up subdomain
- [ ] Send credentials
- [ ] Create deployment record

### When Tenant Configures Domain:
- [ ] Validate domain
- [ ] Generate DNS records
- [ ] Store configuration
- [ ] Configure in Vercel
- [ ] Verify ownership
- [ ] Set up SSL
- [ ] Update deployment

## 💡 Benefits of This Architecture

1. **Complete Isolation**: Each tenant has own database
2. **Automatic Setup**: Zero manual intervention
3. **Scalable**: Easy to add new tenants
4. **Secure**: Encrypted credentials, isolated databases
5. **Flexible**: Support custom domains
6. **Manageable**: Central admin panel for oversight

## 📚 Implementation Files Needed

1. `lib/database-service.ts` - MongoDB database management
2. `lib/vercel-service.ts` - Vercel deployment management
3. `lib/domain-service.ts` - Domain configuration
4. `app/api/admin/deployments/route.ts` - Deployment management
5. `app/api/tenant/domain/route.ts` - Domain configuration
6. `app/api/webhooks/vercel/route.ts` - Vercel webhooks
7. `app/api/webhooks/subscription/route.ts` - Subscription webhooks


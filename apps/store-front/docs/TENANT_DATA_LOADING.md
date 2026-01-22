# Tenant Data Loading System

## Overview

The tenant data loading system automatically detects and loads tenant-specific data based on the request context. It supports:

- **Environment-based detection** (for deployed tenant instances)
- **Domain-based detection** (for custom domains)
- **Header-based detection** (for API requests)
- **Automatic database routing** (shared or separate databases)

## Architecture

### Core Components

1. **`lib/tenant-loader.ts`** - Core loader that detects and loads tenant data
2. **`lib/tenant-context.ts`** - React cache-based context provider
3. **`lib/tenant-data-loader.ts`** - Helper functions for loading tenant-specific collections
4. **`middleware.ts`** - Next.js middleware to detect tenant from domain/headers
5. **`app/api/tenant/context/route.ts`** - API endpoint to get tenant context

## How It Works

### 1. Tenant Detection

The system detects tenant ID from multiple sources (in order):

1. **Environment Variable** (`TENANT_ID`) - For deployed tenant instances
2. **Request Headers** (`x-tenant-id`) - For API requests
3. **Domain/Subdomain** - Looks up tenant by custom domain

### 2. Data Loading

Once tenant is detected, the system loads:

- **Tenant Profile** - Basic tenant information
- **Database Configuration** - Which database to use (shared or separate)
- **Deployment Configuration** - Deployment URL and status
- **Connection String** - Database connection (if separate DB)

### 3. Database Routing

The system automatically routes to the correct database:

- **Separate Database**: Uses tenant's dedicated MongoDB database
- **Shared Database**: Uses main database with `tenantId` filtering

## Usage

### In Server Components

```typescript
import { getTenantContext, getCurrentTenant } from "@/lib/tenant-context";

// Get full tenant context
const context = await getTenantContext();
if (context) {
  console.log("Tenant:", context.tenant.name);
  console.log("Database:", context.dbName);
}

// Get just tenant
const tenant = await getCurrentTenant();
```

### Loading Tenant-Specific Data

```typescript
import { loadTenantCollectionData, loadTenantDocument } from "@/lib/tenant-data-loader";

// Load all products for current tenant
const products = await loadTenantCollectionData("products", {}, { 
  sort: { createdAt: -1 },
  limit: 10 
});

// Load single document
const product = await loadTenantDocument("products", { slug: "my-product" });

// Count documents
const count = await countTenantDocuments("orders", { status: "pending" });
```

### In API Routes

```typescript
import { loadTenantData } from "@/lib/tenant-loader";

export async function GET(request: Request) {
  // Get tenant ID from query params or auto-detect
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenantId");
  
  // Load tenant data
  const context = await loadTenantData(tenantId || undefined);
  
  if (!context) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }
  
  // Use context.tenant, context.database, etc.
}
```

### Using Tenant Collection Helper

```typescript
import { getTenantCollection } from "@/lib/tenant-data-loader";

// Get collection for current tenant
const productsCol = await getTenantCollection("products");

// Use normally - automatically uses tenant's database
const products = await productsCol.find({}).toArray();
```

## API Endpoints

### GET /api/tenant/context

Get current tenant context data.

**Query Parameters:**
- `tenantId` (optional) - Specific tenant ID

**Response:**
```json
{
  "success": true,
  "data": {
    "tenant": {
      "id": "tenant_123",
      "name": "My Store",
      "email": "store@example.com",
      "status": "active",
      "settings": { ... }
    },
    "database": {
      "id": "db_123",
      "databaseName": "tenant_123_db",
      "useSharedDatabase": false,
      "status": "active"
    },
    "deployment": {
      "id": "deploy_123",
      "deploymentUrl": "tenant-123.vercel.app",
      "deploymentStatus": "active"
    },
    "dbName": "tenant_123_db",
    "hasConnectionString": true
  }
}
```

## Environment Variables

For deployed tenant instances, set:

```env
TENANT_ID=tenant_123
TENANT_DB_NAME=tenant_123_db
MONGODB_URI=mongodb://.../tenant_123_db
NEXT_PUBLIC_TENANT_ID=tenant_123
```

## Middleware

The middleware automatically:
- Detects tenant from domain/subdomain
- Adds `x-tenant-id` header to requests
- Adds `x-domain` header for domain-based detection

## Examples

### Dashboard Page

```typescript
// app/(home)/tenant/page.tsx
import { loadTenantCollectionData } from "@/lib/tenant-data-loader";

async function getDashboardData() {
  const [products, orders, categories] = await Promise.all([
    loadTenantCollectionData("products"),
    loadTenantCollectionData("orders", {}, { sort: { _id: -1 } }),
    loadTenantCollectionData("product_categories"),
  ]);
  
  return { products, orders, categories };
}
```

### Product API Route

```typescript
// app/api/products/route.ts
import { loadTenantCollectionData } from "@/lib/tenant-data-loader";

export async function GET() {
  const products = await loadTenantCollectionData("products");
  return NextResponse.json({ products });
}
```

## Benefits

1. **Automatic Detection** - No need to manually pass tenant ID
2. **Database Routing** - Automatically uses correct database
3. **Data Isolation** - Ensures tenants only see their data
4. **Caching** - React cache ensures same data across request
5. **Flexible** - Works with shared or separate databases

## Migration Guide

### Before

```typescript
const products = await getCollection("products").find({}).toArray();
```

### After

```typescript
const products = await loadTenantCollectionData("products");
```

The new system automatically:
- Detects tenant
- Routes to correct database
- Filters by tenantId if needed
- Handles both shared and separate databases


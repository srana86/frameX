# Merchant Data Loading System

## Overview

The merchant data loading system automatically detects and loads merchant-specific data based on the request context. It supports:

- **Environment-based detection** (for deployed merchant instances)
- **Domain-based detection** (for custom domains)
- **Header-based detection** (for API requests)
- **Automatic database routing** (shared or separate databases)

## Architecture

### Core Components

1. **`lib/merchant-loader.ts`** - Core loader that detects and loads merchant data
2. **`lib/merchant-context.ts`** - React cache-based context provider
3. **`lib/merchant-data-loader.ts`** - Helper functions for loading merchant-specific collections
4. **`middleware.ts`** - Next.js middleware to detect merchant from domain/headers
5. **`app/api/merchant/context/route.ts`** - API endpoint to get merchant context

## How It Works

### 1. Merchant Detection

The system detects merchant ID from multiple sources (in order):

1. **Environment Variable** (`MERCHANT_ID`) - For deployed merchant instances
2. **Request Headers** (`x-merchant-id`) - For API requests
3. **Domain/Subdomain** - Looks up merchant by custom domain

### 2. Data Loading

Once merchant is detected, the system loads:

- **Merchant Profile** - Basic merchant information
- **Database Configuration** - Which database to use (shared or separate)
- **Deployment Configuration** - Deployment URL and status
- **Connection String** - Database connection (if separate DB)

### 3. Database Routing

The system automatically routes to the correct database:

- **Separate Database**: Uses merchant's dedicated MongoDB database
- **Shared Database**: Uses main database with `merchantId` filtering

## Usage

### In Server Components

```typescript
import { getMerchantContext, getCurrentMerchant } from "@/lib/merchant-context";

// Get full merchant context
const context = await getMerchantContext();
if (context) {
  console.log("Merchant:", context.merchant.name);
  console.log("Database:", context.dbName);
}

// Get just merchant
const merchant = await getCurrentMerchant();
```

### Loading Merchant-Specific Data

```typescript
import { loadMerchantCollectionData, loadMerchantDocument } from "@/lib/merchant-data-loader";

// Load all products for current merchant
const products = await loadMerchantCollectionData("products", {}, { 
  sort: { createdAt: -1 },
  limit: 10 
});

// Load single document
const product = await loadMerchantDocument("products", { slug: "my-product" });

// Count documents
const count = await countMerchantDocuments("orders", { status: "pending" });
```

### In API Routes

```typescript
import { loadMerchantData } from "@/lib/merchant-loader";

export async function GET(request: Request) {
  // Get merchant ID from query params or auto-detect
  const { searchParams } = new URL(request.url);
  const merchantId = searchParams.get("merchantId");
  
  // Load merchant data
  const context = await loadMerchantData(merchantId || undefined);
  
  if (!context) {
    return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
  }
  
  // Use context.merchant, context.database, etc.
}
```

### Using Merchant Collection Helper

```typescript
import { getMerchantCollection } from "@/lib/merchant-data-loader";

// Get collection for current merchant
const productsCol = await getMerchantCollection("products");

// Use normally - automatically uses merchant's database
const products = await productsCol.find({}).toArray();
```

## API Endpoints

### GET /api/merchant/context

Get current merchant context data.

**Query Parameters:**
- `merchantId` (optional) - Specific merchant ID

**Response:**
```json
{
  "success": true,
  "data": {
    "merchant": {
      "id": "merchant_123",
      "name": "My Store",
      "email": "store@example.com",
      "status": "active",
      "settings": { ... }
    },
    "database": {
      "id": "db_123",
      "databaseName": "merchant_123_db",
      "useSharedDatabase": false,
      "status": "active"
    },
    "deployment": {
      "id": "deploy_123",
      "deploymentUrl": "merchant-123.vercel.app",
      "deploymentStatus": "active"
    },
    "dbName": "merchant_123_db",
    "hasConnectionString": true
  }
}
```

## Environment Variables

For deployed merchant instances, set:

```env
MERCHANT_ID=merchant_123
MERCHANT_DB_NAME=merchant_123_db
MONGODB_URI=mongodb://.../merchant_123_db
NEXT_PUBLIC_MERCHANT_ID=merchant_123
```

## Middleware

The middleware automatically:
- Detects merchant from domain/subdomain
- Adds `x-merchant-id` header to requests
- Adds `x-domain` header for domain-based detection

## Examples

### Dashboard Page

```typescript
// app/(home)/merchant/page.tsx
import { loadMerchantCollectionData } from "@/lib/merchant-data-loader";

async function getDashboardData() {
  const [products, orders, categories] = await Promise.all([
    loadMerchantCollectionData("products"),
    loadMerchantCollectionData("orders", {}, { sort: { _id: -1 } }),
    loadMerchantCollectionData("product_categories"),
  ]);
  
  return { products, orders, categories };
}
```

### Product API Route

```typescript
// app/api/products/route.ts
import { loadMerchantCollectionData } from "@/lib/merchant-data-loader";

export async function GET() {
  const products = await loadMerchantCollectionData("products");
  return NextResponse.json({ products });
}
```

## Benefits

1. **Automatic Detection** - No need to manually pass merchant ID
2. **Database Routing** - Automatically uses correct database
3. **Data Isolation** - Ensures merchants only see their data
4. **Caching** - React cache ensures same data across request
5. **Flexible** - Works with shared or separate databases

## Migration Guide

### Before

```typescript
const products = await getCollection("products").find({}).toArray();
```

### After

```typescript
const products = await loadMerchantCollectionData("products");
```

The new system automatically:
- Detects merchant
- Routes to correct database
- Filters by merchantId if needed
- Handles both shared and separate databases


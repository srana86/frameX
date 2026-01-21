# Migration Guide: Adding Multi-Tenant Support

## 🔄 How to Update Existing APIs

### Before (Single Tenant)

```typescript
// app/api/products/route.ts
import { getCollection } from "@/lib/mongodb";

export async function GET() {
  const col = await getCollection("products");
  const products = await col.find({}).toArray();
  return NextResponse.json(products);
}
```

### After (Multi-Tenant)

```typescript
// app/api/products/route.ts
import { getTenantCollection } from "@/lib/mongodb-tenant";
import { requireAuth } from "@/lib/auth-helpers";

export async function GET() {
  const user = await requireAuth("tenant");
  const col = await getTenantCollection("products", user.id);
  const products = await col.find({}).toArray();
  return NextResponse.json(products);
}
```

## 📝 Step-by-Step Migration

### Step 1: Update Imports

```typescript
// OLD
import { getCollection } from "@/lib/mongodb";

// NEW
import { getTenantCollection } from "@/lib/mongodb-tenant";
import { requireAuth } from "@/lib/auth-helpers";
```

### Step 2: Get Tenant Context

```typescript
// Get authenticated tenant
const user = await requireAuth("tenant");
const tenantId = user.id;
```

### Step 3: Use Tenant Collection

```typescript
// OLD
const col = await getCollection("products");
const items = await col.find({}).toArray();

// NEW
const col = await getTenantCollection("products", tenantId);
const items = await col.find({}).toArray();
// Automatically filters by tenantId
```

### Step 4: Update POST/PUT/DELETE

```typescript
// POST - Create
const col = await getTenantCollection("products", tenantId);
await col.insertOne({ name: "Product", price: 100 });
// tenantId automatically added

// PUT - Update
await col.updateOne({ id: productId }, { $set: { name: "Updated" } });
// Only updates if tenantId matches

// DELETE
await col.deleteOne({ id: productId });
// Only deletes if tenantId matches
```

## 🎯 APIs to Update

### High Priority

- [ ] `/api/products` - Products CRUD
- [ ] `/api/orders` - Orders management
- [ ] `/api/inventory` - Inventory tracking
- [ ] `/api/brand-config` - Brand configuration
- [ ] `/api/sslcommerz-config` - Payment config
- [ ] `/api/ads-config` - Ads configuration
- [ ] `/api/pages` - Custom pages

### Medium Priority

- [ ] `/api/products/categories` - Categories
- [ ] `/api/pages/categories` - Page categories
- [ ] `/api/hero-slides` - Hero slides
- [ ] `/api/promotional-banner` - Banners

## 🔍 Example: Complete API Migration

### Products API - Full Example

```typescript
import { NextResponse } from "next/server";
import { getTenantCollection } from "@/lib/mongodb-tenant";
import { requireAuth } from "@/lib/auth-helpers";
import type { Product } from "@/lib/types";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const user = await requireAuth("tenant");
    const col = await getTenantCollection("products", user.id);

    const docs = await col.find({}).sort({ order: 1, _id: -1 }).toArray();
    const items: Product[] = docs.map((d: any) => ({
      id: String(d._id),
      slug: d.slug,
      name: d.name,
      // ... other fields
    }));

    return NextResponse.json(items);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth("tenant");
    const body = await request.json();

    const col = await getTenantCollection("products", user.id);

    // Check product limit (from subscription)
    // ... subscription check code ...

    const newProduct = {
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // tenantId is automatically added by getTenantCollection
    };

    await col.insertOne(newProduct);

    // Increment usage
    // await incrementFeatureUsage(user.id, "max_products", 1);

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

## ⚠️ Important Notes

1. **Always use `getTenantCollection`** for tenant-specific data
2. **Never manually add tenantId** - it's automatic
3. **Always require authentication** before accessing tenant data
4. **Use `requireAuth("tenant")`** to get tenant context
5. **Test data isolation** - ensure tenants can't see each other's data

## 🧪 Testing Multi-Tenant Isolation

```typescript
// Test that tenant A can't see tenant B's data
const tenantA = await requireAuth("tenant"); // tenant_123
const tenantB = await requireAuth("tenant"); // tenant_456

const colA = await getTenantCollection("products", tenantA.id);
const colB = await getTenantCollection("products", tenantB.id);

const productsA = await colA.find({}).toArray();
const productsB = await colB.find({}).toArray();

// productsA should only contain tenant_123's products
// productsB should only contain tenant_456's products
// They should never overlap
```

## 🔐 Security Checklist

- [ ] All tenant APIs require authentication
- [ ] All queries use `getTenantCollection` (not `getCollection`)
- [ ] No direct database access without tenantId
- [ ] Super admin uses `getCollection` (no tenantId filter)
- [ ] Custom domain validation before tenant access
- [ ] Environment variables isolated per deployment

## 📊 Database Migration

### Add tenantId to Existing Data

```typescript
// Migration script
import { getCollection } from "@/lib/mongodb";

async function migrateExistingData() {
  const productsCol = await getCollection("products");

  // Assign all existing products to a default tenant
  const defaultTenantId = "tenant_default";

  await productsCol.updateMany({ tenantId: { $exists: false } }, { $set: { tenantId: defaultTenantId } });

  // Repeat for other collections
}
```

## 🚀 Quick Reference

| Task           | Old Code                      | New Code                                          |
| -------------- | ----------------------------- | ------------------------------------------------- |
| Get collection | `getCollection("products")`   | `getTenantCollection("products", tenantId)`   |
| Find all       | `col.find({})`                | `col.find({})` (auto-filters by tenantId)       |
| Insert         | `col.insertOne(doc)`          | `col.insertOne(doc)` (auto-adds tenantId)       |
| Update         | `col.updateOne({id}, update)` | `col.updateOne({id}, update)` (checks tenantId) |
| Delete         | `col.deleteOne({id})`         | `col.deleteOne({id})` (checks tenantId)         |

## ✅ Migration Complete When

- [ ] All tenant APIs use `getTenantCollection`
- [ ] All APIs require authentication
- [ ] Existing data has tenantId field
- [ ] Data isolation tested
- [ ] Super admin panel functional
- [ ] Deployment system ready

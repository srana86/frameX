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
import { getMerchantCollection } from "@/lib/mongodb-tenant";
import { requireAuth } from "@/lib/auth-helpers";

export async function GET() {
  const user = await requireAuth("merchant");
  const col = await getMerchantCollection("products", user.id);
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
import { getMerchantCollection } from "@/lib/mongodb-tenant";
import { requireAuth } from "@/lib/auth-helpers";
```

### Step 2: Get Merchant Context

```typescript
// Get authenticated merchant
const user = await requireAuth("merchant");
const merchantId = user.id;
```

### Step 3: Use Merchant Collection

```typescript
// OLD
const col = await getCollection("products");
const items = await col.find({}).toArray();

// NEW
const col = await getMerchantCollection("products", merchantId);
const items = await col.find({}).toArray();
// Automatically filters by merchantId
```

### Step 4: Update POST/PUT/DELETE

```typescript
// POST - Create
const col = await getMerchantCollection("products", merchantId);
await col.insertOne({ name: "Product", price: 100 });
// merchantId automatically added

// PUT - Update
await col.updateOne({ id: productId }, { $set: { name: "Updated" } });
// Only updates if merchantId matches

// DELETE
await col.deleteOne({ id: productId });
// Only deletes if merchantId matches
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
import { getMerchantCollection } from "@/lib/mongodb-tenant";
import { requireAuth } from "@/lib/auth-helpers";
import type { Product } from "@/lib/types";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const user = await requireAuth("merchant");
    const col = await getMerchantCollection("products", user.id);

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
    const user = await requireAuth("merchant");
    const body = await request.json();

    const col = await getMerchantCollection("products", user.id);

    // Check product limit (from subscription)
    // ... subscription check code ...

    const newProduct = {
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // merchantId is automatically added by getMerchantCollection
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

1. **Always use `getMerchantCollection`** for merchant-specific data
2. **Never manually add merchantId** - it's automatic
3. **Always require authentication** before accessing merchant data
4. **Use `requireAuth("merchant")`** to get merchant context
5. **Test data isolation** - ensure merchants can't see each other's data

## 🧪 Testing Multi-Tenant Isolation

```typescript
// Test that merchant A can't see merchant B's data
const merchantA = await requireAuth("merchant"); // merchant_123
const merchantB = await requireAuth("merchant"); // merchant_456

const colA = await getMerchantCollection("products", merchantA.id);
const colB = await getMerchantCollection("products", merchantB.id);

const productsA = await colA.find({}).toArray();
const productsB = await colB.find({}).toArray();

// productsA should only contain merchant_123's products
// productsB should only contain merchant_456's products
// They should never overlap
```

## 🔐 Security Checklist

- [ ] All merchant APIs require authentication
- [ ] All queries use `getMerchantCollection` (not `getCollection`)
- [ ] No direct database access without merchantId
- [ ] Super admin uses `getCollection` (no merchantId filter)
- [ ] Custom domain validation before merchant access
- [ ] Environment variables isolated per deployment

## 📊 Database Migration

### Add merchantId to Existing Data

```typescript
// Migration script
import { getCollection } from "@/lib/mongodb";

async function migrateExistingData() {
  const productsCol = await getCollection("products");

  // Assign all existing products to a default merchant
  const defaultMerchantId = "merchant_default";

  await productsCol.updateMany({ merchantId: { $exists: false } }, { $set: { merchantId: defaultMerchantId } });

  // Repeat for other collections
}
```

## 🚀 Quick Reference

| Task           | Old Code                      | New Code                                          |
| -------------- | ----------------------------- | ------------------------------------------------- |
| Get collection | `getCollection("products")`   | `getMerchantCollection("products", merchantId)`   |
| Find all       | `col.find({})`                | `col.find({})` (auto-filters by merchantId)       |
| Insert         | `col.insertOne(doc)`          | `col.insertOne(doc)` (auto-adds merchantId)       |
| Update         | `col.updateOne({id}, update)` | `col.updateOne({id}, update)` (checks merchantId) |
| Delete         | `col.deleteOne({id})`         | `col.deleteOne({id})` (checks merchantId)         |

## ✅ Migration Complete When

- [ ] All merchant APIs use `getMerchantCollection`
- [ ] All APIs require authentication
- [ ] Existing data has merchantId field
- [ ] Data isolation tested
- [ ] Super admin panel functional
- [ ] Deployment system ready

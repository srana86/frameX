# Dynamic Plan Management Guide

## 🎯 Overview

The system uses a **single source of truth** for subscription plans stored in the database. Admins can customize plans dynamically, and merchants automatically get features based on their plan.

## 📊 How It Works

### 1. **Single Source of Truth**
- Plans are stored in `subscription_plans` collection
- All feature checks read from database
- No hardcoded plan logic
- Changes to plans take effect immediately

### 2. **Feature Definitions**
- All available features are defined in `lib/feature-definitions.ts`
- Features are categorized (products, storage, domain, analytics, etc.)
- Each feature has a type (boolean, number, unlimited, string, array)
- Features can be added/removed by updating the definitions

### 3. **Dynamic Plan Configuration**
- Admin can customize any plan from `/admin/subscription-plans`
- Features are configured per plan
- Changes are saved to database
- Merchants get updated features automatically

## 🔧 Admin Panel Usage

### Access Plan Management
1. Go to `/admin/subscription-plans`
2. View all plans
3. Click "Edit" on any plan
4. Configure features in tabs:
   - Products
   - Storage
   - Domain
   - Analytics
   - Payment
   - Team
   - Support

### Creating a New Plan
1. Click "Create Plan"
2. Enter plan name, price, description
3. Configure features in each category
4. Set plan as "Popular" if needed
5. Save plan

### Editing Features
- **Boolean features**: Toggle on/off
- **Number features**: Enter number or set "Unlimited"
- **String features**: Select from dropdown
- **Array features**: Check/uncheck options

## 💡 How Merchants Get Features

### Example 1: Check Product Limit
```typescript
import { canUseFeature, incrementFeatureUsage } from "@/lib/subscription-helpers";

// Before creating product
const canCreate = await canUseFeature(merchantId, "max_products", 1);
if (!canCreate) {
  return NextResponse.json({ 
    error: "Product limit reached. Please upgrade your plan." 
  }, { status: 403 });
}

// After creating product
await incrementFeatureUsage(merchantId, "max_products", 1);
```

### Example 2: Check Custom Domain Access
```typescript
import { hasFeature } from "@/lib/feature-helpers";

const canUseCustomDomain = await hasFeature(merchantId, "custom_domain");
if (!canUseCustomDomain) {
  // Show upgrade prompt
  return NextResponse.json({ 
    error: "Custom domain requires Professional plan or higher" 
  }, { status: 403 });
}
```

### Example 3: Check Ads Platform Access
```typescript
import { hasFeatureValue } from "@/lib/feature-helpers";

// Check if merchant can use TikTok pixel
const canUseTikTok = await hasFeatureValue(
  merchantId, 
  "ads_tracking_platforms", 
  "tiktok"
);

if (!canUseTikTok) {
  // Disable TikTok option in ads config
}
```

### Example 4: Get Feature Value
```typescript
import { getFeatureAsNumber, getFeatureAsArray } from "@/lib/feature-helpers";

// Get storage limit
const storageLimit = await getFeatureAsNumber(merchantId, "max_storage_gb");
// Returns: 50 or "unlimited" or null

// Get available ads platforms
const platforms = await getFeatureAsArray(merchantId, "ads_tracking_platforms");
// Returns: ["meta", "tiktok", "gtm"] or null
```

## 🎨 Feature Types

### Boolean Features
- `custom_domain`: true/false
- `remove_branding`: true/false
- `advanced_analytics`: true/false
- `export_data`: true/false

### Number Features
- `max_products`: 50, 500, or "unlimited"
- `max_storage_gb`: 5, 50, 500, or "unlimited"
- `payment_gateways`: 1, 2, or "unlimited"
- `team_members`: 1, 5, or "unlimited"

### String Features
- `api_access`: "none" | "limited" | "full"
- `support_level`: "email" | "priority" | "24/7"

### Array Features
- `ads_tracking_platforms`: ["meta", "tiktok", "gtm", ...]

## 📝 Adding New Features

### Step 1: Add Feature Definition
```typescript
// In lib/feature-definitions.ts
{
  key: "new_feature",
  name: "New Feature",
  description: "Description of new feature",
  type: "boolean", // or "number", "string", "array"
  category: "products", // or any category
  defaultValue: false,
}
```

### Step 2: Add to PlanFeatures Type (Optional)
```typescript
// In lib/subscription-types.ts
export interface PlanFeatures {
  // ... existing features
  new_feature?: boolean; // Add new feature
}
```

### Step 3: Use in Code
```typescript
import { hasFeature } from "@/lib/feature-helpers";

const hasNewFeature = await hasFeature(merchantId, "new_feature");
```

## 🔄 Flow Diagram

```
Admin Updates Plan
    ↓
Plan Saved to Database
    ↓
Merchant API Call
    ↓
getMerchantSubscription() → Gets subscription
    ↓
getSubscriptionPlan() → Gets plan from database
    ↓
plan.features → Returns current features
    ↓
Feature Check → Uses actual plan features
    ↓
Merchant Gets Feature Access
```

## ✅ Benefits

1. **Single Source of Truth**: Plans in database, no code changes needed
2. **Dynamic Configuration**: Change plans without deploying code
3. **Flexible Features**: Add new features easily
4. **Real-time Updates**: Changes take effect immediately
5. **Type Safe**: TypeScript types for all features

## 🚀 Quick Start

1. **Go to Admin Panel**: `/admin/subscription-plans`
2. **Edit a Plan**: Click edit on any plan
3. **Configure Features**: Change feature values
4. **Save**: Changes are saved to database
5. **Test**: Merchants immediately get new features

## 📚 Key Files

- `lib/feature-definitions.ts` - Feature definitions (single source)
- `lib/subscription-helpers.ts` - Feature checking functions
- `lib/feature-helpers.ts` - Helper functions for features
- `app/(home)/admin/subscription-plans/` - Admin UI for plans

Everything is dynamic and database-driven! 🎉


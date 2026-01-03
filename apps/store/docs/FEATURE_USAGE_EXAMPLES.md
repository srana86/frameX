# Feature Usage Examples

## How to Use Dynamic Plan Features in Your Code

## 🎯 Core Concept

All features come from the database plan (single source of truth). When you check a feature, it reads from the merchant's current plan stored in the database.

## 📚 Available Helper Functions

### From `lib/subscription-helpers.ts`:

- `checkFeatureAccess()` - Check if merchant has feature access
- `getFeatureLimit()` - Get feature limit/value
- `canUseFeature()` - Check if can use feature within limits
- `incrementFeatureUsage()` - Track usage

### From `lib/feature-helpers.ts`:

- `getMerchantFeatures()` - Get all features for merchant
- `getMerchantFeature()` - Get specific feature value
- `hasFeature()` - Check boolean feature
- `getFeatureAsNumber()` - Get numeric feature
- `getFeatureAsArray()` - Get array feature
- `hasFeatureValue()` - Check if value exists in array/string feature

## 💻 Code Examples

### Example 1: Product Creation with Limit Check

```typescript
// app/api/products/route.ts
import { canUseFeature, incrementFeatureUsage } from "@/lib/subscription-helpers";
import { requireAuth } from "@/lib/auth-helpers";

export async function POST(request: Request) {
  const user = await requireAuth("merchant");
  const body = await request.json();

  // Check if merchant can create more products
  const canCreate = await canUseFeature(user.id, "max_products", 1);

  if (!canCreate) {
    return NextResponse.json(
      {
        error: "Product limit reached. Please upgrade your plan to add more products.",
        limitReached: true,
        feature: "max_products",
      },
      { status: 403 }
    );
  }

  // Create product...
  const product = await createProduct(body);

  // Track usage
  await incrementFeatureUsage(user.id, "max_products", 1);

  return NextResponse.json(product, { status: 201 });
}
```

### Example 2: File Upload with Storage Check

```typescript
// app/api/upload/route.ts
import { getFeatureAsNumber, getFeatureUsage } from "@/lib/feature-helpers";
import { requireAuth } from "@/lib/auth-helpers";

export async function POST(request: Request) {
  const user = await requireAuth("merchant");
  const formData = await request.formData();
  const file = formData.get("file") as File;

  // Get storage limit
  const storageLimit = await getFeatureAsNumber(user.id, "max_storage_gb");
  if (!storageLimit) {
    return NextResponse.json({ error: "Storage feature not available" }, { status: 403 });
  }

  // Get current usage
  const currentUsage = await getFeatureUsage(user.id, "max_storage_gb");
  const fileSizeGB = file.size / (1024 * 1024 * 1024);

  // Check if can upload
  if (storageLimit !== "unlimited") {
    if (currentUsage + fileSizeGB > storageLimit) {
      return NextResponse.json(
        {
          error: `Storage limit exceeded. You have ${storageLimit}GB, currently using ${currentUsage.toFixed(2)}GB.`,
          limit: storageLimit,
          current: currentUsage,
          required: fileSizeGB,
        },
        { status: 403 }
      );
    }
  }

  // Upload file...
  const uploaded = await uploadFile(file);

  // Track usage
  await incrementFeatureUsage(user.id, "max_storage_gb", fileSizeGB);

  return NextResponse.json(uploaded);
}
```

### Example 3: Custom Domain Configuration

```typescript
// app/api/merchant/domain/configure/route.ts
import { hasFeature } from "@/lib/feature-helpers";
import { requireAuth } from "@/lib/auth-helpers";

export async function POST(request: Request) {
  const user = await requireAuth("merchant");
  const { domain } = await request.json();

  // Check if merchant has custom domain feature
  const canUseCustomDomain = await hasFeature(user.id, "custom_domain");

  if (!canUseCustomDomain) {
    return NextResponse.json(
      {
        error: "Custom domain is not available in your plan. Please upgrade to Professional or Enterprise plan.",
        feature: "custom_domain",
        upgradeRequired: true,
      },
      { status: 403 }
    );
  }

  // Configure domain...
  return NextResponse.json({ success: true });
}
```

### Example 4: Ads Platform Selection

```typescript
// app/api/ads-config/route.ts
import { hasFeatureValue, getFeatureAsArray } from "@/lib/feature-helpers";
import { requireAuth } from "@/lib/auth-helpers";

export async function PUT(request: Request) {
  const user = await requireAuth("merchant");
  const body = await request.json();

  // Get available platforms from plan
  const availablePlatforms = await getFeatureAsArray(user.id, "ads_tracking_platforms");

  if (!availablePlatforms || availablePlatforms.length === 0) {
    return NextResponse.json({ error: "Ads tracking is not available in your plan" }, { status: 403 });
  }

  // Validate each platform
  const requestedPlatforms = Object.keys(body).filter((key) => key.endsWith("Pixel") || key.endsWith("Tag") || key.includes("Pixel"));

  for (const platform of requestedPlatforms) {
    const platformKey = platform.toLowerCase().replace("pixel", "").replace("tag", "").trim();

    // Check if platform is available in plan
    if (!availablePlatforms.includes(platformKey)) {
      return NextResponse.json(
        {
          error: `${platform} is not available in your plan. Available platforms: ${availablePlatforms.join(", ")}`,
          availablePlatforms,
          requestedPlatform: platformKey,
        },
        { status: 403 }
      );
    }
  }

  // Save config...
  return NextResponse.json({ success: true });
}
```

### Example 5: Payment Gateway Configuration

```typescript
// app/api/sslcommerz-config/route.ts
import { getFeatureAsNumber } from "@/lib/feature-helpers";
import { requireAuth } from "@/lib/auth-helpers";

export async function PUT(request: Request) {
  const user = await requireAuth("merchant");
  const body = await request.json();

  // Get payment gateway limit
  const gatewayLimit = await getFeatureAsNumber(user.id, "payment_gateways");

  if (!gatewayLimit) {
    return NextResponse.json({ error: "Payment gateways not available" }, { status: 403 });
  }

  // Count existing gateways
  const existingConfig = await getPaymentConfig(user.id);
  const enabledGateways = existingConfig ? 1 : 0; // Count enabled gateways

  // Check limit
  if (gatewayLimit !== "unlimited" && enabledGateways >= gatewayLimit) {
    return NextResponse.json(
      {
        error: `Payment gateway limit reached. Your plan allows ${gatewayLimit} gateway(s).`,
        limit: gatewayLimit,
        current: enabledGateways,
      },
      { status: 403 }
    );
  }

  // Save config...
  return NextResponse.json({ success: true });
}
```

### Example 6: API Access Check

```typescript
// app/api/products/export/route.ts
import { getFeatureAsString } from "@/lib/feature-helpers";
import { requireAuth } from "@/lib/auth-helpers";

export async function GET(request: Request) {
  const user = await requireAuth("merchant");

  // Check API access level
  const apiAccess = await getFeatureAsString(user.id, "api_access");

  if (!apiAccess || apiAccess === "none") {
    return NextResponse.json({ error: "API access is not available in your plan" }, { status: 403 });
  }

  if (apiAccess === "limited") {
    // Apply rate limiting
    // Check API call count
  }

  // Export data...
  return NextResponse.json({ data: "..." });
}
```

### Example 7: Team Member Addition

```typescript
// app/api/team/members/route.ts
import { canUseFeature, incrementFeatureUsage } from "@/lib/subscription-helpers";
import { requireAuth } from "@/lib/auth-helpers";

export async function POST(request: Request) {
  const user = await requireAuth("merchant");
  const body = await request.json();

  // Check team member limit
  const canAddMember = await canUseFeature(user.id, "team_members", 1);

  if (!canAddMember) {
    return NextResponse.json(
      {
        error: "Team member limit reached. Please upgrade your plan.",
        feature: "team_members",
      },
      { status: 403 }
    );
  }

  // Add team member...
  const member = await addTeamMember(body);

  // Track usage
  await incrementFeatureUsage(user.id, "team_members", 1);

  return NextResponse.json(member, { status: 201 });
}
```

## 🎨 UI Examples

### Show/Hide Features Based on Plan

```typescript
// components/merchant/FeatureGate.tsx
"use client";

import { useEffect, useState } from "react";
import { hasFeature } from "@/lib/feature-helpers";

export function FeatureGate({ feature, children, fallback }: { feature: string; children: React.ReactNode; fallback?: React.ReactNode }) {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/merchant/features/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feature }),
    })
      .then((res) => res.json())
      .then((data) => {
        setHasAccess(data.hasAccess);
        setLoading(false);
      });
  }, [feature]);

  if (loading) return null;
  if (!hasAccess) return fallback || null;
  return <>{children}</>;
}

// Usage:
<FeatureGate feature='custom_domain' fallback={<UpgradePrompt />}>
  <CustomDomainConfig />
</FeatureGate>;
```

### Display Feature Limits

```typescript
// components/merchant/FeatureLimit.tsx
"use client";

import { useEffect, useState } from "react";

export function FeatureLimit({ feature }: { feature: string }) {
  const [limit, setLimit] = useState<any>(null);
  const [usage, setUsage] = useState(0);

  useEffect(() => {
    Promise.all([
      fetch("/api/merchant/features/limit?feature=" + feature).then((r) => r.json()),
      fetch("/api/merchant/features/usage?feature=" + feature).then((r) => r.json()),
    ]).then(([limitData, usageData]) => {
      setLimit(limitData.limit);
      setUsage(usageData.usage);
    });
  }, [feature]);

  if (!limit) return null;

  return (
    <div className='text-sm'>
      {limit === "unlimited" ? (
        <span>Unlimited</span>
      ) : (
        <span>
          {usage} / {limit} used
        </span>
      )}
    </div>
  );
}
```

## 🔄 Complete Flow

1. **Admin updates plan** in `/admin/subscription-plans`
2. **Plan saved to database** in `subscription_plans` collection
3. **Merchant makes API call** (e.g., create product)
4. **System checks feature** using `canUseFeature(merchantId, "max_products")`
5. **Function reads plan** from database via `getSubscriptionPlan()`
6. **Returns feature value** from `plan.features.max_products`
7. **Decision made** based on actual plan value
8. **Merchant gets access** or upgrade prompt

## ✅ Key Points

- ✅ **Single Source of Truth**: Database plans
- ✅ **Dynamic**: No code changes needed to update plans
- ✅ **Real-time**: Changes take effect immediately
- ✅ **Type Safe**: TypeScript types for all features
- ✅ **Flexible**: Easy to add new features

All feature checks read from the database plan! 🎉

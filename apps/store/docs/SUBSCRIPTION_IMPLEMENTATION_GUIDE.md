# Subscription System - Implementation Guide

## ✅ What Has Been Implemented

### 1. Core Types & Schemas (`lib/subscription-types.ts`)

- Complete TypeScript types for all subscription entities
- Default 3-tier plan structure (Starter, Professional, Enterprise)
- Feature definitions and limits

### 2. Helper Functions (`lib/subscription-helpers.ts`)

- `getMerchantSubscription()` - Get active subscription
- `getSubscriptionPlan()` - Get plan details
- `checkFeatureAccess()` - Check if merchant has feature access
- `getFeatureLimit()` - Get feature limit for merchant
- `getFeatureUsage()` - Get current usage
- `canUseFeature()` - Check if can use feature within limits
- `incrementFeatureUsage()` - Track usage
- `isSubscriptionActive()` - Validate subscription status

### 3. API Routes

- **Admin Routes:**
  - `GET/POST/PUT/DELETE /api/admin/subscription-plans` - Manage plans
- **Merchant Routes:**
  - `GET /api/subscriptions/plans` - View available plans
  - `GET /api/subscriptions/current` - Get current subscription
  - `POST /api/subscriptions/create` - Create new subscription

## 📋 Next Steps to Complete

### 4. Admin Panel UI

Create admin pages for:

- **Plans Management** (`/admin/subscription-plans`)
  - List all plans
  - Create/Edit/Delete plans
  - Configure features for each plan
  - Set pricing

### 5. Merchant Subscription UI

Create merchant pages for:

- **Subscription Dashboard** (`/merchant/subscription`)
  - View current plan
  - See usage vs limits
  - Upgrade/Downgrade options
  - Billing history

### 6. Feature Gating Integration

Add feature checks throughout the app:

- Product creation: Check `max_products` limit
- Storage uploads: Check `max_storage_gb` limit
- Ads config: Check `ads_tracking_platforms` access
- Payment gateways: Check `payment_gateways` limit
- Team members: Check `team_members` limit

### 7. Payment Integration

- Integrate payment gateway (SSLCommerz or Stripe) for subscriptions
- Handle recurring payments
- Webhook handlers for payment events

### 8. Renewal System

- Cron job or scheduled task to:
  - Check expiring subscriptions
  - Generate invoices
  - Process payments
  - Update subscription status

### 9. Usage Tracking

- Track product count
- Track storage usage
- Track API calls
- Display usage in merchant dashboard

## 🔧 How to Use Feature Gating

### Example: Check Product Limit Before Creation

```typescript
import { canUseFeature, incrementFeatureUsage } from "@/lib/subscription-helpers";

// Before creating product
const canCreate = await canUseFeature(merchantId, "max_products", 1);
if (!canCreate) {
  return NextResponse.json({ error: "Product limit reached. Please upgrade your plan." }, { status: 403 });
}

// After creating product
await incrementFeatureUsage(merchantId, "max_products", 1);
```

### Example: Check Feature Access

```typescript
import { checkFeatureAccess } from "@/lib/subscription-helpers";

// Check if merchant can use custom domain
const canUseCustomDomain = await checkFeatureAccess(merchantId, "custom_domain");
if (!canUseCustomDomain) {
  // Show upgrade prompt
}
```

## 📊 Database Collections Needed

1. **subscription_plans** - Plan definitions
2. **merchant_subscriptions** - Active subscriptions
3. **subscription_usage** - Usage tracking
4. **subscription_invoices** - Billing history
5. **subscription_payments** - Payment records

## 🎯 Feature Flags to Implement

Based on the plan features, gate these areas:

1. **Products:**

   - Max products limit
   - Product creation/editing

2. **Storage:**

   - File upload size limits
   - Total storage quota

3. **Branding:**

   - Custom domain setup
   - Remove branding option

4. **Analytics:**

   - Advanced analytics dashboard
   - Export capabilities

5. **Ads Tracking:**

   - Number of tracking platforms
   - Advanced tracking features

6. **Payment:**

   - Number of payment gateways
   - Payment gateway configuration

7. **Team:**

   - Add team members
   - Role management

8. **API:**
   - API access
   - Rate limits
   - API key generation

## 💡 Recommended Implementation Order

1. ✅ Core types and helpers (DONE)
2. ✅ API routes (DONE)
3. Admin panel for plans management
4. Merchant subscription UI
5. Feature gating in product creation
6. Payment integration
7. Renewal system
8. Usage tracking
9. Additional feature gates

## 🔐 Security Considerations

- Always verify merchant ID from authenticated session
- Validate subscription status before allowing actions
- Check limits before incrementing usage
- Handle subscription expiration gracefully
- Implement grace period for expired subscriptions

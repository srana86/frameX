# SaaS Subscription System - Implementation Plan

## Overview

Convert the e-commerce platform into a multi-tenant SaaS where tenants pay monthly subscriptions with feature-based plans.

## Architecture

### 1. Database Collections

#### `subscription_plans`

- Plan definitions with features and limits
- Managed by admin
- Fields: id, name, price, billingCycle, features (object), limits (object), isActive, createdAt, updatedAt

#### `tenant_subscriptions`

- Active subscriptions for each tenant
- Fields: id, tenantId, planId, status (active/trial/expired/cancelled), currentPeriodStart, currentPeriodEnd, trialEndsAt, cancelAtPeriodEnd, createdAt, updatedAt

#### `subscription_features`

- Feature definitions (reusable across plans)
- Fields: id, key, name, description, type (boolean/number/unlimited), defaultValue

#### `subscription_usage`

- Track usage for metered features
- Fields: id, tenantId, featureKey, period (YYYY-MM), currentUsage, limit, resetAt

#### `subscription_invoices`

- Billing history
- Fields: id, tenantId, subscriptionId, amount, status (pending/paid/failed), dueDate, paidAt, invoiceNumber, items[]

#### `subscription_payments`

- Payment records
- Fields: id, invoiceId, tenantId, amount, paymentMethod, transactionId, status, createdAt

### 2. Subscription Plans Structure

#### Plan 1: Starter ($29/month)

- Products: 50 max
- Orders: Unlimited
- Storage: 5GB
- Custom Domain: No
- Advanced Analytics: No
- API Access: No
- Support: Email only
- Ads Tracking: Basic (Meta, GTM)
- Payment Gateway: 1
- Team Members: 1

#### Plan 2: Professional ($79/month)

- Products: 500 max
- Orders: Unlimited
- Storage: 50GB
- Custom Domain: Yes
- Advanced Analytics: Yes
- API Access: Limited
- Support: Priority email
- Ads Tracking: All platforms
- Payment Gateway: 2
- Team Members: 5

#### Plan 3: Enterprise ($199/month)

- Products: Unlimited
- Orders: Unlimited
- Storage: 500GB
- Custom Domain: Yes
- Advanced Analytics: Yes
- API Access: Full
- Support: 24/7 Priority
- Ads Tracking: All platforms + Custom
- Payment Gateway: Unlimited
- Team Members: Unlimited

### 3. Feature Gating System

Features are checked via middleware/helpers:

- `checkFeatureAccess(tenantId, featureKey)` - Returns boolean
- `checkFeatureLimit(tenantId, featureKey)` - Returns usage vs limit
- `incrementUsage(tenantId, featureKey, amount)` - Track usage

### 4. Billing Flow

1. **New Subscription**: Tenant selects plan → Payment processed → Subscription created
2. **Renewal**: Cron job checks expiring subscriptions → Generate invoice → Charge payment method → Update subscription
3. **Upgrade/Downgrade**: Immediate upgrade, downgrade at period end
4. **Cancellation**: Mark for cancellation at period end, keep access until period ends

### 5. Admin Panel Features

- **Plans Management**: CRUD for subscription plans
- **Features Management**: Define and manage feature flags
- **Tenant Subscriptions**: View all subscriptions, manually adjust
- **Billing Dashboard**: Revenue, active subscriptions, churn metrics
- **Usage Monitoring**: Track feature usage across tenants

### 6. Tenant Panel Features

- **Current Plan**: Display plan details, usage, limits
- **Upgrade/Downgrade**: Change plan with preview
- **Billing History**: View invoices and payments
- **Payment Method**: Manage payment methods
- **Usage Dashboard**: See current usage vs limits

### 7. Implementation Steps

1. ✅ Create database schemas and types
2. ✅ Create subscription plans API
3. ✅ Create tenant subscription API
4. ✅ Create feature gating helpers
5. ✅ Create admin panel for plans management
6. ✅ Create tenant subscription management UI
7. ✅ Integrate payment gateway for subscriptions
8. ✅ Create renewal cron job/webhook
9. ✅ Add feature checks throughout the app
10. ✅ Create usage tracking system

# API Endpoints Documentation

Complete documentation of all API endpoints in the FrameX-Store application.

## Table of Contents

1. [Authentication APIs](#authentication-apis)
2. [Product APIs](#product-apis)
3. [Order APIs](#order-apis)
4. [Payment APIs](#payment-apis)
5. [Coupon APIs](#coupon-apis)
6. [Affiliate APIs](#affiliate-apis)
7. [Customer APIs](#customer-apis)
8. [Inventory APIs](#inventory-apis)
9. [Subscription APIs](#subscription-apis)
10. [Merchant APIs](#merchant-apis)
11. [Configuration APIs](#configuration-apis)
12. [Content Management APIs](#content-management-apis)
13. [Statistics & Analytics APIs](#statistics--analytics-apis)
14. [Delivery & Shipping APIs](#delivery--shipping-apis)
15. [Tracking & Events APIs](#tracking--events-apis)
16. [Super Admin APIs](#super-admin-apis)
17. [Other APIs](#other-apis)

---

## Data Models

### Product

```typescript
type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  description: string;
  price: number;
  buyPrice?: number;
  images: string[];
  sizes?: string[];
  colors?: string[];
  materials?: string[];
  weight?: string;
  dimensions?: string;
  sku?: string;
  condition?: string;
  warranty?: string;
  tags?: string[];
  discountPercentage?: number;
  featured?: boolean;
  stock?: number;
  order?: number;
};
```

### Order

```typescript
type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";
type PaymentMethod = "cod" | "online";
type PaymentStatus =
  | "pending"
  | "completed"
  | "failed"
  | "cancelled"
  | "refunded";
type OrderType = "online" | "offline";

type CustomerInfo = {
  fullName: string;
  email?: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode: string;
  notes?: string;
};

type CartLineItem = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  size?: string;
  color?: string;
  quantity: number;
  category?: string;
};

type Order = {
  id: string;
  createdAt: string;
  status: OrderStatus;
  orderType?: OrderType;
  items: CartLineItem[];
  subtotal: number;
  discountPercentage?: number;
  discountAmount?: number;
  vatTaxPercentage?: number;
  vatTaxAmount?: number;
  shipping: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus?: PaymentStatus;
  paidAmount?: number;
  paymentTransactionId?: string;
  paymentValId?: string;
  customer: CustomerInfo;
  courier?: OrderCourierInfo;
  fraudCheck?: FraudCheckData;
  couponCode?: string;
  couponId?: string;
  affiliateCode?: string;
  affiliateId?: string;
  affiliateCommission?: number;
  sourceTracking?: SourceTrackingData;
};
```

### Coupon

```typescript
type CouponType =
  | "percentage"
  | "fixed_amount"
  | "free_shipping"
  | "buy_x_get_y"
  | "first_order";
type CouponStatus = "active" | "inactive" | "expired" | "scheduled";

interface Coupon {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: CouponType;
  status: CouponStatus;
  discountValue: number;
  maxDiscountAmount?: number;
  buyXGetY?: BuyXGetYConfig;
  startDate: string;
  endDate: string;
  usageLimit: CouponUsageLimit;
  conditions: CouponConditions;
  createdAt: string;
  updatedAt: string;
  totalRevenue?: number;
  averageOrderValue?: number;
}
```

### Affiliate

```typescript
type AffiliateStatus = "active" | "inactive" | "suspended";
type CommissionLevel = 1 | 2 | 3 | 4 | 5;

interface Affiliate {
  id: string;
  userId: string;
  promoCode: string;
  status: AffiliateStatus;
  totalEarnings: number;
  totalWithdrawn: number;
  availableBalance: number;
  totalOrders: number;
  deliveredOrders: number;
  currentLevel: CommissionLevel;
  assignedCouponId?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Subscription

```typescript
type SubscriptionStatus =
  | "active"
  | "trial"
  | "expired"
  | "cancelled"
  | "past_due"
  | "grace_period";
type BillingCycleMonths = 1 | 6 | 12;
type BillingCycle = "monthly" | "semi_annual" | "yearly";

interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  basePrice: number;
  price: number;
  billingCycle: BillingCycle;
  billingCycleMonths: BillingCycleMonths;
  features: PlanFeatures;
  isActive: boolean;
  isPopular?: boolean;
  sortOrder?: number;
}

interface MerchantSubscription {
  id: string;
  merchantId: string;
  planId: string;
  planName?: string;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  billingCycleMonths: BillingCycleMonths;
  amount: number;
  currency: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  nextBillingDate?: string;
  trialEndsAt?: string;
  gracePeriodEndsAt?: string;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: string;
  autoRenew: boolean;
}
```

---

## Authentication APIs

### POST /api/auth/login

Authenticate user and return JWT token.

**Request Body:**

```typescript
{
  method: "email" | "phone";
  email?: string; // Required if method is "email"
  phone?: string; // Required if method is "phone"
  password: string;
  rememberMe?: boolean;
}
```

**Response:**

```typescript
{
  success: true;
  user: {
    id: string;
    fullName: string;
    email?: string;
    phone?: string;
    role: "customer" | "merchant" | "admin";
    createdAt: string;
  };
}
```

**Sets Cookie:** `auth_token` (httpOnly, secure in production)

---

### POST /api/auth/register

Register a new user.

**Request Body:**

```typescript
{
  fullName: string;
  email?: string;
  phone?: string;
  password: string;
  role?: "customer" | "merchant" | "admin";
}
```

**Response:**

```typescript
{
  success: true;
  user: {
    id: string;
    fullName: string;
    email?: string;
    phone?: string;
    role: string;
  };
}
```

---

### POST /api/auth/logout

Logout current user (clears auth cookie).

**Response:**

```typescript
{
  success: true;
}
```

---

### GET /api/auth/me

Get current authenticated user information.

**Response:**

```typescript
{
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  role: "customer" | "merchant" | "admin";
  createdAt: string;
}
```

---

### GET /api/auth/google

OAuth Google authentication callback.

**Query Parameters:**

- `code`: OAuth authorization code

---

## Product APIs

### GET /api/products

Get paginated list of products.

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 30, max: 100)
- `category` (optional): Filter by category (default: "all")

**Response:**

```typescript
{
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  categories: string[];
}
```

---

### POST /api/products

Create a new product.

**Request Body:** `Partial<Product> & { id?: string }`

**Response:** `Product` (201 Created)

---

### PUT /api/products

Update product order (bulk update).

**Request Body:**

```typescript
{
  products: Product[]; // Array of products with updated order
}
```

**Response:** `Product[]`

---

### GET /api/products/[id]

Get single product by ID or slug.

**Response:** `Product`

---

### PUT /api/products/[id]

Update a product.

**Request Body:** `Partial<Product>`

**Response:** `Product`

---

### DELETE /api/products/[id]

Delete a product.

**Response:**

```typescript
{
  ok: true;
}
```

---

### GET /api/products/search

Search products.

**Query Parameters:**

- `q`: Search query
- `category` (optional): Filter by category
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response:**

```typescript
{
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

---

### GET /api/products/brands

Get all product brands.

**Response:** `string[]`

---

### GET /api/products/categories

Get all product categories.

**Query Parameters:**

- `enabled` (optional): Filter enabled categories

**Response:**

```typescript
{
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    description?: string;
    order?: number;
    enabled: boolean;
  }>;
}
```

---

### POST /api/products/categories

Create a new category.

**Request Body:**

```typescript
{
  name: string;
  slug: string;
  description?: string;
  order?: number;
  enabled?: boolean;
}
```

---

### PUT /api/products/categories

Update category order (bulk).

**Request Body:**

```typescript
{
  categories: Array<{ id: string; order: number }>;
}
```

---

### PUT /api/products/categories/[id]

Update a category.

**Request Body:**

```typescript
{
  name?: string;
  slug?: string;
  description?: string;
  order?: number;
  enabled?: boolean;
}
```

---

### DELETE /api/products/categories/[id]

Delete a category.

---

### GET /api/products/most-loved

Get most loved/popular products.

**Query Parameters:**

- `limit` (optional): Number of products (default: 10)

**Response:** `Product[]`

---

### GET /api/products/[id]/reviews

Get product reviews.

**Response:**

```typescript
{
  reviews: Array<{
    id: string;
    productId: string;
    customerName: string;
    rating: number;
    comment?: string;
    createdAt: string;
  }>;
}
```

---

### POST /api/products/[id]/reviews

Create a product review.

**Request Body:**

```typescript
{
  customerName: string;
  rating: number; // 1-5
  comment?: string;
}
```

---

## Order APIs

### GET /api/orders

Get paginated list of orders.

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 30, max: 100)
- `status` (optional): Filter by status
- `search` (optional): Search in order ID, customer name, phone, email

**Response:**

```typescript
{
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}
```

---

### POST /api/orders

Create a new order.

**Request Body:** `Order`

**Features:**

- Stock validation
- Blocked customer check
- Affiliate commission calculation
- Fraud check (async)
- Inventory transaction logging
- Email notifications
- Real-time socket updates

**Response:** `Order` (201 Created)

---

### GET /api/orders/[id]

Get single order by ID.

**Response:** `Order`

---

### PUT /api/orders/[id]

Update an order.

**Request Body:** `Partial<Order>`

**Features:**

- Affiliate commission status update on status change
- Email notifications for status/payment changes
- Real-time socket updates

**Response:** `Order`

---

### DELETE /api/orders/[id]

Delete an order.

**Response:**

```typescript
{
  ok: true;
}
```

---

### POST /api/orders/place

Place order using product slug (simplified API).

**Request Body:**

```typescript
{
  productSlug: string;
  quantity: number;
  size?: string;
  color?: string;
  customer: CustomerInfo;
  paymentMethod?: "cod" | "online";
  shipping?: number;
  notes?: string;
  couponCode?: string;
  sourceTracking?: SourceTrackingData;
}
```

**Response:** `Order` (201 Created)

---

### GET /api/orders/user

Get orders for current user.

**Query Parameters:**

- `page` (optional): Page number
- `limit` (optional): Items per page

**Response:**

```typescript
{
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

---

### GET /api/orders/[id]/receipt

Get order receipt (PDF generation).

**Response:** PDF file

---

### POST /api/orders/[id]/courier

Assign courier to order.

**Request Body:**

```typescript
{
  serviceId: "pathao" | "steadfast" | "redx" | "paperfly" | string;
  consignmentId: string;
}
```

---

### DELETE /api/orders/[id]/courier

Remove courier from order.

---

### POST /api/orders/[id]/courier/send

Send order to courier service.

**Request Body:**

```typescript
{
  serviceId: string;
  // ... courier-specific fields
}
```

---

## Payment APIs

### POST /api/payment/init

Initialize SSLCommerz payment.

**Request Body:**

```typescript
{
  orderId: string;
  customer: CustomerInfo;
}
```

**Response:**

```typescript
{
  success: true;
  gatewayPageURL: string;
  sessionkey: string;
}
```

---

### POST /api/payment/easy-checkout

Easy checkout payment initialization.

**Request Body:**

```typescript
{
  orderId: string;
  customer: CustomerInfo;
}
```

---

### GET /api/payment/success

Payment success callback handler.

**Query Parameters:**

- SSLCommerz callback parameters

---

### POST /api/payment/success

Payment success callback (POST).

**Request Body:** SSLCommerz callback data

---

### GET /api/payment/fail

Payment failure callback handler.

**Query Parameters:**

- SSLCommerz callback parameters

---

### POST /api/payment/fail

Payment failure callback (POST).

---

### GET /api/payment/cancel

Payment cancellation callback handler.

**Query Parameters:**

- SSLCommerz callback parameters

---

### POST /api/payment/cancel

Payment cancellation callback (POST).

---

### POST /api/payment/ipn

Instant Payment Notification (IPN) handler.

**Request Body:** SSLCommerz IPN data

---

### POST /api/payment/validate

Validate payment transaction.

**Request Body:**

```typescript
{
  transactionId: string;
  orderId: string;
}
```

---

### GET /api/payment/transaction-query

Query transaction status.

**Query Parameters:**

- `transactionId`: Transaction ID

---

### POST /api/payment/refund

Initiate payment refund.

**Request Body:**

```typescript
{
  orderId: string;
  amount: number;
  reason?: string;
}
```

---

### GET /api/payment/refund-query

Query refund status.

**Query Parameters:**

- `refundId`: Refund ID

---

### GET /api/payments

Get payment transactions.

**Query Parameters:**

- `page` (optional): Page number
- `limit` (optional): Items per page

**Response:**

```typescript
{
  payments: Array<{
    id: string;
    orderId: string;
    amount: number;
    status: string;
    transactionId?: string;
    createdAt: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
  }
}
```

---

## Coupon APIs

### GET /api/coupons

Get all coupons.

**Query Parameters:**

- `status` (optional): Filter by status
- `search` (optional): Search in code or name
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response:**

```typescript
{
  coupons: Coupon[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

---

### POST /api/coupons

Create a new coupon.

**Request Body:**

```typescript
{
  code: string;
  name: string;
  description?: string;
  type: CouponType;
  status?: CouponStatus;
  discountValue: number;
  maxDiscountAmount?: number;
  buyXGetY?: BuyXGetYConfig;
  startDate: string;
  endDate: string;
  usageLimit?: {
    totalUses?: number;
    usesPerCustomer?: number;
  };
  conditions?: CouponConditions;
}
```

**Response:** `Coupon` (201 Created)

---

### GET /api/coupons/[id]

Get single coupon.

**Response:** `Coupon`

---

### PUT /api/coupons/[id]

Update a coupon.

**Request Body:** `Partial<Coupon>`

**Response:** `Coupon`

---

### DELETE /api/coupons/[id]

Delete a coupon.

---

### POST /api/coupons/apply

Apply coupon to cart.

**Request Body:**

```typescript
{
  code: string;
  cartSubtotal: number;
  cartItems: Array<{
    productId: string;
    categoryId?: string;
    quantity: number;
    price: number;
  }>;
  customerEmail?: string;
  customerPhone?: string;
  isFirstOrder?: boolean;
}
```

**Response:**

```typescript
{
  success: boolean;
  coupon?: Coupon;
  discount: number;
  discountType: CouponType;
  message: string;
  error?: string;
  freeItems?: Array<{ productId: string; quantity: number }>;
  freeShipping?: boolean;
}
```

---

### POST /api/coupons/record-usage

Record coupon usage after order completion.

**Request Body:**

```typescript
{
  couponId: string;
  couponCode: string;
  orderId: string;
  customerId?: string;
  customerEmail?: string;
  customerPhone?: string;
  discountApplied: number;
  orderTotal: number;
}
```

**Response:**

```typescript
{
  success: true;
  usageRecord?: CouponUsageRecord;
  message?: string; // "Usage already recorded" if already exists
}
```

---

### GET /api/coupons/record-usage

Get usage records for a coupon.

**Query Parameters:**

- `couponId` (required): Coupon ID
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**

```typescript
{
  records: CouponUsageRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

---

## Affiliate APIs

### GET /api/affiliate/me

Get current user's affiliate information.

**Response:**

```typescript
{
  affiliate: Affiliate | null;
  enabled: boolean;
  message?: string;
}
```

---

### POST /api/affiliate/me

Create affiliate account for current user.

**Response:**

```typescript
{
  affiliate: Affiliate;
}
```

---

### GET /api/affiliate/list

Get list of all affiliates (admin).

**Query Parameters:**

- `page` (optional): Page number
- `limit` (optional): Items per page
- `status` (optional): Filter by status

**Response:**

```typescript
{
  affiliates: Array<
    Affiliate & {
      user: {
        id: string;
        fullName: string;
        email?: string;
        phone?: string;
      };
      totalCommissions: number;
      pendingCommissions: number;
      completedCommissions: number;
    }
  >;
  total: number;
}
```

---

### GET /api/affiliate/commissions

Get affiliate commissions.

**Query Parameters:**

- `affiliateId` (optional): Filter by affiliate
- `status` (optional): Filter by status
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response:**

```typescript
{
  commissions: Array<
    AffiliateCommission & {
      order: {
        id: string;
        total: number;
        createdAt: string;
      };
    }
  >;
  pagination: {
    page: number;
    limit: number;
    total: number;
  }
}
```

---

### GET /api/affiliate/progress

Get affiliate progress and statistics.

**Response:**

```typescript
{
  totalOrders: number;
  deliveredOrders: number;
  totalEarnings: number;
  availableBalance: number;
  currentLevel: CommissionLevel;
  nextLevel?: CommissionLevel;
  progressToNextLevel?: number;
  recentCommissions: AffiliateCommission[];
}
```

---

### GET /api/affiliate/withdrawals

Get withdrawal requests.

**Query Parameters:**

- `affiliateId` (optional): Filter by affiliate
- `status` (optional): Filter by status

**Response:**

```typescript
{
  withdrawals: AffiliateWithdrawal[];
}
```

---

### POST /api/affiliate/withdrawals

Create withdrawal request.

**Request Body:**

```typescript
{
  amount: number;
  paymentMethod: string;
  paymentDetails: {
    accountName?: string;
    accountNumber?: string;
    bankName?: string;
    mobileNumber?: string;
  };
}
```

---

### POST /api/affiliate/set-cookie

Set affiliate referral cookie.

**Request Body:**

```typescript
{
  promoCode: string;
  affiliateId: string;
}
```

---

### GET /api/affiliate/settings

Get affiliate settings.

**Response:**

```typescript
{
  enabled: boolean;
  minWithdrawalAmount: number;
  commissionLevels: {
    [key in CommissionLevel]?: {
      percentage: number;
      enabled: boolean;
      requiredSales?: number;
    };
  };
  cookieExpiryDays: number;
}
```

---

### PUT /api/affiliate/settings

Update affiliate settings (admin).

**Request Body:**

```typescript
{
  enabled?: boolean;
  minWithdrawalAmount?: number;
  commissionLevels?: {
    [key: string]: {
      percentage: number;
      enabled: boolean;
      requiredSales?: number;
    };
  };
  cookieExpiryDays?: number;
}
```

---

### POST /api/affiliate/assign-coupon

Assign coupon to affiliate.

**Request Body:**

```typescript
{
  affiliateId: string;
  couponId: string;
}
```

---

## Customer APIs

### GET /api/customers

Get all customers with statistics.

**Query Parameters:**

- `search` (optional): Search in name, email, phone
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response:**

```typescript
{
  customers: Array<{
    id: string;
    fullName: string;
    email?: string;
    phone: string;
    addressLine1: string;
    city: string;
    totalOrders: number;
    totalSpent: number;
    firstOrderDate: string;
    lastOrderDate: string;
    averageOrderValue: number;
  }>;
  stats: {
    totalCustomers: number;
    totalRevenue: number;
    averageOrderValue: number;
  }
  pagination: {
    page: number;
    limit: number;
    total: number;
  }
}
```

---

### POST /api/blocked-customers

Block a customer.

**Request Body:**

```typescript
{
  phone?: string;
  email?: string;
  reason: string;
  notes?: string;
}
```

---

### GET /api/blocked-customers

Get all blocked customers.

**Response:**

```typescript
{
  blocked: Array<{
    id: string;
    phone?: string;
    email?: string;
    reason: string;
    notes?: string;
    isActive: boolean;
    createdAt: string;
  }>;
}
```

---

### POST /api/blocked-customers/check

Check if customer is blocked.

**Request Body:**

```typescript
{
  phone?: string;
  email?: string;
}
```

**Response:**

```typescript
{
  isBlocked: boolean;
  block?: {
    id: string;
    reason: string;
  };
}
```

---

### GET /api/blocked-customers/[id]

Get specific blocked customer by ID.

**Response:**

```typescript
{
  id: string;
  phone?: string;
  email?: string;
  reason: string;
  notes?: string;
  isActive: boolean;
  blockedAt: string;
  createdAt: string;
  updatedAt: string;
}
```

---

### PUT /api/blocked-customers/[id]

Update blocked customer information.

**Request Body:**

```typescript
{
  reason?: string;
  notes?: string;
  isActive?: boolean;
}
```

**Response:**

```typescript
{
  success: true;
  customer: BlockedCustomer;
}
```

---

### DELETE /api/blocked-customers/[id]

Unblock a customer (soft delete - sets isActive to false).

**Response:**

```typescript
{
  success: true;
  message: "Customer unblocked";
}
```

---

## Inventory APIs

### GET /api/inventory

Get inventory transactions.

**Query Parameters:**

- `productId` (optional): Filter by product
- `type` (optional): Filter by transaction type
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response:**

```typescript
{
  transactions: Array<{
    id: string;
    productId: string;
    productName: string;
    type: "order" | "restock" | "adjustment" | "return";
    quantity: number;
    previousStock: number;
    newStock: number;
    orderId?: string;
    createdAt: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
  }
}
```

---

### POST /api/inventory

Create inventory transaction.

**Request Body:**

```typescript
{
  productId: string;
  type: "restock" | "adjustment" | "return";
  quantity: number;
  notes?: string;
}
```

---

### GET /api/inventory/overview

Get inventory overview statistics.

**Response:**

```typescript
{
  totalProducts: number;
  totalStock: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalValue: number;
  categories: Array<{
    name: string;
    totalStock: number;
    lowStock: number;
  }>;
}
```

---

### GET /api/inventory/products

Get inventory status for all products.

**Query Parameters:**

- `lowStock` (optional): Filter low stock items
- `outOfStock` (optional): Filter out of stock items

**Response:**

```typescript
{
  products: Array<{
    id: string;
    name: string;
    stock?: number;
    buyPrice?: number;
    totalValue: number;
  }>;
}
```

---

## Subscription APIs

### GET /api/subscription/plans

Get available subscription plans.

**Response:** `SubscriptionPlan[]`

---

### GET /api/subscription/status

Get current merchant subscription status.

**Response:**

```typescript
{
  subscription: MerchantSubscription | null;
  statusDetails: SubscriptionStatusDetails;
}
```

---

### GET /api/subscription/invoices

Get subscription invoices.

**Query Parameters:**

- `status` (optional): Filter by status
- `page` (optional): Page number

**Response:**

```typescript
{
  invoices: SubscriptionInvoice[];
  pagination: {
    page: number;
    total: number;
  };
}
```

---

### POST /api/subscription/renew

Renew subscription.

**Request Body:**

```typescript
{
  planId: string;
  billingCycleMonths: BillingCycleMonths;
}
```

---

### POST /api/subscription/renew/success

Subscription renewal success callback (SSLCommerz callback).

**Request Body:** SSLCommerz form data

**Response:** Redirects to billing page with success message

---

### GET /api/subscription/renew/success

Subscription renewal success callback (GET redirect handler).

**Response:** Redirects to billing page

---

### POST /api/subscription/renew/fail

Subscription renewal failure callback (SSLCommerz callback).

**Request Body:** SSLCommerz form data with error information

**Response:** Redirects to billing page with error message

---

### GET /api/subscription/renew/fail

Subscription renewal failure callback (GET redirect handler).

**Response:** Redirects to billing page with error message

---

### GET /api/subscriptions/plans

Get all subscription plans (alternative endpoint).

**Response:** `SubscriptionPlan[]`

---

### GET /api/subscriptions/current

Get current subscription.

**Response:** `MerchantSubscription | null`

---

### POST /api/subscriptions/create

Create new subscription.

**Request Body:**

```typescript
{
  planId: string;
  billingCycleMonths: BillingCycleMonths;
  paymentMethodId?: string;
}
```

---

## Merchant APIs

### GET /api/merchant/context

Get merchant context data.

**Query Parameters:**

- `merchantId` (optional): Merchant ID

**Response:**

```typescript
{
  success: true;
  data: {
    merchant: {
      id: string;
      name: string;
      email: string;
      status: string;
      settings: any;
    };
    database: {
      id: string;
      databaseName: string;
      useSharedDatabase: boolean;
      status: string;
    } | null;
    deployment: {
      id: string;
      deploymentUrl: string;
      deploymentStatus: string;
      deploymentType: string;
    } | null;
    dbName: string;
    hasConnectionString: boolean;
  };
}
```

---

### GET /api/merchant/data-from-brand-config

Get merchant data from brand config.

**Response:**

```typescript
{
  merchant: {
    name: string;
    logo?: string;
    // ... other brand config fields
  };
}
```

---

### GET /api/merchant/plan-subscription

Get merchant subscription information.

**Response:** `MerchantSubscription | null`

---

### POST /api/merchant/features/check

Check multiple features.

**Request Body:**

```typescript
{
  features: string[];
}
```

**Response:**

```typescript
{
  features: {
    [key: string]: {
      enabled: boolean;
      limit?: number | "unlimited";
      currentUsage?: number;
    };
  };
}
```

---

### GET /api/merchant/features/limit

Get feature limits.

**Response:**

```typescript
{
  limits: {
    [key: string]: number | "unlimited";
  };
}
```

---

### GET /api/merchant/features/usage

Get feature usage statistics.

**Response:**

```typescript
{
  usage: {
    [key: string]: {
      current: number;
      limit: number | "unlimited";
      percentage?: number;
    };
  };
}
```

---

### GET /api/merchant/fraud-check

Get fraud check data for phone number.

**Query Parameters:**

- `phone`: Phone number to check

**Response:**

```typescript
{
  success: boolean;
  data?: FraudCheckData;
  error?: string;
}
```

---

### POST /api/merchant/fraud-check

Check fraud risk for phone number.

**Request Body:**

```typescript
{
  phone: string;
}
```

**Response:**

```typescript
{
  success: boolean;
  data?: FraudCheckData;
}
```

---

### POST /api/merchant/domain/configure

Configure custom domain.

**Request Body:**

```typescript
{
  domain: string;
}
```

---

### GET /api/merchant/domain/configure

Get domain configuration.

**Response:**

```typescript
{
  domain?: string;
  verified: boolean;
  dnsRecords?: Array<{
    type: string;
    name: string;
    value: string;
  }>;
}
```

---

### POST /api/merchant/domain/verify

Verify domain DNS records.

**Request Body:**

```typescript
{
  domain: string;
}
```

**Response:**

```typescript
{
  verified: boolean;
  dnsRecords?: Array<{
    type: string;
    name: string;
    value: string;
    status: "valid" | "invalid" | "pending";
  }>;
}
```

---

### DELETE /api/merchant/domain/remove

Remove custom domain.

---

### GET /api/merchant/super-admin-data

Get merchant data from super admin.

**Response:**

```typescript
{
  merchant: any;
  database: any;
  deployment: any;
}
```

---

### GET /api/merchant/email-settings

Get email settings.

**Response:**

```typescript
{
  provider: string;
  enabled: boolean;
  settings: any;
}
```

---

### PUT /api/merchant/email-settings

Update email settings.

**Request Body:**

```typescript
{
  provider: string;
  enabled?: boolean;
  settings?: any;
}
```

---

### POST /api/merchant/email-settings

Test email settings.

**Request Body:**

```typescript
{
  to: string;
  subject: string;
  body: string;
}
```

---

### GET /api/merchant/email-templates

Get email templates.

**Response:**

```typescript
{
  templates: Array<{
    id: string;
    event: string;
    subject: string;
    body: string;
    enabled: boolean;
  }>;
}
```

---

### PUT /api/merchant/email-templates

Update email templates (bulk).

**Request Body:**

```typescript
{
  templates: Array<{
    id: string;
    subject?: string;
    body?: string;
    enabled?: boolean;
  }>;
}
```

---

### POST /api/merchant/email-templates

Create email template.

**Request Body:**

```typescript
{
  event: string;
  subject: string;
  body: string;
  enabled?: boolean;
}
```

---

## Configuration APIs

### GET /api/brand-config

Get brand configuration.

**Response:**

```typescript
{
  name: string;
  logo?: string;
  favicon?: string;
  primaryColor?: string;
  secondaryColor?: string;
  currency: {
    iso: string;
    symbol: string;
  };
  // ... other brand settings
}
```

---

### PUT /api/brand-config

Update brand configuration.

**Request Body:**

```typescript
{
  name?: string;
  logo?: string;
  favicon?: string;
  primaryColor?: string;
  secondaryColor?: string;
  currency?: {
    iso: string;
    symbol: string;
  };
  // ... other brand settings
}
```

---

### GET /api/delivery-config

Get delivery configuration.

**Query Parameters:**

- `type` (optional): Configuration type - `"courier"` for courier services config, otherwise returns delivery service config

**Response (delivery service config):**

```typescript
{
  id: string;
  defaultDeliveryCharge: number;
  enableCODForDefault: boolean;
  deliveryChargeNotRefundable: boolean;
  weightBasedCharges: Array<{
    weight: number;
    extraCharge: number;
  }>;
  deliveryOption: "zones" | "districts" | "upazila";
  specificDeliveryCharges: Array<{
    location: string;
    charge: number;
  }>;
  createdAt?: string;
  updatedAt: string;
}
```

**Response (courier services config when type="courier"):**

```typescript
{
  id: string;
  services: Array<{
    id: string;
    name: string;
    enabled: boolean;
    logo?: string;
    credentials?: Record<string, any>;
  }>;
  createdAt?: string;
  updatedAt: string;
}
```

---

### PUT /api/delivery-config

Update delivery configuration.

**Query Parameters:**

- `type` (optional): Configuration type - `"courier"` for courier services config, otherwise updates delivery service config

**Request Body (delivery service config):**

```typescript
{
  defaultDeliveryCharge: number;
  enableCODForDefault: boolean;
  deliveryChargeNotRefundable: boolean;
  weightBasedCharges: Array<{
    weight: number;
    extraCharge: number;
  }>;
  deliveryOption: "zones" | "districts" | "upazila";
  specificDeliveryCharges: Array<{
    location: string;
    charge: number;
  }>;
}
```

**Request Body (courier services config when type="courier"):**

```typescript
{
  services: Array<{
    id: string;
    name: string;
    enabled: boolean;
    logo?: string;
    credentials?: Record<string, any>;
  }>;
}
```

**Response:** Updated configuration object

---

### GET /api/sslcommerz-config

Get SSLCommerz payment configuration.

**Response:**

```typescript
{
  enabled: boolean;
  storeId?: string;
  storePassword?: string;
  isLive?: boolean;
}
```

---

### PUT /api/sslcommerz-config

Update SSLCommerz configuration.

**Request Body:**

```typescript
{
  enabled: boolean;
  storeId: string;
  storePassword: string;
  isLive: boolean;
}
```

---

### GET /api/oauth-config

Get OAuth configuration.

**Response:**

```typescript
{
  google?: {
    enabled: boolean;
    clientId?: string;
    clientSecret?: string;
  };
  // ... other OAuth providers
}
```

---

### PUT /api/oauth-config

Update OAuth configuration.

**Request Body:**

```typescript
{
  google?: {
    enabled: boolean;
    clientId?: string;
    clientSecret?: string;
  };
}
```

---

### GET /api/ads-config

Get ads tracking configuration.

**Response:**

```typescript
{
  meta?: {
    enabled: boolean;
    pixelId?: string;
  };
  tiktok?: {
    enabled: boolean;
    pixelId?: string;
  };
  // ... other platforms
}
```

---

### PUT /api/ads-config

Update ads configuration.

**Request Body:**

```typescript
{
  meta?: {
    enabled: boolean;
    pixelId?: string;
  };
  tiktok?: {
    enabled: boolean;
    pixelId?: string;
  };
}
```

---

## Content Management APIs

### GET /api/hero-slides

Get enabled hero slides.

**Response:** `HeroSlide[]`

---

### POST /api/hero-slides

Create hero slide.

**Request Body:**

```typescript
{
  image: string; // Required
  mobileImage?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
  textPosition?: "left" | "center" | "right";
  textColor?: string;
  overlay?: boolean;
  overlayOpacity?: number;
  order?: number;
  enabled?: boolean;
}
```

**Response:** `HeroSlide` (201 Created)

---

### PUT /api/hero-slides

Update hero slide.

**Request Body:**

```typescript
{
  id: string;
  image?: string;
  // ... other fields (all optional)
}
```

**Response:** `HeroSlide`

---

### GET /api/hero-slides/all

Get all hero slides (including disabled).

**Response:** `HeroSlide[]`

---

### DELETE /api/hero-slides/[id]

Delete hero slide by ID.

**Response:**

```typescript
{
  success: true;
}
```

---

### GET /api/pages

Get all footer pages.

**Response:**

```typescript
{
  pages: Array<{
    id: string;
    title: string;
    slug: string;
    content: string;
    categoryId?: string;
    order?: number;
    enabled: boolean;
  }>;
}
```

---

### POST /api/pages

Create footer page.

**Request Body:**

```typescript
{
  title: string;
  slug: string;
  content: string;
  categoryId?: string;
  order?: number;
  enabled?: boolean;
}
```

---

### GET /api/pages/enabled

Get enabled footer pages only.

**Response:** `FooterPage[]`

---

### GET /api/pages/[slug]

Get page by slug.

**Response:** `FooterPage`

---

### PUT /api/pages/[slug]

Update page by slug.

**Request Body:** `Partial<FooterPage>`

---

### DELETE /api/pages/[slug]

Delete page.

---

### GET /api/pages/categories

Get page categories.

**Response:**

```typescript
{
  categories: Array<{
    id: string;
    name: string;
    order?: number;
  }>;
}
```

---

### POST /api/pages/categories

Create page category.

**Request Body:**

```typescript
{
  name: string;
  order?: number;
}
```

---

### PUT /api/pages/categories/[id]

Update page category.

**Request Body:**

```typescript
{
  name?: string;
  order?: number;
}
```

---

### DELETE /api/pages/categories/[id]

Delete page category.

---

### GET /api/promotional-banner

Get promotional banner.

**Response:**

```typescript
{
  enabled: boolean;
  text?: string;
  link?: string;
  backgroundColor?: string;
  textColor?: string;
}
```

---

### PUT /api/promotional-banner

Update promotional banner.

**Request Body:**

```typescript
{
  enabled?: boolean;
  text?: string;
  link?: string;
  backgroundColor?: string;
  textColor?: string;
}
```

---

## Statistics & Analytics APIs

### GET /api/statistics

Get comprehensive statistics.

**Response:**

```typescript
{
  orders: {
    total: number;
    byStatus: {
      pending: number;
      processing: number;
      shipped: number;
      delivered: number;
      cancelled: number;
    }
    today: number;
    last7Days: number;
    last30Days: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
  }
  revenue: {
    total: number;
    paid: number;
    pending: number;
    today: number;
    last7Days: number;
    last30Days: number;
    thisMonth: number;
    lastMonth: number;
    avgOrderValue: number;
    growth: number;
    daily: Array<{
      date: string;
      revenue: number;
      orders: number;
    }>;
  }
  payments: {
    total: number;
    successful: number;
    failed: number;
    successRate: number;
    totalAmount: number;
    today: number;
    last7Days: number;
    last30Days: number;
    methods: {
      cod: number;
      online: number;
    }
  }
  customers: {
    total: number;
    newLast30Days: number;
    repeat: number;
    retentionRate: number;
    avgOrdersPerCustomer: number;
  }
  products: {
    total: number;
    categories: number;
    avgPrice: number;
    withImages: number;
  }
  categories: {
    total: number;
    avgOrder: number;
  }
  inventory: {
    totalStock: number;
    lowStockItems: number;
    outOfStockItems: number;
    lowStockThreshold: number;
  }
  orderTypes: {
    online: number;
    offline: number;
  }
}
```

---

### GET /api/budgets

Get all budgets.

**Response:**

```typescript
{
  budgets: Array<{
    id: string;
    name: string;
    category?: string;
    amount: number;
    spent: number;
    period: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
  }>;
}
```

---

### POST /api/budgets

Create budget.

**Request Body:**

```typescript
{
  name: string;
  category?: string;
  amount: number;
  period: string;
  notes?: string;
}
```

---

### PUT /api/budgets/[id]

Update budget.

**Request Body:**

```typescript
{
  name: string;
  category?: string;
  amount: number;
  period: string;
  startDate: string;
  endDate?: string;
  isActive?: boolean;
}
```

**Response:** Updated `Budget` object

---

### DELETE /api/budgets/[id]

Delete budget.

---

### GET /api/investments

Get all investments.

**Response:**

```typescript
{
  investments: Array<{
    id: string;
    key: string; // Reason/description
    value: number; // Amount
    category?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
  }>;
}
```

---

### POST /api/investments

Create investment record.

**Request Body:**

```typescript
{
  key: string;
  value: number;
  category?: string;
  notes?: string;
}
```

---

### PUT /api/investments/[id]

Update investment.

**Request Body:** `Partial<Investment>`

---

### DELETE /api/investments/[id]

Delete investment.

---

## Delivery & Shipping APIs

### GET /api/storefront/delivery-config

Get delivery configuration for storefront.

**Response:**

```typescript
{
  enabled: boolean;
  methods: Array<{
    id: string;
    name: string;
    cost: number;
    estimatedDays: number;
  }>;
  freeShippingThreshold?: number;
}
```

---

### POST /api/storefront/calculate-shipping

Calculate shipping cost.

**Request Body:**

```typescript
{
  city: string;
  postalCode?: string;
  weight?: number;
  total?: number;
}
```

**Response:**

```typescript
{
  methods: Array<{
    id: string;
    name: string;
    cost: number;
    estimatedDays: number;
  }>;
  freeShipping: boolean;
}
```

---

### GET /api/pathao/cities

Get Pathao cities.

**Response:**

```typescript
{
  cities: Array<{
    id: number;
    name: string;
  }>;
}
```

---

### GET /api/pathao/zones

Get Pathao zones.

**Query Parameters:**

- `cityId`: City ID

**Response:**

```typescript
{
  zones: Array<{
    id: number;
    name: string;
    cityId: number;
  }>;
}
```

---

### GET /api/pathao/areas

Get Pathao areas.

**Query Parameters:**

- `zoneId`: Zone ID

**Response:**

```typescript
{
  areas: Array<{
    id: number;
    name: string;
    zoneId: number;
  }>;
}
```

---

## Tracking & Events APIs

### POST /api/fb-events

Track Facebook Pixel events.

**Request Body:**

```typescript
{
  eventName: string;
  eventData: {
    content_ids?: string[];
    content_name?: string;
    value?: number;
    currency?: string;
    // ... other event parameters
  };
}
```

---

### GET /api/fb-events

Get tracked Facebook events.

**Query Parameters:**

- `eventName` (optional): Filter by event name
- `date` (optional): Filter by date

**Response:**

```typescript
{
  events: Array<{
    id: string;
    eventName: string;
    eventData: any;
    timestamp: string;
  }>;
}
```

---

### POST /api/tracking/meta-pixel

Track Meta Pixel event.

**Request Body:**

```typescript
{
  eventName: string;
  userData?: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    city?: string;
    zipCode?: string;
  };
  customData?: {
    value?: number;
    currency?: string;
    contentIds?: string[];
    numItems?: number;
  };
}
```

---

## Super Admin APIs

### GET /api/super-admin/merchants

Get all merchants.

**Response:**

```typescript
{
  merchants: Array<{
    id: string;
    name: string;
    email: string;
    status: string;
    createdAt: string;
  }>;
}
```

---

### POST /api/super-admin/merchants

Create new merchant.

**Request Body:**

```typescript
{
  name: string;
  email: string;
  password: string;
}
```

---

### PUT /api/super-admin/merchants

Update merchant.

**Request Body:**

```typescript
{
  id: string;
  name?: string;
  email?: string;
  status?: string;
}
```

---

### GET /api/super-admin/merchants/[id]/full

Get full merchant data.

**Response:**

```typescript
{
  merchant: any;
  database: any;
  deployment: any;
  subscription: any;
}
```

---

### GET /api/super-admin/merchants/[id]/database

Get merchant database information.

**Response:**

```typescript
{
  database: {
    id: string;
    databaseName: string;
    useSharedDatabase: boolean;
    connectionString?: string;
    status: string;
  };
}
```

---

### GET /api/super-admin/merchants/[id]/deployment

Get merchant deployment information.

**Response:**

```typescript
{
  deployment: {
    id: string;
    deploymentUrl: string;
    deploymentStatus: string;
    deploymentType: string;
  }
}
```

---

### GET /api/super-admin/merchants/[id]/subscription

Get merchant subscription information from super-admin.

**Response:** `MerchantSubscription`

---

## Other APIs

### GET /api/notifications

Get notifications for current user.

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 15)
- `unreadOnly` (optional): Filter unread notifications only (default: false)

**Response:**

```typescript
{
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    type: "info" | "success" | "warning" | "error";
    read: boolean;
    createdAt: string;
    link?: string | null;
  }>;
  unreadCount: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  }
}
```

---

### PATCH /api/notifications

Mark notification(s) as read.

**Request Body:**

```typescript
{
  notificationId?: string; // Mark specific notification as read
  markAllAsRead?: boolean; // Mark all notifications as read
}
```

**Response:**

```typescript
{
  success: true;
  message: string;
}
```

---

### POST /api/upload

Upload file to Cloudinary via central API.

**Request Body:** `FormData`

**Form Fields:**

- `file` (Blob): File to upload
- `url` (string, optional): URL to upload from (alternative to file)
- `folder` (string, optional): Cloudinary folder
- `public_id` (string, optional): Public ID for the resource
- `resource_type` (string, optional): Resource type (default: "auto")

**Response:**

```typescript
{
  secure_url: string;
  public_id: string;
  width?: number;
  height?: number;
  format?: string;
  // ... other Cloudinary response fields
}
```

**Note:** Uploads go through the super-admin's central Cloudinary API. The API returns `secure_url` which should be saved directly to the database.

---

### GET /api/env/config

Get environment configuration (masked sensitive data).

**Response:**

```typescript
{
  success: true;
  data: {
    envLines12to16: {
      ENCRYPTION_KEY?: string; // Masked as "***"
      GITHUB_REPO?: string;
      GITHUB_TOKEN?: string; // Masked as "***"
      MONGODB_DB?: string;
    };
    validation: {
      valid: boolean;
      missing: string[];
      invalid: string[];
    };
    allEnvVars: {
      // All environment variables with sensitive data masked
      [key: string]: any;
    };
  };
}
```

---

### GET /api/geolocation

Get user's geolocation based on IP address.

**Response:**

```typescript
{
  ip: string;
  country?: string;
  countryCode?: string;
  region?: string;
  regionName?: string;
  city?: string;
  zip?: string;
  lat?: number;
  lon?: number;
  timezone?: string;
  isp?: string;
  org?: string;
  as?: string;
}
```

---

### GET /api/socket/config

Get Socket.IO configuration for the current domain.

**Response:**

```typescript
{
  socketUrl: string; // Base URL for Socket.IO connection
  path: string; // Socket.IO path (default: "/api/socket")
  transports: ("websocket" | "polling")[]; // Transport methods
}
```

**Note:** Returns dynamic Socket.IO configuration based on the request origin/host, useful for multi-tenant/white-label setups.

---

### POST /api/visits

Track page visits with IP address and geolocation.

**Request Body:**

```typescript
{
  path?: string; // Page path (default: "/")
  referrer?: string; // Referrer URL
  userAgent?: string; // User agent string
}
```

**Response:**

```typescript
{
  success: true;
  message: "Visit recorded" | "Visit count updated" | "Visit recorded (no IP)";
}
```

**Note:** Prevents duplicate visits from the same IP within 1 minute by updating visit count instead.

---

### GET /api/visits

Get visit statistics with IP geolocation data.

**Query Parameters:**

- `limit` (optional): Maximum number of visits to return (default: 100, max: 1000)

**Response:**

```typescript
{
  success: true;
  data: Array<{
    ip: string;
    visitCount: number;
    orderCount: number;
    geolocation?: {
      country?: string;
      countryCode?: string;
      region?: string;
      city?: string;
      lat?: number;
      lon?: number;
      // ... other geolocation fields
      capturedAt: string;
    };
    paths: string[]; // Array of visited paths
    firstVisit: string;
    lastVisit: string;
  }>;
  total: number;
}
```

---

### POST /api/product-viewers

Track active viewers on a product page (real-time viewing).

**Request Body:**

```typescript
{
  slug: string; // Product slug (required)
  sessionId?: string; // Session ID (auto-generated if not provided)
}
```

**Response:**

```typescript
{
  count: number; // Current number of active viewers
  sessionId: string; // Session ID for this viewer
}
```

**Note:** Uses heartbeat mechanism (every 20 seconds) to keep viewers registered. Viewers are removed when they leave the page.

---

### GET /api/product-viewers

Get current viewer count for a product.

**Query Parameters:**

- `slug` (required): Product slug

**Response:**

```typescript
{
  count: number; // Current number of active viewers
}
```

---

### DELETE /api/product-viewers

Remove a viewer when they leave the product page.

**Request Body:**

```typescript
{
  slug: string; // Product slug (required)
  sessionId: string; // Session ID (required)
}
```

**Response:**

```typescript
{
  count: number; // Remaining viewer count after removal
}
```

---

### POST /api/orders/sync-courier-status

Sync delivery status for all orders with courier info (for current merchant).

**Response:**

```typescript
{
  success: true;
  message: "Courier status sync completed";
  results: {
    totalOrders: number;
    updated: number; // Orders with status changes
    failed: number;
    skipped: number;
    errorCount: number;
    sampleErrors: string[]; // First 5 errors
  };
  timestamp: string;
}
```

**Note:** Syncs status for orders that have courier info and are not in final states (delivered/cancelled). Emits real-time updates via socket.

---

### GET /api/cron/sync-delivery-status

Cron job to sync delivery status for all orders across all merchants.

**Note:** This is a system cron endpoint that runs every 5 minutes to update courier delivery statuses across all active merchants.

**Response:**

```typescript
{
  success: true;
  message: "Delivery status sync completed";
  results: {
    totalMerchants: number;
    totalOrders: number;
    updated: number;
    failed: number;
    skipped: number;
    errorCount: number;
    sampleErrors: string[]; // First 10 errors
  };
  timestamp: string;
}
```

**Note:** This endpoint processes all active merchants and syncs their courier order statuses. Used by automated cron jobs.

---

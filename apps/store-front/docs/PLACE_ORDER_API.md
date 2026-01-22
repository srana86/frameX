# Place Order API

A simplified API endpoint for placing orders using product slugs instead of full product objects.

## Endpoint

```
POST /api/orders/place
```

## Request Body

```typescript
interface PlaceOrderRequest {
  productSlug: string; // Required: Product slug to identify the product
  quantity: number; // Required: Quantity to order (must be > 0)
  size?: string; // Optional: Product size variant
  color?: string; // Optional: Product color variant
  customer: {
    // Required: Complete customer information
    fullName: string;
    email?: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    postalCode: string;
    notes?: string;
  };
  paymentMethod?: "cod" | "online"; // Optional: Default is "cod"
  shipping?: number; // Optional: Shipping cost, default is 0
  notes?: string; // Optional: Additional order notes
  couponCode?: string; // Optional: Coupon code to apply
  sourceTracking?: {
    // Optional: Source tracking data
    fbclid?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
    gclid?: string;
    ref?: string;
    firstSeenAt?: string;
    landingPage?: string;
  };
}
```

## Example Request

```json
{
  "productSlug": "nike-air-max-270",
  "quantity": 2,
  "size": "US 10",
  "color": "Black",
  "customer": {
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "+8801712345678",
    "addressLine1": "123 Main Street",
    "addressLine2": "Apt 4B",
    "city": "Dhaka",
    "postalCode": "1216",
    "notes": "Please deliver between 9 AM - 5 PM"
  },
  "paymentMethod": "cod",
  "shipping": 100,
  "couponCode": "WELCOME10"
}
```

## Response

### Success Response (201 Created)

```json
{
  "id": "507f1f77bcf86cd799439011",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "status": "pending",
  "orderType": "online",
  "items": [
    {
      "productId": "507f1f77bcf86cd799439012",
      "slug": "nike-air-max-270",
      "name": "Nike Air Max 270",
      "price": 12000,
      "image": "https://example.com/image.jpg",
      "size": "US 10",
      "color": "Black",
      "quantity": 2
    }
  ],
  "subtotal": 24000,
  "shipping": 100,
  "total": 24100,
  "paymentMethod": "cod",
  "customer": {
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "+8801712345678",
    "addressLine1": "123 Main Street",
    "addressLine2": "Apt 4B",
    "city": "Dhaka",
    "postalCode": "1216",
    "notes": "Please deliver between 9 AM - 5 PM"
  },
  "couponCode": "WELCOME10"
}
```

### Error Responses

#### 400 Bad Request - Missing Required Fields

```json
{
  "error": "Product slug is required"
}
```

#### 400 Bad Request - Invalid Quantity

```json
{
  "error": "Valid quantity is required"
}
```

#### 400 Bad Request - Incomplete Customer Info

```json
{
  "error": "Complete customer information is required"
}
```

#### 404 Not Found - Product Not Found

```json
{
  "error": "Product not found"
}
```

#### 400 Bad Request - Insufficient Stock

```json
{
  "error": "Insufficient stock",
  "available": 5,
  "requested": 10
}
```

#### 403 Forbidden - Blocked Customer

```json
{
  "error": "Order cannot be placed",
  "message": "This customer has been blocked from placing orders. Please contact support for assistance.",
  "code": "CUSTOMER_BLOCKED"
}
```

## Features

- **Product Lookup**: Automatically finds products by slug
- **Stock Validation**: Checks product availability before creating orders
- **Fraud Protection**: Validates customers against blocked customer list
- **Inventory Management**: Automatically deducts stock and logs transactions
- **Flexible Pricing**: Supports product discounts and coupon codes
- **Source Tracking**: Captures marketing attribution data (UTM, Facebook pixel, etc.)

## Notes

- The endpoint uses the same order creation logic as the main `/api/orders` endpoint
- All validation and business logic (stock checking, fraud prevention, inventory updates) is handled automatically
- The endpoint returns the complete order object with the generated order ID
- Failed orders (due to stock issues, blocked customers, etc.) are rejected before any database changes

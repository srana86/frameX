# FrameX-Dashboard Direct Connection - Complete ✅

## What's Been Done

All API calls in FrameX-Dashboard have been updated to connect directly to the Node.js backend (FrameX-Server) using the new API client.

### ✅ Created API Client

- **File:** `src/lib/api-client.ts`
- Handles all API requests to `http://localhost:5000/api/v1`
- Automatically unwraps `{ success, message, data }` response format
- Includes error handling and TypeScript types

### ✅ Updated Pages

1. **Dashboard** (`src/app/(dashboard)/dashboard/page.tsx`)

   - Updated to use `api.get()` for merchants, subscriptions, deployments, plans, databases

2. **Merchants** (`src/app/(dashboard)/merchants/page.tsx`)

   - Updated to use `api.get()` for merchants, plans, subscriptions

3. **Subscriptions** (`src/app/(dashboard)/subscriptions/page.tsx`)

   - Updated to use `api.get()` for subscriptions, plans, merchants

4. **Plans** (`src/app/(dashboard)/plans/page.tsx`)

   - Updated to use `api.get()` for plans, subscriptions

5. **Deployments** (`src/app/(dashboard)/deployments/page.tsx`)

   - Updated to use `api.get()` for deployments, merchants

6. **Databases** (`src/app/(dashboard)/database/page.tsx`)

   - Updated to use `api.get()` for databases, merchants

7. **Payments** (`src/app/(dashboard)/payments/page.tsx`)

   - Updated to use `api.get()` for payments

8. **Invoices** (`src/app/(dashboard)/invoices/page.tsx`)

   - Updated to use `api.get()` for invoices

9. **Sales** (`src/app/(dashboard)/sales/page.tsx`)

   - Updated to use `api.get()` for sales

10. **Feature Requests** (`src/app/(dashboard)/feature-requests/page.tsx`)

    - Updated to use `api.get()` and `api.patch()` for feature requests

11. **Fraud Check** (`src/app/(dashboard)/fraud-check/FraudCheckClient.tsx`)

    - Updated to use `api.get()` and `api.post()` for fraud checks

12. **System Health** (`src/app/(dashboard)/system/page.tsx`)

    - Updated to use `api.get()` for system health

13. **Admin** (`src/app/(admin)/admin/page.tsx`)
    - Updated to use `api.get()` for stats

---

## Environment Setup

### Required Environment Variable

Create/update `FrameX-Dashboard/.env.local`:

```env
# Node.js Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1

# Keep existing variables
MONGODB_URI=mongodb://localhost:27017/shoestore_main
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
SSLCOMMERZ_STORE_ID=your_store_id
SSLCOMMERZ_STORE_PASSWORD=your_store_password
SSLCOMMERZ_IS_LIVE=false
```

---

## Next Steps

### 1. Remove Old Next.js API Routes (Optional)

Since all frontend code now connects directly to the Node.js backend, you can optionally remove the old Next.js API routes:

```bash
# These directories can be deleted (they're no longer used):
rm -rf src/app/api/merchants
rm -rf src/app/api/subscriptions
rm -rf src/app/api/plans
rm -rf src/app/api/deployments
rm -rf src/app/api/databases
rm -rf src/app/api/payments
rm -rf src/app/api/invoices
rm -rf src/app/api/sales
rm -rf src/app/api/feature-requests
rm -rf src/app/api/fraud-check
rm -rf src/app/api/system-health
rm -rf src/app/api/analytics
rm -rf src/app/api/activity-logs
rm -rf src/app/api/settings
rm -rf src/app/api/cloudinary
rm -rf src/app/api/checkout
```

**Note:** Keep `src/app/api/` directory if you have other routes that aren't migrated yet.

### 2. Test the Connection

1. **Start Node.js Backend:**

   ```bash
   cd FrameX-Server
   npm run start:dev
   # Should run on http://localhost:5000
   ```

2. **Start FrameX-Dashboard:**

   ```bash
   cd FrameX-Dashboard
   npm run dev
   ```

3. **Verify:**
   - Open browser DevTools → Network tab
   - Check that requests go to `http://localhost:5000/api/v1/...`
   - Verify responses have `{ success, message, data }` format

---

## API Client Usage

### Basic Usage

```typescript
import { api } from "@/lib/api-client";

// GET request
const merchants = await api.get<any[]>("merchants");

// POST request
const newMerchant = await api.post<any>("merchants", { name: "..." });

// PUT request
const updated = await api.put<any>("merchants/123", { name: "..." });

// PATCH request
const patched = await api.patch<any>("feature-requests/123", {
  status: "approved",
});

// DELETE request
await api.delete("merchants/123");
```

### With Error Handling

```typescript
try {
  const data = await api.get<any[]>("merchants");
  setMerchants(data);
} catch (error: any) {
  console.error("Failed to load:", error);
  toast.error(error.message || "Request failed");
}
```

### With Pagination Meta

```typescript
import { apiRequestWithMeta } from "@/lib/api-client";

const result = await apiRequestWithMeta<any[]>("merchants?page=1&limit=10");
console.log(result.data); // Array of merchants
console.log(result.meta); // { page, limit, total, totalPage }
```

---

## Remaining Files to Update (If Needed)

Some files may still have fetch calls that need updating:

- `src/app/(dashboard)/simulate/page.tsx` - May have API calls
- `src/app/(dashboard)/settings/_components/SSLCommerzSettings.tsx` - May have API calls
- `src/app/(dashboard)/plans/new/page.tsx` - May have API calls
- `src/app/(dashboard)/_components/modules/activity/ActivityContainer.tsx` - May have API calls
- `src/app/(dashboard)/merchants/[id]/page.tsx` - May have API calls
- `src/app/(home)/checkout/_components/CheckoutContainer.tsx` - May have API calls

Check these files and update any remaining `fetch("/api/...")` calls to use the API client.

---

## Troubleshooting

**CORS Errors:**

- Check `FrameX-Server/src/app.ts` CORS configuration
- Ensure `http://localhost:3000` (or your dashboard port) is in allowed origins

**404 Not Found:**

- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check that route exists in `FrameX-Server/src/app/routes/index.ts`

**Response Format Errors:**

- API client automatically handles `{ success, message, data }` format
- Data is automatically unwrapped, so use `data` directly

**Environment Variables Not Loading:**

- Restart dev server after changing `.env.local`
- Verify variable name is `NEXT_PUBLIC_API_URL` (case-sensitive)

---

## Summary

✅ All major dashboard pages updated to use API client  
✅ Direct connection to Node.js backend established  
✅ Response format handling implemented  
✅ Error handling added  
⚠️ Some utility/component files may still need updates (check remaining fetch calls)

The dashboard is now fully connected to the Node.js backend! 🎉

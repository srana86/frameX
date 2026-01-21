# 📋 How to Create Subscription Plans

## Method 1: Using Super Admin UI (Easiest)

### Step 1: Go to Plans Page
1. Open your super admin panel
2. Navigate to `/plans` or click "Plans" from the dashboard
3. You'll see the plans management page

### Step 2: Create a New Plan
1. Click the **"Create Plan"** button (top right)
2. Fill in the form:
   - **Name**: Plan name (e.g., "Starter", "Professional", "Enterprise")
   - **Description**: Plan description (optional)
   - **Price**: Monthly price in USD (e.g., 29, 79, 199)
   - **Sort Order**: Display order (lower numbers show first)
   - **Active**: Toggle to enable/disable the plan
   - **Popular**: Toggle to mark as popular (shows badge)
3. Click **"Create"**

### Step 3: Edit Plan Features (Optional)
After creating, you can edit the plan to add features. Features are stored in the `features` object and can be configured later.

---

## Method 2: Using API Directly

### Create Plan via API

```bash
curl -X POST http://localhost:3001/api/plans \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Starter",
    "description": "Perfect for small businesses",
    "price": 29,
    "billingCycle": "monthly",
    "isActive": true,
    "isPopular": false,
    "sortOrder": 1,
    "features": {
      "max_products": 50,
      "max_storage_gb": 5,
      "custom_domain": false,
      "remove_branding": false,
      "advanced_analytics": false,
      "ads_tracking_platforms": ["meta", "gtm"],
      "payment_gateways": 1,
      "team_members": 1,
      "api_access": false,
      "support_level": "email"
    }
  }'
```

---

## Method 3: Direct Database Insert (Advanced)

If you want to insert plans directly into MongoDB:

```javascript
// In MongoDB shell or Compass
use shoestore_main

db.subscription_plans.insertOne({
  id: "starter",
  name: "Starter",
  description: "Perfect for small businesses",
  price: 29,
  billingCycle: "monthly",
  features: {
    max_products: 50,
    max_storage_gb: 5,
    custom_domain: false,
    remove_branding: false,
    advanced_analytics: false,
    ads_tracking_platforms: ["meta", "gtm"],
    payment_gateways: 1,
    team_members: 1,
    api_access: false,
    support_level: "email"
  },
  isActive: true,
  isPopular: false,
  sortOrder: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
})
```

---

## 📝 Plan Structure

### Required Fields:
- `name` - Plan name (string)
- `price` - Monthly price in USD (number)

### Optional Fields:
- `description` - Plan description (string)
- `billingCycle` - "monthly" or "yearly" (default: "monthly")
- `features` - Object with feature limits
- `isActive` - Boolean (default: true)
- `isPopular` - Boolean (default: false)
- `sortOrder` - Number (default: 0)

### Features Object Example:
```json
{
  "max_products": 50,
  "max_storage_gb": 5,
  "custom_domain": false,
  "remove_branding": false,
  "advanced_analytics": false,
  "ads_tracking_platforms": ["meta", "gtm"],
  "payment_gateways": 1,
  "team_members": 1,
  "api_access": false,
  "support_level": "email"
}
```

---

## 🎯 Quick Example Plans

### Starter Plan ($29/month)
```json
{
  "name": "Starter",
  "description": "Perfect for small businesses",
  "price": 29,
  "features": {
    "max_products": 50,
    "max_storage_gb": 5,
    "custom_domain": false,
    "advanced_analytics": false,
    "ads_tracking_platforms": ["meta", "gtm"],
    "payment_gateways": 1,
    "team_members": 1,
    "api_access": false,
    "support_level": "email"
  },
  "isActive": true,
  "isPopular": false,
  "sortOrder": 1
}
```

### Professional Plan ($79/month)
```json
{
  "name": "Professional",
  "description": "For growing businesses",
  "price": 79,
  "features": {
    "max_products": 500,
    "max_storage_gb": 50,
    "custom_domain": true,
    "advanced_analytics": true,
    "ads_tracking_platforms": ["meta", "tiktok", "gtm", "ga4"],
    "payment_gateways": 2,
    "team_members": 5,
    "api_access": "limited",
    "support_level": "priority"
  },
  "isActive": true,
  "isPopular": true,
  "sortOrder": 2
}
```

### Enterprise Plan ($199/month)
```json
{
  "name": "Enterprise",
  "description": "For large businesses",
  "price": 199,
  "features": {
    "max_products": "unlimited",
    "max_storage_gb": 500,
    "custom_domain": true,
    "remove_branding": true,
    "advanced_analytics": true,
    "ads_tracking_platforms": ["meta", "tiktok", "gtm", "ga4", "pinterest", "snapchat", "linkedin"],
    "payment_gateways": "unlimited",
    "team_members": "unlimited",
    "api_access": "full",
    "support_level": "24/7"
  },
  "isActive": true,
  "isPopular": false,
  "sortOrder": 3
}
```

---

## ✅ Steps to Create Plans

1. **Start Super Admin:**
   ```bash
   cd super-admin
   npm run dev
   ```

2. **Open Plans Page:**
   - Go to `http://localhost:3001/plans`

3. **Click "Create Plan"**

4. **Fill in Basic Info:**
   - Name: "Starter"
   - Description: "Perfect for small businesses"
   - Price: 29
   - Sort Order: 1
   - Toggle Active: ON
   - Toggle Popular: OFF (or ON if you want)

5. **Click "Create"**

6. **Edit Features (if needed):**
   - Click Edit on the plan
   - You can update features later or use the main app's plan editor

---

## 🔧 After Creating Plans

1. Plans will appear in the main app at `/admin/subscription-plans`
2. Tenants can subscribe to these plans
3. Features are checked dynamically from the plan
4. You can edit plans anytime from super admin or main app

---

## 💡 Tips

- **Start Simple**: Create basic plans first, add features later
- **Use Sort Order**: Lower numbers appear first (1, 2, 3)
- **Mark Popular**: Use "Popular" badge for your recommended plan
- **Test Features**: After creating, test feature gating in the main app

That's it! You can now create and manage plans easily! 🎉


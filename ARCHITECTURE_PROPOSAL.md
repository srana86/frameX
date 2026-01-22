# Architecture Proposal: Consolidating Admin Features

## Current State

### Landing App (`/apps/landing`)
- **`/admin`** - Super Admin Panel (managing all tenants, deployments, subscriptions)
- **`/owner`** - Store Owner Dashboard (managing multiple stores from one account)
- **Public pages** - Marketing site (home, blog, contact, etc.)

### Store-Front App (`/apps/store-front`)
- **`/tenant`** - Tenant Admin Dashboard (managing individual store: products, orders, inventory, brand, etc.)
- **Customer-facing** - Products, cart, checkout, account pages

## Proposed Change

**Move all `/tenant` admin features from store-front to landing app**

### New Structure

#### Landing App
- **`/admin`** - Super Admin Panel (unchanged)
- **`/owner`** - Store Owner Dashboard (enhanced)
  - **`/owner/stores`** - List all stores
  - **`/owner/staff`** - Staff account management
    - Create staff accounts
    - Assign staff to stores
    - Set permission levels per store
  - **`/owner/stores/[storeId]`** - Individual store management
    - **`/owner/stores/[storeId]/dashboard`** - Store dashboard
    - **`/owner/stores/[storeId]/products`** - Product management
    - **`/owner/stores/[storeId]/orders`** - Order management
    - **`/owner/stores/[storeId]/inventory`** - Inventory management
    - **`/owner/stores/[storeId]/brand`** - Branding & configuration (affects store-front only)
    - **`/owner/stores/[storeId]/customers`** - Customer management
    - ... (all other tenant admin features)
  - **Note**: Admin UI uses **static, unified theme** (no tenant branding)
- **Public pages** - Marketing site (unchanged)

#### Store-Front App
- **Customer-facing only**
  - Products listing & details
  - Cart & checkout
  - Customer account
  - Authentication (login/register)
  - **Tenant branding applied** - Uses tenant's brand config (logo, colors, theme)
- **No admin features**

---

## Assessment: Is This Plan Good?

### ✅ **PROS**

1. **Clear Separation of Concerns**
   - Admin features completely separated from customer-facing app
   - Store-front becomes a pure e-commerce frontend
   - Easier to understand and maintain

2. **Better Security**
   - Admin routes not exposed in customer-facing app
   - Reduced attack surface
   - Easier to apply different security policies

3. **Unified Admin Experience**
   - Store owners manage all businesses from one place
   - Consistent UI/UX across all admin features
   - Better navigation between stores

4. **Simplified Store-Front**
   - Lighter bundle size
   - Faster load times for customers
   - Easier to optimize for performance

5. **Better Multi-Tenancy Support**
   - Natural fit for multi-store management
   - Easier to switch between stores
   - Better context management

6. **Scalability**
   - Can scale admin and customer apps independently
   - Different deployment strategies
   - Better resource allocation

### ⚠️ **CONS & CHALLENGES**

1. **Tenant Context Management**
   - **Challenge**: Need to maintain which store is being managed
   - **Solution**: Use URL params (`/owner/stores/[storeId]/...`) and context/store
   - **Impact**: Medium - requires refactoring tenant resolution

2. **API Access & Data Isolation**
   - **Challenge**: Landing app needs access to tenant-specific APIs
   - **Solution**: 
     - Share backend APIs between apps
     - Use tenant ID from URL to scope API calls
     - Ensure proper authorization checks
   - **Impact**: Medium - need to ensure APIs support tenant scoping

3. **Branding & Theming**
   - **Challenge**: Tenant admin currently uses tenant branding
   - **Solution**: 
     - **Admin UI stays static** - Landing app admin interface uses unified, static theme
     - **Store-front only** - Tenant branding applies ONLY to customer-facing store-front
     - No tenant branding in admin interface for consistency
   - **Impact**: Low - simplifies implementation, better UX consistency

4. **Migration Complexity**
   - **Challenge**: Moving ~30+ admin routes and components
   - **Solution**: Phased migration approach
   - **Impact**: High - significant refactoring effort

5. **URL Structure Changes**
   - **Challenge**: Existing bookmarks/links will break
   - **Solution**: 
     - Add redirects from old routes
     - Update documentation
   - **Impact**: Low - manageable with redirects

6. **Authentication Flow**
   - **Challenge**: Different auth contexts (owner vs tenant admin vs staff)
   - **Solution**: 
     - Owner auth for `/owner` routes
     - Staff auth with store-level permissions
     - Verify user has access to specific store with appropriate permissions
   - **Impact**: Medium - need to ensure proper access control

7. **Staff Account Management**
   - **Challenge**: Store owners need to create staff accounts with store-specific access control
   - **Solution**: 
     - Create staff management system in `/owner/staff`
     - Allow owners to assign staff to specific stores
     - Implement permission levels per store (view-only, edit, full access)
     - Staff can only access assigned stores
   - **Impact**: Medium - requires new database schema and UI

8. **Development Workflow**
   - **Challenge**: Developers need to work across two apps
   - **Solution**: Clear documentation and shared components
   - **Impact**: Low - already working with multiple apps

---

## Improved Plan

### Phase 1: Foundation (Week 1-2)

1. **Create Store Context System**
   - Implement store selection/switching in landing app
   - Create tenant context provider for admin routes
   - Add store ID to URL structure
   - **Static Admin Theme** - Ensure admin UI uses unified, static theme (no tenant branding)

2. **API Infrastructure**
   - Ensure all tenant APIs accept tenant ID parameter
   - Create API client utilities for tenant-scoped calls
   - Add authorization middleware
   - Implement staff access verification

3. **Staff Management System**
   - Design database schema for staff-store access (StaffStoreAccess model)
   - Create staff management UI in `/owner/staff`
   - Implement permission levels (VIEW, EDIT, FULL)
   - Add staff creation and assignment flow

4. **Shared Components**
   - Move reusable admin components to shared package or landing
   - Create unified admin layout component with static theme
   - Set up design system consistency

### Phase 2: Core Features Migration (Week 3-4)

1. **Dashboard & Overview**
   - Move dashboard from `/tenant` to `/owner/stores/[storeId]/dashboard`
   - Update data fetching to use store ID from URL
   - Test tenant data isolation

2. **Product Management**
   - Move products routes
   - Update product APIs to use tenant context
   - Test CRUD operations

3. **Order Management**
   - Move orders routes
   - Ensure order data is properly scoped
   - Test order workflows

### Phase 3: Extended Features (Week 5-6)

1. **Configuration Features**
   - Brand configuration (affects store-front only, not admin)
   - Payment settings
   - Email settings
   - Domain configuration

2. **Analytics & Reports**
   - Statistics
   - Profit analysis
   - IP analytics

3. **Support Features**
   - Inventory management
   - Customer management
   - Affiliates
   - Coupons

4. **Staff Management Features**
   - Staff account creation
   - Store assignment interface
   - Permission management per store
   - Staff activity logging

### Phase 4: Cleanup & Optimization (Week 7-8)

1. **Remove Old Routes**
   - Delete `/tenant` routes from store-front
   - Add redirects for old URLs
   - Update all internal links

2. **Testing & QA**
   - Test all admin features
   - Verify data isolation
   - Test multi-store switching
   - Performance testing

3. **Documentation**
   - Update developer docs
   - Update user guides
   - Migration guide for existing users

### Phase 5: Enhancements (Optional)

1. **Multi-Store Features**
   - Bulk operations across stores
   - Cross-store analytics
   - Unified reporting

2. **UI/UX Improvements**
   - Store switcher component
   - Quick actions
   - Keyboard shortcuts

3. **Staff Management Enhancements**
   - Staff activity logs
   - Permission templates
   - Bulk staff assignment
   - Staff performance metrics

---

## Key Design Decisions

### 1. Static Admin Theme

**Decision**: Admin interface in landing app uses a **static, unified theme** - no tenant branding.

**Rationale**:
- Consistent admin experience across all stores
- Easier to maintain and update
- Professional, unified look
- Reduces complexity (no need to load/store tenant themes in admin)

**Implementation**:
- Admin UI always uses default/static theme
- Tenant branding only applies to **store-front** (customer-facing)
- Brand configuration in admin affects store-front appearance only
- Admin layout, colors, and styling remain constant

**Example**:
```typescript
// Admin always uses static theme
<AdminLayout theme="static"> // No tenant branding
  <StoreManagement storeId={storeId} />
</AdminLayout>

// Store-front uses tenant branding
<StoreFront theme={tenantBrandConfig}> // Tenant branding applied
  <Products />
</StoreFront>
```

### 2. Staff Account Management

**Decision**: Store owners can create staff accounts and assign them to specific stores with granular permissions.

**Features**:
1. **Staff Creation**: Owners create staff accounts (role=STAFF)
2. **Store Assignment**: Assign staff to one or multiple stores
3. **Permission Levels**: Set permission per store:
   - **VIEW**: Read-only access (can view but not edit)
   - **EDIT**: Can create/edit items but not delete critical data
   - **FULL**: Full access (except store deletion/settings)
4. **Access Control**: Staff can only access assigned stores
5. **UI Restrictions**: UI adapts based on permission level

**Database Schema**:
```prisma
model StaffStoreAccess {
  id        String   @id @default(uuid())
  staffId   String   // User with role=STAFF
  storeId   String   // Tenant ID
  permission StaffPermission @default(VIEW)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  staff User  @relation(fields: [staffId], references: [id], onDelete: Cascade)
  store Tenant @relation(fields: [storeId], references: [id], onDelete: Cascade)

  @@unique([staffId, storeId])
  @@index([staffId])
  @@index([storeId])
  @@map("staff_store_access")
}

enum StaffPermission {
  VIEW    // Read-only access
  EDIT    // Can create/edit but not delete critical items
  FULL    // Full access (except store deletion)
}
```

**User Flow**:
1. Owner navigates to `/owner/staff`
2. Clicks "Create Staff Account"
3. Enters staff email, name, password
4. Assigns stores and sets permission level for each
5. Staff receives invitation/login credentials
6. Staff logs in and sees only assigned stores
7. UI shows/hides features based on permission level

**Permission Examples**:
- **VIEW**: Can view products, orders, analytics (no edit buttons)
- **EDIT**: Can add/edit products, update orders, manage inventory (no delete/store settings)
- **FULL**: Can do everything except delete store or change subscription

---

## Technical Implementation Details

### 1. URL Structure

```
/owner/stores/[storeId]/dashboard
/owner/stores/[storeId]/products
/owner/stores/[storeId]/products/[productId]
/owner/stores/[storeId]/orders
/owner/stores/[storeId]/orders/[orderId]
/owner/stores/[storeId]/inventory
/owner/stores/[storeId]/brand
/owner/stores/[storeId]/customers
/owner/stores/[storeId]/coupons
... etc
```

### 2. Tenant Context Provider

```typescript
// apps/landing/src/contexts/StoreContext.tsx
interface StoreContextType {
  currentStoreId: string | null;
  stores: Store[];
  switchStore: (storeId: string) => void;
  hasAccess: (storeId: string) => boolean;
  // For staff: check permission level
  getPermission: (storeId: string) => 'VIEW' | 'EDIT' | 'FULL' | null;
}
```

### 2a. Staff Access Model

```prisma
// packages/database/prisma/schema/staff.prisma
model StaffStoreAccess {
  id        String   @id @default(uuid())
  staffId   String   // User with role=STAFF
  storeId   String   // Tenant ID
  permission StaffPermission @default(VIEW)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  staff User  @relation(fields: [staffId], references: [id], onDelete: Cascade)
  store Tenant @relation(fields: [storeId], references: [id], onDelete: Cascade)

  @@unique([staffId, storeId])
  @@index([staffId])
  @@index([storeId])
  @@map("staff_store_access")
}

enum StaffPermission {
  VIEW    // Read-only access
  EDIT    // Can create/edit but not delete critical items
  FULL    // Full access (except store deletion)
}
```

### 3. API Client Pattern

```typescript
// apps/landing/src/lib/api-client.ts
export async function getStoreProducts(storeId: string) {
  return api.get(`/stores/${storeId}/products`);
}
```

### 4. Route Protection

```typescript
// apps/landing/src/app/owner/stores/[storeId]/layout.tsx
export default async function StoreAdminLayout({ 
  params, 
  children 
}: { 
  params: { storeId: string };
  children: React.ReactNode;
}) {
  const user = await requireAuth(["owner", "staff"]);
  
  // Check access based on role
  let hasAccess = false;
  let permission: 'VIEW' | 'EDIT' | 'FULL' = 'VIEW';
  
  if (user.role === 'OWNER') {
    hasAccess = await verifyOwnerAccess(user.id, params.storeId);
    permission = 'FULL';
  } else if (user.role === 'STAFF') {
    const access = await getStaffStoreAccess(user.id, params.storeId);
    hasAccess = access !== null;
    permission = access?.permission || 'VIEW';
  }
  
  if (!hasAccess) {
    redirect("/owner/stores");
  }
  
  // Static admin theme - no tenant branding
  return (
    <StoreAdminShell 
      storeId={params.storeId} 
      permission={permission}
      theme="static" // Always use static admin theme
    >
      {children}
    </StoreAdminShell>
  );
}
```

### 4a. Staff Management UI

```typescript
// apps/landing/src/app/owner/staff/page.tsx
// Store owners can:
// 1. Create staff accounts
// 2. Assign staff to specific stores
// 3. Set permission level per store (VIEW/EDIT/FULL)
// 4. View/manage staff access

interface StaffMember {
  id: string;
  name: string;
  email: string;
  stores: {
    storeId: string;
    storeName: string;
    permission: 'VIEW' | 'EDIT' | 'FULL';
  }[];
}
```

### 5. Data Fetching Pattern

```typescript
// apps/landing/src/app/owner/stores/[storeId]/products/page.tsx
export default async function ProductsPage({ 
  params 
}: { 
  params: { storeId: string } 
}) {
  const user = await requireAuth(["owner", "staff"]);
  const permission = await getUserStorePermission(user.id, params.storeId);
  
  // Check if user has permission to view products
  if (!permission || permission === null) {
    redirect("/owner/stores");
  }
  
  const products = await getStoreProducts(params.storeId);
  return (
    <ProductsClient 
      products={products} 
      storeId={params.storeId}
      permission={permission} // Pass permission to client for UI restrictions
    />
  );
}
```

### 5a. Permission-Based UI Restrictions

```typescript
// Client component respects permission level
function ProductsClient({ products, storeId, permission }) {
  const canEdit = permission === 'EDIT' || permission === 'FULL';
  const canDelete = permission === 'FULL';
  
  return (
    <div>
      {canEdit && <Button>Add Product</Button>}
      {products.map(product => (
        <ProductCard 
          product={product}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      ))}
    </div>
  );
}
```

---

## Migration Checklist

### Pre-Migration
- [ ] Audit all `/tenant` routes in store-front
- [ ] Document all API endpoints used by tenant admin
- [ ] Create shared component library (if needed)
- [ ] Set up tenant context system
- [ ] Design URL structure
- [ ] Design staff access database schema
- [ ] Plan static admin theme implementation
- [ ] Design staff management UI/UX

### During Migration
- [ ] Move routes one feature at a time
- [ ] Update API calls to use store ID
- [ ] Remove tenant branding from admin UI (use static theme)
- [ ] Implement staff access checks
- [ ] Test each migrated feature
- [ ] Update navigation and links
- [ ] Preserve existing functionality
- [ ] Test permission-based UI restrictions

### Post-Migration
- [ ] Remove old routes from store-front
- [ ] Add redirects for old URLs
- [ ] Update documentation
- [ ] Test multi-store scenarios
- [ ] Test staff access and permissions
- [ ] Verify static admin theme (no tenant branding)
- [ ] Performance optimization
- [ ] Security audit
- [ ] Staff management feature testing

---

## Recommendations

### ✅ **DO THIS**

1. **Start with a pilot feature** - Move one small feature first (e.g., statistics) to validate the approach
2. **Maintain backward compatibility** - Keep old routes working with redirects during transition
3. **Use feature flags** - Allow gradual rollout
4. **Test thoroughly** - Especially multi-store scenarios and data isolation
5. **Document everything** - Keep track of what moved where

### ❌ **AVOID**

1. **Big bang migration** - Don't move everything at once
2. **Breaking existing functionality** - Ensure smooth transition
3. **Losing tenant context** - Always verify store access
4. **Duplicating code** - Share components and utilities
5. **Forgetting redirects** - Users might have bookmarked old URLs

---

## Alternative: Hybrid Approach

If full migration is too risky, consider a **hybrid approach**:

- Keep frequently-used admin features in store-front (quick access)
- Move advanced/configuration features to landing (less frequent)
- Use iframe or micro-frontend pattern for seamless experience

**Not recommended** - Adds complexity without clear benefits.

---

## Conclusion

### **Verdict: ✅ GOOD PLAN with proper execution**

The plan is **architecturally sound** and will result in:
- Better code organization
- Improved security
- Better user experience for store owners
- Cleaner separation of concerns

### **Key Success Factors:**

1. **Phased approach** - Don't rush
2. **Thorough testing** - Especially data isolation
3. **Clear communication** - Update users about changes
4. **Proper access control** - Security is critical
5. **Performance monitoring** - Ensure no regressions

### **Estimated Effort:**
- **Time**: 6-8 weeks for full migration
- **Risk**: Medium (manageable with phased approach)
- **Value**: High (long-term maintainability and UX)

---

## Implementation Status: ✅ COMPLETED

The migration has been fully implemented. All admin features have been moved from `store-front/tenant` to `landing/owner/stores/[storeId]`.

### What Was Done

#### Phase 1: Foundation ✅
- Store Context System implemented (`StoreContext.tsx`)
- URL structure `/owner/stores/[storeId]/...` in place
- Static admin theme enforced
- Store-scoped API client (`store-api-client.ts`)
- Authorization middleware (`store-auth-helpers.ts`)
- Staff management schema and APIs

#### Phase 2: Core Features ✅
- Dashboard migrated
- Products management (list, create, detail/edit)
- Orders management (list, detail)
- Inventory management

#### Phase 3: Extended Features ✅
- Brand configuration
- Domain settings
- Payment settings
- Email settings & templates
- Statistics & analytics
- Customers, Affiliates, Coupons
- Staff management (full CRUD)

#### Phase 4: Cleanup ✅
- Old `/tenant` routes removed from store-front
- Redirects implemented
- Documentation updated

---

## Developer Guide

### Accessing Store Admin Pages

All store-specific admin pages follow this pattern:
```
/owner/stores/[storeId]/[feature]
```

### Key Files

| File | Purpose |
|------|---------|
| `apps/landing/src/contexts/StoreContext.tsx` | Store state management |
| `apps/landing/src/lib/store-api-client.ts` | API calls with store context |
| `apps/landing/src/lib/store-auth-helpers.ts` | Authentication & authorization |
| `apps/landing/src/app/owner/stores/[storeId]/_components/StoreAdminShell.tsx` | Admin layout |

### Adding New Store Features

1. Create route at `/owner/stores/[storeId]/[feature]/page.tsx`
2. Use `requireStoreAccess(storeId)` for authorization
3. Use `storeApi` for API calls
4. Pass `permission` to client components for UI restrictions

```typescript
// Example page
import { requireStoreAccess } from "@/lib/store-auth-helpers";
import { storeApi } from "@/lib/store-api-client";

export default async function NewFeaturePage({
  params,
}: {
  params: { storeId: string };
}) {
  const { user, permission } = await requireStoreAccess(params.storeId);
  const data = await storeApi.get(params.storeId, "/your-endpoint");
  
  return <YourClient data={data} permission={permission} />;
}
```

### Permission Levels

| Permission | Can View | Can Create/Edit | Can Delete |
|------------|----------|-----------------|------------|
| VIEW       | ✅       | ❌              | ❌         |
| EDIT       | ✅       | ✅              | ❌         |
| FULL       | ✅       | ✅              | ✅         |

### Adding Navigation Items

Update `StoreAdminShell.tsx` to add new navigation items:

```typescript
const NAV_GROUPS = [
  {
    label: "Your Section",
    items: [
      {
        title: "New Feature",
        href: "new-feature",
        icon: YourIcon,
        permission: "EDIT", // Minimum permission required
      },
    ],
  },
];
```

---

## User Migration Guide

### URL Changes

| Old URL (store-front) | New URL (landing) |
|-----------------------|-------------------|
| `/tenant/dashboard` | `/owner/stores/[storeId]/dashboard` |
| `/tenant/products` | `/owner/stores/[storeId]/products` |
| `/tenant/orders` | `/owner/stores/[storeId]/orders` |
| `/tenant/brand` | `/owner/stores/[storeId]/brand` |
| `/tenant/customers` | `/owner/stores/[storeId]/customers` |
| `/tenant/*` | `/owner/stores/[storeId]/*` |

### For Store Owners

1. **Access your admin panel** at the landing app (e.g., `https://your-domain.com/owner`)
2. **Select your store** from the store list
3. **Manage your store** using the sidebar navigation
4. **Create staff accounts** at `/owner/staff` to delegate access

### For Staff

1. **Log in** to the landing app
2. **View assigned stores** - you'll only see stores you have access to
3. **Work within your permissions** - UI adapts based on your access level

### New Features

- **Multi-store management**: Switch between stores easily
- **Staff accounts**: Create staff with granular permissions
- **Unified admin**: All admin features in one place
- **Static theme**: Consistent admin experience

---

## API Documentation

### Store-Scoped Endpoints

All tenant-specific APIs now require `storeId` in the URL:

```
GET    /api/v1/stores/{storeId}/products
POST   /api/v1/stores/{storeId}/products
GET    /api/v1/stores/{storeId}/orders
PATCH  /api/v1/stores/{storeId}/orders/{orderId}
...
```

### Staff Management Endpoints

```
GET    /api/v1/owner/staff           # List all staff
POST   /api/v1/owner/staff           # Create staff
GET    /api/v1/owner/staff/{staffId} # Get staff details
PATCH  /api/v1/owner/staff/{staffId} # Update staff
DELETE /api/v1/owner/staff/{staffId} # Remove staff access
PUT    /api/v1/owner/staff/{staffId}/access # Update store assignments
```

### Authentication

All owner/staff routes require authentication. The system checks:
1. User is authenticated
2. User role is OWNER, TENANT, or STAFF
3. User has access to the specific store
4. User has required permission level for the action

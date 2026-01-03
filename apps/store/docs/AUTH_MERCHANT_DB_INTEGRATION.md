# ✅ Authentication - Merchant Database Integration

## 🎯 Overview

All authentication routes have been updated to save and retrieve user data from merchant-specific databases instead of the main/non-merchant database.

## 📋 Updated Auth Routes

### ✅ Registration (`/api/auth/register`)
- **Before**: Saved users to main database
- **After**: Saves users to merchant-specific database
- **Changes**:
  - Uses `getMerchantCollectionForAPI("users")`
  - Checks for existing users within merchant scope
  - Adds `merchantId` to user document if using shared database

### ✅ Login (`/api/auth/login`)
- **Before**: Searched users in main database
- **After**: Searches users in merchant-specific database
- **Changes**:
  - Uses `getMerchantCollectionForAPI("users")`
  - Queries users within merchant scope only

### ✅ Get Current User (`/api/auth/me`)
- **Before**: Retrieved user from main database
- **After**: Retrieves user from merchant-specific database
- **Changes**:
  - Uses `getMerchantCollectionForAPI("users")`
  - Validates user exists within merchant scope

### ✅ Google OAuth (`/api/auth/google`)
- **Before**: Saved/updated users in main database
- **After**: Saves/updates users in merchant-specific database
- **Changes**:
  - Uses `getMerchantCollectionForAPI("users")`
  - Creates/updates users within merchant scope
  - Adds `merchantId` to new users if using shared database

## 🔧 Implementation Details

### Registration Flow

```typescript
const col = await getMerchantCollectionForAPI("users");
const baseQuery = await buildMerchantQuery();
const merchantId = await getMerchantIdForAPI();

// Check if user exists within merchant scope
const existingUser = await col.findOne({ ...baseQuery, email });

// Create user with merchant context
const newUser: any = { ...userData };
if (merchantId) {
  const useShared = await isUsingSharedDatabase();
  if (useShared) {
    newUser.merchantId = merchantId;
  }
}
await col.insertOne(newUser);
```

### Login Flow

```typescript
const col = await getMerchantCollectionForAPI("users");
const baseQuery = await buildMerchantQuery();

// Find user within merchant scope
const user = await col.findOne({ ...baseQuery, email });
```

## ✨ Benefits

1. **Data Isolation** - Each merchant has their own user database
2. **Security** - Users can only log in to their merchant's store
3. **Scalability** - User data is distributed across merchant databases
4. **Multi-tenancy** - Complete separation of user data per merchant

## 🎯 User Scoping

### Separate Database (Default)
- Each merchant has their own `users` collection in their dedicated database
- Complete data isolation
- No need for `merchantId` field

### Shared Database (Optional)
- All merchants share one database
- Users are filtered by `merchantId` field
- Automatic `merchantId` assignment on registration

## 🔒 Security Implications

- Users registered on Merchant A's store cannot log in to Merchant B's store
- Each merchant maintains their own customer base
- User authentication is scoped to the merchant's database

## 📝 Notes

- **Existing Users**: Users created before this update may need migration to merchant databases
- **JWT Tokens**: Tokens remain valid but user lookup is now merchant-scoped
- **OAuth**: Google OAuth users are also saved to merchant-specific databases

## 🚀 Status

**✅ Complete** - All authentication routes now use merchant-specific databases!

Users are now properly isolated per merchant, ensuring complete data separation and security.


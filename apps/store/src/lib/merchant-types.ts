/**
 * @deprecated Use tenant-types.ts instead
 * This file re-exports from tenant-types.ts for backward compatibility
 */

export * from "./tenant-types";

// Additional deprecated type aliases if needed
/** @deprecated Use TenantStatus instead */
export type MerchantStatus = import("./tenant-types").TenantStatus;
/** @deprecated Use Tenant instead */
export type Merchant = import("./tenant-types").Tenant;
/** @deprecated Use TenantDeployment instead */
export type MerchantDeployment = import("./tenant-types").TenantDeployment;
/** @deprecated Use TenantDatabase instead */
export type MerchantDatabase = import("./tenant-types").TenantDatabase;

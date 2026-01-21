// Multi-tenant types

export type TenantStatus = "active" | "suspended" | "trial" | "inactive";

export type DeploymentType = "subdomain" | "custom_domain";

export type DeploymentStatus = "pending" | "active" | "failed" | "inactive";

// Backward compatibility
export type MerchantStatus = TenantStatus;

/**
 * Tenant Account
 */
export interface Tenant {
    id: string;
    name: string;
    email: string;
    phone?: string;
    status: TenantStatus;
    customDomain?: string;
    deploymentUrl?: string; // e.g., "tenant1.shoestore.com" or "shop.example.com"
    subscriptionId?: string;
    settings: {
        brandName: string;
        logo?: string;
        theme?: {
            primaryColor?: string;
        };
        currency?: string;
        timezone?: string;
    };
    createdAt?: string;
    updatedAt?: string;
}

// Backward compatibility
export type Merchant = Tenant;

/**
 * Tenant Deployment Configuration
 */
export interface TenantDeployment {
    id: string;
    tenantId: string;
    deploymentType: DeploymentType;
    subdomain?: string; // e.g., "tenant1"
    customDomain?: string; // e.g., "shop.example.com"
    deploymentStatus: DeploymentStatus;
    deploymentUrl: string; // Full URL
    deploymentProvider?: "custom";

    deploymentId?: string; // Provider's deployment ID (dpl_xxx)
    environmentVariables: Record<string, string>;
    lastDeployedAt?: string;
    createdAt?: string;
    updatedAt?: string;
}

// Backward compatibility
export type MerchantDeployment = TenantDeployment;

/**
 * Tenant Database Configuration
 */
export interface TenantDatabase {
    id: string;
    tenantId: string;
    databaseName: string; // e.g., "tenant1_db" or use shared DB
    connectionString?: string; // Encrypted, if separate DB
    useSharedDatabase: boolean; // true = shared DB with tenantId, false = separate DB
    status: "active" | "inactive";
    createdAt?: string;
    updatedAt?: string;
}

// Backward compatibility
export type MerchantDatabase = TenantDatabase;

/**
 * Default tenant settings
 */
export const defaultTenantSettings = {
    brandName: "My Store",
    currency: "USD",
    timezone: "UTC",
};

// Backward compatibility
export const defaultMerchantSettings = defaultTenantSettings;

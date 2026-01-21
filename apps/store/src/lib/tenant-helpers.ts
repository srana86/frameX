// Server-only tenant helper functions
import { getTenantFullDataFromSuperAdmin, getTenantDeploymentFromSuperAdmin } from "./super-admin-client";
import { Tenant, TenantDeployment, TenantDatabase } from "./tenant-types";

/**
 * Get tenant by ID
 */
export async function getTenant(tenantId: string): Promise<Tenant | null> {
    try {
        const fullData = await getTenantFullDataFromSuperAdmin(tenantId);
        // API returns .merchant property, cast to Tenant type
        return (fullData?.merchant as Tenant) || null;
    } catch (error) {
        console.error("Error fetching tenant:", error);
        return null;
    }
}

// Backward compatibility alias
export const getMerchant = getTenant;

/**
 * Get tenant by email
 */
export async function getTenantByEmail(email: string): Promise<Tenant | null> {
    console.warn("getTenantByEmail not implemented via API yet");
    return null;
}

// Backward compatibility alias
export const getMerchantByEmail = getTenantByEmail;

/**
 * Get tenant by custom domain
 */
export async function getTenantByDomain(domain: string): Promise<Tenant | null> {
    // This logic is typically handled by middleware rewriting to tenantId
    console.warn("getTenantByDomain not implemented via API yet");
    return null;
}

// Backward compatibility alias
export const getMerchantByDomain = getTenantByDomain;

/**
 * Get tenant deployment configuration
 * Fetches from super-admin API since tenant_deployments is stored in super-admin database
 */
export async function getTenantDeployment(tenantId: string): Promise<TenantDeployment | null> {
    try {
        // Fetch from super-admin API since tenant_deployments collection is in super-admin DB
        const deployment = await getTenantDeploymentFromSuperAdmin(tenantId);

        if (deployment) {
            // Map SuperAdmin deployment to TenantDeployment type
            return {
                id: deployment.id,
                tenantId: (deployment as any).tenantId || deployment.merchantId,
                deploymentType: deployment.deploymentType as "subdomain" | "custom_domain",
                subdomain: deployment.subdomain,
                customDomain: deployment.customDomain,
                deploymentStatus: deployment.deploymentStatus as "pending" | "active" | "failed" | "inactive",
                deploymentUrl: deployment.deploymentUrl,
                deploymentProvider: deployment.deploymentProvider as "custom" | undefined,
                deploymentId: deployment.deploymentId,
                environmentVariables: deployment.environmentVariables,
                lastDeployedAt: deployment.lastDeployedAt,
                createdAt: deployment.createdAt,
                updatedAt: deployment.updatedAt,
            };
        }

        return null;
    } catch (error) {
        console.error("Error fetching tenant deployment from super-admin:", error);
        return null;
    }
}

// Backward compatibility alias
export const getMerchantDeployment = getTenantDeployment;

/**
 * Get tenant database configuration
 */
export async function getTenantDatabase(tenantId: string): Promise<TenantDatabase | null> {
    try {
        const fullData = await getTenantFullDataFromSuperAdmin(tenantId);
        if (fullData?.database) {
            const saDb = fullData.database;
            return {
                id: saDb.id,
                tenantId: (saDb as any).tenantId || saDb.merchantId,
                databaseName: saDb.databaseName,
                status: saDb.status as 'active' | 'inactive',
                useSharedDatabase: saDb.useSharedDatabase,
                createdAt: saDb.createdAt,
                updatedAt: saDb.updatedAt
            } as unknown as TenantDatabase;
        }
        return null;
    } catch (error) {
        console.error("Error fetching tenant database:", error);
        return null;
    }
}

// Backward compatibility alias  
export const getMerchantDatabase = getTenantDatabase;

/**
 * Get database name for tenant
 * Returns tenant-specific DB name or shared DB name
 */
export async function getTenantDbName(tenantId: string): Promise<string> {
    const dbConfig = await getTenantDatabase(tenantId);

    if (dbConfig && !dbConfig.useSharedDatabase) {
        return dbConfig.databaseName;
    }

    // Use shared database
    return process.env.MONGODB_DB || "shoestore";
}

// Backward compatibility alias
export const getMerchantDbName = getTenantDbName;

/**
 * Get all active tenants
 */
export async function getAllTenants(): Promise<Tenant[]> {
    // Not supported via simple API call without pagination/auth usually
    return [];
}

// Backward compatibility alias
export const getAllMerchants = getAllTenants;

/**
 * Create new tenant
 */
export async function createTenant(tenantData: Omit<Tenant, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<Tenant> {
    throw new Error("Create tenant not supported via Store App");
}

// Backward compatibility alias
export const createMerchant = createTenant;

/**
 * Update tenant
 */
export async function updateTenant(tenantId: string, updates: Partial<Tenant>): Promise<Tenant | null> {
    throw new Error("Update tenant not supported via Store App");
}

// Backward compatibility alias
export const updateMerchant = updateTenant;

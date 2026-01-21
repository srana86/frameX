export interface Tenant {
    id: string;
    name: string;
    email: string;
    status: string;
    createdAt?: string;
}

export interface TenantDeployment {
    id: string;
    tenantId: string;
    deploymentUrl: string;
    deploymentStatus: string;
    deploymentType: string;
}

export interface TenantDatabase {
    id: string;
    tenantId: string;
    databaseName: string;
    useSharedDatabase: boolean;
    status: string;
}

export type TenantStatus = "ACTIVE" | "INACTIVE" | "TRIAL" | "SUSPENDED";

// Backward compatibility aliases if needed
export type Merchant = Tenant;
export type MerchantStatus = TenantStatus;

export interface TenantContext {
  tenant: {
    id: string;
    name: string;
    email: string;
    status: string;
    settings?: any;
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
}

export interface FraudCheckData {
  phone: string;
  total_parcels?: number;
  successful_deliveries?: number;
  failed_deliveries?: number;
  success_rate?: number;
  fraud_risk?: "low" | "medium" | "high";
  courier_history?: Array<{
    courier: string;
    total: number;
    successful: number;
    failed: number;
    success_rate: number;
  }>;
}

export interface DomainConfig {
  domain?: string;
  verified: boolean;
  dnsRecords?: Array<{
    type: string;
    name: string;
    value: string;
    status?: "valid" | "invalid" | "pending";
  }>;
}

export interface FeatureCheck {
  enabled: boolean;
  limit?: number | "unlimited";
  currentUsage?: number;
}

// Email-related interfaces are now in separate files:
// - emailProvider.interface.ts
// - emailTemplate.interface.ts

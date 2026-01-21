export type TenantStatus = 'active' | 'suspended' | 'trial' | 'inactive';

export interface ITenantSettings {
  brandName?: string;
  logo?: string;
  theme?: {
    primaryColor?: string;
  };
  currency?: string;
  timezone?: string;
}

export interface ITenant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: TenantStatus;
  customDomain?: string;
  deploymentUrl?: string;
  subscriptionId?: string;
  settings?: ITenantSettings;
  createdAt?: string;
  updatedAt?: string;
}

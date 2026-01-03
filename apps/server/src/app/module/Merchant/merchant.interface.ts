export type MerchantStatus = 'active' | 'suspended' | 'trial' | 'inactive';

export interface IMerchantSettings {
  brandName?: string;
  logo?: string;
  theme?: {
    primaryColor?: string;
  };
  currency?: string;
  timezone?: string;
}

export interface IMerchant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: MerchantStatus;
  customDomain?: string;
  deploymentUrl?: string;
  subscriptionId?: string;
  settings?: IMerchantSettings;
  createdAt?: string;
  updatedAt?: string;
}

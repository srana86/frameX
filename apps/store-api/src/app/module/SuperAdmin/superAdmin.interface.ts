export interface Merchant {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt: string;
  [key: string]: any;
}

export interface MerchantDatabase {
  id: string;
  databaseName: string;
  useSharedDatabase: boolean;
  connectionString?: string;
  status: string;
}

export interface MerchantDeployment {
  id: string;
  deploymentUrl: string;
  deploymentStatus: string;
  deploymentType: string;
}

export interface CreateMerchantPayload {
  name: string;
  email: string;
  password: string;
}

export interface UpdateMerchantPayload {
  id: string;
  name?: string;
  email?: string;
  status?: string;
}

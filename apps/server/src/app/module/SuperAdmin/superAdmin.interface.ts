export interface Tenant {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt: string;
  [key: string]: any;
}

export interface TenantDatabase {
  id: string;
  databaseName: string;
  useSharedDatabase: boolean;
  connectionString?: string;
  status: string;
}

export interface TenantDeployment {
  id: string;
  deploymentUrl: string;
  deploymentStatus: string;
  deploymentType: string;
}

export interface CreateTenantPayload {
  name: string;
  email: string;
  password?: string;
}

export interface UpdateTenantPayload {
  id: string;
  name?: string;
  email?: string;
  status?: string;
}

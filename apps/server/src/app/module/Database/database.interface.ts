export interface IDatabase {
  id?: string;
  tenantId: string;
  databaseName: string;
  status?: string;
  useSharedDatabase?: boolean;
  sizeOnDisk?: number;
  connectionString?: string;
  createdAt?: string;
  updatedAt?: string;
}

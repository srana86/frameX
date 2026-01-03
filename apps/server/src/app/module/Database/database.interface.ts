export interface IDatabase {
  id?: string;
  merchantId: string;
  databaseName: string;
  status?: string;
  useSharedDatabase?: boolean;
  sizeOnDisk?: number;
  connectionString?: string;
  createdAt?: string;
  updatedAt?: string;
}

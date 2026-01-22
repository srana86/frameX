export interface TCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  order?: number;
  enabled: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

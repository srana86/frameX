export interface TProduct {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  description: string;
  price: number;
  buyPrice?: number;
  images: string[];
  sizes?: string[];
  colors?: string[];
  materials?: string[];
  weight?: string;
  dimensions?: string;
  sku?: string;
  condition?: string;
  warranty?: string;
  tags?: string[];
  discountPercentage?: number;
  featured?: boolean;
  stock?: number;
  order?: number;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

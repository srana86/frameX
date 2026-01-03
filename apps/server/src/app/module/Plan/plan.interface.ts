export interface IPlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  billingCycleMonths: number; // 1, 6, or 12
  featuresList: string[];
  isActive: boolean;
  isPopular?: boolean;
  sortOrder?: number;
  buttonText?: string;
  buttonVariant?: "default" | "outline" | "gradient";
  iconType?: "star" | "grid" | "sparkles";
  createdAt?: string;
  updatedAt?: string;
}

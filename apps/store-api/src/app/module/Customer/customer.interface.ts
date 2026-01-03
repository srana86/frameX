export interface TCustomer {
  id: string;
  fullName: string;
  email?: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode: string;
  totalOrders: number;
  totalSpent: number;
  firstOrderDate?: Date;
  lastOrderDate?: Date;
  averageOrderValue: number;
  createdAt?: Date;
  updatedAt?: Date;
}

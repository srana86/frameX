export interface CourierService {
  id: string;
  name: string;
  enabled: boolean;
  logo?: string;
  credentials?: Record<string, any>;
}

export interface CourierServicesConfig {
  id: string;
  services: CourierService[];
  createdAt?: string;
  updatedAt?: string;
}

export interface DeliveryDetails {
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  city: string;
  area: string;
  amountToCollect: number;
  itemWeight: number;
  specialInstruction?: string;
}

export interface CourierStatusResult {
  consignmentId: string;
  deliveryStatus: string;
  rawStatus: any;
}

export interface OrderCourierInfo {
  serviceId: string;
  serviceName: string;
  consignmentId: string;
  deliveryStatus: string;
  lastSyncedAt: string;
  rawStatus?: any;
}

export interface DeliveryServiceConfig {
  id: string;
  defaultDeliveryCharge: number;
  enableCODForDefault: boolean;
  deliveryChargeNotRefundable: boolean;
  weightBasedCharges: Array<{ weight: number; extraCharge: number }>;
  deliveryOption: "zones" | "districts" | "upazila";
  specificDeliveryCharges: Array<{ location: string; charge: number }>;
  freeShippingThreshold?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

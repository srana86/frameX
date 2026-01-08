export type DeliveryOption = "zones" | "districts" | "upazila";

export interface WeightBasedCharge {
  weight: number; // in kg
  extraCharge: number;
}

export interface SpecificDeliveryCharge {
  location: string; // Zone/District/Upazila name
  charge: number;
}

export interface DeliveryServiceConfig {
  id: string;
  defaultDeliveryCharge: number;
  enableCODForDefault: boolean;
  deliveryChargeNotRefundable: boolean;
  weightBasedCharges: WeightBasedCharge[];
  deliveryOption: DeliveryOption;
  specificDeliveryCharges: SpecificDeliveryCharge[];
  createdAt?: string;
  freeShippingThreshold?: any;
  updatedAt?: string;
}

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

export const defaultDeliveryServiceConfig: DeliveryServiceConfig = {
  id: "delivery_service_config_v1",
  defaultDeliveryCharge: 0,
  enableCODForDefault: true,
  deliveryChargeNotRefundable: false,
  weightBasedCharges: [],
  deliveryOption: "zones",
  specificDeliveryCharges: [],
};

export const defaultCourierServices: CourierService[] = [
  {
    id: "pathao",
    name: "Pathao",
    enabled: false,
  },
  {
    id: "steadfast",
    name: "Steadfast",
    enabled: false,
  },
  {
    id: "redx",
    name: "Redx",
    enabled: false,
  },
  {
    id: "paperfly",
    name: "Paperfly",
    enabled: false,
  },
];

export const defaultCourierServicesConfig: CourierServicesConfig = {
  id: "courier_services_config_v1",
  services: defaultCourierServices,
};

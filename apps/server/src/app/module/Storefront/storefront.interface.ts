export interface StorefrontDeliveryConfig {
  enabled: boolean;
  methods: Array<{
    id: string;
    name: string;
    cost: number;
    estimatedDays: number;
  }>;
  freeShippingThreshold?: number;
}

export interface CalculateShippingRequest {
  city: string;
  area?: string;
  postalCode?: string;
  weight?: number;
  total?: number;
}

export interface CalculateShippingResponse {
  methods: Array<{
    id: string;
    name: string;
    cost: number;
    estimatedDays: number;
  }>;
  freeShipping: boolean;
}

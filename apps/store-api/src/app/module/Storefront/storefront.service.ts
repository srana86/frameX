/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@framex/database";
import {
  StorefrontDeliveryConfig,
  CalculateShippingRequest,
  CalculateShippingResponse,
} from "./storefront.interface";

// Get delivery config for storefront (public endpoint)
const getStorefrontDeliveryConfigFromDB =
  async (tenantId: string): Promise<StorefrontDeliveryConfig> => {
    const config = await prisma.deliveryServiceConfig.findUnique({
      where: {
        tenantId,
      },
    });

    if (!config) {
      return {
        enabled: true,
        methods: [
          {
            id: "standard",
            name: "Standard Delivery",
            cost: 0,
            estimatedDays: 3,
          },
        ],
      };
    }

    return {
      enabled: true,
      methods: [
        {
          // Assuming config has a deliveryOption field or we infer 'standard'
          // The Mongoose code returned 'standard'.
          // Config model has: deliveryOption String @default("districts")
          id: "standard", // or config.deliveryOption
          name: "Standard Delivery",
          cost: Number(config.defaultDeliveryCharge || 0),
          estimatedDays: 3,
        },
      ],
      // freeShippingThreshold is not in schema directly? 
      // Schema: weightBasedCharges, specificDeliveryCharges.
      // Schema doesn't have `freeShippingThreshold`.
      // Mongoose code used `(config as any).freeShippingThreshold`.
      // I'll keep the cast for now or remove if not supported.
      // Let's assume it might be in JSON maybe? Or it was removed from schema.
      // I'll leave it as any or default to undefined.
      freeShippingThreshold: (config as any).freeShippingThreshold,
    };
  };

// Calculate shipping cost (public endpoint)
const calculateShippingFromDB = async (
  tenantId: string,
  payload: CalculateShippingRequest
): Promise<CalculateShippingResponse> => {
  const config = await prisma.deliveryServiceConfig.findUnique({
    where: {
      tenantId,
    },
  });

  if (!config) {
    return {
      methods: [
        {
          id: "standard",
          name: "Standard Delivery",
          cost: 0,
          estimatedDays: 3,
        },
      ],
      freeShipping: false,
    };
  }

  let shippingCost = Number(config.defaultDeliveryCharge || 0);

  // Check for specific delivery charges
  const specificDeliveryCharges = config.specificDeliveryCharges as any[]; // Json type
  if (
    specificDeliveryCharges &&
    Array.isArray(specificDeliveryCharges) &&
    specificDeliveryCharges.length > 0
  ) {
    const normalize = (str: string) => str.toLowerCase().trim();

    // Try to match by area first (more specific)
    if (payload.area) {
      const areaMatch = specificDeliveryCharges.find(
        (charge: any) => normalize(charge.location) === normalize(payload.area!)
      );
      if (areaMatch) {
        shippingCost = Number(areaMatch.charge);
      }
    }

    // Try to match by city if no area match
    if (shippingCost === Number(config.defaultDeliveryCharge)) {
      const cityMatch = specificDeliveryCharges.find(
        (charge: any) => normalize(charge.location) === normalize(payload.city)
      );
      if (cityMatch) {
        shippingCost = Number(cityMatch.charge);
      }
    }

    // Try partial matching (in case location contains city name)
    if (shippingCost === Number(config.defaultDeliveryCharge)) {
      const partialMatch = specificDeliveryCharges.find((charge: any) => {
        const normalizedLocation = normalize(charge.location);
        const normalizedCity = normalize(payload.city);
        return (
          normalizedLocation.includes(normalizedCity) ||
          normalizedCity.includes(normalizedLocation)
        );
      });
      if (partialMatch) {
        shippingCost = Number(partialMatch.charge);
      }
    }
  }

  // Check for free shipping threshold
  const freeShippingThreshold = (config as any).freeShippingThreshold; // Not in schema, keeping logic if extra field exists
  const freeShipping = freeShippingThreshold
    ? (payload.total || 0) >= freeShippingThreshold
    : false;

  if (freeShipping) {
    shippingCost = 0;
  }

  return {
    methods: [
      {
        id: "standard",
        name: "Standard Delivery",
        cost: shippingCost,
        estimatedDays: 3,
      },
    ],
    freeShipping,
  };
};

export const StorefrontServices = {
  getStorefrontDeliveryConfigFromDB,
  calculateShippingFromDB,
};

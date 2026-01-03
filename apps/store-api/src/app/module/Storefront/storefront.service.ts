/* eslint-disable @typescript-eslint/no-explicit-any */
import { DeliveryServiceConfig } from "../Config/config.model";
import {
  StorefrontDeliveryConfig,
  CalculateShippingRequest,
  CalculateShippingResponse,
} from "./storefront.interface";

// Get delivery config for storefront (public endpoint)
const getStorefrontDeliveryConfigFromDB =
  async (): Promise<StorefrontDeliveryConfig> => {
    const config = await DeliveryServiceConfig.findOne({
      id: "delivery-service-config",
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
          id: "standard",
          name: "Standard Delivery",
          cost: config.defaultDeliveryCharge || 0,
          estimatedDays: 3,
        },
      ],
      freeShippingThreshold: (config as any).freeShippingThreshold,
    };
  };

// Calculate shipping cost (public endpoint)
const calculateShippingFromDB = async (
  payload: CalculateShippingRequest
): Promise<CalculateShippingResponse> => {
  const config = await DeliveryServiceConfig.findOne({
    id: "delivery-service-config",
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

  let shippingCost = config.defaultDeliveryCharge || 0;

  // Check for specific delivery charges
  if (
    config.specificDeliveryCharges &&
    config.specificDeliveryCharges.length > 0
  ) {
    const normalize = (str: string) => str.toLowerCase().trim();

    // Try to match by area first (more specific)
    if (payload.area) {
      const areaMatch = config.specificDeliveryCharges.find(
        (charge) => normalize(charge.location) === normalize(payload.area!)
      );
      if (areaMatch) {
        shippingCost = areaMatch.charge;
      }
    }

    // Try to match by city if no area match
    if (shippingCost === config.defaultDeliveryCharge) {
      const cityMatch = config.specificDeliveryCharges.find(
        (charge) => normalize(charge.location) === normalize(payload.city)
      );
      if (cityMatch) {
        shippingCost = cityMatch.charge;
      }
    }

    // Try partial matching (in case location contains city name)
    if (shippingCost === config.defaultDeliveryCharge) {
      const partialMatch = config.specificDeliveryCharges.find((charge) => {
        const normalizedLocation = normalize(charge.location);
        const normalizedCity = normalize(payload.city);
        return (
          normalizedLocation.includes(normalizedCity) ||
          normalizedCity.includes(normalizedLocation)
        );
      });
      if (partialMatch) {
        shippingCost = partialMatch.charge;
      }
    }
  }

  // Check for free shipping threshold
  const freeShippingThreshold = (config as any).freeShippingThreshold;
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

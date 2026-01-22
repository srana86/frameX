import { getTenantCollectionForAPI, buildTenantQuery } from "./api-helpers";
import type { DeliveryServiceConfig, CourierServicesConfig } from "../types/delivery-config-types";
import { defaultDeliveryServiceConfig, defaultCourierServicesConfig } from "../types/delivery-config-types";

const DELIVERY_SERVICE_CONFIG_ID = "delivery_service_config_v1";
const COURIER_SERVICES_CONFIG_ID = "courier_services_config_v1";

export async function getDeliveryServiceConfig(): Promise<DeliveryServiceConfig> {
  try {
    const col = await getTenantCollectionForAPI("delivery_service_config");
    const query = await buildTenantQuery({ id: DELIVERY_SERVICE_CONFIG_ID });
    const doc = await col.findOne(query);
    if (doc) {
      const { _id, ...config } = doc;
      return config as DeliveryServiceConfig;
    }
  } catch (error) {
    console.error("Error fetching delivery service config:", error);
  }
  return defaultDeliveryServiceConfig;
}

export async function getCourierServicesConfig(): Promise<CourierServicesConfig> {
  try {
    const col = await getTenantCollectionForAPI("courier_services_config");
    const query = await buildTenantQuery({ id: COURIER_SERVICES_CONFIG_ID });
    const doc = await col.findOne(query);
    if (doc) {
      const { _id, ...config } = doc;
      return config as CourierServicesConfig;
    }
  } catch (error) {
    console.error("Error fetching courier services config:", error);
  }
  return defaultCourierServicesConfig;
}

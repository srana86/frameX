import { CourierServicesConfig } from "../Config/config.model";
import { getPathaoAccessToken } from "./courier.util";
import { CourierService } from "./delivery.interface";

// Get Pathao cities
const getPathaoCitiesFromDB = async () => {
  const courierConfig = await CourierServicesConfig.findOne({
    id: "courier-services-config",
  });

  if (!courierConfig) {
    throw new Error("Courier services config not found");
  }

  const pathaoService = courierConfig.services.find(
    (s: any) => s.id === "pathao" && s.enabled
  ) as CourierService | undefined;

  if (!pathaoService || !pathaoService.credentials) {
    throw new Error("Pathao service is not configured or enabled");
  }

  const accessToken = await getPathaoAccessToken(pathaoService);
  const baseUrl = "https://api-hermes.pathao.com";

  const res = await fetch(`${baseUrl}/aladdin/api/v1/city-list`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(
      `Failed to fetch Pathao cities: ${errorText || res.statusText}`
    );
  }

  const data = await res.json();
  const cities = data?.data?.data || [];

  return cities;
};

// Get Pathao zones
const getPathaoZonesFromDB = async (cityId: string) => {
  if (!cityId) {
    throw new Error("city_id parameter is required");
  }

  const courierConfig = await CourierServicesConfig.findOne({
    id: "courier-services-config",
  });

  if (!courierConfig) {
    throw new Error("Courier services config not found");
  }

  const pathaoService = courierConfig.services.find(
    (s: any) => s.id === "pathao" && s.enabled
  ) as CourierService | undefined;

  if (!pathaoService || !pathaoService.credentials) {
    throw new Error("Pathao service is not configured or enabled");
  }

  const accessToken = await getPathaoAccessToken(pathaoService);
  const baseUrl = "https://api-hermes.pathao.com";

  const res = await fetch(
    `${baseUrl}/aladdin/api/v1/cities/${encodeURIComponent(cityId)}/zone-list`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(
      `Failed to fetch Pathao zones: ${errorText || res.statusText}`
    );
  }

  const data = await res.json();
  const zones = data?.data?.data || [];

  return zones;
};

// Get Pathao areas
const getPathaoAreasFromDB = async (zoneId: string) => {
  if (!zoneId) {
    throw new Error("zone_id parameter is required");
  }

  const courierConfig = await CourierServicesConfig.findOne({
    id: "courier-services-config",
  });

  if (!courierConfig) {
    throw new Error("Courier services config not found");
  }

  const pathaoService = courierConfig.services.find(
    (s: any) => s.id === "pathao" && s.enabled
  ) as CourierService | undefined;

  if (!pathaoService || !pathaoService.credentials) {
    throw new Error("Pathao service is not configured or enabled");
  }

  const accessToken = await getPathaoAccessToken(pathaoService);
  const baseUrl = "https://api-hermes.pathao.com";

  const res = await fetch(
    `${baseUrl}/aladdin/api/v1/zones/${encodeURIComponent(zoneId)}/area-list`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(
      `Failed to fetch Pathao areas: ${errorText || res.statusText}`
    );
  }

  const data = await res.json();
  const areas = data?.data?.data || [];

  return areas;
};

export const PathaoServices = {
  getPathaoCitiesFromDB,
  getPathaoZonesFromDB,
  getPathaoAreasFromDB,
};

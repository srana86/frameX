import { prisma } from "@framex/database";
import { getPathaoAccessToken } from "./courier.util";
import { CourierService } from "./delivery.interface";

const getPathaoCitiesFromDB = async (tenantId: string) => {
  const courierConfig = await prisma.courierServicesConfig.findUnique({
    where: { tenantId }
  });

  if (!courierConfig) throw new Error("Courier services config not found");

  const services: any[] = (courierConfig.services as any) || [];
  const pathaoService = services.find(
    (s: any) => s.id === "pathao" && s.enabled
  );

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
    throw new Error(`Failed to fetch Pathao cities: ${errorText || res.statusText}`);
  }

  const data = await res.json();
  return data?.data?.data || [];
};

const getPathaoZonesFromDB = async (tenantId: string, cityId: string) => {
  if (!cityId) throw new Error("city_id parameter is required");

  const courierConfig = await prisma.courierServicesConfig.findUnique({
    where: { tenantId }
  });

  if (!courierConfig) throw new Error("Courier services config not found");

  const services: any[] = (courierConfig.services as any) || [];
  const pathaoService = services.find(
    (s: any) => s.id === "pathao" && s.enabled
  );

  if (!pathaoService || !pathaoService.credentials) throw new Error("Pathao service not configured");

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
    throw new Error(`Failed to fetch Pathao zones: ${errorText}`);
  }

  const data = await res.json();
  return data?.data?.data || [];
};

const getPathaoAreasFromDB = async (tenantId: string, zoneId: string) => {
  if (!zoneId) throw new Error("zone_id parameter is required");

  const courierConfig = await prisma.courierServicesConfig.findUnique({
    where: { tenantId }
  });

  if (!courierConfig) throw new Error("Courier services config not found");

  const services: any[] = (courierConfig.services as any) || [];
  const pathaoService = services.find(
    (s: any) => s.id === "pathao" && s.enabled
  );

  if (!pathaoService || !pathaoService.credentials) throw new Error("Pathao service not configured");

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
    throw new Error(`Failed to fetch Pathao areas: ${errorText}`);
  }

  const data = await res.json();
  return data?.data?.data || [];
};

export const PathaoServices = {
  getPathaoCitiesFromDB,
  getPathaoZonesFromDB,
  getPathaoAreasFromDB,
};

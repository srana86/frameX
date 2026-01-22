export interface UserLocation {
  country: string;
  countryCode: string;
  ip: string;
}

export interface DetailedIpGeolocation {
  ip: string;
  country?: string;
  countryCode?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  isp?: string;
}

/**
 * Get user's location from IP address using a free geolocation API
 * Tries multiple services as fallback
 */
export async function getUserLocation(ip?: string): Promise<UserLocation | null> {
  // Try ipapi.co first
  try {
    const apiUrl = ip ? `https://ipapi.co/${ip}/json/` : "https://ipapi.co/json/";

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(apiUrl, {
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();

      if (!data.error && data.country_code) {
        return {
          country: data.country_name || "",
          countryCode: data.country_code || "",
          ip: data.ip || ip || "",
        };
      }
    }
  } catch (error: any) {
    // Silently handle connection errors - don't spam console
    const isConnectionError = error?.cause?.code === "ECONNREFUSED" || error?.code === "ECONNREFUSED";
    if (!isConnectionError) {
      console.warn("ipapi.co failed, trying fallback:", error);
    }
  }

  // Fallback to ip-api.com
  try {
    const apiUrl = ip
      ? `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,query`
      : "http://ip-api.com/json/?fields=status,message,country,countryCode,query";

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(apiUrl, {
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();

      if (data.status === "success" && data.countryCode) {
        return {
          country: data.country || "",
          countryCode: data.countryCode || "",
          ip: data.query || ip || "",
        };
      }
    }
  } catch (error: any) {
    // Silently handle connection errors - don't spam console
    const isConnectionError = error?.cause?.code === "ECONNREFUSED" || error?.code === "ECONNREFUSED";
    if (!isConnectionError) {
      console.warn("ip-api.com fallback failed:", error);
    }
  }

  // Last fallback: ipgeolocation.io (free tier)
  try {
    const apiUrl = "https://api.ipgeolocation.io/ipgeo?apiKey=free";

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(apiUrl, {
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();

      if (data.country_code2) {
        return {
          country: data.country_name || "",
          countryCode: data.country_code2 || "",
          ip: data.ip || ip || "",
        };
      }
    }
  } catch (error: any) {
    // Silently handle connection errors - don't spam console
    const isConnectionError = error?.cause?.code === "ECONNREFUSED" || error?.code === "ECONNREFUSED";
    if (!isConnectionError) {
      console.warn("ipgeolocation.io fallback failed:", error);
    }
  }

  console.error("All geolocation APIs failed");
  return null;
}

/**
 * Get detailed geolocation data from IP address including coordinates for map visualization
 * Tries multiple services as fallback
 */
export async function getDetailedIpGeolocation(ip?: string): Promise<DetailedIpGeolocation | null> {
  // Try ipapi.co first (provides detailed data including lat/long)
  try {
    const apiUrl = ip ? `https://ipapi.co/${ip}/json/` : "https://ipapi.co/json/";

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(apiUrl, {
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();

      if (!data.error && data.country_code) {
        return {
          ip: data.ip || ip || "",
          country: data.country_name || "",
          countryCode: data.country_code || "",
          region: data.region || data.region_code || "",
          city: data.city || "",
          latitude: data.latitude ? parseFloat(data.latitude) : undefined,
          longitude: data.longitude ? parseFloat(data.longitude) : undefined,
          timezone: data.timezone || "",
          isp: data.org || "",
        };
      }
    }
  } catch (error: any) {
    const isConnectionError = error?.cause?.code === "ECONNREFUSED" || error?.code === "ECONNREFUSED";
    if (!isConnectionError) {
      console.warn("ipapi.co detailed geolocation failed, trying fallback:", error);
    }
  }

  // Fallback to ip-api.com (provides lat/long)
  try {
    const apiUrl = ip
      ? `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,lat,lon,timezone,isp,query`
      : "http://ip-api.com/json/?fields=status,message,country,countryCode,region,regionName,city,lat,lon,timezone,isp,query";

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(apiUrl, {
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();

      if (data.status === "success" && data.countryCode) {
        return {
          ip: data.query || ip || "",
          country: data.country || "",
          countryCode: data.countryCode || "",
          region: data.regionName || data.region || "",
          city: data.city || "",
          latitude: data.lat ? parseFloat(data.lat) : undefined,
          longitude: data.lon ? parseFloat(data.lon) : undefined,
          timezone: data.timezone || "",
          isp: data.isp || "",
        };
      }
    }
  } catch (error: any) {
    const isConnectionError = error?.cause?.code === "ECONNREFUSED" || error?.code === "ECONNREFUSED";
    if (!isConnectionError) {
      console.warn("ip-api.com detailed geolocation fallback failed:", error);
    }
  }

  // Last fallback: ip-api.com with minimal data
  try {
    const basicLocation = await getUserLocation(ip);
    if (basicLocation) {
      return {
        ip: basicLocation.ip,
        country: basicLocation.country,
        countryCode: basicLocation.countryCode,
      };
    }
  } catch (error) {
    console.warn("Basic geolocation fallback failed:", error);
  }

  return null;
}

/**
 * Get user's IP address from request headers (server-side)
 */
export function getClientIP(headers: Headers): string | null {
  // Check various headers for the real IP
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIP = headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = headers.get("cf-connecting-ip"); // Cloudflare
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  return null;
}

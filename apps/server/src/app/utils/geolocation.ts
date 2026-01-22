import axios from "axios";

export interface UserLocation {
    country: string;
    countryCode: string;
    ip: string;
}

/**
 * Get user's location from IP address using a free geolocation API
 * Tries multiple services as fallback
 */
export async function getUserLocation(ip?: string): Promise<UserLocation | null> {
    // Try ipapi.co first
    try {
        const apiUrl = ip ? `https://ipapi.co/${ip}/json/` : "https://ipapi.co/json/";

        const response = await axios.get<any>(apiUrl, {
            timeout: 5000,
            headers: {
                Accept: "application/json",
            },
        });

        if (response.status === 200) {
            const data = response.data;

            if (!data.error && data.country_code) {
                return {
                    country: data.country_name || "",
                    countryCode: data.country_code || "",
                    ip: data.ip || ip || "",
                };
            }
        }
    } catch (error: any) {
        // console.warn("ipapi.co failed, trying fallback:", error.message);
    }

    // Fallback to ip-api.com
    try {
        const apiUrl = ip
            ? `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,query`
            : "http://ip-api.com/json/?fields=status,message,country,countryCode,query";

        const response = await axios.get<any>(apiUrl, {
            timeout: 5000,
            headers: {
                Accept: "application/json",
            },
        });

        if (response.status === 200) {
            const data = response.data;

            if (data.status === "success" && data.countryCode) {
                return {
                    country: data.country || "",
                    countryCode: data.countryCode || "",
                    ip: data.query || ip || "",
                };
            }
        }
    } catch (error: any) {
        // console.warn("ip-api.com fallback failed:", error.message);
    }

    // Last fallback: ipgeolocation.io (free tier)
    try {
        const apiUrl = "https://api.ipgeolocation.io/ipgeo?apiKey=free";

        const response = await axios.get<any>(apiUrl, {
            timeout: 5000,
            headers: {
                Accept: "application/json",
            },
        });

        if (response.status === 200) {
            const data = response.data;

            if (data.country_code2) {
                return {
                    country: data.country_name || "",
                    countryCode: data.country_code2 || "",
                    ip: data.ip || ip || "",
                };
            }
        }
    } catch (error: any) {
        // console.warn("ipgeolocation.io fallback failed:", error.message);
    }

    console.error("All geolocation APIs failed");
    return null;
}

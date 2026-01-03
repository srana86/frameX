import axios from "axios";


const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true,
});

// Helper for server-side API calls
export const serverSideApiClient = (token?: string, merchantId?: string) => {
    return axios.create({
        baseURL: API_BASE_URL,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            "X-Merchant-ID": merchantId || process.env.NEXT_PUBLIC_MERCHANT_ID || "",
        },
        withCredentials: true,
    });
};

// Request interceptor for client-side
apiClient.interceptors.request.use(
    (config) => {
        const merchantId = process.env.NEXT_PUBLIC_MERCHANT_ID;
        if (merchantId) {
            config.headers["X-Merchant-ID"] = merchantId;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export const apiRequest = async <T>(
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
    url: string,
    data?: any,
    params?: any,
    headers?: any
): Promise<T> => {
    const response = await apiClient({
        method,
        url,
        data,
        params,
        headers: {
            ...headers
        }
    });
    return response.data;
};

export default apiClient;

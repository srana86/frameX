import axios from "axios";


const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true,
});

// Helper for server-side API calls
export const serverSideApiClient = (token?: string, merchantId?: string, domain?: string) => {
    return axios.create({
        baseURL: API_BASE_URL,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            "X-Merchant-ID": merchantId || process.env.NEXT_PUBLIC_MERCHANT_ID || "",
            "X-Domain": domain || process.env.NEXT_PUBLIC_DOMAIN || "",
        },
        withCredentials: true,
    });
};

// Request interceptor for client-side
apiClient.interceptors.request.use(
    (config) => {
        // Send current domain for tenant resolution
        if (typeof window !== "undefined") {
            config.headers["X-Domain"] = window.location.hostname;

            // Add Authorization header from localStorage if available
            const authToken = localStorage.getItem("auth_token");
            if (authToken) {
                config.headers["Authorization"] = `Bearer ${authToken}`;
            }
        }
        // Fallback to merchant ID
        const merchantId = process.env.NEXT_PUBLIC_MERCHANT_ID;
        if (merchantId) {
            config.headers["X-Merchant-ID"] = merchantId;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for token refresh
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Check if error is 401 and we haven't retried yet
        // Also skip if the request was for the refresh endpoint itself to avoid loops
        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url.includes("/auth/refresh-token")
        ) {
            originalRequest._retry = true;

            try {
                // Call refresh endpoint
                // We use axios instance directly but ensure we don't use the same interceptor?
                // Actually using apiClient is fine as long as we check the URL above
                const response = await apiClient.post("/auth/refresh-token");

                // response.data is (success, message, data: { accessToken }) based on sendResponse
                const { accessToken } = response.data.data;

                if (accessToken) {
                    // Update localStorage
                    localStorage.setItem("auth_token", accessToken);

                    // Update header in original request
                    originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;

                    // Retry original request
                    return apiClient(originalRequest);
                }
            } catch (refreshError) {
                // Refresh failed - logout or redirect
                // Only clear if we are in browser
                if (typeof window !== "undefined") {
                    localStorage.removeItem("auth_token");
                    // Optional: Redirect to login
                    window.location.href = "/login";
                }
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
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

import axios from "axios";
import FormData from "form-data";

export interface SSLCommerzConfig {
    storeId: string;
    storePassword: string;
    isLive: boolean;
}

export interface PaymentInitData {
    total_amount: number;
    currency: string;
    tran_id: string;
    success_url: string;
    fail_url: string;
    cancel_url: string;
    ipn_url?: string;
    shipping_method?: string;
    product_name: string;
    product_category: string;
    product_profile: string;
    cus_name: string;
    cus_email: string;
    cus_add1: string;
    cus_add2?: string;
    cus_city: string;
    cus_state: string;
    cus_postcode: string;
    cus_country: string;
    cus_phone: string;
    cus_fax?: string;
    ship_name?: string;
    ship_add1?: string;
    ship_add2?: string;
    ship_city?: string;
    ship_state?: string;
    ship_postcode?: string;
    ship_country?: string;
    [key: string]: any;
}

function processPaymentInitData(data: PaymentInitData & { store_id: string; store_passwd: string }): FormData {
    const postData: Record<string, any> = {};

    postData["store_id"] = data.store_id;
    postData["store_passwd"] = data.store_passwd;
    postData["tran_id"] = data.tran_id;
    postData["total_amount"] = data.total_amount;
    postData["currency"] = data.currency;
    postData["success_url"] = data.success_url;
    postData["fail_url"] = data.fail_url;
    postData["cancel_url"] = data.cancel_url;

    if (data.ipn_url) postData["ipn_url"] = data.ipn_url;

    postData["cus_name"] = data.cus_name;
    postData["cus_email"] = data.cus_email;
    postData["cus_add1"] = data.cus_add1;
    postData["cus_add2"] = data.cus_add2 || "";
    postData["cus_city"] = data.cus_city;
    postData["cus_state"] = data.cus_state;
    postData["cus_postcode"] = data.cus_postcode;
    postData["cus_country"] = data.cus_country;
    postData["cus_phone"] = data.cus_phone;
    if (data.cus_fax) postData["cus_fax"] = data.cus_fax;

    if (data.shipping_method) postData["shipping_method"] = data.shipping_method;
    if (data.ship_name) postData["ship_name"] = data.ship_name;
    if (data.ship_add1) postData["ship_add1"] = data.ship_add1;
    if (data.ship_add2) postData["ship_add2"] = data.ship_add2;
    if (data.ship_city) postData["ship_city"] = data.ship_city;
    if (data.ship_state) postData["ship_state"] = data.ship_state;
    if (data.ship_postcode) postData["ship_postcode"] = data.ship_postcode;
    if (data.ship_country) postData["ship_country"] = data.ship_country;

    postData["product_name"] = data.product_name;
    postData["product_category"] = data.product_category;
    postData["product_profile"] = data.product_profile;

    const formData = new FormData();
    for (const key in postData) {
        if (postData[key] !== undefined && postData[key] !== null) {
            formData.append(key, String(postData[key]));
        }
    }

    return formData;
}

export async function initSSLCommerzPayment(config: SSLCommerzConfig, paymentData: PaymentInitData) {
    const baseURL = `https://${config.isLive ? "securepay" : "sandbox"}.sslcommerz.com`;
    const initURL = `${baseURL}/gwprocess/v4/api.php`;

    const dataWithCredentials = {
        ...paymentData,
        store_id: config.storeId,
        store_passwd: config.storePassword,
    };

    const formData = processPaymentInitData(dataWithCredentials);

    try {
        const response = await axios.post(initURL, formData, {
            headers: {
                ...formData.getHeaders(),
            },
            maxRedirects: 0,
        } as any);

        if (response.data && typeof response.data === "object") {
            return response.data;
        }

        if (typeof response.data === "string" && response.data.includes("http")) {
            return {
                GatewayPageURL: response.data,
                sessionkey: paymentData.tran_id,
            };
        }

        try {
            const parsed = typeof response.data === "string" ? JSON.parse(response.data) : response.data;
            return parsed;
        } catch {
            return response.data;
        }
    } catch (error: any) {
        if (error.response && error.response.status >= 300 && error.response.status < 400) {
            const redirectUrl = error.response.headers.location;
            if (redirectUrl) {
                return {
                    GatewayPageURL: redirectUrl,
                    sessionkey: paymentData.tran_id,
                };
            }
        }

        if (error.response && error.response.data) {
            throw new Error(error.response.data.message || "Failed to initialize payment");
        }

        throw error;
    }
}

export async function validateSSLCommerzPayment(config: SSLCommerzConfig, valId: string) {
    const baseURL = `https://${config.isLive ? "securepay" : "sandbox"}.sslcommerz.com`;
    const validationURL = `${baseURL}/validator/api/validationserverAPI.php?val_id=${valId}&store_id=${config.storeId}&store_passwd=${config.storePassword}&v=1&format=json`;

    try {
        const response = await axios.get(validationURL);

        if (response.data && typeof response.data === "object") {
            return response.data;
        }

        try {
            const parsed = typeof response.data === "string" ? JSON.parse(response.data) : response.data;
            return parsed;
        } catch {
            return response.data;
        }
    } catch (error: any) {
        if (error.response && error.response.data) {
            throw new Error(error.response.data.message || "Failed to validate payment");
        }
        throw error;
    }
}

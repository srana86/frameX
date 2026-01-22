interface SSLCommerzConfig {
  storeId: string;
  storePassword: string;
  isLive: boolean;
}

interface PaymentInitData {
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
  [key: string]: any; // Allow additional fields
}

/**
 * Process payment init data into FormData format
 */
function processPaymentInitData(data: PaymentInitData & { store_id: string; store_passwd: string }): FormData {
  const formData = new FormData();

  // Required parameters
  formData.append("store_id", data.store_id);
  formData.append("store_passwd", data.store_passwd);
  formData.append("tran_id", data.tran_id);
  formData.append("total_amount", String(data.total_amount));
  formData.append("currency", data.currency);
  formData.append("success_url", data.success_url);
  formData.append("fail_url", data.fail_url);
  formData.append("cancel_url", data.cancel_url);

  // Optional parameters
  if (data.ipn_url) formData.append("ipn_url", data.ipn_url);

  // Customer Information (required)
  formData.append("cus_name", data.cus_name);
  formData.append("cus_email", data.cus_email);
  formData.append("cus_add1", data.cus_add1);
  formData.append("cus_add2", data.cus_add2 || "");
  formData.append("cus_city", data.cus_city);
  formData.append("cus_state", data.cus_state);
  formData.append("cus_postcode", data.cus_postcode);
  formData.append("cus_country", data.cus_country);
  formData.append("cus_phone", data.cus_phone);
  if (data.cus_fax) formData.append("cus_fax", data.cus_fax);

  // Shipment Information
  if (data.shipping_method) formData.append("shipping_method", data.shipping_method);
  if (data.ship_name) formData.append("ship_name", data.ship_name);
  if (data.ship_add1) formData.append("ship_add1", data.ship_add1);
  if (data.ship_add2) formData.append("ship_add2", data.ship_add2);
  if (data.ship_city) formData.append("ship_city", data.ship_city);
  if (data.ship_state) formData.append("ship_state", data.ship_state);
  if (data.ship_postcode) formData.append("ship_postcode", data.ship_postcode);
  if (data.ship_country) formData.append("ship_country", data.ship_country);

  // Product Information (required)
  formData.append("product_name", data.product_name);
  formData.append("product_category", data.product_category);
  formData.append("product_profile", data.product_profile);

  return formData;
}

/**
 * Initialize SSLCommerz payment using fetch
 */
export async function initSSLCommerzPayment(config: SSLCommerzConfig, paymentData: PaymentInitData) {
  const baseURL = `https://${config.isLive ? "securepay" : "sandbox"}.sslcommerz.com`;
  const initURL = `${baseURL}/gwprocess/v4/api.php`;

  // Add store credentials to payment data
  const dataWithCredentials = {
    ...paymentData,
    store_id: config.storeId,
    store_passwd: config.storePassword,
  };

  // Process data into FormData
  const formData = processPaymentInitData(dataWithCredentials);

  try {
    const response = await fetch(initURL, {
      method: "POST",
      body: formData,
    });

    const responseData = await response.json();
    
    if (responseData && typeof responseData === "object") {
      return responseData;
    }

    return responseData;
  } catch (error: any) {
    console.error("SSLCommerz init error:", error);
    throw new Error(error.message || "Failed to initialize payment");
  }
}

/**
 * Validate SSLCommerz payment
 */
export async function validateSSLCommerzPayment(config: SSLCommerzConfig, valId: string) {
  const baseURL = `https://${config.isLive ? "securepay" : "sandbox"}.sslcommerz.com`;
  const validationURL = `${baseURL}/validator/api/validationserverAPI.php?val_id=${valId}&store_id=${config.storeId}&store_passwd=${config.storePassword}&v=1&format=json`;

  try {
    const response = await fetch(validationURL);
    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("SSLCommerz validation error:", error);
    throw new Error(error.message || "Failed to validate payment");
  }
}


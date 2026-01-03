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
  [key: string]: any;
}

/**
 * Process payment init data into URLSearchParams format (for form-urlencoded)
 */
function processPaymentInitData(
  data: PaymentInitData & { store_id: string; store_passwd: string }
): URLSearchParams {
  const params = new URLSearchParams();

  // Required parameters
  params.append("store_id", data.store_id);
  params.append("store_passwd", data.store_passwd);
  params.append("tran_id", data.tran_id);
  params.append("total_amount", String(data.total_amount));
  params.append("currency", data.currency);
  params.append("success_url", data.success_url);
  params.append("fail_url", data.fail_url);
  params.append("cancel_url", data.cancel_url);

  // Optional parameters
  if (data.ipn_url) params.append("ipn_url", data.ipn_url);

  // Customer Information (required)
  params.append("cus_name", data.cus_name);
  params.append("cus_email", data.cus_email);
  params.append("cus_add1", data.cus_add1);
  params.append("cus_add2", data.cus_add2 || "");
  params.append("cus_city", data.cus_city);
  params.append("cus_state", data.cus_state);
  params.append("cus_postcode", data.cus_postcode);
  params.append("cus_country", data.cus_country);
  params.append("cus_phone", data.cus_phone);
  if (data.cus_fax) params.append("cus_fax", data.cus_fax);

  // Shipment Information
  if (data.shipping_method)
    params.append("shipping_method", data.shipping_method);
  if (data.ship_name) params.append("ship_name", data.ship_name);
  if (data.ship_add1) params.append("ship_add1", data.ship_add1);
  if (data.ship_add2) params.append("ship_add2", data.ship_add2);
  if (data.ship_city) params.append("ship_city", data.ship_city);
  if (data.ship_state) params.append("ship_state", data.ship_state);
  if (data.ship_postcode) params.append("ship_postcode", data.ship_postcode);
  if (data.ship_country) params.append("ship_country", data.ship_country);

  // Product Information (required)
  params.append("product_name", data.product_name);
  params.append("product_category", data.product_category);
  params.append("product_profile", data.product_profile);

  return params;
}

/**
 * Initialize SSLCommerz payment
 */
export async function initSSLCommerzPayment(
  config: SSLCommerzConfig,
  paymentData: PaymentInitData
) {
  const baseURL = `https://${config.isLive ? "securepay" : "sandbox"}.sslcommerz.com`;
  const initURL = `${baseURL}/gwprocess/v4/api.php`;

  // Add store credentials to payment data
  const dataWithCredentials = {
    ...paymentData,
    store_id: config.storeId,
    store_passwd: config.storePassword,
  };

  // Process data into URLSearchParams
  const formData = processPaymentInitData(dataWithCredentials);

  try {
    const response = await fetch(initURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
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
export async function validateSSLCommerzPayment(
  config: SSLCommerzConfig,
  valId: string
) {
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

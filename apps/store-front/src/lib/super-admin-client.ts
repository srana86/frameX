/**
 * Client for calling super-admin API endpoints
 * Default super-admin URL: https://framextech.com
 */

import { cache } from "react";

// Default super-admin URL
const DEFAULT_SUPER_ADMIN_URL = "https://framextech.com";

// Get super-admin URL and ensure it doesn't end with a slash
const getSuperAdminUrl = () => {
  const url = process.env.SUPER_ADMIN_URL || process.env.NEXT_PUBLIC_SUPER_ADMIN_URL || DEFAULT_SUPER_ADMIN_URL;
  return url.endsWith("/") ? url.slice(0, -1) : url;
};

const SUPER_ADMIN_URL = getSuperAdminUrl();

/**
 * Helper to build clean URLs with /api/v1/ prefix for FrameX-Server
 */
function buildUrl(path: string): string {
  const baseUrl = SUPER_ADMIN_URL.endsWith("/") ? SUPER_ADMIN_URL.slice(0, -1) : SUPER_ADMIN_URL;
  // Transform /api/ paths to /api/v1/ for FrameX-Server compatibility
  let cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (cleanPath.startsWith("/api/") && !cleanPath.startsWith("/api/v1/")) {
    cleanPath = cleanPath.replace("/api/", "/api/v1/");
  }
  return `${baseUrl}${cleanPath}`;
}

export interface SuperAdminTenantSubscription {
  id: string;
  tenantId: string;
  planId: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEndsAt?: string;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: string;
  paymentMethodId?: string;
  createdAt?: string;
  updatedAt?: string;
  plan?: any;
}

export interface SuperAdminTenantDeployment {
  id: string;
  tenantId: string;
  deploymentType: string;
  subdomain?: string;
  customDomain?: string;
  deploymentStatus: string;
  deploymentUrl: string;
  deploymentProvider?: string;

  deploymentId?: string;
  environmentVariables: Record<string, string>;
  lastDeployedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SuperAdminTenantDatabase {
  id: string;
  tenantId: string;
  databaseName: string;
  connectionString?: string;
  useSharedDatabase: boolean;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SuperAdminTenantFullData {
  tenant: any;
  subscription: SuperAdminTenantSubscription | null;
  plan: any | null;
  deployment: SuperAdminTenantDeployment | null;
  database: SuperAdminTenantDatabase | null;
}

/**
 * Get tenant subscription from super-admin
 * Cached per request to prevent duplicate API calls
 */
export const getTenantSubscriptionFromSuperAdmin = cache(async (tenantId: string): Promise<SuperAdminTenantSubscription | null> => {
  try {
    const url = buildUrl(`/api/tenants/${tenantId}/subscription`);
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // Cache for 5 minutes, revalidate in background
      next: { revalidate: 300 },
      cache: "force-cache",
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to get subscription: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`\n📦 [API Data] Subscription Data for tenant ${tenantId}:`, JSON.stringify(data, null, 2));
    return data;
  } catch (error: any) {
    // Silently handle connection errors - don't spam console
    const isConnectionError = error?.cause?.code === "ECONNREFUSED" || error?.code === "ECONNREFUSED";

    // Only log non-connection errors during runtime, not during build
    if (!isConnectionError && process.env.NEXT_PHASE !== "phase-production-build") {
      console.error("❌ [super-admin-client] Error fetching tenant subscription:", error);
    }
    // During build or connection errors, return null instead of throwing
    if (process.env.NEXT_PHASE === "phase-production-build" || isConnectionError) {
      return null;
    }
    throw error;
  }
});

/**
 * Get tenant deployment from super-admin
 * Cached per request to prevent duplicate API calls
 */
export const getTenantDeploymentFromSuperAdmin = cache(async (tenantId: string): Promise<SuperAdminTenantDeployment | null> => {
  try {
    const url = buildUrl(`/api/tenants/${tenantId}/deployment`);
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // Cache for 5 minutes, revalidate in background
      next: { revalidate: 300 },
      cache: "force-cache",
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to get deployment: ${response.statusText}`);
    }

    const data = await response.json();
    // Only log in development with debug flag
    if (process.env.NODE_ENV === "development" && process.env.DEBUG_SUPER_ADMIN === "true") {
      console.log(`\n🚀 [API Data] Deployment Data for tenant ${tenantId}:`, JSON.stringify(data, null, 2));
    }
    return data;
  } catch (error: any) {
    // Silently handle connection errors - don't spam console
    const isConnectionError = error?.cause?.code === "ECONNREFUSED" || error?.code === "ECONNREFUSED";

    // Only log non-connection errors during runtime, not during build
    if (!isConnectionError && process.env.NEXT_PHASE !== "phase-production-build") {
      console.error("❌ [super-admin-client] Error fetching tenant deployment:", error);
    }
    // During build or connection errors, return null instead of throwing
    if (process.env.NEXT_PHASE === "phase-production-build" || isConnectionError) {
      return null;
    }
    throw error;
  }
});

/**
 * Get tenant database from super-admin
 * Cached per request to prevent duplicate API calls
 */
export const getTenantDatabaseFromSuperAdmin = cache(async (tenantId: string): Promise<SuperAdminTenantDatabase | null> => {
  try {
    const url = buildUrl(`/api/tenants/${tenantId}/database`);
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // Cache for 5 minutes, revalidate in background
      next: { revalidate: 300 },
      cache: "force-cache",
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to get database: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`\n💾 [API Data] Database Data for tenant ${tenantId}:`, JSON.stringify(data, null, 2));
    return data;
  } catch (error: any) {
    // Silently handle connection errors - don't spam console
    const isConnectionError = error?.cause?.code === "ECONNREFUSED" || error?.code === "ECONNREFUSED";

    // Only log non-connection errors during runtime, not during build
    if (!isConnectionError && process.env.NEXT_PHASE !== "phase-production-build") {
      console.error("❌ [super-admin-client] Error fetching tenant database:", error);
    }
    // During build or connection errors, return null instead of throwing
    if (process.env.NEXT_PHASE === "phase-production-build" || isConnectionError) {
      return null;
    }
    throw error;
  }
});

/**
 * Get tenant subscription and plan data using the public endpoint
 * This is the recommended method as it uses the public /api/tenant-subscription endpoint
 * Cached per request to prevent duplicate API calls
 */
export const getTenantSubscriptionData = cache(async (tenantId: string): Promise<SuperAdminTenantFullData | null> => {
  try {
    const url = buildUrl(`/api/tenant-subscription?tenantId=${tenantId}`);
    // Reduced logging - only log in development or on errors
    if (process.env.NODE_ENV === "development") {
      console.log(`[super-admin-client] Fetching subscription for tenantId: ${tenantId}`);
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": tenantId,
      },
      // Cache for 5 minutes to reduce API calls
      next: { revalidate: 300 }, // 5 minutes
      cache: "force-cache", // Enable caching to prevent excessive API calls
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`[super-admin-client] Tenant ${tenantId} not found in super-admin`);
        return null;
      }
      const errorText = await response.text();
      console.error(`[super-admin-client] Error response: ${errorText}`);
      throw new Error(`Failed to get tenant subscription: ${response.statusText}`);
    }

    const data = await response.json();
    // Only log in development to reduce console noise
    if (process.env.NODE_ENV === "development") {
      console.log(`[super-admin-client] Received data:`, {
        hasTenant: !!data.tenant,
        hasSubscription: !!data.subscription,
        hasPlan: !!data.plan,
        subscriptionId: data.subscription?.id,
        planId: data.subscription?.planId,
      });
    }

    // Transform to match SuperAdminTenantFullData format
    return {
      tenant: data.tenant,
      subscription: data.subscription,
      plan: data.plan,
      deployment: null, // Not included in this endpoint
      database: null, // Not included in this endpoint
    };
  } catch (error: any) {
    // Silently handle connection errors - don't spam console
    const isConnectionError = error?.cause?.code === "ECONNREFUSED" || error?.code === "ECONNREFUSED";

    console.error("❌ [super-admin-client] Error fetching tenant subscription:", error?.message);

    // During build or connection errors, return null instead of throwing
    if (process.env.NEXT_PHASE === "phase-production-build" || isConnectionError) {
      return null;
    }
    return null;
  }
});

/**
 * Get complete tenant data (tenant + subscription + plan + deployment + database) from super-admin
 * Uses the public /api/tenant-subscription endpoint first, then falls back to /api/tenants/{id}/full
 * Cached per request to prevent duplicate API calls
 */
export const getTenantFullDataFromSuperAdmin = cache(async (tenantId: string): Promise<SuperAdminTenantFullData | null> => {
  // Try the public endpoint first (recommended)
  const subscriptionData = await getTenantSubscriptionData(tenantId);
  if (subscriptionData) {
    return subscriptionData;
  }

  // Fallback to the old endpoint (for backwards compatibility)
  try {
    const url = buildUrl(`/api/tenants/${tenantId}/full`);
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // Cache for 5 minutes, revalidate in background
      next: { revalidate: 300 },
      cache: "force-cache",
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to get tenant data: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`[super-admin-client] Full tenant data received for ${tenantId}`);
    return data;
  } catch (error: any) {
    // Silently handle connection errors - don't spam console
    const isConnectionError = error?.cause?.code === "ECONNREFUSED" || error?.code === "ECONNREFUSED";

    // Only log non-connection errors during runtime, not during build
    if (!isConnectionError && process.env.NEXT_PHASE !== "phase-production-build") {
      console.error("❌ [super-admin-client] Error fetching tenant full data:", error?.message);
    }
    // During build or connection errors, return null instead of throwing
    if (process.env.NEXT_PHASE === "phase-production-build" || isConnectionError) {
      return null;
    }
    return null;
  }
});

// ============================================================
// Domain Management via Super-Admin Proxy
// ============================================================

export interface SuperAdminDomainConfig {
  id: string;
  tenantId: string;
  domain: string;

  redirect?: string | null;
  redirectStatusCode?: number | null;
  verified: boolean;
  dnsRecords: Array<{ type: string; name: string; value: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface SuperAdminDomainResponse {
  success: boolean;
  domain: SuperAdminDomainConfig;
  dnsInstructions?: {
    records: Array<{ type: string; name: string; value: string }>;
    message: string;
  };
}

/**
 * Get domain configuration from super-admin
 */
export async function getDomainConfigFromSuperAdmin(tenantId: string): Promise<{
  domain: SuperAdminDomainConfig | null;

} | null> {
  try {
    const url = buildUrl(`/api/tenants/${tenantId}/domain`);
    console.log(`[super-admin-client] Getting domain config from: ${url}`);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": tenantId,
      },
      cache: "no-store", // Don't cache - always fetch fresh
    });

    console.log(`[super-admin-client] Domain config response status: ${response.status}`);

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`[super-admin-client] Domain not found (404) for tenantId: ${tenantId}`);
        return null;
      }
      const errorData = await response.json().catch(() => ({}));
      console.error(`[super-admin-client] Domain config error:`, errorData);
      throw new Error(errorData.error || `Failed to get domain config: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`[super-admin-client] Domain config received:`, data?.domain ? "found" : "null");
    return data;
  } catch (error: any) {
    // Silently handle connection errors - don't spam console
    const isConnectionError = error?.cause?.code === "ECONNREFUSED" || error?.code === "ECONNREFUSED";

    // Only log non-connection errors during runtime, not during build
    if (!isConnectionError && process.env.NEXT_PHASE !== "phase-production-build") {
      console.error("❌ [super-admin-client] Error fetching domain config:", error?.message);
    }
    // During build or connection errors, return null instead of throwing
    if (process.env.NEXT_PHASE === "phase-production-build" || isConnectionError) {
      return null;
    }
    // Return null instead of throwing to prevent page crash
    return null;
  }
}

/**
 * Configure domain via super-admin proxy
 */
export async function configureDomainViaSuperAdmin(
  tenantId: string,
  domain: string,
  redirect?: string,
  redirectStatusCode?: number
): Promise<SuperAdminDomainResponse> {
  const url = buildUrl(`/api/tenants/${tenantId}/domain`);
  console.log(`[super-admin-client] Configuring domain via: ${url}`);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Tenant-ID": tenantId,
    },
    body: JSON.stringify({
      domain,
      redirect,
      redirectStatusCode,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to configure domain: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Remove domain via super-admin proxy
 */
export async function removeDomainViaSuperAdmin(tenantId: string, domain: string): Promise<{ success: boolean; message: string }> {
  const url = buildUrl(`/api/tenants/${tenantId}/domain?domain=${encodeURIComponent(domain)}`);
  console.log(`[super-admin-client] Removing domain via: ${url}`);

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "X-Tenant-ID": tenantId,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to remove domain: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Verify domain via super-admin proxy
 */
export async function verifyDomainViaSuperAdmin(
  tenantId: string,
  domain: string
): Promise<{ success: boolean; verified: boolean; message: string; misconfigured?: boolean }> {
  const url = buildUrl(`/api/tenants/${tenantId}/domain`);
  console.log(`[super-admin-client] Verifying domain via: ${url}`);

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "X-Tenant-ID": tenantId,
    },
    body: JSON.stringify({ domain }),
  });

  const data = await response.json();

  if (!response.ok && response.status !== 400) {
    throw new Error(data.error || `Failed to verify domain: ${response.statusText}`);
  }

  return data;
}

// ============================================================
// Subscription Plans from Super-Admin
// ============================================================

export interface SuperAdminPlan {
  id: string;
  name: string;
  description?: string;
  basePrice: number;
  price?: number;
  discount6Month?: number;
  discount12Month?: number;
  prices?: {
    monthly: number;
    semi_annual: number;
    yearly: number;
  };
  featuresList?: string[];
  isActive: boolean;
  isPopular?: boolean;
  sortOrder?: number;
}

/**
 * Get all subscription plans from super-admin
 */
export const getPlansFromSuperAdmin = cache(async (variants: boolean = false): Promise<SuperAdminPlan[]> => {
  try {
    const url = buildUrl(`/api/plans${variants ? "?variants=true" : ""}`);
    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      throw new Error(`Failed to get plans: ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    const isConnectionError = error?.cause?.code === "ECONNREFUSED" || error?.code === "ECONNREFUSED";
    if (!isConnectionError && process.env.NEXT_PHASE !== "phase-production-build") {
      console.error("❌ [super-admin-client] Error fetching plans:", error?.message);
    }
    return [];
  }
});

/**
 * Get single plan from super-admin
 */
export const getPlanFromSuperAdmin = cache(async (planId: string): Promise<SuperAdminPlan | null> => {
  try {
    const url = buildUrl(`/api/plans/${planId}`);
    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to get plan: ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    const isConnectionError = error?.cause?.code === "ECONNREFUSED" || error?.code === "ECONNREFUSED";
    if (!isConnectionError && process.env.NEXT_PHASE !== "phase-production-build") {
      console.error("❌ [super-admin-client] Error fetching plan:", error?.message);
    }
    return null;
  }
});

// ============================================================
// Invoices from Super-Admin
// ============================================================

export interface SuperAdminInvoice {
  id: string;
  invoiceNumber: string;
  tenantId: string;
  tenantName?: string;
  tenantEmail?: string;
  subscriptionId?: string;
  planId?: string;
  planName?: string;
  billingCycle?: string;
  amount: number;
  currency: string;
  status: "draft" | "pending" | "paid" | "overdue" | "cancelled";
  dueDate: string;
  paidAt?: string;
  items?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  createdAt?: string;
}

/**
 * Get invoices for a tenant from super-admin
 */
export async function getInvoicesFromSuperAdmin(tenantId: string, status?: string): Promise<SuperAdminInvoice[]> {
  try {
    let url = buildUrl(`/api/invoices?tenantId=${tenantId}`);
    if (status) {
      url += `&status=${status}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to get invoices: ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error("❌ [super-admin-client] Error fetching invoices:", error?.message);
    return [];
  }
}

/**
 * Create an invoice via super-admin
 */
export async function createInvoiceViaSuperAdmin(invoice: {
  tenantId: string;
  tenantName: string;
  tenantEmail: string;
  subscriptionId?: string;
  planId?: string;
  planName?: string;
  billingCycle?: string;
  amount: number;
  dueDate?: string;
  items?: Array<{ description: string; quantity: number; unitPrice: number; total: number }>;
  notes?: string;
}): Promise<{ success: boolean; id?: string; invoiceNumber?: string; error?: string }> {
  try {
    const url = buildUrl("/api/invoices");
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invoice),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || "Failed to create invoice" };
    }

    const data = await response.json();
    return { success: true, id: data.id, invoiceNumber: data.invoiceNumber };
  } catch (error: any) {
    console.error("❌ [super-admin-client] Error creating invoice:", error?.message);
    return { success: false, error: error?.message || "Failed to create invoice" };
  }
}

/**
 * Update invoice status via super-admin
 */
export async function updateInvoiceViaSuperAdmin(
  invoiceId: string,
  updates: { status?: string; paidAt?: string; transactionId?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const url = buildUrl(`/api/invoices/${invoiceId}`);
    const response = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || "Failed to update invoice" };
    }

    return { success: true };
  } catch (error: any) {
    console.error("❌ [super-admin-client] Error updating invoice:", error?.message);
    return { success: false, error: error?.message || "Failed to update invoice" };
  }
}

// ============================================================
// Subscription Management via Super-Admin
// ============================================================

/**
 * Get subscription by ID from super-admin
 */
export async function getSubscriptionFromSuperAdmin(subscriptionId: string): Promise<SuperAdminTenantSubscription | null> {
  try {
    const url = buildUrl(`/api/subscriptions/${subscriptionId}`);
    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to get subscription: ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error("❌ [super-admin-client] Error fetching subscription:", error?.message);
    return null;
  }
}

/**
 * Update subscription via super-admin
 */
export async function updateSubscriptionViaSuperAdmin(
  subscriptionId: string,
  updates: {
    status?: string;
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
    gracePeriodEndsAt?: string;
    lastPaymentDate?: string;
    lastPaymentId?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const url = buildUrl(`/api/subscriptions/${subscriptionId}`);
    const response = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || "Failed to update subscription" };
    }

    return { success: true };
  } catch (error: any) {
    console.error("❌ [super-admin-client] Error updating subscription:", error?.message);
    return { success: false, error: error?.message || "Failed to update subscription" };
  }
}

/**
 * Renew subscription via super-admin
 */
export async function renewSubscriptionViaSuperAdmin(
  subscriptionId: string,
  paymentDetails: {
    transactionId: string;
    paymentMethod?: string;
    amount: number;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const url = buildUrl("/api/subscriptions/renew");
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subscriptionId,
        ...paymentDetails,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || "Failed to renew subscription" };
    }

    return { success: true };
  } catch (error: any) {
    console.error("❌ [super-admin-client] Error renewing subscription:", error?.message);
    return { success: false, error: error?.message || "Failed to renew subscription" };
  }
}

// ============================================================
// Payments via Super-Admin
// ============================================================

export interface SuperAdminPayment {
  id: string;
  tranId: string;
  tenantId: string;
  tenantName?: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod?: string;
  cardBrand?: string;
  createdAt?: string;
}

/**
 * Get payments for a tenant from super-admin
 */
export async function getPaymentsFromSuperAdmin(tenantId?: string): Promise<SuperAdminPayment[]> {
  try {
    let url = buildUrl("/api/payments");
    if (tenantId) {
      url += `?tenantId=${tenantId}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to get payments: ${response.statusText}`);
    }

    const data = await response.json();
    return data.payments || [];
  } catch (error: any) {
    console.error("❌ [super-admin-client] Error fetching payments:", error?.message);
    return [];
  }
}

// ============================================================
// Checkout Session via Super-Admin
// ============================================================

/**
 * Initialize checkout via super-admin
 */
export async function initCheckoutViaSuperAdmin(checkoutData: {
  tenantName: string;
  tenantEmail: string;
  tenantPhone: string;
  customSubdomain: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  customerCity: string;
  customerState: string;
  customerPostcode: string;
  customerCountry: string;
  planId: string;
  planName: string;
  planPrice: number;
  billingCycle: number;
}): Promise<{
  success: boolean;
  tranId?: string;
  GatewayPageURL?: string;
  demoMode?: boolean;
  error?: string;
}> {
  try {
    const url = buildUrl("/api/checkout/init");
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(checkoutData),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Checkout initialization failed" };
    }

    return data;
  } catch (error: any) {
    console.error("❌ [super-admin-client] Error initializing checkout:", error?.message);
    return { success: false, error: error?.message || "Checkout initialization failed" };
  }
}

/**
 * Get checkout session from super-admin
 */
export async function getCheckoutSessionFromSuperAdmin(tranId: string): Promise<any | null> {
  try {
    const url = buildUrl(`/api/checkout/session?tranId=${tranId}`);
    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to get checkout session: ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error("❌ [super-admin-client] Error fetching checkout session:", error?.message);
    return null;
  }
}

// ============================================================
// Tenant Aliases for Backward Compatibility
// ============================================================

// Type aliases maintained for internal consistency if needed, 
// but primary names are now Tenant based.


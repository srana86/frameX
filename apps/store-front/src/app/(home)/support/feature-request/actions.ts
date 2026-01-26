"use server";

import { getTenantId } from "@/lib/env-utils";

type ActionState = {
  success: boolean;
  message: string;
};

export async function submitFeatureRequest(_: ActionState, formData: FormData): Promise<ActionState> {
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const priority = String(formData.get("priority") || "medium");
  const contactEmail = String(formData.get("contactEmail") || "").trim();
  const contactPhone = String(formData.get("contactPhone") || "").trim();

  const tenantId = getTenantId();
  const apiBase = process.env.SUPER_ADMIN_URL || process.env.NEXT_PUBLIC_SUPERADMIN_API_URL || process.env.NEXT_PUBLIC_SUPER_ADMIN_URL;

  if (!tenantId) {
    return { success: false, message: "Missing tenant id (set TENANT_ID)." };
  }

  if (!apiBase) {
    return { success: false, message: "Missing SUPERADMIN_API_URL." };
  }

  if (!title || !description) {
    return { success: false, message: "Title and description are required." };
  }

  try {
    // Transform /api/ paths to /api/v1/ for FrameX-Server compatibility if needed
    const apiEndpoint = apiBase.endsWith("/") ? apiBase.slice(0, -1) : apiBase;
    const url = `${apiEndpoint}/api/v1/feature-requests`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        priority,
        contactEmail: contactEmail || undefined,
        contactPhone: contactPhone || undefined,
        tenantId,
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to submit request");
    }

    return { success: true, message: "Request submitted. We will review soon." };
  } catch (error: any) {
    return { success: false, message: error?.message || "Failed to submit request" };
  }
}

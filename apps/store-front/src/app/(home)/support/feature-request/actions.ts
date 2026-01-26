"use server";

import { getTenantId } from "@/lib/env-utils";
import { getPublicServerClient } from "@/lib/server-utils";

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

  if (!tenantId) {
    return { success: false, message: "Missing tenant id (set TENANT_ID)." };
  }

  if (!title || !description) {
    return { success: false, message: "Title and description are required." };
  }

  try {
    const client = await getPublicServerClient();
    const res = await client.post("feature-requests", {
      title,
      description,
      priority,
      contactEmail: contactEmail || undefined,
      contactPhone: contactPhone || undefined,
      tenantId,
    });

    return { success: true, message: "Request submitted. We will review soon." };
  } catch (error: any) {
    const errorMessage = error?.response?.data?.message || error?.message || "Failed to submit request";
    return { success: false, message: errorMessage };
  }
}

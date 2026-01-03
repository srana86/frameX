"use server";

import { getMerchantId } from "@/lib/env-utils";

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

  const merchantId = getMerchantId();
  const apiBase = process.env.SUPER_ADMIN_URL || process.env.NEXT_PUBLIC_SUPERADMIN_API_URL;

  if (!merchantId) {
    return { success: false, message: "Missing merchant id (set MERCHANT_ID)." };
  }

  if (!apiBase) {
    return { success: false, message: "Missing SUPERADMIN_API_URL." };
  }

  if (!title || !description) {
    return { success: false, message: "Title and description are required." };
  }

  try {
    const res = await fetch(`${apiBase}/api/feature-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        priority,
        contactEmail: contactEmail || undefined,
        contactPhone: contactPhone || undefined,
        merchantId,
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

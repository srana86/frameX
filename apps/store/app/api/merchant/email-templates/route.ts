import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { buildMerchantQuery, getMerchantCollectionForAPI, getMerchantIdForAPI } from "@/lib/api-helpers";
import { buildDefaultTemplate, defaultEmailTemplates, emailEvents, type EmailEvent, type EmailTemplate } from "@/lib/email-types";
import { buildDefaultEmailTemplates, ensureEmailTemplatesExist, normalizeTemplate } from "@/lib/email-helpers";
import { sendTestEmail } from "@/lib/email-service";

export const dynamic = "force-dynamic";
export const revalidate = 30; // Cache for 30 seconds

const COLLECTION = "email_templates";

export async function GET(request: Request) {
  try {
    await requireAuth("merchant");

    const merchantId = await getMerchantIdForAPI();
    const baseQuery = await buildMerchantQuery();

    // Parallelize database queries for better performance
    const [brandConfigCol, col] = await Promise.all([
      getMerchantCollectionForAPI("brand_config"),
      getMerchantCollectionForAPI<EmailTemplate>(COLLECTION),
    ]);

    const [brandConfig, existingCount] = await Promise.all([
      brandConfigCol.findOne(await buildMerchantQuery({ id: "brand_config_v1" })),
      col.countDocuments(baseQuery),
    ]);

    const brandMeta = {
      brandName: (brandConfig as any)?.brandName,
      fromEmail: (brandConfig as any)?.contact?.email,
      fromName: (brandConfig as any)?.brandName,
      replyTo: (brandConfig as any)?.contact?.email,
    };

    const searchParams = new URL(request.url).searchParams;
    const event = searchParams.get("event") as EmailEvent | null;

    // Only ensure templates exist if none exist (optimize for subsequent loads)
    if (existingCount === 0) {
      await ensureEmailTemplatesExist(merchantId || undefined, baseQuery, brandMeta);
    }

    if (event) {
      if (!emailEvents.includes(event)) {
        return NextResponse.json({ error: "Invalid email event" }, { status: 400 });
      }

      const query = { ...baseQuery, event };
      const template = await col.findOne(query);
      if (template) {
        return NextResponse.json(normalizeTemplate(template));
      }

      const fallback = buildDefaultTemplate(event, merchantId || undefined, brandMeta);
      return NextResponse.json(fallback);
    }

    const docs = await col.find(baseQuery).sort({ event: 1 }).toArray();

    if (!docs.length) {
      const defaults = buildDefaultEmailTemplates(merchantId || undefined, brandMeta).map((doc) => ({ ...doc, ...baseQuery }));
      await col.insertMany(defaults);
      return NextResponse.json({ templates: defaults });
    }

    return NextResponse.json({ templates: docs.map(normalizeTemplate) });
  } catch (error: any) {
    console.error("GET /api/merchant/email-templates error:", error);
    if (error?.message === "NEXT_REDIRECT") throw error;
    return NextResponse.json({ error: error?.message || "Failed to load email templates" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await requireAuth("merchant");

    const body = await request.json();
    const event = body?.event as EmailEvent | undefined;
    if (!event || !emailEvents.includes(event)) {
      return NextResponse.json({ error: "Invalid or missing event" }, { status: 400 });
    }

    const merchantId = await getMerchantIdForAPI();
    const col = await getMerchantCollectionForAPI<EmailTemplate>(COLLECTION);
    const baseQuery = await buildMerchantQuery();
    const query = { ...baseQuery, event };

    const existing = await col.findOne(query);
    const now = new Date().toISOString();
    const defaults = defaultEmailTemplates[event];

    const update: Partial<EmailTemplate> = {
      id: existing?.id || `email_template_${event}`,
      merchantId: merchantId || existing?.merchantId,
      event,
      name: body.name || existing?.name || defaults.name,
      description: body.description ?? existing?.description ?? defaults.description,
      subject: body.subject || existing?.subject || defaults.subject,
      previewText: body.previewText ?? existing?.previewText ?? "",
      fromName: body.fromName ?? existing?.fromName,
      fromEmail: body.fromEmail ?? existing?.fromEmail,
      replyTo: body.replyTo ?? existing?.replyTo,
      design: body.design ?? existing?.design ?? null,
      html: body.html ?? existing?.html ?? "",
      variables: Array.isArray(body.variables) ? body.variables : existing?.variables || defaults.variables,
      enabled: typeof body.enabled === "boolean" ? body.enabled : existing?.enabled ?? true,
      updatedAt: now,
    };

    const setOnInsert = {
      createdAt: existing?.createdAt || now,
    };

    await col.updateOne(
      query,
      {
        $set: update,
        $setOnInsert: setOnInsert,
      },
      { upsert: true }
    );

    const updated = await col.findOne(query);
    return NextResponse.json(normalizeTemplate(updated));
  } catch (error: any) {
    console.error("PUT /api/merchant/email-templates error:", error);
    if (error?.message === "NEXT_REDIRECT") throw error;
    return NextResponse.json({ error: error?.message || "Failed to save email template" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAuth("merchant");

    const body = await request.json();
    const action = body?.action || "test";
    if (action !== "test") {
      return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
    }

    const event = body?.event as EmailEvent | undefined;
    const to = body?.to as string | string[] | undefined;
    if (!event || !emailEvents.includes(event)) {
      return NextResponse.json({ error: "Invalid or missing event" }, { status: 400 });
    }
    if (!to || (Array.isArray(to) && to.length === 0)) {
      return NextResponse.json({ error: "Missing recipient" }, { status: 400 });
    }

    const merchantId = await getMerchantIdForAPI();
    const col = await getMerchantCollectionForAPI<EmailTemplate>(COLLECTION);
    const baseQuery = await buildMerchantQuery({ event });
    const template = await col.findOne(baseQuery);
    const normalized = (template ? normalizeTemplate(template) : null) || buildDefaultTemplate(event, merchantId || undefined);
    const templateWithOverrides = {
      ...normalized,
      html: body?.html ?? normalized.html,
      design: body?.design ?? normalized.design,
    };

    const result = await sendTestEmail({
      to,
      event,
      template: templateWithOverrides,
      variables: body?.variables || {},
      merchantId: merchantId || undefined,
    });

    if (!result.ok) {
      console.error(`[Email Templates Test] Failed to send test email for event ${event}:`, result.error);
      return NextResponse.json({ ok: false, result, error: result.error }, { status: 400 });
    }

    console.log(`[Email Templates Test] Test email sent successfully to ${Array.isArray(to) ? to.join(", ") : to} for event ${event}`);
    return NextResponse.json({ ok: true, result, message: `Test email sent successfully to ${Array.isArray(to) ? to.join(", ") : to}` });
  } catch (error: any) {
    console.error("POST /api/merchant/email-templates (test) error:", error);
    if (error?.message === "NEXT_REDIRECT") throw error;
    return NextResponse.json({ error: error?.message || "Failed to send test email" }, { status: 500 });
  }
}

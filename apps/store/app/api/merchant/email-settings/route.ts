import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { buildMerchantQuery, getMerchantCollectionForAPI, getMerchantIdForAPI } from "@/lib/api-helpers";
import type { EmailProviderConfig, EmailProviderSettings } from "@/lib/email-types";
import { buildEmptyProviderSettings, decryptProviderSecrets, encryptProviderSecrets, maskProviderSecrets } from "@/lib/email-helpers";
import { testProviderConnection } from "@/lib/email-service";

export const dynamic = "force-dynamic";

const COLLECTION = "email_providers";
const SETTINGS_ID = "email_providers_default";
const MASKED_VALUE = "ENCRYPTED";

export async function GET() {
  try {
    await requireAuth("merchant");

    const merchantId = await getMerchantIdForAPI();
    const col = await getMerchantCollectionForAPI<EmailProviderSettings>(COLLECTION);
    const query = await buildMerchantQuery({ id: SETTINGS_ID });
    const doc = await col.findOne(query);

    if (!doc) {
      const empty = buildEmptyProviderSettings(merchantId || undefined);
      return NextResponse.json(empty);
    }

    const masked = {
      ...doc,
      providers: (doc.providers || []).map(maskProviderSecrets),
    };

    return NextResponse.json(masked);
  } catch (error: any) {
    console.error("GET /api/merchant/email-settings error:", error);
    if (error?.message === "NEXT_REDIRECT") throw error;
    return NextResponse.json({ error: error?.message || "Failed to load email settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await requireAuth("merchant");

    const body = await request.json();
    const incomingProviders: EmailProviderConfig[] = Array.isArray(body?.providers) ? body.providers : [];

    const merchantId = await getMerchantIdForAPI();
    const col = await getMerchantCollectionForAPI<EmailProviderSettings>(COLLECTION);
    const query = await buildMerchantQuery({ id: SETTINGS_ID });
    const existing = await col.findOne(query);
    const existingDecrypted = (existing?.providers || []).map(decryptProviderSecrets);

    const now = new Date().toISOString();

    const mergedProviders = incomingProviders.map((provider, index) => {
      const id = provider.id || `provider_${provider.provider}_${index + 1}`;
      const previous = existingDecrypted.find((p) => p.id === id && p.provider === provider.provider);

      const merged = mergeProviderConfig({ ...provider, id }, previous);
      const createdAt = previous?.createdAt || (provider as any)?.createdAt || now;

      return encryptProviderSecrets({
        ...merged,
        merchantId: merchantId || merged.merchantId,
        createdAt,
        updatedAt: now,
        enabled: typeof provider.enabled === "boolean" ? provider.enabled : previous?.enabled ?? true,
        name: provider.name || previous?.name || provider.provider.toUpperCase(),
        isFallback: provider.isFallback ?? previous?.isFallback,
      });
    });

    const settings: EmailProviderSettings = {
      id: existing?.id || SETTINGS_ID,
      merchantId: merchantId || existing?.merchantId,
      defaultProviderId: body.defaultProviderId || existing?.defaultProviderId || mergedProviders[0]?.id,
      fallbackProviderId: body.fallbackProviderId ?? existing?.fallbackProviderId,
      providers: mergedProviders,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    await col.updateOne(
      query,
      {
        $set: settings,
      },
      { upsert: true }
    );

    const saved = await col.findOne(query);
    const masked = saved
      ? {
          ...saved,
          providers: (saved.providers || []).map(maskProviderSecrets),
        }
      : settings;

    return NextResponse.json(masked);
  } catch (error: any) {
    console.error("PUT /api/merchant/email-settings error:", error);
    if (error?.message === "NEXT_REDIRECT") throw error;
    return NextResponse.json({ error: error?.message || "Failed to save email settings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAuth("merchant");

    const body = await request.json();
    const action = body?.action || "test";
    if (action !== "test" && action !== "send-test") {
      return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
    }

    const providerId = body?.providerId as string | undefined;
    const col = await getMerchantCollectionForAPI<EmailProviderSettings>(COLLECTION);
    const query = await buildMerchantQuery({ id: SETTINGS_ID });
    const settings = await col.findOne(query);

    if (!settings || !settings.providers?.length) {
      return NextResponse.json({ error: "No providers configured" }, { status: 400 });
    }

    const targetId = providerId || settings.defaultProviderId || settings.providers[0]?.id;
    const providerEncrypted = settings.providers.find((p) => p.id === targetId) || settings.providers[0];
    if (!providerEncrypted) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    const provider = decryptProviderSecrets(providerEncrypted);

    // If action is "send-test", send an actual test email
    if (action === "send-test") {
      const testEmail = body?.to as string | undefined;
      if (!testEmail) {
        return NextResponse.json({ error: "Test email address is required" }, { status: 400 });
      }

      const { sendEmailEvent } = await import("@/lib/email-service");
      const merchantId = await getMerchantIdForAPI();

      // Get fromEmail from provider or brand config
      let fromEmail = provider.fromEmail;
      if (!fromEmail) {
        const { getMerchantCollectionForAPI, buildMerchantQuery } = await import("@/lib/api-helpers");
        const brandCol = await getMerchantCollectionForAPI("brand_config");
        const brandCfg = await brandCol.findOne(await buildMerchantQuery({ id: "brand_config_v1" }));
        fromEmail = (brandCfg as any)?.contact?.email;
      }

      if (!fromEmail) {
        return NextResponse.json(
          { error: "From email is required. Please set fromEmail in provider settings or brand config." },
          { status: 400 }
        );
      }

      const result = await sendEmailEvent({
        event: "order_confirmation",
        to: testEmail,
        merchantId: merchantId || undefined,
        variables: {
          orderId: "TEST-ORDER-123",
          customerName: "Test User",
          orderTotal: "$99.99",
          orderDate: new Date().toISOString(),
          paymentMethod: "Test Payment",
          orderItems: "Test Product x1",
          trackingLink: "",
        },
        templateOverrides: {
          fromEmail: provider.fromEmail || fromEmail,
          fromName: provider.fromName,
          replyTo: provider.replyTo || provider.fromEmail || fromEmail,
        },
      });

      if (!result.ok) {
        console.error(`[Email Settings Test] Failed to send test email:`, result.error);
        return NextResponse.json({ ok: false, result, error: result.error }, { status: 400 });
      }

      return NextResponse.json({
        ok: true,
        result,
        message: `Test email sent successfully to ${testEmail} using ${result.provider}`,
      });
    }

    // Otherwise, just test the connection
    const result = await testProviderConnection(provider);
    return NextResponse.json({ ok: result?.ok !== false, result });
  } catch (error: any) {
    console.error("POST /api/merchant/email-settings (test) error:", error);
    if (error?.message === "NEXT_REDIRECT") throw error;
    return NextResponse.json({ error: error?.message || "Failed to test provider" }, { status: 500 });
  }
}

function mergeProviderConfig(incoming: EmailProviderConfig, existing?: EmailProviderConfig): EmailProviderConfig {
  if (!existing || incoming.provider !== existing.provider) {
    return clearMaskedSecrets(incoming);
  }

  switch (incoming.provider) {
    case "smtp": {
      const prevSmtp = existing?.provider === "smtp" ? existing : undefined;
      return {
        ...(prevSmtp || {}),
        ...incoming,
        password: incoming.password && incoming.password !== MASKED_VALUE ? incoming.password : prevSmtp?.password,
      };
    }
    case "ses": {
      const prevSes = existing?.provider === "ses" ? existing : undefined;
      return {
        ...(prevSes || {}),
        ...incoming,
        accessKeyId: incoming.accessKeyId && incoming.accessKeyId !== MASKED_VALUE ? incoming.accessKeyId : prevSes?.accessKeyId,
        secretAccessKey:
          incoming.secretAccessKey && incoming.secretAccessKey !== MASKED_VALUE ? incoming.secretAccessKey : prevSes?.secretAccessKey,
      };
    }
    case "sendgrid": {
      const prevSendgrid = existing?.provider === "sendgrid" ? existing : undefined;
      return {
        ...(prevSendgrid || {}),
        ...incoming,
        apiKey: incoming.apiKey && incoming.apiKey !== MASKED_VALUE ? incoming.apiKey : prevSendgrid?.apiKey,
      };
    }
    case "postmark": {
      const prevPostmark = existing?.provider === "postmark" ? existing : undefined;
      return {
        ...(prevPostmark || {}),
        ...incoming,
        serverToken: incoming.serverToken && incoming.serverToken !== MASKED_VALUE ? incoming.serverToken : prevPostmark?.serverToken,
      };
    }
    default:
      return clearMaskedSecrets(incoming);
  }
}

function clearMaskedSecrets(config: EmailProviderConfig): EmailProviderConfig {
  switch (config.provider) {
    case "smtp":
      return { ...config, password: config.password === MASKED_VALUE ? undefined : config.password };
    case "ses":
      return {
        ...config,
        accessKeyId: config.accessKeyId === MASKED_VALUE ? undefined : config.accessKeyId,
        secretAccessKey: config.secretAccessKey === MASKED_VALUE ? undefined : config.secretAccessKey,
      };
    case "sendgrid":
      return { ...config, apiKey: config.apiKey === MASKED_VALUE ? undefined : config.apiKey };
    case "postmark":
      return { ...config, serverToken: config.serverToken === MASKED_VALUE ? undefined : config.serverToken };
    default:
      return config;
  }
}

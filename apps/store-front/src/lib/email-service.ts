import { buildTenantQuery, getTenantCollectionForAPI, getTenantIdForAPI } from "./api-helpers";
import { decryptProviderSecrets, normalizeTemplate } from "./email-helpers";
import {
  buildDefaultTemplate,
  type EmailEvent,
  type EmailProviderConfig,
  type EmailProviderSettings,
  type EmailSendPayload,
  type EmailTemplate,
  type EmailSendResult,
  type BrandEmailMeta,
} from "./email-types";

type SendTemplatedEmailInput = {
  to: string | string[];
  event: EmailEvent;
  template: EmailTemplate;
  variables?: Record<string, string | number>;
  tenantId?: string;
};

export async function sendTemplatedEmail(input: SendTemplatedEmailInput): Promise<EmailSendResult> {
  const { to, event, template, variables = {}, tenantId } = input;

  const { primary, fallback } = await getProviderPreference(tenantId);
  if (!primary && !fallback) {
    const error = "No email provider configured. Please configure an email provider in Settings > Email Settings.";
    console.error(`[Email Service] ${error}`);
    return { ok: false, error };
  }

  // Check if primary provider is enabled
  if (primary && primary.enabled === false) {
    console.warn(`[Email Service] Primary provider ${primary.provider} (${primary.id}) is disabled`);
  }

  const rendered = renderTemplate(template, variables);

  // Ensure fromEmail is set - use brand config as fallback
  let fromEmail = template.fromEmail;
  if (!fromEmail) {
    const brandMeta = await loadBrandMeta();
    fromEmail = brandMeta?.fromEmail;
    if (!fromEmail) {
      const error = "From email is required but not configured. Please set fromEmail in email provider settings or brand config.";
      console.error(`[Email Service] ${error}`);
      return { ok: false, error };
    }
  }

  const payload: EmailSendPayload = {
    to,
    fromEmail,
    fromName: template.fromName,
    replyTo: template.replyTo || template.fromEmail || fromEmail,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    tags: [event],
    event,
    variables,
  };

  const primaryResult =
    primary && primary.enabled !== false ? await sendWithProvider(primary, payload) : { ok: false, error: "No enabled primary provider" };

  if (primaryResult.ok || !fallback || fallback.id === primary?.id) {
    if (!primaryResult.ok && primary) {
      console.error(`[Email Service] Failed to send email with primary provider ${primary.provider} (${primary.id}):`, primaryResult.error);
    }
    return primaryResult;
  }

  const fallbackResult = await sendWithProvider(fallback, payload);
  if (fallbackResult.ok) {
    console.warn(`[Email Service] Primary provider failed, used fallback ${fallback.provider} (${fallback.id})`);
    return fallbackResult;
  }

  console.error(
    `[Email Service] Both primary and fallback providers failed. Primary: ${primaryResult.error}, Fallback: ${fallbackResult.error}`
  );
  return primaryResult;
}

export async function sendTestEmail(input: SendTemplatedEmailInput): Promise<EmailSendResult> {
  return sendTemplatedEmail(input);
}

export async function testProviderConnection(provider: EmailProviderConfig): Promise<EmailSendResult> {
  return testConnection(provider);
}

export async function sendEmailEvent(params: {
  event: EmailEvent;
  to: string | string[];
  variables?: Record<string, string | number>;
  tenantId?: string;
  templateOverrides?: Partial<EmailTemplate>;
}): Promise<EmailSendResult> {
  const { event, to, variables = {}, tenantId, templateOverrides } = params;
  const template = await loadTemplate(event, tenantId);
  const mergedTemplate = { ...template, ...(templateOverrides || {}) };
  return sendTemplatedEmail({
    to,
    event,
    template: mergedTemplate,
    variables,
    tenantId,
  });
}

type ProviderPreference = {
  primary: EmailProviderConfig | null;
  fallback: EmailProviderConfig | null;
};

async function getProviderPreference(tenantId?: string): Promise<ProviderPreference> {
  try {
    const col = await getTenantCollectionForAPI<EmailProviderSettings>("email_providers");
    const query = await buildTenantQuery({ id: "email_providers_default" });
    const settings = await col.findOne(query);

    if (!settings || !settings.providers?.length) {
      console.warn("[Email Service] No email providers configured in database");
      return { primary: null, fallback: null };
    }

    // Filter to only enabled providers
    const enabledProviders = settings.providers.filter((p) => p.enabled !== false);
    if (enabledProviders.length === 0) {
      console.warn("[Email Service] All email providers are disabled");
      return { primary: null, fallback: null };
    }

    const providerId = settings.defaultProviderId || enabledProviders[0]?.id;
    const providerEncrypted = enabledProviders.find((p) => p.id === providerId) || enabledProviders[0];
    const fallbackEncrypted = settings.fallbackProviderId
      ? enabledProviders.find((p) => p.id === settings.fallbackProviderId && p.id !== providerEncrypted?.id)
      : null;

    const primary = providerEncrypted ? decryptProviderSecrets(providerEncrypted) : null;
    const fallback = fallbackEncrypted ? decryptProviderSecrets(fallbackEncrypted) : null;

    // Validate that passwords were properly decrypted
    if (primary?.provider === "smtp") {
      const smtpPrimary = primary as any;
      if (smtpPrimary.password && smtpPrimary.password.includes(":") && smtpPrimary.password.split(":").length === 2) {
        console.error(
          "[Email Service] ⚠️ CRITICAL: Primary SMTP provider password is still encrypted! " +
            "Decryption failed. Check ENCRYPTION_KEY environment variable. " +
            "User must re-enter password in Email Settings."
        );
      }
    }
    if (fallback?.provider === "smtp") {
      const smtpFallback = fallback as any;
      if (smtpFallback.password && smtpFallback.password.includes(":") && smtpFallback.password.split(":").length === 2) {
        console.error(
          "[Email Service] ⚠️ CRITICAL: Fallback SMTP provider password is still encrypted! " +
            "Decryption failed. Check ENCRYPTION_KEY environment variable. " +
            "User must re-enter password in Email Settings."
        );
      }
    }

    if (primary) {
      console.log(`[Email Service] Using primary provider: ${primary.provider} (${primary.id})`);
    }
    if (fallback) {
      console.log(`[Email Service] Fallback provider available: ${fallback.provider} (${fallback.id})`);
    }

    return { primary, fallback };
  } catch (error) {
    console.error("[Email Service] Error loading provider preferences:", error);
    return { primary: null, fallback: null };
  }
}

function renderTemplate(template: EmailTemplate, variables: Record<string, string | number>) {
  const subject = replacePlaceholders(template.subject || "", variables);
  const htmlSource = (template.html && template.html.length ? template.html : buildFallbackHtml(template)) || "<p></p>";
  const html = replacePlaceholders(htmlSource, variables);
  const text = stripHtml(html);

  return { subject, html, text };
}

function buildFallbackHtml(template: EmailTemplate) {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2>${template.name}</h2>
      <p>${template.description || "This is a notification from your store."}</p>
    </div>
  `;
}

function replacePlaceholders(text: string, variables: Record<string, string | number>) {
  if (!text) return "";
  return text.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, key) => {
    const value = variables[key.trim()];
    return value !== undefined && value !== null ? String(value) : "";
  });
}

function stripHtml(html: string) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function sendWithProvider(provider: EmailProviderConfig, payload: EmailSendPayload): Promise<EmailSendResult> {
  try {
    const { sendWithProvider: dispatcherSend } = await import("./email-providers/dispatcher");
    return await dispatcherSend(provider, payload);
  } catch (error: any) {
    console.error("sendWithProvider error:", error);
    return { ok: false, provider: provider.provider, error: error?.message || "Failed to send email" };
  }
}

async function testConnection(provider: EmailProviderConfig): Promise<EmailSendResult> {
  try {
    const { testConnection: dispatcherTest } = await import("./email-providers/dispatcher");
    return await dispatcherTest(provider);
  } catch (error: any) {
    console.error("testConnection error:", error);
    return { ok: false, provider: provider.provider, error: error?.message || "Failed to test provider" };
  }
}

async function loadTemplate(event: EmailEvent, tenantId?: string): Promise<EmailTemplate> {
  try {
    const col = await getTenantCollectionForAPI<EmailTemplate>("email_templates");
    const query = await buildTenantQuery({ event });
    const doc = await col.findOne(query);
    if (doc) {
      return normalizeTemplate(doc);
    }
  } catch (error) {
    console.error("Failed to load email template:", error);
  }

  const resolvedTenantId = tenantId || (await getTenantIdForAPI()) || undefined;
  const brandMeta = await loadBrandMeta();
  return buildDefaultTemplate(event, resolvedTenantId, brandMeta);
}

async function loadBrandMeta(): Promise<BrandEmailMeta | undefined> {
  try {
    const col = await getTenantCollectionForAPI("brand_config");
    const cfg = await col.findOne(await buildTenantQuery({ id: "brand_config_v1" }));
    if (cfg) {
      return {
        brandName: (cfg as any)?.brandName,
        fromEmail: (cfg as any)?.contact?.email,
        fromName: (cfg as any)?.brandName,
        replyTo: (cfg as any)?.contact?.email,
      };
    }
  } catch (err) {
    console.error("Failed to load brand meta for emails:", err);
  }
  return undefined;
}

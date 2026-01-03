import sgMail from "@sendgrid/mail";
import type { EmailSendPayload, EmailSendResult, SendGridProviderConfig } from "../email-types";
import { resolveFromFields, toArray } from "./utils";

export async function sendWithSendgrid(provider: SendGridProviderConfig, payload: EmailSendPayload): Promise<EmailSendResult> {
  if (!provider.apiKey) {
    return { ok: false, provider: "sendgrid", error: "SendGrid API key is required" };
  }

  const { fromEmail, fromName } = resolveFromFields(provider, payload);
  if (!fromEmail) {
    return { ok: false, provider: "sendgrid", error: "From email is required for SendGrid" };
  }

  try {
    sgMail.setApiKey(provider.apiKey);
    const [response] = await sgMail.send({
      from: { email: fromEmail, name: fromName },
      to: toArray(payload.to),
      cc: toArray(payload.cc),
      bcc: toArray(payload.bcc),
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      replyTo: payload.replyTo || provider.replyTo || fromEmail,
      categories: payload.tags?.length ? payload.tags.slice(0, 10) : undefined,
    });

    return {
      ok: true,
      provider: "sendgrid",
      messageId: response?.headers?.["x-message-id"] || response?.headers?.["X-Message-Id"],
    };
  } catch (error: any) {
    console.error("SendGrid send error:", error?.response?.body || error);
    return { ok: false, provider: "sendgrid", error: error?.message || "SendGrid send failed" };
  }
}

export async function testSendgrid(provider: SendGridProviderConfig): Promise<EmailSendResult> {
  const testRecipient = provider.fromEmail || provider.replyTo;
  if (!testRecipient) {
    return { ok: false, provider: "sendgrid", error: "Test recipient is required for SendGrid" };
  }

  return sendWithSendgrid(provider, {
    to: testRecipient,
    subject: "SendGrid connection test",
    html: "<p>SendGrid connection test</p>",
    text: "SendGrid connection test",
  });
}

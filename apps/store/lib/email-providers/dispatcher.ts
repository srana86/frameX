import type { EmailProviderConfig, EmailSendPayload, EmailSendResult } from "../email-types";
import { sendWithSmtp, testSmtp } from "./smtp";
import { sendWithSes, testSes } from "./ses";
import { sendWithSendgrid, testSendgrid } from "./sendgrid";
import { sendWithPostmark, testPostmark } from "./postmark";

export async function sendWithProvider(provider: EmailProviderConfig, payload: EmailSendPayload): Promise<EmailSendResult> {
  const handler = getSendHandler(provider.provider);
  if (!handler) {
    return { ok: false, provider: provider.provider, error: "Unsupported email provider" };
  }

  return handler(provider as any, payload);
}

export async function testConnection(provider: EmailProviderConfig): Promise<EmailSendResult> {
  const handler = getTestHandler(provider.provider);
  if (!handler) {
    return { ok: false, provider: provider.provider, error: "Unsupported email provider" };
  }
  return handler(provider as any);
}

function getSendHandler(provider: EmailProviderConfig["provider"]) {
  switch (provider) {
    case "smtp":
      return sendWithSmtp;
    case "ses":
      return sendWithSes;
    case "sendgrid":
      return sendWithSendgrid;
    case "postmark":
      return sendWithPostmark;
    default:
      return null;
  }
}

function getTestHandler(provider: EmailProviderConfig["provider"]) {
  switch (provider) {
    case "smtp":
      return testSmtp;
    case "ses":
      return testSes;
    case "sendgrid":
      return testSendgrid;
    case "postmark":
      return testPostmark;
    default:
      return null;
  }
}

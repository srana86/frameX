import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import type { EmailSendPayload, EmailSendResult, SesProviderConfig } from "../email-types";
import { formatFrom, resolveFromFields, toArray } from "./utils";

export async function sendWithSes(provider: SesProviderConfig, payload: EmailSendPayload): Promise<EmailSendResult> {
  if (!provider.region) {
    return { ok: false, provider: "ses", error: "SES region is required" };
  }

  const { fromEmail, fromName } = resolveFromFields(provider, payload);
  if (!fromEmail) {
    return { ok: false, provider: "ses", error: "From email is required for SES" };
  }

  try {
    const client = new SESClient({
      region: provider.region,
      credentials:
        provider.accessKeyId && provider.secretAccessKey
          ? {
              accessKeyId: provider.accessKeyId,
              secretAccessKey: provider.secretAccessKey,
            }
          : undefined,
    });

    const command = new SendEmailCommand({
      Source: formatFrom(fromEmail, fromName),
      Destination: {
        ToAddresses: toArray(payload.to),
        CcAddresses: toArray(payload.cc),
        BccAddresses: toArray(payload.bcc),
      },
      Message: {
        Subject: { Data: payload.subject },
        Body: {
          Html: { Data: payload.html },
          ...(payload.text ? { Text: { Data: payload.text } } : {}),
        },
      },
      ReplyToAddresses: toArray(payload.replyTo || provider.replyTo),
    });

    const response = await client.send(command);
    return {
      ok: true,
      provider: "ses",
      messageId: response.MessageId,
    };
  } catch (error: any) {
    console.error("SES send error:", error);
    return { ok: false, provider: "ses", error: error?.message || "SES send failed" };
  }
}

export async function testSes(provider: SesProviderConfig): Promise<EmailSendResult> {
  const testRecipient = provider.fromEmail || provider.replyTo;
  if (!testRecipient) {
    return { ok: false, provider: "ses", error: "Test recipient is required for SES" };
  }

  return sendWithSes(provider, {
    to: testRecipient,
    subject: "SES connection test",
    html: "<p>SES connection test</p>",
    text: "SES connection test",
  });
}

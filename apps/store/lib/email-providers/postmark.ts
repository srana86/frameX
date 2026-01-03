import postmark from "postmark";
import type { EmailSendPayload, EmailSendResult, PostmarkProviderConfig } from "../email-types";
import { formatFrom, resolveFromFields, toCommaSeparated } from "./utils";

export async function sendWithPostmark(provider: PostmarkProviderConfig, payload: EmailSendPayload): Promise<EmailSendResult> {
  if (!provider.serverToken) {
    return { ok: false, provider: "postmark", error: "Postmark server token is required" };
  }

  const { fromEmail, fromName } = resolveFromFields(provider, payload);
  if (!fromEmail) {
    return { ok: false, provider: "postmark", error: "From email is required for Postmark" };
  }

  try {
    const client = new postmark.ServerClient(provider.serverToken);

    const response = await client.sendEmail({
      From: formatFrom(fromEmail, fromName),
      To: toCommaSeparated(payload.to) || "",
      Cc: toCommaSeparated(payload.cc),
      Bcc: toCommaSeparated(payload.bcc),
      Subject: payload.subject,
      HtmlBody: payload.html,
      TextBody: payload.text,
      ReplyTo: payload.replyTo || provider.replyTo || fromEmail,
      Tag: payload.event,
      MessageStream: provider.messageStream || "outbound",
    });

    return {
      ok: true,
      provider: "postmark",
      messageId: response.MessageID?.toString(),
    };
  } catch (error: any) {
    console.error("Postmark send error:", error);
    const errorMessage = error?.response?.body?.Message || error?.message || "Postmark send failed";
    const errorCode = error?.response?.body?.ErrorCode || error?.statusCode;
    return {
      ok: false,
      provider: "postmark",
      error: errorCode ? `${errorCode}: ${errorMessage}` : errorMessage,
    };
  }
}

export async function testPostmark(provider: PostmarkProviderConfig): Promise<EmailSendResult> {
  if (!provider.serverToken) {
    return { ok: false, provider: "postmark", error: "Postmark server token is required" };
  }

  try {
    const client = new postmark.ServerClient(provider.serverToken);
    // Use getServer() to validate the token and connection
    const server = await client.getServer();
    return {
      ok: true,
      provider: "postmark",
      responseId: server.ID?.toString(),
      messageId: server.Name || "Connection successful",
    };
  } catch (error: any) {
    console.error("Postmark test error:", error);
    const errorMessage = error?.response?.body?.Message || error?.message || "Postmark test failed";
    return {
      ok: false,
      provider: "postmark",
      error: errorMessage,
    };
  }
}

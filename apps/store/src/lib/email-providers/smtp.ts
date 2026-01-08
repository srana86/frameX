import nodemailer from "nodemailer";
import type { EmailSendPayload, EmailSendResult, SmtpProviderConfig } from "../email-types";
import { formatFrom, resolveFromFields } from "./utils";

export async function sendWithSmtp(provider: SmtpProviderConfig, payload: EmailSendPayload): Promise<EmailSendResult> {
  if (!provider.host || !provider.port) {
    return { ok: false, provider: "smtp", error: "SMTP host and port are required" };
  }

  const { fromEmail, fromName } = resolveFromFields(provider, payload);
  if (!fromEmail) {
    return { ok: false, provider: "smtp", error: "From email is required for SMTP" };
  }

  // Validate and prepare credentials
  const username = provider.username?.trim();
  const password = provider.password?.trim();

  // Debug logging (without exposing actual password)
  console.log("[SMTP] Attempting connection:", {
    host: provider.host,
    port: provider.port,
    secure: provider.secure,
    username: username ? `${username.substring(0, 3)}***` : "not set",
    passwordLength: password?.length || 0,
    passwordFormat: password ? (password.includes(":") ? "encrypted (may need decryption)" : "plain text") : "not set",
  });

  // Check if password looks encrypted (contains ":" separator from encryption format)
  // If it does, it means decryption failed - this is a critical error
  const isPasswordEncrypted = password && password.includes(":") && password.split(":").length === 2;
  if (isPasswordEncrypted) {
    const errorMsg =
      "⚠️ CRITICAL: Your password is still encrypted and couldn't be decrypted. " +
      "This usually happens when:\n" +
      "1. ENCRYPTION_KEY environment variable changed or is missing\n" +
      "2. Password was saved with a different encryption key\n\n" +
      "SOLUTION: Please go to Email Settings and re-enter your SMTP password, then save again.";

    console.error("[SMTP]", errorMsg);
    return { ok: false, provider: "smtp", error: errorMsg };
  }

  // If username or password is provided, both should be present for authentication
  if ((username || password) && (!username || !password)) {
    return {
      ok: false,
      provider: "smtp",
      error: "Both username and password are required for SMTP authentication",
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: provider.host.trim(),
      port: provider.port,
      secure: !!provider.secure,
      auth:
        username && password
          ? {
              user: username,
              pass: password,
            }
          : undefined,
      // Add connection timeout and better error handling
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });

    // Note: We skip verify() to avoid TypeScript issues and extra round trip.
    // sendMail() will catch authentication errors anyway.

    const info = await transporter.sendMail({
      from: formatFrom(fromEmail, fromName),
      to: payload.to,
      cc: payload.cc,
      bcc: payload.bcc,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      replyTo: payload.replyTo || provider.replyTo || fromEmail,
    });

    return {
      ok: true,
      provider: "smtp",
      messageId: typeof info.messageId === "string" ? info.messageId : undefined,
    };
  } catch (error: any) {
    console.error("[SMTP] Send error:", error);

    // Provide more helpful error messages
    let errorMessage = error?.message || "SMTP send failed";

    if (error?.code === "EAUTH" || error?.responseCode === 535) {
      // Check if password might be encrypted
      const isPasswordEncrypted = password && password.includes(":") && password.split(":").length === 2;

      errorMessage =
        "SMTP authentication failed (535 error). " +
        (isPasswordEncrypted
          ? "⚠️ Your password appears to still be encrypted. Please re-enter your password in email settings and save again."
          : "Please check your username and password. " +
            "For Gmail: Use an App Password (not your regular password). " +
            "For Outlook/Hotmail: Use an App Password if 2FA is enabled. " +
            "For other providers: Ensure 2FA is disabled or use an app-specific password. " +
            "Common SMTP settings:\n" +
            "- Gmail: smtp.gmail.com:587 (secure: true) or :465 (secure: true)\n" +
            "- Outlook: smtp-mail.outlook.com:587 (secure: true)\n" +
            "- Yahoo: smtp.mail.yahoo.com:587 (secure: true)");
    } else if (error?.code === "ECONNECTION" || error?.code === "ETIMEDOUT") {
      errorMessage = `SMTP connection failed. Please check your host (${provider.host}) and port (${provider.port}) settings.`;
    } else if (error?.code === "EENVELOPE") {
      errorMessage = "Invalid email address in recipient or sender fields.";
    }

    return { ok: false, provider: "smtp", error: errorMessage };
  }
}

export async function testSmtp(provider: SmtpProviderConfig): Promise<EmailSendResult> {
  const testRecipient = provider.fromEmail || provider.replyTo || provider.username;
  if (!testRecipient) {
    return { ok: false, provider: "smtp", error: "Test recipient is required for SMTP" };
  }

  // Validate credentials before testing
  const username = provider.username?.trim();
  const password = provider.password?.trim();

  if (!username || !password) {
    return {
      ok: false,
      provider: "smtp",
      error: "Username and password are required for SMTP authentication",
    };
  }

  return sendWithSmtp(provider, {
    to: testRecipient,
    subject: "SMTP connection test",
    html: "<p>SMTP connection test</p>",
    text: "SMTP connection test",
  });
}

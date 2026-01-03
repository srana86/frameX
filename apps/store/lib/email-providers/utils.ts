import type { EmailSendPayload } from "../email-types";

export function toArray(value?: string | string[] | null): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value.filter(Boolean) : [value].filter(Boolean);
}

export function toCommaSeparated(value?: string | string[] | null): string | undefined {
  const arr = toArray(value);
  return arr.length ? arr.join(",") : undefined;
}

export function formatFrom(email: string, name?: string) {
  if (!email) return "";
  return name ? `${name} <${email}>` : email;
}

export function resolveFromFields(provider: { fromEmail?: string; fromName?: string }, payload: EmailSendPayload) {
  const fromEmail = payload.fromEmail || provider.fromEmail;
  const fromName = payload.fromName || provider.fromName;

  return { fromEmail, fromName };
}

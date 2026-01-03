export type EmailProviderType = "smtp" | "ses" | "sendgrid" | "postmark";

export type EmailProviderBase = {
  id: string;
  merchantId?: string;
  provider: EmailProviderType;
  name: string;
  fromEmail?: string;
  fromName?: string;
  replyTo?: string;
  enabled: boolean;
  isFallback?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type SmtpProviderConfig = EmailProviderBase & {
  provider: "smtp";
  host: string;
  port: number;
  username?: string;
  password?: string; // store encrypted at rest
  secure?: boolean;
};

export type SesProviderConfig = EmailProviderBase & {
  provider: "ses";
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string; // store encrypted at rest
};

export type SendGridProviderConfig = EmailProviderBase & {
  provider: "sendgrid";
  apiKey?: string; // store encrypted at rest
};

export type PostmarkProviderConfig = EmailProviderBase & {
  provider: "postmark";
  serverToken?: string; // store encrypted at rest
  messageStream?: string;
};

export type EmailProviderConfig =
  | SmtpProviderConfig
  | SesProviderConfig
  | SendGridProviderConfig
  | PostmarkProviderConfig;

export interface EmailProviderSettings {
  id: string;
  merchantId?: string;
  defaultProviderId?: string;
  fallbackProviderId?: string;
  providers: EmailProviderConfig[];
  createdAt?: string;
  updatedAt?: string;
}


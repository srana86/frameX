import { prisma } from "@framex/database";

// Get email provider settings
const getEmailProviderSettingsFromDB = async (tenantId: string) => {
  let settings = await prisma.emailProviderSettings.findUnique({
    where: { tenantId }
  });

  if (!settings) {
    settings = await prisma.emailProviderSettings.create({
      data: {
        tenantId,
        providers: []
      }
    });
  }

  // Mask sensitive fields in providers array (Json)
  const providers: any[] = (settings.providers as any) || [];
  const maskedProviders = providers.map((p: any) => ({
    ...p,
    password: p.password ? "ENCRYPTED" : undefined,
    apiKey: p.apiKey ? "ENCRYPTED" : undefined
  }));

  return {
    ...settings,
    providers: maskedProviders
  };
};

// Update email provider settings
const updateEmailProviderSettingsFromDB = async (
  tenantId: string,
  payload: any
) => {
  // Encrypt secrets (placeholder)
  const providers = payload.providers.map((p: any) => ({
    ...p,
    // Implement encryption here
  }));

  const result = await prisma.emailProviderSettings.upsert({
    where: { tenantId },
    create: {
      tenantId,
      providers,
      defaultProviderId: payload.defaultProviderId,
      fallbackProviderId: payload.fallbackProviderId
    },
    update: {
      providers,
      defaultProviderId: payload.defaultProviderId,
      fallbackProviderId: payload.fallbackProviderId
    }
  });

  return result;
};

export const EmailProviderServices = {
  getEmailProviderSettingsFromDB,
  updateEmailProviderSettingsFromDB,
};

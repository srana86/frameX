import { z } from "zod";

const userDataSchema = z.object({
  email: z.string().email().optional(),
  emails: z.array(z.string().email()).optional(),
  phone: z.string().optional(),
  phones: z.array(z.string()).optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
});

const eventDataSchema = z.object({
  content_ids: z.array(z.string()).optional(),
  content_name: z.string().optional(),
  value: z.number().optional(),
  currency: z.string().optional(),
});

const trackFBEventValidationSchema = z.object({
  body: z.object({
    eventName: z.string().min(1, "Event name is required"),
    eventId: z.string().optional(),
    eventData: eventDataSchema.optional(),
    userData: userDataSchema.optional(),
  }),
});

const metaPixelUserDataSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  city: z.string().optional(),
  zipCode: z.string().optional(),
  externalId: z.string().optional(),
});

const metaPixelCustomDataSchema = z.object({
  value: z.number().optional(),
  currency: z.string().optional(),
  contentIds: z.array(z.string()).optional(),
  numItems: z.number().optional(),
  orderId: z.string().optional(),
});

const trackMetaPixelValidationSchema = z.object({
  body: z.object({
    eventName: z.string().min(1, "Event name is required"),
    eventId: z.string().optional(),
    userData: metaPixelUserDataSchema.optional(),
    customData: metaPixelCustomDataSchema.optional(),
    eventSourceUrl: z.string().url().optional(),
    actionSource: z
      .enum([
        "website",
        "email",
        "app",
        "phone_call",
        "chat",
        "physical_store",
        "system_generated",
        "other",
      ])
      .optional(),
    fbp: z.string().nullable().optional(),
    fbc: z.string().nullable().optional(),
    clientIpAddress: z.string().nullable().optional(),
  }),
});

const tiktokPixelPropertiesSchema = z.object({
  value: z.number().optional(),
  currency: z.string().optional(),
  content_type: z.string().optional(),
  quantity: z.number().optional(),
});

const trackTikTokPixelValidationSchema = z.object({
  body: z.object({
    event: z.string().min(1, "Event name is required"),
    event_id: z.string().optional(),
    properties: tiktokPixelPropertiesSchema.optional(),
    timestamp: z.number().optional(),
  }),
});

const trackGA4ValidationSchema = z.object({
  body: z.object({
    client_id: z.string().min(1, "Client ID is required"),
    events: z.array(
      z.object({
        name: z.string().min(1, "Event name is required"),
        params: z.record(z.string(), z.any()).optional(),
      })
    ),
  }),
});

export const TrackingValidation = {
  trackFBEventValidationSchema,
  trackMetaPixelValidationSchema,
  trackTikTokPixelValidationSchema,
  trackGA4ValidationSchema,
};

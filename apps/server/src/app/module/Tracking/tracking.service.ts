/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma, PrismaQueryBuilder } from "@framex/database";
import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";

const trackFBEventFromDB = async (tenantId: string, payload: any) => {
  const adsConfig = await prisma.adsConfig.findUnique({ where: { tenantId } });

  // Use type assertion if properties are not fully typed in generated client yet, or rely on Json type
  const metaPixel: any = (adsConfig as any)?.metaPixel;

  if (!metaPixel?.enabled || !metaPixel?.pixelId) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Meta Pixel is not enabled");
  }

  const { serverSideTracking } = metaPixel;
  const accessToken = process.env.META_PIXEL_ACCESS_TOKEN || serverSideTracking?.accessToken;
  const testEventCode = serverSideTracking?.testEventCode;

  if (!accessToken) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Meta Pixel access token missing");
  }

  const eventId = payload.eventId || `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  const pixelId = metaPixel.pixelId;

  // Prepare Meta API payload
  const userData: any = { ...payload.userData };
  const customData: any = { ...payload.eventData, content_type: "product" };

  const eventData = {
    event_name: payload.eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    action_source: "website",
    user_data: userData,
    custom_data: customData
  };

  const apiUrl = `https://graph.facebook.com/v21.0/${pixelId}/events`;
  const requestBody: any = {
    data: [eventData],
    access_token: accessToken
  };

  if (testEventCode) requestBody.test_event_code = testEventCode;

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    const responseData = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(responseData));

    // Save to DB
    const savedEvent = await prisma.fBEvent.create({
      data: {
        tenantId,
        eventName: payload.eventName,
        eventId,
        eventData: payload.eventData,
        userData: payload.userData,
        timestamp: new Date()
      }
    });

    return { success: true, eventId, savedEvent, metaResponse: responseData };

  } catch (error: any) {
    // Save locally even if failed
    await prisma.fBEvent.create({
      data: {
        tenantId,
        eventName: payload.eventName,
        eventId,
        eventData: payload.eventData,
        userData: payload.userData,
        timestamp: new Date()
      }
    });

    throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, `Meta API failed: ${error.message}`);
  }
};

const trackMetaPixelEventFromDB = async (tenantId: string, payload: any) => {
  // Same logic as FB event tracking mostly, adapting payload structure
  return trackFBEventFromDB(tenantId, payload);
};

const trackTikTokPixelEventFromDB = async (tenantId: string, payload: any) => {
  const adsConfig = await prisma.adsConfig.findUnique({ where: { tenantId } });
  const tiktokPixel: any = (adsConfig as any)?.tiktokPixel;

  if (!tiktokPixel?.enabled || !tiktokPixel?.pixelCode) {
    return { success: false, message: "TikTok Pixel is not enabled or misconfigured" };
  }

  // TikTok Pixel tracking implementation would go here
  // For now, we acknowledge the event to stop 404 errors
  return {
    success: true,
    message: "TikTok Pixel event received",
    eventId: payload.event_id
  };
};

const getFBEventsFromDB = async (tenantId: string, query: Record<string, unknown>) => {
  const builder = new PrismaQueryBuilder({
    model: prisma.fBEvent,
    query,
    searchFields: ["eventName"]
  });

  return builder
    .addBaseWhere({ tenantId })
    .search()
    .filter()
    .sort()
    .paginate()
    .execute();
};

const trackGA4EventFromDB = async (tenantId: string, payload: any) => {
  const adsConfig = await prisma.adsConfig.findUnique({ where: { tenantId } });
  const gtm: any = (adsConfig as any)?.googleTagManager;

  // For GTM/GA4, we mostly check if GTM is enabled as GA4 often fires via GTM
  // and the server endpoint might be for measurement protocol
  if (!gtm?.enabled || !gtm?.containerId) {
    return { success: false, message: "Google Tag Manager/GA4 is not enabled or misconfigured" };
  }

  // Measurement Protocol logic would go here
  return {
    success: true,
    message: "GA4 event received",
    eventsCount: payload.events?.length || 0
  };
};

export const TrackingServices = {
  trackFBEventFromDB,
  trackMetaPixelEventFromDB,
  trackTikTokPixelEventFromDB,
  trackGA4EventFromDB,
  getFBEventsFromDB,
};

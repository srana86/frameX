/* eslint-disable @typescript-eslint/no-explicit-any */
import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import { FBEventModel } from "./tracking.model";
import { FBEvent, MetaPixelEvent } from "./tracking.interface";
import { AdsConfig } from "../Config/config.model";
import QueryBuilder from "../../builder/QueryBuilder";

// Track Facebook event
const trackFBEventFromDB = async (payload: FBEvent) => {
  // Get ads config to check if Meta Pixel is enabled
  const adsConfig = await AdsConfig.findOne({ id: "ads-config" });

  // AdsConfig uses 'meta' field, but we need to check for serverSideTracking
  // For now, we'll make it optional and log a warning if not configured
  const metaPixel = (adsConfig as any)?.meta;

  if (!metaPixel?.enabled || !metaPixel?.pixelId) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Meta Pixel is not enabled or configured"
    );
  }

  // Note: serverSideTracking config would need to be added to AdsConfig model
  // For now, we'll use a placeholder or environment variable
  const accessToken =
    process.env.META_PIXEL_ACCESS_TOKEN ||
    (metaPixel as any)?.serverSideTracking?.accessToken;
  const testEventCode = (metaPixel as any)?.serverSideTracking?.testEventCode;

  if (!accessToken) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Meta Pixel access token is not configured"
    );
  }

  // Generate event ID if not provided
  const eventId =
    payload.eventId ||
    `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

  // Prepare event data for Meta Conversions API
  const pixelId = metaPixel.pixelId;

  // Build user data
  const userData: any = {};
  if (payload.userData?.email) userData.email = payload.userData.email;
  if (payload.userData?.emails && payload.userData.emails.length > 0) {
    userData.emails = payload.userData.emails;
  }
  if (payload.userData?.phone) userData.phone = payload.userData.phone;
  if (payload.userData?.phones && payload.userData.phones.length > 0) {
    userData.phones = payload.userData.phones;
  }
  if (payload.userData?.firstName)
    userData.firstName = payload.userData.firstName;
  if (payload.userData?.lastName) userData.lastName = payload.userData.lastName;
  if (payload.userData?.city) userData.city = payload.userData.city;
  if (payload.userData?.zipCode) userData.zipCode = payload.userData.zipCode;
  if (payload.userData?.country) userData.country = payload.userData.country;

  // Build custom data
  const customData: any = {
    content_type: "product",
  };
  if (payload.eventData?.value !== undefined)
    customData.value = payload.eventData.value;
  if (payload.eventData?.currency)
    customData.currency = payload.eventData.currency;
  if (payload.eventData?.content_ids)
    customData.content_ids = payload.eventData.content_ids;
  if (payload.eventData?.content_name)
    customData.content_name = payload.eventData.content_name;

  // Build event for Meta API
  const eventData: any = {
    event_name: payload.eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    action_source: "website",
    user_data: userData,
    custom_data: customData,
  };

  // Send to Meta Conversions API
  const apiUrl = `https://graph.facebook.com/v21.0/${pixelId}/events`;
  const requestBody: any = {
    data: [eventData],
    access_token: accessToken,
  };

  if (testEventCode) {
    requestBody.test_event_code = testEventCode;
  }

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(`Meta API error: ${JSON.stringify(responseData)}`);
    }

    // Save event to database
    const savedEvent = await FBEventModel.create({
      eventName: payload.eventName,
      eventId,
      eventData: payload.eventData,
      userData: payload.userData,
      timestamp: new Date(),
    });

    return {
      success: true,
      eventId,
      savedEvent,
      metaResponse: responseData,
    };
  } catch (error: any) {
    // Still save event even if Meta API fails
    const savedEvent = await FBEventModel.create({
      eventName: payload.eventName,
      eventId,
      eventData: payload.eventData,
      userData: payload.userData,
      timestamp: new Date(),
    });

    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to send event to Meta: ${error.message}. Event saved locally.`
    );
  }
};

// Track Meta Pixel event (newer API)
const trackMetaPixelEventFromDB = async (payload: MetaPixelEvent) => {
  // Get ads config
  const adsConfig = await AdsConfig.findOne({ id: "ads-config" });

  const metaPixel = (adsConfig as any)?.meta;

  if (!metaPixel?.enabled || !metaPixel?.pixelId) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Meta Pixel is not enabled or configured"
    );
  }

  const pixelId = metaPixel.pixelId;
  const accessToken =
    process.env.META_PIXEL_ACCESS_TOKEN ||
    (metaPixel as any)?.serverSideTracking?.accessToken;
  const testEventCode = (metaPixel as any)?.serverSideTracking?.testEventCode;

  if (!accessToken) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Meta Pixel access token is not configured"
    );
  }

  const eventId =
    payload.eventId ||
    `${Date.now()}-${Math.random().toString(36).substring(7)}`;

  // Build user data
  const userData: any = {};
  if (payload.userData?.email) userData.email = payload.userData.email;
  if (payload.userData?.phone) userData.phone = payload.userData.phone;
  if (payload.userData?.firstName)
    userData.firstName = payload.userData.firstName;
  if (payload.userData?.lastName) userData.lastName = payload.userData.lastName;
  if (payload.userData?.city) userData.city = payload.userData.city;
  if (payload.userData?.zipCode) userData.zipCode = payload.userData.zipCode;
  if (payload.userData?.externalId)
    userData.externalId = payload.userData.externalId;

  // Build custom data
  const customData: any = {};
  if (payload.customData?.value !== undefined)
    customData.value = payload.customData.value;
  if (payload.customData?.currency)
    customData.currency = payload.customData.currency;
  if (payload.customData?.contentIds)
    customData.content_ids = payload.customData.contentIds;
  if (payload.customData?.numItems !== undefined)
    customData.num_items = payload.customData.numItems;
  if (payload.customData?.orderId)
    customData.order_id = payload.customData.orderId;

  // Build event
  const eventData: any = {
    event_name: payload.eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    action_source: payload.actionSource || "website",
    user_data: {
      ...userData,
      ...(payload.fbp && { fbp: payload.fbp }),
      ...(payload.fbc && { fbc: payload.fbc }),
      ...(payload.clientIpAddress && {
        client_ip_address: payload.clientIpAddress,
      }),
    },
    custom_data: customData,
    ...(payload.eventSourceUrl && { event_source_url: payload.eventSourceUrl }),
  };

  // Send to Meta API
  const apiUrl = `https://graph.facebook.com/v21.0/${pixelId}/events`;
  const requestBody: any = {
    data: [eventData],
    access_token: accessToken,
  };

  if (testEventCode) {
    requestBody.test_event_code = testEventCode;
  }

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(`Meta API error: ${JSON.stringify(responseData)}`);
    }

    return {
      success: true,
      eventId,
      response: responseData,
    };
  } catch (error: any) {
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Failed to send event to Meta: ${error.message}`
    );
  }
};

// Get tracked Facebook events
const getFBEventsFromDB = async (query: Record<string, unknown>) => {
  const eventQuery = new QueryBuilder(FBEventModel.find(), query)
    .search(["eventName"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await eventQuery.modelQuery;
  const meta = await eventQuery.countTotal();

  return {
    meta,
    data: result,
  };
};

export const TrackingServices = {
  trackFBEventFromDB,
  trackMetaPixelEventFromDB,
  getFBEventsFromDB,
};

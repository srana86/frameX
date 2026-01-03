import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb";
import { DEFAULT_CURRENCY } from "@/lib/currency";

export interface GeneralSettings {
  siteName: string;
  defaultCurrency: string;
  timezone: string;
  dateFormat: string;
  darkMode: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
  updatedAt?: string;
}

const DEFAULT_SETTINGS: GeneralSettings = {
  siteName: "FrameX Super Admin",
  defaultCurrency: DEFAULT_CURRENCY,
  timezone: "Asia/Dhaka",
  dateFormat: "DD/MM/YYYY",
  darkMode: false,
  autoRefresh: true,
  refreshInterval: 30,
};

// GET - Fetch general settings
export async function GET() {
  try {
    const collection = await getCollection("settings");
    const settings = await collection.findOne({ id: "general_settings" });

    if (!settings) {
      return NextResponse.json(DEFAULT_SETTINGS);
    }

    const { _id, id, ...settingsData } = settings as any;
    return NextResponse.json({ ...DEFAULT_SETTINGS, ...settingsData });
  } catch (error: any) {
    console.error("GET /api/settings/general error:", error);
    return NextResponse.json(DEFAULT_SETTINGS);
  }
}

// PUT - Update general settings
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const collection = await getCollection("settings");

    const updatedSettings = {
      ...DEFAULT_SETTINGS,
      ...body,
      id: "general_settings",
      updatedAt: new Date().toISOString(),
    };

    await collection.updateOne({ id: "general_settings" }, { $set: updatedSettings }, { upsert: true });

    // Log activity
    const activityCol = await getCollection("activity_logs");
    await activityCol.insertOne({
      type: "settings",
      action: "settings_updated",
      entityId: "general_settings",
      entityName: "General Settings",
      details: { updatedFields: Object.keys(body) },
      createdAt: new Date().toISOString(),
    });

    const { _id, id, ...settingsData } = updatedSettings;
    return NextResponse.json(settingsData);
  } catch (error: any) {
    console.error("PUT /api/settings/general error:", error);
    return NextResponse.json({ error: error?.message || "Failed to update settings" }, { status: 500 });
  }
}

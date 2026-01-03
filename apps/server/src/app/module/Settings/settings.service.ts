import { Settings } from "./settings.model";
import { ActivityLog } from "../ActivityLog/activityLog.model";
import { toPlainObject } from "../../utils/mongodb";
import { ISettings } from "./settings.interface";

const DEFAULT_GENERAL_SETTINGS = {
  siteName: "FrameX Super Admin",
  defaultCurrency: "BDT",
  timezone: "Asia/Dhaka",
  dateFormat: "DD/MM/YYYY",
  darkMode: false,
  autoRefresh: true,
  refreshInterval: 30,
};

const DEFAULT_SSLCOMMERZ_CONFIG = {
  id: "sslcommerz_config_v1",
  enabled: false,
  storeId: "",
  storePassword: "",
  isLive: false,
};

const getGeneralSettings = async () => {
  const settings = await Settings.findOne({ id: "general_settings" });

  if (!settings) {
    return DEFAULT_GENERAL_SETTINGS;
  }

  const data = toPlainObject<ISettings>(settings);
  return { ...DEFAULT_GENERAL_SETTINGS, ...data };
};

const updateGeneralSettings = async (
  payload: Partial<typeof DEFAULT_GENERAL_SETTINGS>
) => {
  const updatedSettings = {
    ...DEFAULT_GENERAL_SETTINGS,
    ...payload,
    id: "general_settings",
    updatedAt: new Date().toISOString(),
  };

  await Settings.findOneAndUpdate(
    { id: "general_settings" },
    { $set: updatedSettings },
    { upsert: true, new: true }
  );

  // Log activity
  await ActivityLog.create({
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: "system",
    action: "settings_updated",
    entityId: "general_settings",
    entityName: "General Settings",
    details: { updatedFields: Object.keys(payload) },
    createdAt: new Date().toISOString(),
  });

  const data = toPlainObject<ISettings>(updatedSettings as any);
  if (!data) {
    return DEFAULT_GENERAL_SETTINGS;
  }
  const { id, ...settingsData } = data;
  return settingsData;
};

const getSSLCommerzSettings = async () => {
  const config = await Settings.findOne({ id: "sslcommerz_config_v1" });

  if (!config) {
    return DEFAULT_SSLCOMMERZ_CONFIG;
  }

  const data = toPlainObject<ISettings>(config);
  return {
    ...DEFAULT_SSLCOMMERZ_CONFIG,
    ...data,
    storePassword: (data as any).storePassword ? "••••••••" : "", // Mask password
  };
};

const updateSSLCommerzSettings = async (payload: {
  storeId?: string;
  storePassword?: string;
  isLive?: boolean;
  enabled?: boolean;
}) => {
  const { storeId, storePassword, isLive, enabled } = payload;

  // Get existing config to preserve password if not changed
  const existingConfig = await Settings.findOne({ id: "sslcommerz_config_v1" });

  // If password is masked (••••••••), keep the existing password
  const finalPassword =
    storePassword === "••••••••" && existingConfig
      ? (existingConfig as any).storePassword
      : storePassword;

  const configToSave = {
    id: "sslcommerz_config_v1",
    storeId: storeId || "",
    storePassword: finalPassword || "",
    isLive: isLive ?? false,
    enabled: enabled ?? false,
    updatedAt: new Date().toISOString(),
    createdAt: existingConfig
      ? (existingConfig as any).createdAt
      : new Date().toISOString(),
  };

  await Settings.findOneAndUpdate(
    { id: "sslcommerz_config_v1" },
    { $set: configToSave },
    { upsert: true, new: true }
  );

  // Log activity
  await ActivityLog.create({
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: "system",
    action: "sslcommerz_config_updated",
    entityId: "sslcommerz_config_v1",
    details: {
      storeId: configToSave.storeId,
      isLive: configToSave.isLive,
      enabled: configToSave.enabled,
    },
    createdAt: new Date().toISOString(),
  });

  return {
    success: true,
    message: "Configuration saved successfully",
  };
};

const testSSLCommerzConnection = async (payload: {
  storeId: string;
  storePassword: string;
  isLive: boolean;
}) => {
  const { storeId, storePassword, isLive } = payload;

  if (!storeId || !storePassword) {
    throw new Error("Store ID and Store Password are required");
  }

  // Use SSLCommerz transaction query API to test credentials
  const baseURL = `https://${isLive ? "securepay" : "sandbox"}.sslcommerz.com`;
  const testURL = `${baseURL}/validator/api/merchantTransIDvalidationAPI.php`;

  const params = new URLSearchParams();
  params.append("store_id", storeId);
  params.append("store_passwd", storePassword);
  params.append("tran_id", "TEST_CONNECTION_" + Date.now());

  try {
    const response = await fetch(testURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const data = await response.json();

    // SSLCommerz returns specific status for invalid credentials
    if (data.APIConnect === "DONE") {
      return {
        success: true,
        message: "Connection successful! Your credentials are valid.",
        details: {
          apiConnect: data.APIConnect,
          noOfTransaction: data.no_of_trans_found || 0,
        },
      };
    } else if (
      data.status === "INVALID_STORE" ||
      data.status === "INVALID_CREDENTIAL" ||
      data.APIConnect === "FAILED"
    ) {
      return {
        success: false,
        message:
          "Invalid credentials. Please check your Store ID and Password.",
      };
    } else {
      return {
        success: true,
        message:
          "Connection established. Please verify credentials are correct.",
        details: data,
      };
    }
  } catch (error: any) {
    throw new Error(error.message || "Failed to connect to SSLCommerz");
  }
};

export const SettingsServices = {
  getGeneralSettings,
  updateGeneralSettings,
  getSSLCommerzSettings,
  updateSSLCommerzSettings,
  testSSLCommerzConnection,
};

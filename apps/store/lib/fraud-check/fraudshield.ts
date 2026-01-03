import { fetchWithTimeout, safeJson, failure, FraudResponse, FraudResponseItem, round2, BD_PHONE_REGEX, FraudAggregated } from "./common";

interface FraudShieldCourierItem {
  name: string;
  logo: string;
  total_parcel: number;
  success_parcel: number;
  cancelled_parcel: number;
  success_ratio: number;
}

interface FraudShieldResponse {
  status: string;
  message?: string;
  courierData?: Record<
    string,
    FraudShieldCourierItem | { total_parcel: number; success_parcel: number; cancelled_parcel: number; success_ratio: number }
  >;
  reports?: any[];
}

function mapToFraudResponseItem(item?: FraudShieldCourierItem): FraudResponseItem {
  if (!item) {
    return failure("No data returned");
  }
  const success = Number(item.success_parcel || 0);
  const cancel = Number(item.cancelled_parcel || 0);
  const total = Number(item.total_parcel || 0);
  const deliveredPercentage = total > 0 ? round2((success / total) * 100) : 0;
  const returnPercentage = total > 0 ? round2((cancel / total) * 100) : 0;
  return { status: true, message: "Successful.", data: { success, cancel, total, deliveredPercentage, returnPercentage } };
}

export async function fraudShieldCheck(phone: string): Promise<FraudAggregated> {
  const result: FraudResponse = {};

  if (!BD_PHONE_REGEX.test(phone)) {
    const msg = "Invalid Bangladeshi phone number format";
    return { services: { pathao: failure(msg), redx: failure(msg), steadfast: failure(msg) } };
  }

  const resp = await fetchWithTimeout("https://fraudshieldbd.site/courier-check", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/plain, */*",
    },
    body: JSON.stringify({ phone }),
  });

  if (!resp.ok) {
    const data = await safeJson(resp);
    const msg = data?.message || `FraudShield query failed (${resp.status})`;
    return { services: { pathao: failure(msg), redx: failure(msg), steadfast: failure(msg) } };
  }

  const json = (await safeJson(resp)) as FraudShieldResponse | null;
  if (!json || json.status !== "success") {
    const msg = json?.message || "FraudShield returned unexpected response";
    return { services: { pathao: failure(msg), redx: failure(msg), steadfast: failure(msg) } };
  }

  const data = json.courierData || {};

  // Map each courier
  if (data.pathao) result.pathao = mapToFraudResponseItem(data.pathao as FraudShieldCourierItem);
  if (data.redx) result.redx = mapToFraudResponseItem(data.redx as FraudShieldCourierItem);
  if (data.steadfast) result.steadfast = mapToFraudResponseItem(data.steadfast as FraudShieldCourierItem);
  if (data.paperfly) result.paperfly = mapToFraudResponseItem(data.paperfly as FraudShieldCourierItem);
  if (data.parceldex) result.parceldex = mapToFraudResponseItem(data.parceldex as FraudShieldCourierItem);

  // If any of the expected services were missing, mark them as failure to be explicit
  if (!result.pathao) result.pathao = failure("Pathao data not available");
  if (!result.redx) result.redx = failure("Redx data not available");
  if (!result.steadfast) result.steadfast = failure("Steadfast data not available");
  if (!result.paperfly) result.paperfly = failure("Paperfly data not available");
  if (!result.parceldex) result.parceldex = failure("Parceldex data not available");

  // Compute summary if present
  let summary;
  const s = data.summary as any;
  if (s) {
    const success = Number(s.success_parcel || 0);
    const total = Number(s.total_parcel || 0);
    const cancel = Number(s.cancelled_parcel || Math.max(total - success, 0));
    const deliveredPercentage = total > 0 ? round2((success / total) * 100) : 0;
    const returnPercentage = total > 0 ? round2((cancel / total) * 100) : 0;
    summary = { success, cancel, total, deliveredPercentage, returnPercentage };
  }

  return { services: result, summary };
}

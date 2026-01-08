import type { Metadata } from "next";
import { IpAnalyticsClient } from "./IpAnalyticsClient";
import { requireAuth } from "@/lib/auth-helpers";

export const metadata: Metadata = {
  title: "Merchant · IP Analytics",
  description: "View IP addresses, geolocation data, and order statistics",
};

export default async function IpAnalyticsPage() {
  await requireAuth("merchant");

  return <IpAnalyticsClient />;
}


import type { Metadata } from "next";
import { AIAssistantClient } from "./AIAssistantClient";
import { loadBrandConfig } from "../brand/loadBrandConfig";

export const metadata: Metadata = {
  title: "AI Assistant · Dashboard",
  description: "Chat with your AI-powered business assistant for insights and analytics.",
};

export default async function AIAssistantPage() {
  const brandConfig = await loadBrandConfig();

  return <AIAssistantClient brandName={brandConfig.brandName} />;
}

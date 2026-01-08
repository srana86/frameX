"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/site/Footer";
import type { BrandConfig } from "@/lib/brand-config";

interface EnabledFooterPage {
  slug: string;
  title: string;
  category: string;
}

interface AdminAwareFooterProps {
  brandConfig: BrandConfig;
  enabledPages: EnabledFooterPage[];
}

export default function AdminAwareFooter({ brandConfig, enabledPages }: AdminAwareFooterProps) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/merchant") || pathname?.startsWith("/admin");
  if (isAdmin) return null;
  return <Footer brandConfig={brandConfig} enabledPages={enabledPages} />;
}

"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/site/Navbar";
import type { BrandConfig } from "@/lib/brand-config";

interface TopNavProps {
  brandConfig: BrandConfig;
}

export default function TopNav({ brandConfig }: TopNavProps) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/tenant") || pathname?.startsWith("/admin");
  // Hide TopNav for admin pages since admin layout has its own header
  if (isAdmin) return null;
  return <Navbar brandConfig={brandConfig} />;
}

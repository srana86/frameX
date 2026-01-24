"use client";

import { usePathname } from "next/navigation";
import SnowfallEffect from "./SnowfallEffect";

export default function ClientEffects() {
  const pathname = usePathname();

  // Don't show snowfall in owner panel or other administrative pages
  if (pathname?.startsWith("/owner")) {
    return null;
  }

  return <SnowfallEffect />;
}

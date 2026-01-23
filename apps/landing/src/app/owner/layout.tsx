"use client";

import { OwnerShell } from "@/app/owner/_components/OwnerShell";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

/**
 * Owner Layout
 * 
 * Conditionally renders OwnerShell for owner-level pages.
 * Store-specific pages (under /owner/stores/[id]) use their own StoreAdminShell,
 * so we skip OwnerShell to avoid double headers.
 */
export default function OwnerLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();

    // Check if we're in a store-specific route (has storeId in path)
    // Pattern: /owner/stores/[uuid]/...
    const isStoreRoute = /^\/owner\/stores\/[^/]+\/.+/.test(pathname);

    return (
        <SettingsProvider>
            <main>
                {isStoreRoute ? (
                    // Store routes use StoreAdminShell, skip OwnerShell
                    children
                ) : (
                    // Owner-level routes use OwnerShell
                    <OwnerShell>{children}</OwnerShell>
                )}
            </main>
        </SettingsProvider>
    );
}

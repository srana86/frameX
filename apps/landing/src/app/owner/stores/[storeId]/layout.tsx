import { ReactNode } from "react";
import { StoreAdminShell } from "./_components/StoreAdminShell";
import { requireStoreAccess } from "@/lib/store-auth-helpers";
import { StoreProvider } from "@/contexts/StoreContext";

export const dynamic = "force-dynamic";

interface StoreAdminLayoutProps {
  children: ReactNode;
  params: Promise<{ storeId: string }>;
}

/**
 * Store Admin Layout
 * Protects routes and provides store context
 * Uses static admin theme (no tenant branding)
 */
export default async function StoreAdminLayout({
  children,
  params,
}: StoreAdminLayoutProps) {
  const { storeId } = await params;

  // Verify user has access to this store
  const access = await requireStoreAccess(storeId);

  return (
    <StoreProvider>
      <StoreAdminShell storeId={storeId}>{children}</StoreAdminShell>
    </StoreProvider>
  );
}

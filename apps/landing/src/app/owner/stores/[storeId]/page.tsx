import { redirect } from "next/navigation";

interface StorePageProps {
  params: Promise<{ storeId: string }>;
}

/**
 * Store Page - Redirects to dashboard
 */
export default async function StorePage({ params }: StorePageProps) {
  const { storeId } = await params;
  redirect(`/owner/stores/${storeId}/dashboard`);
}

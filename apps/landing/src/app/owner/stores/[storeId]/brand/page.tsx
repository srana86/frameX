import { redirect } from "next/navigation";

export default async function BrandConfigPage({ params }: { params: { storeId: string } }) {
  const { storeId } = await params;
  redirect(`/owner/stores/${storeId}/brand/identity`);
}

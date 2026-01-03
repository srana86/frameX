import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { serverSideApiClient } from "@/lib/api-client";
import PageForm from "@/components/admin/PageForm";
import type { FooterPage } from "@/lib/types";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) return { title: "Admin · Edit Page" };
  return { title: `Edit · ${page.title}` };
}

export default async function AdminEditPagePage({ params }: Props) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) notFound();
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Edit Page</h1>
      <PageForm initial={page} />
    </div>
  );
}

async function getPage(slug: string): Promise<FooterPage | null> {
  try {
    const client = serverSideApiClient();
    const response = await client.get(`/pages/${slug}`);
    if (response.data?.data) {
      return response.data.data as FooterPage;
    }
  } catch (error) {
    console.error("Failed to fetch page:", error);
  }
  return null;
}


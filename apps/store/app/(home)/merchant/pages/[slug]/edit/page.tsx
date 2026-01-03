import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCollection } from "@/lib/mongodb";
import PageForm from "@/components/admin/PageForm";
import type { FooterPage } from "@/app/api/pages/route";

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
    const col = await getCollection<FooterPage>("footer_pages");
    const page = await col.findOne({ slug });
    if (!page) return null;
    const { _id, ...pageWithoutId } = page as any;
    return pageWithoutId as FooterPage;
  } catch (error) {
    console.error("Failed to fetch page:", error);
    return null;
  }
}


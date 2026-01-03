import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { brandConfig } from "@/lib/brand-config";
import { getCollection } from "@/lib/mongodb";
import type { FooterPage } from "@/app/api/pages/route";

async function getPage(slug: string): Promise<FooterPage | null> {
  try {
    const col = await getCollection<FooterPage>("footer_pages");
    const page = await col.findOne({ slug, enabled: true });

    if (!page) {
      return null;
    }

    const { _id, ...pageWithoutId } = page;
    return pageWithoutId;
  } catch (error) {
    console.error("Failed to fetch page:", error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);

  if (!page) {
    return {
      title: "Page Not Found",
    };
  }

  return {
    title: `${page.title} – ${brandConfig.brandName}`,
    description: `Read ${page.title} on ${brandConfig.brandName}`,
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getPage(slug);

  if (!page) {
    notFound();
  }

  return (
    <div className='mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8'>
      <article className='prose prose-lg dark:prose-invert max-w-none'>
        <h1 className='text-4xl font-bold mb-8'>{page.title}</h1>
        <div className='prose prose-lg dark:prose-invert max-w-none' dangerouslySetInnerHTML={{ __html: page.content }} />
      </article>
    </div>
  );
}

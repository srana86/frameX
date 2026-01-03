import { NextResponse } from "next/server";
import { getMerchantCollectionForAPI, buildMerchantQuery } from "@/lib/api-helpers";
import type { FooterPage } from "../route";

export async function GET() {
  try {
    const col = await getMerchantCollectionForAPI<FooterPage>("footer_pages");
    const query = await buildMerchantQuery({ enabled: true });
    const pages = await col.find(query).sort({ category: 1, title: 1 }).toArray();
    
    // Remove MongoDB _id field and only return public fields
    const publicPages = pages.map(({ _id, ...page }) => ({
      slug: page.slug,
      title: page.title,
      category: page.category || "General",
    }));
    
    return NextResponse.json(publicPages);
  } catch (error: any) {
    console.error("GET /api/pages/enabled error:", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch enabled pages" }, { status: 500 });
  }
}


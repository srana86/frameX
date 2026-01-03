import { NextResponse } from "next/server";
import { getMerchantCollectionForAPI, buildMerchantQuery, getMerchantIdForAPI, isUsingSharedDatabase } from "@/lib/api-helpers";

export interface FooterPage {
  id: string;
  slug: string;
  title: string;
  content: string; // Tiptap HTML content
  category: string; // Category name
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FooterCategory {
  id: string;
  name: string;
  order: number; // Display order
  createdAt: string;
  updatedAt: string;
}

export async function GET() {
  try {
    const col = await getMerchantCollectionForAPI<FooterPage>("footer_pages");
    const query = await buildMerchantQuery();
    const pages = await col.find(query).sort({ category: 1, title: 1 }).toArray();

    // Remove MongoDB _id field
    const pagesWithoutId = pages.map(({ _id, ...page }) => page);

    return NextResponse.json(pagesWithoutId);
  } catch (error: any) {
    console.error("GET /api/pages error:", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch pages" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const col = await getMerchantCollectionForAPI<FooterPage>("footer_pages");
    const baseQuery = await buildMerchantQuery();
    const merchantId = await getMerchantIdForAPI();

    // Validate required fields
    if (!body.slug || !body.title) {
      return NextResponse.json({ error: "Missing required fields: slug and title" }, { status: 400 });
    }

    // Check if slug already exists
    const existing = await col.findOne({ ...baseQuery, slug: body.slug });
    if (existing) {
      return NextResponse.json({ error: "A page with this slug already exists" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const newPage: any = {
      id: body.slug,
      slug: body.slug,
      title: body.title,
      content: body.content || "",
      category: body.category || "General",
      enabled: body.enabled ?? false,
      createdAt: now,
      updatedAt: now,
    };

    // Add merchantId if using shared database
    if (merchantId) {
      const useShared = await isUsingSharedDatabase();
      if (useShared) {
        newPage.merchantId = merchantId;
      }
    }

    await col.insertOne(newPage);

    return NextResponse.json(newPage, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/pages error:", error);
    return NextResponse.json({ error: error?.message || "Failed to create page" }, { status: 500 });
  }
}

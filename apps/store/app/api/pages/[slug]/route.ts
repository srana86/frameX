import { NextResponse } from "next/server";
import { getMerchantCollectionForAPI, buildMerchantQuery } from "@/lib/api-helpers";
import type { FooterPage } from "../route";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const col = await getMerchantCollectionForAPI<FooterPage>("footer_pages");
    const baseQuery = await buildMerchantQuery();
    const page = await col.findOne({ ...baseQuery, slug });

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Only return enabled pages for public access
    if (!page.enabled) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    const { _id, ...pageWithoutId } = page;
    return NextResponse.json(pageWithoutId);
  } catch (error: any) {
    console.error("GET /api/pages/[slug] error:", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch page" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const col = await getMerchantCollectionForAPI<FooterPage>("footer_pages");
    const baseQuery = await buildMerchantQuery();

    const query = { ...baseQuery, slug };

    // Check if page exists
    const existing = await col.findOne(query);
    if (!existing) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Update page
    const updateData: Partial<FooterPage> = {
      updatedAt: new Date().toISOString(),
    };

    if (body.title !== undefined) updateData.title = body.title;
    if (body.content !== undefined) updateData.content = body.content;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.enabled !== undefined) updateData.enabled = body.enabled;

    await col.updateOne(query, { $set: updateData });

    // Fetch updated page
    const updated = await col.findOne(query);
    const { _id, ...pageWithoutId } = updated as any;

    return NextResponse.json(pageWithoutId);
  } catch (error: any) {
    console.error("PUT /api/pages/[slug] error:", error);
    return NextResponse.json({ error: error?.message || "Failed to update page" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const col = await getMerchantCollectionForAPI<FooterPage>("footer_pages");
    const baseQuery = await buildMerchantQuery();

    const query = { ...baseQuery, slug };
    const result = await col.deleteOne(query);

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/pages/[slug] error:", error);
    return NextResponse.json({ error: error?.message || "Failed to delete page" }, { status: 500 });
  }
}


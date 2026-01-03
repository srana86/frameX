import { NextResponse } from "next/server";
import { getMerchantCollectionForAPI, buildMerchantQuery } from "@/lib/api-helpers";
import type { FooterCategory } from "../../route";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const col = await getMerchantCollectionForAPI<FooterCategory>("footer_categories");
    const baseQuery = await buildMerchantQuery();

    const query = { ...baseQuery, id };

    // Check if category exists
    const existing = await col.findOne(query);
    if (!existing) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Update category
    const updateData: Partial<FooterCategory> = {
      updatedAt: new Date().toISOString(),
    };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.order !== undefined) updateData.order = body.order;

    await col.updateOne(query, { $set: updateData });

    // Fetch updated category
    const updated = await col.findOne(query);
    const { _id, ...catWithoutId } = updated as any;

    return NextResponse.json(catWithoutId);
  } catch (error: any) {
    console.error("PUT /api/pages/categories/[id] error:", error);
    return NextResponse.json({ error: error?.message || "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const col = await getMerchantCollectionForAPI<FooterCategory>("footer_categories");
    const pagesCol = await getMerchantCollectionForAPI("footer_pages");
    const baseQuery = await buildMerchantQuery();

    const query = { ...baseQuery, id };

    // Get category name first
    const category = await col.findOne(query);
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Check if any pages use this category (by name, not id)
    const pagesUsingCategory = await pagesCol.countDocuments({ ...baseQuery, category: category.name });
    if (pagesUsingCategory > 0) {
      return NextResponse.json(
        { error: `Cannot delete category. ${pagesUsingCategory} page(s) are using it.` },
        { status: 400 }
      );
    }

    const result = await col.deleteOne(query);

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/pages/categories/[id] error:", error);
    return NextResponse.json({ error: error?.message || "Failed to delete category" }, { status: 500 });
  }
}


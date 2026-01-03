import { NextResponse } from "next/server";
import { getMerchantCollectionForAPI, buildMerchantQuery } from "@/lib/api-helpers";
import type { ProductCategory } from "../route";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const col = await getMerchantCollectionForAPI<ProductCategory>("product_categories");
    const baseQuery = await buildMerchantQuery();

    const query = { ...baseQuery, id };

    // Check if category exists
    const existing = await col.findOne(query);
    if (!existing) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Check if name is being changed and if new name already exists
    if (body.name && body.name !== existing.name) {
      const nameExists = await col.findOne({ ...baseQuery, name: body.name, id: { $ne: id } });
      if (nameExists) {
        return NextResponse.json({ error: "A category with this name already exists" }, { status: 400 });
      }
    }

    // Update category
    const updateData: Partial<ProductCategory> = {
      updatedAt: new Date().toISOString(),
    };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.order !== undefined) updateData.order = body.order;

    await col.updateOne(query, { $set: updateData });

    // Fetch updated category
    const updated = await col.findOne(query);
    const { _id, ...categoryWithoutId } = updated as any;

    return NextResponse.json(categoryWithoutId);
  } catch (error: any) {
    console.error("PUT /api/products/categories/[id] error:", error);
    return NextResponse.json({ error: error?.message || "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const col = await getMerchantCollectionForAPI<ProductCategory>("product_categories");
    const baseQuery = await buildMerchantQuery();

    const query = { ...baseQuery, id };
    const result = await col.deleteOne(query);

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/products/categories/[id] error:", error);
    return NextResponse.json({ error: error?.message || "Failed to delete category" }, { status: 500 });
  }
}


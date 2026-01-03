import { NextResponse } from "next/server";
import { getMerchantCollectionForAPI, buildMerchantQuery } from "@/lib/api-helpers";
import { ObjectId } from "mongodb";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const col = await getMerchantCollectionForAPI("hero_slides");
    const baseQuery = await buildMerchantQuery();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const query = { ...baseQuery, _id: new ObjectId(id) };
    const result = await col.deleteOne(query);

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Slide not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/hero-slides/[id] error:", error);
    return NextResponse.json({ error: error?.message || "Failed to delete hero slide" }, { status: 500 });
  }
}


import { NextResponse } from "next/server";
import { getMerchantCollectionForAPI, buildMerchantQuery } from "@/lib/api-helpers";

export const revalidate = 300;
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const col = await getMerchantCollectionForAPI("products");
    const query = await buildMerchantQuery();

    const pipeline: any[] = [];

    if (Object.keys(query).length > 0) {
      pipeline.push({ $match: query });
    }

    // Add brand filter match
    pipeline.push(
      { $match: { brand: { $exists: true, $ne: null } } },
      { $group: { _id: "$brand" } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, brand: "$_id" } }
    );

    const brands = await col.aggregate(pipeline).toArray();

    const filteredBrands = brands
      .map((item: any) => item.brand)
      .filter((brand): brand is string => Boolean(brand && typeof brand === "string"));

    return NextResponse.json(
      { brands: filteredBrands },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error: any) {
    console.error("GET /api/products/brands error:", error);
    return NextResponse.json({ brands: [] }, { status: 500 });
  }
}

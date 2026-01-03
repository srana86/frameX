import { NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb";
import type { MerchantDeployment } from "@/lib/types";

export async function GET() {
  try {
    const col = await getCollection<MerchantDeployment>("merchant_deployments");
    const deployments = await col.find({}).sort({ createdAt: -1 }).toArray();

    const deploymentsWithoutId = deployments.map((deployment) => {
      const { _id, ...data } = deployment as any;
      return data;
    });

    return NextResponse.json(deploymentsWithoutId);
  } catch (error: any) {
    console.error("GET /api/deployments error:", error);
    return NextResponse.json({ error: error?.message || "Failed to get deployments" }, { status: 500 });
  }
}

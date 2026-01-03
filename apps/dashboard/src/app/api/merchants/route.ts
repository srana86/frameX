import { NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb";
import type { Merchant } from "@/lib/types";

export async function GET() {
  try {
    const col = await getCollection<Merchant>("merchants");
    const merchants = await col.find({}).sort({ createdAt: -1 }).toArray();

    const merchantsWithoutId = merchants.map((merchant: any) => {
      const { _id, ...data } = merchant;
      return data;
    });

    return NextResponse.json(merchantsWithoutId);
  } catch (error: any) {
    console.error("GET /api/merchants error:", error);
    return NextResponse.json({ error: error?.message || "Failed to get merchants" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const col = await getCollection("merchants");

    // Validate required fields
    if (!body.name || !body.email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    const newMerchant = {
      id: body.id || `merchant_${Date.now()}`,
      name: body.name,
      email: body.email,
      phone: body.phone || "",
      status: body.status || "active",
      customDomain: body.customDomain || "",
      deploymentUrl: body.deploymentUrl || "",
      subscriptionId: body.subscriptionId || "",
      settings: body.settings || {
        brandName: body.name,
        currency: "USD",
        timezone: "UTC",
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await col.insertOne(newMerchant);

    return NextResponse.json(newMerchant, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/merchants error:", error);
    return NextResponse.json({ error: error?.message || "Failed to create merchant" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb";

interface Sale {
  id: string;
  merchantId: string;
  merchantName?: string;
  merchantEmail?: string;
  subscriptionId?: string;
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  billingCycleMonths: number;
  paymentMethod: string;
  transactionId?: string;
  status: "completed" | "pending" | "failed" | "refunded";
  type: "new" | "renewal" | "upgrade" | "downgrade";
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// GET - Fetch sales with filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const merchantId = searchParams.get("merchantId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "100");

    const collection = await getCollection("sales");

    // Build query
    const query: any = {};
    if (status) query.status = status;
    if (type) query.type = type;
    if (merchantId) query.merchantId = merchantId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = startDate;
      if (endDate) query.createdAt.$lte = endDate;
    }

    const sales = await collection.find(query).sort({ createdAt: -1 }).limit(limit).toArray();

    // Calculate stats
    const totalRevenue = sales.filter((s: any) => s.status === "completed").reduce((sum: number, s: any) => sum + (s.amount || 0), 0);

    const totalSales = sales.filter((s: any) => s.status === "completed").length;

    const byType = sales.reduce((acc: any, sale: any) => {
      if (sale.status === "completed") {
        acc[sale.type] = (acc[sale.type] || 0) + 1;
      }
      return acc;
    }, {});

    // Remove MongoDB _id
    const salesData = sales.map((sale: any) => {
      const { _id, ...data } = sale;
      return data;
    });

    return NextResponse.json({
      sales: salesData,
      stats: {
        totalRevenue,
        totalSales,
        byType,
        currency: "BDT",
      },
    });
  } catch (error: any) {
    console.error("GET /api/sales error:", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch sales" }, { status: 500 });
  }
}

// POST - Record a new sale
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const collection = await getCollection("sales");

    // Validate required fields
    if (!body.merchantId || !body.planId || !body.amount) {
      return NextResponse.json({ error: "merchantId, planId, and amount are required" }, { status: 400 });
    }

    const sale: Sale = {
      id: body.id || `sale_${Date.now()}`,
      merchantId: body.merchantId,
      merchantName: body.merchantName,
      merchantEmail: body.merchantEmail,
      subscriptionId: body.subscriptionId,
      planId: body.planId,
      planName: body.planName || "Unknown Plan",
      amount: body.amount,
      currency: body.currency || "BDT",
      billingCycleMonths: body.billingCycleMonths || 1,
      paymentMethod: body.paymentMethod || "sslcommerz",
      transactionId: body.transactionId,
      status: body.status || "completed",
      type: body.type || "new",
      metadata: body.metadata || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await collection.insertOne(sale);

    // Log activity
    const activityCol = await getCollection("activity_logs");
    await activityCol.insertOne({
      type: "sale",
      action: "sale_recorded",
      entityId: sale.id,
      entityName: `${sale.planName} - ৳${sale.amount}`,
      details: {
        saleId: sale.id,
        merchantId: sale.merchantId,
        merchantName: sale.merchantName,
        planId: sale.planId,
        planName: sale.planName,
        amount: sale.amount,
        type: sale.type,
      },
      createdAt: new Date().toISOString(),
    });

    console.log(`[sales] Recorded sale: ${sale.id} - ${sale.planName} - ৳${sale.amount}`);

    return NextResponse.json(sale, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/sales error:", error);
    return NextResponse.json({ error: error?.message || "Failed to record sale" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb";

// GET - Fetch all payments/checkout sessions
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const merchantId = searchParams.get("merchantId");
    const limit = parseInt(searchParams.get("limit") || "100");
    const page = parseInt(searchParams.get("page") || "1");

    const collection = await getCollection("checkout_sessions");

    // Build query
    const query: any = {};
    if (status && status !== "all") {
      query.status = status;
    }
    if (merchantId) {
      query.merchantId = merchantId;
    }

    // Get total count
    const total = await collection.countDocuments(query);

    // Fetch payments with pagination
    const payments = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    // Transform data
    const transformedPayments = payments.map((p) => ({
      id: p._id?.toString(),
      tranId: p.tranId,
      merchantId: p.merchantId,
      merchantName: p.merchantName,
      merchantEmail: p.merchantEmail,
      merchantPhone: p.merchantPhone,
      planId: p.planId,
      planName: p.planName,
      amount: p.planPrice || 0,
      billingCycle: p.billingCycle,
      currency: p.currency || "BDT",
      status: p.status === "completed" ? "completed" : p.status === "failed" ? "failed" : "pending",
      paymentMethod: p.card_type || p.paymentMethod,
      cardType: p.card_type,
      cardNo: p.card_no,
      bankTranId: p.bank_tran_id,
      valId: p.val_id,
      customerName: p.customerName,
      customerEmail: p.customerEmail,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    return NextResponse.json(transformedPayments);
  } catch (error: any) {
    console.error("Failed to fetch payments:", error);
    return NextResponse.json({ message: "Failed to fetch payments" }, { status: 500 });
  }
}

// POST - Create payment session or get stats
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, type } = body;

    // Handle stats request
    if (action === "stats") {
      const collection = await getCollection("checkout_sessions");

      // Get counts by status
      const [completed, pending, failed, total] = await Promise.all([
        collection.countDocuments({ status: "completed" }),
        collection.countDocuments({ status: "pending" }),
        collection.countDocuments({ status: "failed" }),
        collection.countDocuments({}),
      ]);

      // Get total revenue
      const revenueResult = await collection
        .aggregate([{ $match: { status: "completed" } }, { $group: { _id: null, total: { $sum: "$planPrice" } } }])
        .toArray();

      const totalRevenue = revenueResult[0]?.total || 0;

      // Get this month's revenue
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const thisMonthResult = await collection
        .aggregate([
          {
            $match: {
              status: "completed",
              createdAt: { $gte: startOfMonth.toISOString() },
            },
          },
          { $group: { _id: null, total: { $sum: "$planPrice" } } },
        ])
        .toArray();

      const thisMonthRevenue = thisMonthResult[0]?.total || 0;

      return NextResponse.json({
        total,
        completed,
        pending,
        failed,
        totalRevenue,
        thisMonthRevenue,
      });
    }

    // Handle renewal session creation
    if (type === "renewal_session") {
      const collection = await getCollection("renewal_sessions");
      const { tranId, merchantId, invoiceId, subscriptionId, sessionkey, status, amount, currency } = body;

      await collection.insertOne({
        tranId,
        merchantId,
        invoiceId,
        subscriptionId,
        sessionkey,
        status: status || "pending",
        amount,
        currency: currency || "BDT",
        createdAt: new Date().toISOString(),
      });

      return NextResponse.json({ success: true, tranId });
    }

    return NextResponse.json({ message: "Unknown action or type" }, { status: 400 });
  } catch (error: any) {
    console.error("Failed to process payment request:", error);
    return NextResponse.json({ message: "Failed to process request" }, { status: 500 });
  }
}

// PUT - Update payment/renewal session
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { tranId, status, valId, error, completedAt, failedAt } = body;

    if (!tranId) {
      return NextResponse.json({ message: "tranId is required" }, { status: 400 });
    }

    // Try to update in renewal_sessions first
    const renewalCol = await getCollection("renewal_sessions");
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (status) updateData.status = status;
    if (valId) updateData.valId = valId;
    if (error) updateData.error = error;
    if (completedAt) updateData.completedAt = completedAt;
    if (failedAt) updateData.failedAt = failedAt;

    const renewalResult = await renewalCol.updateOne({ tranId }, { $set: updateData });

    if (renewalResult.matchedCount > 0) {
      return NextResponse.json({ success: true, updated: "renewal_session" });
    }

    // Fallback to checkout_sessions
    const checkoutCol = await getCollection("checkout_sessions");
    const checkoutResult = await checkoutCol.updateOne({ tranId }, { $set: updateData });

    if (checkoutResult.matchedCount > 0) {
      return NextResponse.json({ success: true, updated: "checkout_session" });
    }

    return NextResponse.json({ message: "Session not found" }, { status: 404 });
  } catch (error: any) {
    console.error("Failed to update payment session:", error);
    return NextResponse.json({ message: "Failed to update session" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// Generate invoice number
function generateInvoiceNumber(): string {
  const prefix = "INV";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// GET - Fetch all invoices
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const merchantId = searchParams.get("merchantId");
    const limit = parseInt(searchParams.get("limit") || "100");

    const collection = await getCollection("invoices");

    // Build query
    const query: any = {};
    if (status && status !== "all") {
      query.status = status;
    }
    if (merchantId) {
      query.merchantId = merchantId;
    }

    // Fetch invoices
    const invoices = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    // Also fetch from checkout_sessions to include successful payments as invoices
    const checkoutCol = await getCollection("checkout_sessions");
    const checkoutQuery: any = { status: "completed" };
    if (merchantId) {
      checkoutQuery.merchantId = merchantId;
    }
    const completedPayments = await checkoutCol
      .find(checkoutQuery)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    // Transform completed payments to invoice format
    const paymentInvoices = completedPayments.map((p) => ({
      id: p._id?.toString(),
      invoiceNumber: `PAY-${p.tranId}`,
      merchantId: p.merchantId,
      merchantName: p.merchantName,
      merchantEmail: p.merchantEmail,
      subscriptionId: p.subscriptionId,
      planId: p.planId,
      planName: p.planName,
      billingCycle: p.billingCycle === 1 ? "1 Month" : p.billingCycle === 6 ? "6 Months" : "1 Year",
      amount: p.planPrice || 0,
      currency: p.currency || "BDT",
      status: "paid" as const,
      dueDate: p.createdAt,
      paidAt: p.updatedAt || p.createdAt,
      createdAt: p.createdAt,
      items: [
        {
          description: `${p.planName} - ${p.billingCycle === 1 ? "Monthly" : p.billingCycle === 6 ? "6 Months" : "Yearly"} Subscription`,
          quantity: 1,
          unitPrice: p.planPrice || 0,
          total: p.planPrice || 0,
        },
      ],
    }));

    // Transform manual invoices
    const manualInvoices = invoices.map((i) => ({
      id: i._id?.toString(),
      invoiceNumber: i.invoiceNumber,
      merchantId: i.merchantId,
      merchantName: i.merchantName,
      merchantEmail: i.merchantEmail,
      subscriptionId: i.subscriptionId,
      planId: i.planId,
      planName: i.planName,
      billingCycle: i.billingCycle,
      amount: i.amount,
      currency: i.currency || "BDT",
      status: i.status,
      dueDate: i.dueDate,
      paidAt: i.paidAt,
      createdAt: i.createdAt,
      items: i.items || [],
      notes: i.notes,
    }));

    // Combine and sort by creation date
    const allInvoices = [...manualInvoices, ...paymentInvoices].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json(allInvoices);
  } catch (error: any) {
    console.error("Failed to fetch invoices:", error);
    return NextResponse.json(
      { message: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}

// POST - Create a new invoice
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      merchantId,
      merchantName,
      merchantEmail,
      subscriptionId,
      planId,
      planName,
      billingCycle,
      amount,
      dueDate,
      items,
      notes,
    } = body;

    // Validate required fields
    if (!merchantId || !merchantName || !merchantEmail || !amount) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const collection = await getCollection("invoices");

    const invoice = {
      invoiceNumber: generateInvoiceNumber(),
      merchantId,
      merchantName,
      merchantEmail,
      subscriptionId,
      planId,
      planName,
      billingCycle,
      amount,
      currency: "BDT",
      status: "draft",
      dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      items: items || [
        {
          description: `${planName} - ${billingCycle} Subscription`,
          quantity: 1,
          unitPrice: amount,
          total: amount,
        },
      ],
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await collection.insertOne(invoice);

    // Log activity
    const activityCol = await getCollection("activity_logs");
    await activityCol.insertOne({
      action: "invoice_created",
      details: {
        invoiceNumber: invoice.invoiceNumber,
        merchantId,
        amount,
      },
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      id: result.insertedId.toString(),
      invoiceNumber: invoice.invoiceNumber,
    });
  } catch (error: any) {
    console.error("Failed to create invoice:", error);
    return NextResponse.json(
      { message: "Failed to create invoice" },
      { status: 500 }
    );
  }
}


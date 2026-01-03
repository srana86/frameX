import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// POST - Send invoice to merchant
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const collection = await getCollection("invoices");

    const invoice = await collection.findOne({ _id: new ObjectId(id) });

    if (!invoice) {
      return NextResponse.json(
        { message: "Invoice not found" },
        { status: 404 }
      );
    }

    if (invoice.status === "paid") {
      return NextResponse.json(
        { message: "Invoice is already paid" },
        { status: 400 }
      );
    }

    // Update invoice status to sent
    await collection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: "sent",
          sentAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      }
    );

    // TODO: Implement actual email sending
    // For now, we just log the activity
    console.log(`Sending invoice ${invoice.invoiceNumber} to ${invoice.merchantEmail}`);

    // Log activity
    const activityCol = await getCollection("activity_logs");
    await activityCol.insertOne({
      action: "invoice_sent",
      details: {
        invoiceId: id,
        invoiceNumber: invoice.invoiceNumber,
        merchantEmail: invoice.merchantEmail,
        amount: invoice.amount,
      },
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Invoice sent successfully",
    });
  } catch (error: any) {
    console.error("Failed to send invoice:", error);
    return NextResponse.json(
      { message: "Failed to send invoice" },
      { status: 500 }
    );
  }
}


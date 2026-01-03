import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// GET - Fetch single invoice
export async function GET(
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

    return NextResponse.json({
      id: invoice._id?.toString(),
      ...invoice,
      _id: undefined,
    });
  } catch (error: any) {
    console.error("Failed to fetch invoice:", error);
    return NextResponse.json(
      { message: "Failed to fetch invoice" },
      { status: 500 }
    );
  }
}

// PUT - Update invoice
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, paidAt, notes, dueDate } = body;

    const collection = await getCollection("invoices");

    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (status) updateData.status = status;
    if (paidAt) updateData.paidAt = paidAt;
    if (notes !== undefined) updateData.notes = notes;
    if (dueDate) updateData.dueDate = dueDate;

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { message: "Invoice not found" },
        { status: 404 }
      );
    }

    // Log activity
    const activityCol = await getCollection("activity_logs");
    await activityCol.insertOne({
      action: "invoice_updated",
      details: { invoiceId: id, updates: updateData },
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Invoice updated successfully",
    });
  } catch (error: any) {
    console.error("Failed to update invoice:", error);
    return NextResponse.json(
      { message: "Failed to update invoice" },
      { status: 500 }
    );
  }
}

// DELETE - Delete invoice (only drafts)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const collection = await getCollection("invoices");

    // Only allow deleting draft invoices
    const invoice = await collection.findOne({ _id: new ObjectId(id) });

    if (!invoice) {
      return NextResponse.json(
        { message: "Invoice not found" },
        { status: 404 }
      );
    }

    if (invoice.status !== "draft") {
      return NextResponse.json(
        { message: "Only draft invoices can be deleted" },
        { status: 400 }
      );
    }

    await collection.deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({
      success: true,
      message: "Invoice deleted successfully",
    });
  } catch (error: any) {
    console.error("Failed to delete invoice:", error);
    return NextResponse.json(
      { message: "Failed to delete invoice" },
      { status: 500 }
    );
  }
}


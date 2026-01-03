import { NextResponse } from "next/server";

// In-memory store for active viewers
// Format: { [productSlug]: Set<sessionId> }
const activeViewers = new Map<string, Set<string>>();

// Note: Viewers are automatically removed when they leave the page (via DELETE request)
// Heartbeat mechanism (every 20 seconds) keeps active viewers registered

// Track viewer activity
export async function POST(request: Request) {
  try {
    const { slug, sessionId } = await request.json();

    if (!slug) {
      return NextResponse.json({ error: "Product slug is required" }, { status: 400 });
    }

    // Generate session ID if not provided
    const viewerId = sessionId || `viewer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Initialize set for this product if it doesn't exist
    if (!activeViewers.has(slug)) {
      activeViewers.set(slug, new Set());
    }

    // Add viewer to the set
    activeViewers.get(slug)!.add(viewerId);

    // Get current count
    const count = activeViewers.get(slug)!.size;

    return NextResponse.json({
      count,
      sessionId: viewerId,
    });
  } catch (error: any) {
    console.error("POST /api/product-viewers error:", error);
    return NextResponse.json({ error: error?.message || "Failed to track viewer" }, { status: 500 });
  }
}

// Get viewer count for a product
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json({ error: "Product slug is required" }, { status: 400 });
    }

    const count = activeViewers.get(slug)?.size || 0;

    return NextResponse.json({ count });
  } catch (error: any) {
    console.error("GET /api/product-viewers error:", error);
    return NextResponse.json({ error: error?.message || "Failed to get viewer count" }, { status: 500 });
  }
}

// Remove viewer (called when user leaves page)
export async function DELETE(request: Request) {
  try {
    const { slug, sessionId } = await request.json();

    if (!slug || !sessionId) {
      return NextResponse.json({ error: "Product slug and session ID are required" }, { status: 400 });
    }

    const viewers = activeViewers.get(slug);
    if (viewers) {
      viewers.delete(sessionId);
      // Remove the entry if no viewers left
      if (viewers.size === 0) {
        activeViewers.delete(slug);
      }
    }

    const count = activeViewers.get(slug)?.size || 0;

    return NextResponse.json({ count });
  } catch (error: any) {
    console.error("DELETE /api/product-viewers error:", error);
    return NextResponse.json({ error: error?.message || "Failed to remove viewer" }, { status: 500 });
  }
}


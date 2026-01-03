import { NextResponse } from "next/server";
import { getMerchantCollectionForAPI, buildMerchantQuery, getMerchantIdForAPI, isUsingSharedDatabase } from "@/lib/api-helpers";
import { ObjectId } from "mongodb";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    const reviewsCol = await getMerchantCollectionForAPI("reviews");
    const productsCol = await getMerchantCollectionForAPI("products");
    const baseQuery = await buildMerchantQuery();

    // Find product by id or slug to get the slug
    const productQuery = ObjectId.isValid(id) ? { ...baseQuery, _id: new ObjectId(id) } : { ...baseQuery, slug: id };
    const product = (await productsCol.findOne(productQuery)) as any;

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const productSlug = product.slug;
    const reviewQuery = { ...baseQuery, productSlug };
    const reviews = (await reviewsCol.find(reviewQuery).sort({ createdAt: -1 }).toArray()) as any[];

    const formattedReviews = reviews.map((r) => ({
      id: String(r._id),
      name: r.name,
      initials:
        r.initials ||
        r.name
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2),
      rating: Number(r.rating ?? 5),
      date:
        r.date ||
        (r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Just now"),
      verified: Boolean(r.verified ?? false),
      review: r.review || r.text || "",
      avatarColor: r.avatarColor || "from-primary/20 to-accent/20",
      images: Array.isArray(r.images) ? r.images : [],
      createdAt: r.createdAt,
    }));

    return NextResponse.json(formattedReviews);
  } catch (e: any) {
    console.error("GET /api/products/[id]/reviews error:", e);
    return NextResponse.json({ error: e?.message || "Failed to fetch reviews" }, { status: 400 });
  }
}

export async function POST(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    const body = await request.json();
    const { rating, review, name, images } = body;

    if (!rating || !review || !name) {
      return NextResponse.json({ error: "Rating, review, and name are required" }, { status: 400 });
    }

    const reviewsCol = await getMerchantCollectionForAPI("reviews");
    const productsCol = await getMerchantCollectionForAPI("products");
    const baseQuery = await buildMerchantQuery();
    const merchantId = await getMerchantIdForAPI();

    // Find product by id or slug to get the slug
    const productQuery = ObjectId.isValid(id) ? { ...baseQuery, _id: new ObjectId(id) } : { ...baseQuery, slug: id };
    const product = (await productsCol.findOne(productQuery)) as any;

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const productSlug = product.slug;

    // Generate initials from name
    const initials = name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    // Generate avatar color based on name hash
    const colors = [
      "from-primary/20 to-accent/20",
      "from-blue-500/20 to-purple-500/20",
      "from-green-500/20 to-teal-500/20",
      "from-orange-500/20 to-red-500/20",
      "from-pink-500/20 to-rose-500/20",
      "from-indigo-500/20 to-blue-500/20",
      "from-cyan-500/20 to-blue-500/20",
      "from-emerald-500/20 to-green-500/20",
      "from-violet-500/20 to-purple-500/20",
      "from-amber-500/20 to-orange-500/20",
      "from-fuchsia-500/20 to-pink-500/20",
      "from-slate-500/20 to-gray-500/20",
    ];
    const colorIndex = name.charCodeAt(0) % colors.length;
    const avatarColor = colors[colorIndex];

    const reviewDoc: any = {
      productSlug,
      rating: Number(rating),
      review: String(review),
      name: String(name),
      initials,
      avatarColor,
      images: Array.isArray(images) ? images : [],
      verified: false, // In a real app, verify if user purchased the product
      date: "Just now",
      createdAt: new Date().toISOString(),
    };

    // Add merchantId if using shared database
    if (merchantId) {
      const useShared = await isUsingSharedDatabase();
      if (useShared) {
        reviewDoc.merchantId = merchantId;
      }
    }

    const result = await reviewsCol.insertOne(reviewDoc);
    const reviewId = String(result.insertedId);

    return NextResponse.json({ ...reviewDoc, id: reviewId }, { status: 201 });
  } catch (e: any) {
    console.error("POST /api/products/[id]/reviews error:", e);
    return NextResponse.json({ error: e?.message || "Failed to create review" }, { status: 400 });
  }
}

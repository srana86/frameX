import { NextResponse } from "next/server";
import { getMerchantCollectionForAPI, buildMerchantQuery, getMerchantIdForAPI, isUsingSharedDatabase } from "@/lib/api-helpers";
import { ObjectId } from "mongodb";
import { CACHE_TAGS, CACHE_HEADERS, revalidateCache } from "@/lib/cache-helpers";

export const revalidate = 60; // Cache for 1 minute
export const dynamic = "force-dynamic";

export interface HeroSlide {
  id?: string;
  image: string;
  mobileImage?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
  textPosition?: "left" | "center" | "right";
  textColor?: string;
  overlay?: boolean;
  overlayOpacity?: number;
  order: number;
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export async function GET() {
  try {
    const col = await getMerchantCollectionForAPI("hero_slides");
    const query = await buildMerchantQuery({ enabled: true });
    const slides = await col.find(query).sort({ order: 1, _id: 1 }).toArray();

    const result = slides.map((slide: any) => ({
      id: String(slide._id),
      image: slide.image,
      mobileImage: slide.mobileImage || undefined,
      title: slide.title,
      subtitle: slide.subtitle || "",
      description: slide.description || "",
      buttonText: slide.buttonText || "",
      buttonLink: slide.buttonLink || "",
      textPosition: slide.textPosition || "center",
      textColor: slide.textColor || "#ffffff",
      overlay: slide.overlay !== undefined ? slide.overlay : true,
      overlayOpacity: slide.overlayOpacity !== undefined ? slide.overlayOpacity : 0.4,
      order: slide.order || 0,
      enabled: slide.enabled !== undefined ? slide.enabled : true,
    }));

    return NextResponse.json(result, {
      headers: {
        ...CACHE_HEADERS.SEMI_STATIC,
        "X-Cache-Tags": CACHE_TAGS.HERO_SLIDES,
      },
    });
  } catch (error: any) {
    console.error("GET /api/hero-slides error:", error);
    return NextResponse.json([], {
      status: 200,
      headers: {
        ...CACHE_HEADERS.SEMI_STATIC,
        "X-Cache-Tags": CACHE_TAGS.HERO_SLIDES,
      },
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const col = await getMerchantCollectionForAPI("hero_slides");
    const merchantId = await getMerchantIdForAPI();

    if (!body.image) {
      return NextResponse.json({ error: "Missing required field: image" }, { status: 400 });
    }

    // Only image is required, all other fields are optional
    const slide: any = {
      image: body.image,
      mobileImage: body.mobileImage || null,
      title: body.title || null,
      subtitle: body.subtitle || null,
      description: body.description || null,
      buttonText: body.buttonText || null,
      buttonLink: body.buttonLink || null,
      textPosition: body.textPosition || "center",
      textColor: body.textColor || "#ffffff",
      overlay: body.overlay !== undefined ? body.overlay : true,
      overlayOpacity: body.overlayOpacity !== undefined ? body.overlayOpacity : 0.4,
      order: body.order !== undefined ? body.order : 0,
      enabled: body.enabled !== undefined ? body.enabled : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add merchantId if using shared database
    if (merchantId) {
      const useShared = await isUsingSharedDatabase();
      if (useShared) {
        slide.merchantId = merchantId;
      }
    }

    const result = await col.insertOne(slide);
    const inserted = await col.findOne({ _id: result.insertedId });

    // Revalidate cache after creating hero slide
    await revalidateCache([CACHE_TAGS.HERO_SLIDES]);

    return NextResponse.json({ id: String(inserted?._id), ...slide }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/hero-slides error:", error);
    return NextResponse.json({ error: error?.message || "Failed to create hero slide" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const col = await getMerchantCollectionForAPI("hero_slides");
    const baseQuery = await buildMerchantQuery();

    if (!body.id) {
      return NextResponse.json({ error: "Missing required field: id" }, { status: 400 });
    }

    // Image is required if provided, but all other fields are optional
    if (body.image !== undefined) {
      if (!body.image || body.image.trim() === "") {
        return NextResponse.json({ error: "Image cannot be empty" }, { status: 400 });
      }
    }

    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    // Only update image if provided (and it's required if provided)
    if (body.image !== undefined) updateData.image = body.image;
    if (body.mobileImage !== undefined) updateData.mobileImage = body.mobileImage || null;

    // All other fields are optional - allow empty strings to clear the field
    if (body.title !== undefined) updateData.title = body.title || null;
    if (body.subtitle !== undefined) updateData.subtitle = body.subtitle || null;
    if (body.description !== undefined) updateData.description = body.description || null;
    if (body.buttonText !== undefined) updateData.buttonText = body.buttonText || null;
    if (body.buttonLink !== undefined) updateData.buttonLink = body.buttonLink || null;
    if (body.textPosition !== undefined) updateData.textPosition = body.textPosition || "center";
    if (body.textColor !== undefined) updateData.textColor = body.textColor || "#ffffff";
    if (body.overlay !== undefined) updateData.overlay = body.overlay;
    if (body.overlayOpacity !== undefined) updateData.overlayOpacity = body.overlayOpacity;
    if (body.order !== undefined) updateData.order = body.order;
    if (body.enabled !== undefined) updateData.enabled = body.enabled;

    const id = ObjectId.isValid(body.id) ? new ObjectId(body.id) : null;
    if (!id) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const query = { ...baseQuery, _id: id };
    await col.updateOne(query, { $set: updateData });
    const updated = await col.findOne(query);

    if (!updated) {
      return NextResponse.json({ error: "Slide not found" }, { status: 404 });
    }

    const result = {
      id: String(updated._id),
      image: updated.image,
      mobileImage: updated.mobileImage || undefined,
      title: updated.title,
      subtitle: updated.subtitle || "",
      description: updated.description || "",
      buttonText: updated.buttonText || "",
      buttonLink: updated.buttonLink || "",
      textPosition: updated.textPosition || "center",
      textColor: updated.textColor || "#ffffff",
      overlay: updated.overlay !== undefined ? updated.overlay : true,
      overlayOpacity: updated.overlayOpacity !== undefined ? updated.overlayOpacity : 0.4,
      order: updated.order || 0,
      enabled: updated.enabled !== undefined ? updated.enabled : true,
    };

    // Revalidate cache after updating hero slide
    await revalidateCache([CACHE_TAGS.HERO_SLIDES]);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("PUT /api/hero-slides error:", error);
    return NextResponse.json({ error: error?.message || "Failed to update hero slide" }, { status: 500 });
  }
}

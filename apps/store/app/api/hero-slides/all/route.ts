import { NextResponse } from "next/server";
import { getMerchantCollectionForAPI, buildMerchantQuery } from "@/lib/api-helpers";

export async function GET() {
  try {
    const col = await getMerchantCollectionForAPI("hero_slides");
    const query = await buildMerchantQuery();
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
      createdAt: slide.createdAt,
      updatedAt: slide.updatedAt,
    }));

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("GET /api/hero-slides/all error:", error);
    return NextResponse.json([], { status: 200 });
  }
}


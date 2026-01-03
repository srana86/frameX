import { NextResponse } from "next/server";
import { getUserLocation, getClientIP } from "@/lib/geolocation";

export async function GET(request: Request) {
  try {
    const headers = request.headers;
    const ip = getClientIP(headers);

    const location = await getUserLocation(ip || undefined);

    if (!location) {
      return NextResponse.json({ error: "Failed to detect location" }, { status: 500 });
    }

    return NextResponse.json(location);
  } catch (error: any) {
    console.error("Geolocation API error:", error);
    return NextResponse.json({ error: error?.message || "Failed to get location" }, { status: 500 });
  }
}

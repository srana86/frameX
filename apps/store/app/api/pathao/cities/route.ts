import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { getCourierServicesConfig } from "@/lib/delivery-config";

const PATHAO_BASE_URL = "https://api-hermes.pathao.com";

async function getPathaoAccessToken(creds: Record<string, any>): Promise<string> {
  const clientId = (creds.clientId as string | undefined)?.trim();
  const clientSecret = (creds.clientSecret as string | undefined)?.trim();
  const username = (creds.username as string | undefined)?.trim();
  const password = (creds.password as string | undefined)?.trim();

  if (!clientId || !clientSecret || !username || !password) {
    throw new Error("Pathao credentials are not fully configured");
  }

  const tokenRes = await fetch(`${PATHAO_BASE_URL}/aladdin/api/v1/issue-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "password",
      username,
      password,
    }),
  });

  if (!tokenRes.ok) {
    const errorText = await tokenRes.text().catch(() => "");
    throw new Error(`Failed to issue Pathao access token: ${errorText || tokenRes.statusText}`);
  }

  const tokenData = await tokenRes.json();
  const accessToken = tokenData?.access_token;

  if (!accessToken) {
    throw new Error("Pathao access token missing in response");
  }

  return accessToken;
}

export async function GET() {
  try {
    await requireAuth("merchant");

    // Get courier services config
    const config = await getCourierServicesConfig();
    const pathaoService = config.services?.find((s) => s.id === "pathao" && s.enabled);

    if (!pathaoService || !pathaoService.credentials) {
      return NextResponse.json({ error: "Pathao service is not configured or enabled" }, { status: 400 });
    }

    // Get access token
    const accessToken = await getPathaoAccessToken(pathaoService.credentials);

    // Fetch cities from Pathao API
    const res = await fetch(`${PATHAO_BASE_URL}/aladdin/api/v1/city-list`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      throw new Error(`Failed to fetch Pathao cities: ${errorText || res.statusText}`);
    }

    const data = await res.json();

    // Extract cities from response: data.data.data
    const cities = data?.data?.data || [];

    return NextResponse.json({ cities });
  } catch (error: any) {
    console.error("GET /api/pathao/cities error:", error);
    if (error.message === "NEXT_REDIRECT") {
      throw error;
    }
    return NextResponse.json({ error: error?.message || "Failed to fetch Pathao cities" }, { status: 500 });
  }
}

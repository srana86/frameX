import { NextRequest, NextResponse } from "next/server";

// POST - Test SSLCommerz connection
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { storeId, storePassword, isLive } = body;

    if (!storeId || !storePassword) {
      return NextResponse.json(
        { success: false, message: "Store ID and Store Password are required" },
        { status: 400 }
      );
    }

    // Use SSLCommerz transaction query API to test credentials
    const baseURL = `https://${isLive ? "securepay" : "sandbox"}.sslcommerz.com`;
    const testURL = `${baseURL}/validator/api/merchantTransIDvalidationAPI.php`;

    const formData = new FormData();
    formData.append("store_id", storeId);
    formData.append("store_passwd", storePassword);
    formData.append("tran_id", "TEST_CONNECTION_" + Date.now());

    const response = await fetch(testURL, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    // SSLCommerz returns specific status for invalid credentials
    // Even if transaction not found, valid credentials will return a specific response format
    if (data.APIConnect === "DONE") {
      // Credentials are valid (even if no transaction found)
      return NextResponse.json({
        success: true,
        message: "Connection successful! Your credentials are valid.",
        details: {
          apiConnect: data.APIConnect,
          noOfTransaction: data.no_of_trans_found || 0,
        },
      });
    } else if (
      data.status === "INVALID_STORE" ||
      data.status === "INVALID_CREDENTIAL" ||
      data.APIConnect === "FAILED"
    ) {
      return NextResponse.json({
        success: false,
        message: "Invalid credentials. Please check your Store ID and Password.",
      });
    } else {
      // Unknown response, but connection worked
      return NextResponse.json({
        success: true,
        message: "Connection established. Please verify credentials are correct.",
        details: data,
      });
    }
  } catch (error: any) {
    console.error("SSLCommerz connection test error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to connect to SSLCommerz",
      },
      { status: 500 }
    );
  }
}


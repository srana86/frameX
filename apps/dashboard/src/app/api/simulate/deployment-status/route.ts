import { NextResponse } from "next/server";
import { getDeploymentStatus } from "@/lib/vercel-service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const deploymentId = searchParams.get("deploymentId");

    if (!deploymentId) {
      return NextResponse.json({ error: "Deployment ID is required" }, { status: 400 });
    }

    const status = await getDeploymentStatus(deploymentId);

    return NextResponse.json({
      success: true,
      status: status.state,
      url: status.url,
      deploymentId: status.id,
    });
  } catch (error: any) {
    console.error("Error getting deployment status:", error);
    return NextResponse.json({ error: error.message || "Failed to get deployment status" }, { status: 500 });
  }
}

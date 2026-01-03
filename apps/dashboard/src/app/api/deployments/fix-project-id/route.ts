import { NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb";

/**
 * Fix missing projectId in deployment records
 * POST /api/deployments/fix-project-id
 *
 * This adds projectId to deployments that are missing it by deriving
 * the Vercel project name from the merchantId
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { merchantId } = body;

    const deploymentsCol = await getCollection("merchant_deployments");

    // If merchantId provided, fix just that one
    if (merchantId) {
      const deployment = await deploymentsCol.findOne({ merchantId });

      if (!deployment) {
        return NextResponse.json({ error: "Deployment not found" }, { status: 404 });
      }

      if (deployment.projectId) {
        return NextResponse.json({
          message: "Deployment already has projectId",
          projectId: deployment.projectId,
        });
      }

      // Derive project name from merchantId (same pattern as createVercelProject)
      const projectName = `merchant-${merchantId}`.toLowerCase().replace(/[^a-z0-9-]/g, "-");

      await deploymentsCol.updateOne(
        { merchantId },
        {
          $set: {
            projectId: projectName,
            updatedAt: new Date().toISOString(),
          },
        }
      );

      return NextResponse.json({
        success: true,
        merchantId,
        projectId: projectName,
        message: "Successfully added projectId to deployment",
      });
    }

    // If no merchantId, fix all deployments missing projectId
    const deploymentsWithoutProjectId = await deploymentsCol
      .find({
        projectId: { $exists: false },
        deploymentProvider: "vercel",
      })
      .toArray();

    if (deploymentsWithoutProjectId.length === 0) {
      return NextResponse.json({
        message: "No deployments need fixing",
        fixed: 0,
      });
    }

    const fixed: string[] = [];
    for (const deployment of deploymentsWithoutProjectId) {
      const projectName = `merchant-${deployment.merchantId}`.toLowerCase().replace(/[^a-z0-9-]/g, "-");

      await deploymentsCol.updateOne(
        { _id: deployment._id },
        {
          $set: {
            projectId: projectName,
            updatedAt: new Date().toISOString(),
          },
        }
      );

      fixed.push(deployment.merchantId);
    }

    return NextResponse.json({
      success: true,
      message: `Fixed ${fixed.length} deployment(s)`,
      fixed,
    });
  } catch (error: any) {
    console.error("Error fixing projectId:", error);
    return NextResponse.json({ error: error?.message || "Failed to fix projectId" }, { status: 500 });
  }
}

/**
 * GET - Check which deployments are missing projectId
 */
export async function GET() {
  try {
    const deploymentsCol = await getCollection("merchant_deployments");

    const missing = await deploymentsCol
      .find({
        projectId: { $exists: false },
        deploymentProvider: "vercel",
      })
      .toArray();

    const deployments = missing.map((d) => ({
      merchantId: d.merchantId,
      deploymentId: d.deploymentId,
      expectedProjectId: `merchant-${d.merchantId}`.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
    }));

    return NextResponse.json({
      count: deployments.length,
      deployments,
    });
  } catch (error: any) {
    console.error("Error checking projectId:", error);
    return NextResponse.json({ error: error?.message || "Failed to check" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb";
import { configureVercelDomain, removeVercelDomain } from "@/lib/vercel-service";

// Import Vercel SDK for domain verification (using project domains API)
import { Vercel } from "@vercel/sdk";
const VERCEL_TOKEN = process.env.VERCEL_TOKEN || "";
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID || "";
const vercel = new Vercel({ bearerToken: VERCEL_TOKEN });

// CORS headers for cross-origin requests from merchant apps
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Merchant-ID, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * GET /api/merchants/[id]/domain
 * Get domain configuration for a merchant with real-time Vercel status
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: merchantId } = await params;
    console.log(`[Domain API] GET domain config for merchant: ${merchantId}`);

    // Get deployment to find projectId
    const deploymentsCol = await getCollection("merchant_deployments");
    const deployment = await deploymentsCol.findOne({
      $or: [{ merchantId }, { id: merchantId }],
    });

    if (!deployment) {
      return NextResponse.json({ error: "Merchant deployment not found" }, { status: 404, headers: corsHeaders });
    }

    const projectId = (deployment as any).projectId;
    if (!projectId) {
      return NextResponse.json({ error: "Deployment missing project ID" }, { status: 400, headers: corsHeaders });
    }

    // Get domain config from database
    const domainsCol = await getCollection("merchant_domains");
    const domainConfig = await domainsCol.findOne({ merchantId });

    // Get current domains from Vercel with real-time status
    let vercelDomains: any[] = [];
    let vercelStatus: any = null;

    try {
      const domains = await vercel.projects.getProjectDomains({
        idOrName: projectId,
        teamId: VERCEL_TEAM_ID || undefined,
      });

      const domainsArray = Array.isArray(domains) ? domains : (domains as any).domains || [];

      vercelDomains = domainsArray.map((d: any) => ({
        name: d.name,
        verified: d.verified || false,
        verification: d.verification || [],
      }));

      // If we have a configured domain, get its real-time status from project domains
      if (domainConfig) {
        const configuredDomain = (domainConfig as any).domain;
        const domainInfo = domainsArray.find((d: any) => d.name === configuredDomain);

        if (domainInfo) {
          // Use project domain info directly (more reliable than getDomainConfig)
          // domainInfo.verified = true means DNS is configured correctly
          vercelStatus = {
            verified: domainInfo.verified || false,
            configuredCorrectly: domainInfo.verified || false, // If verified, it's configured correctly
            verification: domainInfo.verification || [],
          };

          // Update database if status changed
          if (domainInfo.verified !== (domainConfig as any).verified) {
            await domainsCol.updateOne(
              { merchantId },
              {
                $set: {
                  verified: domainInfo.verified,
                  updatedAt: new Date().toISOString(),
                },
              }
            );
            console.log(`[Domain API] Updated domain verification status: ${domainInfo.verified}`);
          }
        } else {
          // Domain not found in Vercel project
          vercelStatus = {
            verified: false,
            configuredCorrectly: false,
            verification: [],
          };
        }
      }
    } catch (e) {
      console.warn(`[Domain API] Could not fetch Vercel domains:`, e);
      // Fall back to database status
      if (domainConfig) {
        vercelStatus = {
          verified: (domainConfig as any).verified || false,
          configuredCorrectly: (domainConfig as any).verified || false,
          verification: [],
        };
      }
    }

    // Clean up MongoDB _id and merge with Vercel status
    let cleanConfig = null;
    if (domainConfig) {
      const { _id, ...rest } = domainConfig as any;
      cleanConfig = {
        ...rest,
        // Override with real-time Vercel status
        verified: vercelStatus?.verified ?? rest.verified,
        configuredCorrectly: vercelStatus?.configuredCorrectly ?? true,
      };
    }

    return NextResponse.json(
      {
        domain: cleanConfig,
        vercelDomains,
        vercelStatus,
        projectId,
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("[Domain API] GET error:", error);
    return NextResponse.json({ error: error?.message || "Failed to get domain configuration" }, { status: 500, headers: corsHeaders });
  }
}

/**
 * POST /api/merchants/[id]/domain
 * Configure custom domain for a merchant
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: merchantId } = await params;
    const body = await request.json();
    const { domain, redirect, redirectStatusCode } = body;

    console.log(`[Domain API] POST configure domain for merchant: ${merchantId}`);
    console.log(`[Domain API] Domain: ${domain}, Redirect: ${redirect}`);

    if (!domain) {
      return NextResponse.json({ error: "Domain is required" }, { status: 400, headers: corsHeaders });
    }

    // Validate domain format
    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
    if (!domainRegex.test(domain)) {
      return NextResponse.json({ error: "Invalid domain format" }, { status: 400, headers: corsHeaders });
    }

    // Get deployment to find projectId
    const deploymentsCol = await getCollection("merchant_deployments");
    const deployment = await deploymentsCol.findOne({
      $or: [{ merchantId }, { id: merchantId }],
    });

    if (!deployment) {
      return NextResponse.json({ error: "Merchant deployment not found" }, { status: 404, headers: corsHeaders });
    }

    const projectId = (deployment as any).projectId;
    if (!projectId) {
      return NextResponse.json({ error: "Deployment missing project ID" }, { status: 400, headers: corsHeaders });
    }

    // Check if domain already configured for this merchant
    const domainsCol = await getCollection("merchant_domains");
    const existing = await domainsCol.findOne({ merchantId });
    if (existing && (existing as any).domain === domain) {
      return NextResponse.json({ error: "Domain already configured" }, { status: 409, headers: corsHeaders });
    }

    // Configure domain in Vercel
    const vercelDomain = await configureVercelDomain(projectId, domain, redirect, redirectStatusCode || 301);

    // Save domain configuration to database
    const now = new Date().toISOString();
    const domainConfig = {
      id: `domain_${Date.now()}`,
      merchantId,
      domain,
      projectId,
      redirect: redirect || null,
      redirectStatusCode: redirect ? redirectStatusCode || 301 : null,
      verified: vercelDomain.verified,
      dnsRecords: vercelDomain.dnsRecords || [],
      createdAt: existing ? (existing as any).createdAt : now,
      updatedAt: now,
    };

    // Upsert domain config
    await domainsCol.updateOne({ merchantId }, { $set: domainConfig }, { upsert: true });

    // Also update deployment with custom domain
    await deploymentsCol.updateOne(
      { $or: [{ merchantId }, { id: merchantId }] },
      {
        $set: {
          customDomain: domain,
          updatedAt: now,
        },
      }
    );

    console.log(`[Domain API] Domain ${domain} configured successfully for merchant ${merchantId}`);

    return NextResponse.json(
      {
        success: true,
        domain: domainConfig,
        dnsInstructions: {
          records: domainConfig.dnsRecords,
          message: redirect
            ? "Please add these DNS records to your domain provider. This domain will redirect to the specified URL."
            : "Please add these DNS records to your domain provider. SSL certificate will be issued automatically once DNS is configured.",
        },
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("[Domain API] POST error:", error);
    return NextResponse.json({ error: error?.message || "Failed to configure domain" }, { status: 500, headers: corsHeaders });
  }
}

/**
 * DELETE /api/merchants/[id]/domain
 * Remove custom domain from a merchant
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: merchantId } = await params;
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get("domain");

    console.log(`[Domain API] DELETE domain for merchant: ${merchantId}`);
    console.log(`[Domain API] Domain to remove: ${domain}`);

    if (!domain) {
      return NextResponse.json({ error: "Domain is required" }, { status: 400, headers: corsHeaders });
    }

    // Get deployment to find projectId
    const deploymentsCol = await getCollection("merchant_deployments");
    const deployment = await deploymentsCol.findOne({
      $or: [{ merchantId }, { id: merchantId }],
    });

    if (!deployment) {
      return NextResponse.json({ error: "Merchant deployment not found" }, { status: 404, headers: corsHeaders });
    }

    const projectId = (deployment as any).projectId;
    if (!projectId) {
      return NextResponse.json({ error: "Deployment missing project ID" }, { status: 400, headers: corsHeaders });
    }

    // Verify domain belongs to this merchant
    const domainsCol = await getCollection("merchant_domains");
    const domainConfig = await domainsCol.findOne({ merchantId });

    if (!domainConfig || (domainConfig as any).domain !== domain) {
      return NextResponse.json({ error: "Domain not found or access denied" }, { status: 404, headers: corsHeaders });
    }

    // Remove domain from Vercel
    const removed = await removeVercelDomain(projectId, domain);

    if (!removed) {
      console.warn(`[Domain API] Vercel domain removal may have failed, but continuing with DB cleanup`);
    }

    // Remove domain config from database
    await domainsCol.deleteOne({ merchantId });

    // Update deployment to remove custom domain
    await deploymentsCol.updateOne(
      { $or: [{ merchantId }, { id: merchantId }] },
      {
        $set: {
          customDomain: null,
          updatedAt: new Date().toISOString(),
        },
      }
    );

    console.log(`[Domain API] Domain ${domain} removed successfully for merchant ${merchantId}`);

    return NextResponse.json({ success: true, message: "Domain removed successfully" }, { headers: corsHeaders });
  } catch (error: any) {
    console.error("[Domain API] DELETE error:", error);
    return NextResponse.json({ error: error?.message || "Failed to remove domain" }, { status: 500, headers: corsHeaders });
  }
}

/**
 * PATCH /api/merchants/[id]/domain
 * Verify domain DNS configuration
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: merchantId } = await params;
    const body = await request.json();
    const { domain } = body;

    console.log(`[Domain API] PATCH verify domain for merchant: ${merchantId}`);
    console.log(`[Domain API] Domain to verify: ${domain}`);

    if (!domain) {
      return NextResponse.json({ error: "Domain is required" }, { status: 400, headers: corsHeaders });
    }

    // Get deployment to find projectId
    const deploymentsCol = await getCollection("merchant_deployments");
    const deployment = await deploymentsCol.findOne({
      $or: [{ merchantId }, { id: merchantId }],
    });

    if (!deployment) {
      return NextResponse.json({ error: "Merchant deployment not found" }, { status: 404, headers: corsHeaders });
    }

    const projectId = (deployment as any).projectId;
    if (!projectId) {
      return NextResponse.json({ error: "Deployment missing project ID" }, { status: 400, headers: corsHeaders });
    }

    // Get domain config from database
    const domainsCol = await getCollection("merchant_domains");
    const domainConfig = await domainsCol.findOne({ merchantId });

    if (!domainConfig || (domainConfig as any).domain !== domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404, headers: corsHeaders });
    }

    // Check domain status from Vercel using project domains (more reliable)
    let verified = false;
    let misconfigured = false;

    try {
      // Get domain info from project domains
      const domains = await vercel.projects.getProjectDomains({
        idOrName: projectId,
        teamId: VERCEL_TEAM_ID || undefined,
      });

      const domainsArray = Array.isArray(domains) ? domains : (domains as any).domains || [];
      const domainInfo = domainsArray.find((d: any) => d.name === domain);

      if (domainInfo) {
        verified = domainInfo.verified === true;
        // If not verified, it means DNS is not configured correctly
        misconfigured = !verified;

        console.log(`[Domain API] Domain ${domain} status - verified: ${verified}, misconfigured: ${misconfigured}`);
      } else {
        console.log(`[Domain API] Domain ${domain} not found in project domains`);
        misconfigured = true;
      }
    } catch (vercelError: any) {
      console.error(`[Domain API] Vercel domain check error:`, vercelError);
      // Don't fail completely - use database status
    }

    // Update domain config in database
    const now = new Date().toISOString();
    await domainsCol.updateOne(
      { merchantId },
      {
        $set: {
          verified,
          misconfigured,
          verifiedAt: verified ? now : null,
          updatedAt: now,
        },
      }
    );

    if (verified) {
      console.log(`[Domain API] Domain ${domain} verified successfully for merchant ${merchantId}`);
      return NextResponse.json(
        {
          success: true,
          verified: true,
          message: "Domain verified successfully! SSL certificate will be issued automatically.",
        },
        { headers: corsHeaders }
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          misconfigured,
          message: misconfigured
            ? "Domain DNS is misconfigured. Please check your DNS records."
            : "Domain not yet verified. DNS propagation can take up to 48 hours.",
        },
        { status: 400, headers: corsHeaders }
      );
    }
  } catch (error: any) {
    console.error("[Domain API] PATCH error:", error);
    return NextResponse.json({ error: error?.message || "Failed to verify domain" }, { status: 500, headers: corsHeaders });
  }
}

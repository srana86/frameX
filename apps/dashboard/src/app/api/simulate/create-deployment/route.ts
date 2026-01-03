import { NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb";
import {
  createVercelProject,
  deployToVercel,
  getDeploymentStatus,
  addVercelSubdomain,
  generateSubdomain,
  getDomainDNSInstructions,
} from "@/lib/vercel-service";
import { getMerchantConnectionString } from "@/lib/database-service";
import type { MerchantDeployment } from "@/lib/merchant-types";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      merchantId,
      merchantName,
      merchantEmail,
      databaseName,
      customSubdomain,
    } = body;

    // Check if Vercel deployment should be skipped
    const skipVercelDeployment =
      process.env.SKIP_VERCEL_DEPLOYMENT === "true" ||
      process.env.DISABLE_VERCEL_DEPLOYMENT === "true";

    if (skipVercelDeployment) {
      console.log(
        `⏭️ [Simulate] SKIP_VERCEL_DEPLOYMENT is enabled - skipping Vercel deployment`
      );
    }

    // Auto-generate subdomain if not provided
    const subdomainToUse = customSubdomain || generateSubdomain(merchantId);

    if (!merchantId || !merchantName || !databaseName) {
      return NextResponse.json(
        { error: "Merchant ID, name, and database name are required" },
        { status: 400 }
      );
    }

    // Get merchant email from merchant record if not provided
    let actualMerchantEmail = merchantEmail;
    if (!actualMerchantEmail) {
      const merchantsCol = await getCollection("merchants");
      const merchant = await merchantsCol.findOne({ id: merchantId });
      if (merchant) {
        actualMerchantEmail = (merchant as any).email;
        console.log(
          `[Simulate] Retrieved merchant email from database: ${actualMerchantEmail}`
        );
      } else {
        console.warn(`[Simulate] Merchant not found, will generate email`);
      }
    }

    // Get connection string
    const connectionString = await getMerchantConnectionString(merchantId);
    if (!connectionString) {
      return NextResponse.json(
        { error: "Failed to get database connection string" },
        { status: 500 }
      );
    }

    let vercelProject: any = null;
    let deployment: any = null;
    let currentDeployment: any = null;
    let deploymentUrl = `http://localhost:3000`; // Default local URL when skipping
    let subdomain: string | undefined = undefined;
    let subdomainConfigured = false;
    let dnsInstructions: any[] = [];
    let domainResult: any = null;

    if (skipVercelDeployment) {
      // Skip Vercel deployment - create mock deployment data
      console.log(
        `⏭️ [Simulate] Creating mock deployment data (Vercel skipped)`
      );
      vercelProject = {
        id: `mock_project_${merchantId}`,
        name: `${merchantId}-mock`,
      };
      deployment = {
        id: `mock_deployment_${Date.now()}`,
        url: deploymentUrl,
        state: "READY",
      };
      currentDeployment = {
        id: deployment.id,
        url: deploymentUrl,
        state: "READY",
      };
      subdomain = subdomainToUse;
      console.log(`✅ [Simulate] Mock deployment created: ${deploymentUrl}`);
    } else {
      // Create Vercel project
      console.log(
        `[Simulate] Creating Vercel project for merchant: ${merchantId}`
      );
      vercelProject = await createVercelProject(merchantId, merchantName);

      // Deploy to Vercel (don't wait - return immediately for polling)
      console.log(`[Simulate] Creating deployment for merchant: ${merchantId}`);
      deployment = await deployToVercel(
        vercelProject.id,
        merchantId,
        databaseName,
        connectionString
      );

      // Get current deployment status (don't wait for completion)
      currentDeployment = await getDeploymentStatus(deployment.id);

      // Auto-generate and configure subdomain
      deploymentUrl =
        currentDeployment.url || `${vercelProject.name}.vercel.app`;

      // Try to add the auto-generated subdomain to Vercel
      try {
        console.log(`[Simulate] Adding subdomain: ${subdomainToUse}`);
        domainResult = await addVercelSubdomain(
          vercelProject.id,
          subdomainToUse
        );
        subdomain = subdomainToUse;
        // Use the configured subdomain as deployment URL
        deploymentUrl = `https://${subdomainToUse}`;
        subdomainConfigured = true;
        console.log(
          `[Simulate] Subdomain added: ${domainResult.name} (verified: ${domainResult.verified})`
        );
        console.log(
          `[Simulate] Using Vercel DNS: ${domainResult.usingVercelDNS}, DNS Auto-configured: ${domainResult.dnsAutoConfigured}`
        );

        // If using Vercel DNS, DNS is automatically configured - no manual DNS setup needed
        if (domainResult.usingVercelDNS && domainResult.dnsAutoConfigured) {
          console.log(
            `[Simulate] ✅ DNS automatically configured via Vercel DNS`
          );
          // Still provide DNS info for reference, but mark as auto-configured
          dnsInstructions = domainResult.dnsRecords || [];
        } else if (
          domainResult.dnsRecords &&
          domainResult.dnsRecords.length > 0
        ) {
          // Always get DNS instructions to ensure CNAME is properly configured
          // Use DNS records from domain result
          dnsInstructions = domainResult.dnsRecords.map((record: any) => ({
            type: record.type || "CNAME",
            name: record.name,
            value:
              record.value || domainResult.cnameValue || "cname.vercel-dns.com",
            ttl: 3600,
          }));
          console.log(
            `[Simulate] DNS instructions from domain result:`,
            dnsInstructions
          );
        } else {
          // Fetch DNS instructions from Vercel API if not in domain result
          console.log(
            `[Simulate] Fetching DNS instructions from Vercel API...`
          );
          try {
            dnsInstructions = await getDomainDNSInstructions(subdomainToUse);
            console.log(
              `[Simulate] DNS instructions retrieved from API:`,
              dnsInstructions
            );

            // If API didn't return records, use the CNAME value from domain result
            if (dnsInstructions.length === 0 && domainResult.cnameValue) {
              const subdomainParts = subdomainToUse.split(".");
              if (subdomainParts.length >= 2) {
                dnsInstructions = [
                  {
                    type: "CNAME",
                    name: subdomainParts[0],
                    value: domainResult.cnameValue,
                    ttl: 3600,
                  },
                ];
              }
            }
          } catch (dnsError: any) {
            console.warn(
              `[Simulate] Failed to get DNS instructions: ${dnsError.message}`
            );
            // Provide default DNS instructions based on subdomain
            const subdomainParts = subdomainToUse.split(".");
            if (subdomainParts.length >= 2) {
              dnsInstructions = [
                {
                  type: "CNAME",
                  name: subdomainParts[0],
                  value: domainResult.cnameValue || "cname.vercel-dns.com",
                  ttl: 3600,
                },
              ];
            }
          }
        }
      } catch (error: any) {
        console.warn(
          `[Simulate] Failed to add subdomain ${subdomainToUse}: ${error.message}`
        );
        console.log(`[Simulate] Falling back to Vercel default domain`);

        // Fall back to extracting from Vercel URL
        const urlMatch = deploymentUrl.match(
          /(?:https?:\/\/)?([^.]+)\.vercel\.app/
        );
        if (urlMatch && urlMatch[1]) {
          subdomain = urlMatch[1];
        } else {
          subdomain = vercelProject.name;
        }
      }
    }

    // Create deployment record
    const deploymentRecord: MerchantDeployment = {
      id: `deploy_${merchantId}_${Date.now()}`,
      merchantId,
      deploymentType: "subdomain",
      subdomain: subdomain,
      deploymentStatus: skipVercelDeployment
        ? "active"
        : currentDeployment.state === "READY"
        ? "active"
        : "pending",
      deploymentUrl: deploymentUrl,
      deploymentProvider: skipVercelDeployment ? "local" : "vercel",
      projectId: vercelProject.id, // Store Vercel project ID for domain configuration
      deploymentId: currentDeployment.id,
      environmentVariables: {
        MERCHANT_ID: merchantId,
        MERCHANT_DB_NAME: databaseName,
        MONGODB_DB: databaseName, // Same as MERCHANT_DB_NAME
        MONGODB_URI: connectionString.replace(/:[^:@]+@/, ":****@"), // Hide password in response
      },
      lastDeployedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const deploymentsCol = await getCollection<MerchantDeployment>(
      "merchant_deployments"
    );
    await deploymentsCol.insertOne(deploymentRecord as any);

    if (skipVercelDeployment) {
      console.log(
        `✅ [Simulate] Deployment record created (Vercel skipped): ${deploymentUrl}`
      );
    }

    // Create merchant user account in the merchant's database
    let merchantUser:
      | {
          id: string;
          email: string;
          password: string;
          role: string;
          merchantId: string;
        }
      | {
          error: string;
        }
      | null = null;
    const userEmail =
      actualMerchantEmail ||
      `merchant_${merchantId}@${merchantName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")}.com`;
    let merchantPassword = "";

    try {
      // Use the actual merchant email from the merchant record
      // Generate password
      merchantPassword = `Merchant${merchantId.slice(-6)}!${Math.random()
        .toString(36)
        .slice(-4)}`;

      console.log(
        `[Simulate] Creating merchant user with email: ${userEmail} (from merchant record)`
      );

      // Connect to merchant database
      const client = new MongoClient(connectionString);
      await client.connect();
      const db = client.db(databaseName);
      const usersCol = db.collection("users");

      // Check if user already exists
      const existingUser = await usersCol.findOne({
        email: userEmail.toLowerCase(),
      });

      if (!existingUser) {
        // Hash password
        const hashedPassword = await bcrypt.hash(merchantPassword, 10);

        // Create merchant user with the same email as the merchant record
        // Include merchantId to link user to deployment/subscription
        const newUser = {
          fullName: merchantName,
          email: userEmail.toLowerCase(),
          password: hashedPassword,
          role: "merchant" as const,
          merchantId: merchantId, // Link to merchant deployment
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const result = await usersCol.insertOne(newUser);
        merchantUser = {
          id: String(result.insertedId),
          email: userEmail,
          password: merchantPassword,
          role: "merchant",
          merchantId: merchantId,
        };

        console.log(
          `[Simulate] ✅ Created merchant user account with merchantId: ${merchantId}, email: ${userEmail}`
        );
      } else {
        // User already exists - update to add merchantId if missing
        if (!existingUser.merchantId) {
          await usersCol.updateOne(
            { _id: existingUser._id },
            {
              $set: {
                merchantId: merchantId,
                updatedAt: new Date().toISOString(),
              },
            }
          );
          console.log(
            `[Simulate] Updated existing user with merchantId: ${merchantId}`
          );
        }
        merchantUser = {
          id: String(existingUser._id),
          email: userEmail,
          password: "*** (User already exists, password not available)",
          role: existingUser.role || "merchant",
          merchantId: merchantId,
        };
        console.log(`[Simulate] Merchant user already exists: ${userEmail}`);
      }

      await client.close();
    } catch (error: any) {
      console.error("Error creating merchant user:", error);
      // Don't fail the deployment if user creation fails
      merchantUser = {
        error: error.message || "Failed to create merchant user",
      };
    }

    return NextResponse.json({
      success: true,
      deployment: {
        id: deploymentRecord.id,
        url: deploymentRecord.deploymentUrl,
        status:
          currentDeployment.state === "READY"
            ? "active"
            : currentDeployment.state.toLowerCase(),
        vercelUrl: currentDeployment.url,
        projectId: vercelProject.id,
        deploymentId: currentDeployment.id,
        subdomain: subdomain,
        subdomainConfigured: subdomainConfigured,
        dnsInstructions:
          dnsInstructions.length > 0 ? dnsInstructions : undefined,
        usingVercelDNS: domainResult?.usingVercelDNS || false,
        dnsAutoConfigured: domainResult?.dnsAutoConfigured || false,
      },
      project: {
        id: vercelProject.id,
        name: vercelProject.name,
      },
      merchantUser: merchantUser,
    });
  } catch (error: any) {
    console.error("Error creating deployment:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create deployment" },
      { status: 500 }
    );
  }
}

import { OAuthConfigClient } from "./OAuthConfigClient";
import { getOAuthConfig } from "@/lib/oauth-config";
import { requireAuth } from "@/lib/auth-helpers";

export const metadata = {
  title: "Tenant · OAuth Configuration",
  description: "Configure OAuth providers for authentication",
};

export default async function OAuthConfigPage() {
  await requireAuth("tenant");

  // Load OAuth config server-side
  const oauthConfig = await getOAuthConfig();

  return (
    <div className='space-y-6 pt-4'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>OAuth Configuration</h1>
        <p className='text-muted-foreground mt-2'>Configure OAuth providers for user authentication</p>
      </div>

      <OAuthConfigClient initialConfig={oauthConfig} />
    </div>
  );
}

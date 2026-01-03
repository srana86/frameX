import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";
import { getOAuthConfig } from "@/lib/oauth-config";

export const metadata: Metadata = {
  title: "Login - Sign in to your account",
  description: "Sign in to your account to continue shopping",
};

export default async function LoginPage() {
  const oauthConfig = await getOAuthConfig();
  const googleOAuthEnabled = oauthConfig.google.enabled && !!oauthConfig.google.clientId;

  return <LoginForm googleOAuthEnabled={googleOAuthEnabled} />;
}

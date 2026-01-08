import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { getOAuthConfig } from "@/lib/oauth-config";

export const metadata: Metadata = {
  title: "Register - Create your account",
  description: "Create your account and start your 3-day free trial",
};

export default async function RegisterPage() {
  const oauthConfig = await getOAuthConfig();
  const googleOAuthEnabled = oauthConfig.google.enabled && !!oauthConfig.google.clientId;

  return <RegisterForm googleOAuthEnabled={googleOAuthEnabled} />;
}

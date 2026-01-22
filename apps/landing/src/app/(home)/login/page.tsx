"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import AuthShell from "../_components/modules/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/auth-client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      const role = user.role?.toUpperCase();
      if (role === "OWNER") {
        router.push("/owner");
      } else {
        router.push("/admin");
      }
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await signIn.email({
        email,
        password,
        callbackURL: "/admin",
      });

      if (error) {
        throw new Error(error.message || "Login failed");
      }

      toast.success("Logged in successfully!");

      // Role-based redirection
      const role = (data?.user as any)?.role?.toUpperCase();
      if (role === "OWNER") {
        router.push("/owner");
      } else {
        router.push("/admin");
      }
    } catch (error: any) {
      toast.error(
        error.message || "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title='Welcome back to your tenant workspace'
      description='Manage all your stores from one place, with unified product, order, and payment visibility.'
      benefits={[
        "View performance across all stores in one dashboard.",
        "Switch between stores and manage inventory fast.",
        "Track orders, fulfillment, and customer updates.",
        "Manage billing and store subscriptions securely.",
      ]}
      formTitle='Tenant login'
      formDescription='Enter your tenant account details to continue.'
      autoScrollToFormOnMobile
      footer={
        <span>
          New to FrameX?{" "}
          <Link href='/register' className='font-semibold text-blue-600 hover:text-blue-700'>
            Create an account
          </Link>
          .
        </span>
      }
    >
      <form onSubmit={handleSubmit} className='space-y-5'>
        <div className='space-y-2'>
          <Label htmlFor='email' className='text-sm font-semibold text-slate-700'>
            Email
          </Label>
          <Input
            id='email'
            type='email'
            autoComplete='email'
            placeholder='tenant@yourstore.com'
            required
            className='h-11 rounded-xl border-slate-200 bg-white/90 text-base shadow-sm'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className='space-y-2'>
          <div className='flex items-center justify-between'>
            <Label htmlFor='password' className='text-sm font-semibold text-slate-700'>
              Password
            </Label>
            <Link href='/forgot-password' className='text-xs font-semibold text-blue-600 hover:text-blue-700'>
              Forgot password?
            </Link>
          </div>
          <Input
            id='password'
            type='password'
            autoComplete='current-password'
            placeholder='Enter your password'
            required
            className='h-11 rounded-xl border-slate-200 bg-white/90 text-base shadow-sm'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button
          type='submit'
          className='h-11 w-full rounded-full bg-[#0448FD] text-base font-semibold text-white hover:bg-[#0548FD]'
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </Button>
        <p className='text-xs text-slate-500'>
          By continuing, you agree to FrameX Tech terms and the tenant access policy.
        </p>
      </form>
    </AuthShell>
  );
}

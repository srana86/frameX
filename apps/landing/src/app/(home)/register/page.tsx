"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import AuthShell from "../_components/modules/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUp } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await signUp.email({
        email,
        password,
        name,
        callbackURL: "/admin",
      });

      if (error) {
        throw new Error(error.message || "Registration failed");
      }

      toast.success("Account created successfully!");

      // Role-based redirection
      const role = (data?.user as any)?.role?.toUpperCase();

      // Set role hint cookie for middleware redirect optimization
      if (role) {
        document.cookie = `framex-user-role=${role}; path=/; max-age=${30 * 24 * 60 * 60}`;
      }

      if (role === "OWNER") {
        router.push("/owner");
      } else {
        router.push("/admin");
      }
    } catch (error: any) {
      toast.error(
        error.message || "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title='Create your merchant account'
      description='Create one account to manage multiple stores, products, orders, and payments from a single workspace.'
      benefits={[
        "Add new stores anytime under one login.",
        "Monitor sales and operations across stores.",
        "Manage inventory, pricing, and promotions.",
        "Access growth tools built for multi-store teams.",
      ]}
      formTitle='Merchant registration'
      formDescription='Use your email and choose a strong password to begin.'
      autoScrollToFormOnMobile
      footer={
        <span>
          Already have an account?{" "}
          <Link href='/login' className='font-semibold text-blue-600 hover:text-blue-700'>
            Sign in
          </Link>
          .
        </span>
      }
    >
      <form onSubmit={handleSubmit} className='space-y-5'>
        <div className='space-y-2'>
          <Label htmlFor='name' className='text-sm font-semibold text-slate-700'>
            Full name
          </Label>
          <Input
            id='name'
            type='text'
            autoComplete='name'
            placeholder='Merchant owner name'
            required
            className='h-11 rounded-xl border-slate-200 bg-white/90 text-base shadow-sm'
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='email' className='text-sm font-semibold text-slate-700'>
            Email
          </Label>
          <Input
            id='email'
            type='email'
            autoComplete='email'
            placeholder='merchant@yourstore.com'
            required
            className='h-11 rounded-xl border-slate-200 bg-white/90 text-base shadow-sm'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='password' className='text-sm font-semibold text-slate-700'>
            Password
          </Label>
          <Input
            id='password'
            type='password'
            autoComplete='new-password'
            placeholder='Create a password'
            required
            className='h-11 rounded-xl border-slate-200 bg-white/90 text-base shadow-sm'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='confirm-password' className='text-sm font-semibold text-slate-700'>
            Confirm password
          </Label>
          <Input
            id='confirm-password'
            type='password'
            autoComplete='new-password'
            placeholder='Re-enter password'
            required
            className='h-11 rounded-xl border-slate-200 bg-white/90 text-base shadow-sm'
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        <div className='flex items-start gap-2 text-xs text-slate-500'>
          <input
            id='agree'
            type='checkbox'
            required
            className='mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40'
          />
          <Label htmlFor='agree' className='cursor-pointer'>
            I agree to the FrameX Tech terms, privacy policy, and merchant account guidelines.
          </Label>
        </div>
        <Button
          type='submit'
          className='h-11 w-full rounded-full bg-[#0448FD] text-base font-semibold text-white hover:bg-[#0548FD]'
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>
    </AuthShell>
  );
}

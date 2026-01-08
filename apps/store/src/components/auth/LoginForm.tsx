"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api-client";

// Zod schema for login form
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  googleOAuthEnabled?: boolean;
}

export function LoginForm({ googleOAuthEnabled = false }: LoginFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setLoading(true);

    try {
      // Call login API
      const data = await apiRequest<any>("POST", "/auth/login", {
        method: "email",
        email: values.email,
        password: values.password,
        rememberMe: values.rememberMe,
      });

      toast.success("Login successful!");
      // JWT token is automatically set in httpOnly cookie by the API
      // Redirect based on user role
      const userRole = data.user?.role || "customer";
      if (userRole === "admin") {
        router.push("/admin");
      } else if (userRole === "merchant") {
        router.push("/merchant");
      } else {
        router.push("/account");
      }
    } catch (error: any) {
      toast.error(error.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      // Fetch OAuth config from backend
      const oauthConfig = await apiRequest<any>("GET", "/configs/oauth");
      if (!oauthConfig.google?.enabled || !oauthConfig.google?.clientId) {
        toast.error("Google login is not configured");
        return;
      }

      const clientId = oauthConfig.google.clientId;
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const redirectUri = `${origin}/google-callback`;
      const scope = "openid email profile";
      const responseType = "code";

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&response_type=${responseType}&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`;

      window.location.href = authUrl;
    } catch (error) {
      toast.error("Failed to initiate Google login");
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center px-4 py-12'>
      <div className='w-full max-w-md'>
        {/* Header */}
        <div className='mb-8 text-center'>
          <h1 className='text-3xl font-bold text-foreground mb-2'>Welcome Back</h1>
          <p className='text-muted-foreground'>Sign in to your account to continue</p>
        </div>

        <Form {...form}>
          {/* Form */}
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            {/* Email Input */}
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type='email' placeholder='Enter your email' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password Input */}
            <FormField
              control={form.control}
              name='password'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className='relative'>
                      <Input type={showPassword ? "text" : "password"} placeholder='Enter your password' className='pr-10' {...field} />
                      <button
                        type='button'
                        onClick={() => setShowPassword(!showPassword)}
                        className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
                      >
                        {showPassword ? <EyeOff className='h-5 w-5' /> : <Eye className='h-5 w-5' />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Remember Me & Forgot Password */}
            <div className='flex items-center justify-between'>
              <FormField
                control={form.control}
                name='rememberMe'
                render={({ field }) => (
                  <div className='flex items-center gap-2'>
                    <Checkbox id='remember' checked={field.value} onCheckedChange={field.onChange} />
                    <label htmlFor='remember' className='cursor-pointer font-normal text-sm'>
                      Remember me
                    </label>
                  </div>
                )}
              />
              <Link href='/forgot-password' className='text-primary hover:underline text-sm'>
                Forgot password?
              </Link>
            </div>

            {/* Sign In Button */}
            <Button type='submit' className='w-full bg-primary text-primary-foreground hover:bg-primary/90' disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </Form>

        {/* Google Login */}
        {googleOAuthEnabled && (
          <div className='mt-6'>
            <div className='relative'>
              <div className='absolute inset-0 flex items-center'>
                <span className='w-full border-t' />
              </div>
              <div className='relative flex justify-center text-xs uppercase'>
                <span className='bg-background px-2 text-muted-foreground'>Or continue with</span>
              </div>
            </div>
            <Button type='button' variant='outline' className='w-full mt-4' onClick={handleGoogleLogin}>
              <svg className='mr-2 h-5 w-5' viewBox='0 0 24 24'>
                <path
                  fill='#4285F4'
                  d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
                />
                <path
                  fill='#34A853'
                  d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
                />
                <path
                  fill='#FBBC05'
                  d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
                />
                <path
                  fill='#EA4335'
                  d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
                />
              </svg>
              Sign in with Google
            </Button>
          </div>
        )}

        {/* Sign Up Link */}
        <div className='mt-6 text-center text-sm'>
          <span className='text-muted-foreground'>Don't have an account? </span>
          <Link href='/register' className='text-primary hover:underline font-medium'>
            Sign up
          </Link>
        </div>

        {/* Terms and Privacy */}
        <div className='mt-8 text-center text-xs text-muted-foreground'>
          By signing up you agree to the{" "}
          <Link href='/terms' className='text-primary hover:underline'>
            Terms of Use
          </Link>{" "}
          &{" "}
          <Link href='/privacy' className='text-primary hover:underline'>
            Privacy Policy
          </Link>{" "}
        </div>
      </div>
    </div>
  );
}

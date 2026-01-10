"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api-client";

// Zod schema for register form
const registerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(100, "Full name must be less than 100 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  googleOAuthEnabled?: boolean;
}

export function RegisterForm({ googleOAuthEnabled = false }: RegisterFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ country: string; countryCode: string; ip: string } | null>(null);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
    },
  });

  // Fetch user location on mount
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const data = await apiRequest<any>("GET", "/geolocation");
        if (data) {
          setUserLocation(data);
        }
      } catch (error) {
        console.error("Failed to fetch location:", error);
      }
    };
    fetchLocation();
  }, []);

  const onSubmit = async (values: RegisterFormValues) => {
    setLoading(true);

    try {
      // Call register API
      const response = await apiRequest<any>("POST", "/auth/register", {
        method: "email",
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        country: userLocation?.country || undefined,
        countryCode: userLocation?.countryCode || undefined,
        ipAddress: userLocation?.ip || undefined,
      });

      // Response structure: { success, message, data: { user, accessToken } }
      const { accessToken } = response.data || response;

      // Store token in localStorage for Authorization header
      if (accessToken) {
        localStorage.setItem("auth_token", accessToken);
      }

      toast.success("Account created successfully!");
      router.push("/account");
    } catch (error: any) {
      toast.error(error.message || "Registration failed. Please try again.");
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
          <h1 className='text-3xl font-bold text-foreground mb-2'>Create Your Account</h1>
          <p className='text-muted-foreground'>
            Start your <span className='text-primary font-semibold'>3-day free trial</span> - no credit card required.
          </p>
        </div>

        <Form {...form}>
          {/* Form */}
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-5'>
            {/* Full Name */}
            <FormField
              control={form.control}
              name='fullName'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input type='text' placeholder='Enter your full name' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      <Input type={showPassword ? "text" : "password"} placeholder='Create a password' className='pr-10' {...field} />
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

            {/* Get Started Button */}
            <Button type='submit' className='w-full bg-primary text-primary-foreground hover:bg-primary/90' disabled={loading}>
              {loading ? "Creating account..." : "Get Started"}
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
              Sign up with Google
            </Button>
          </div>
        )}

        {/* Login Link */}
        <div className='mt-6 text-center text-sm'>
          <span className='text-muted-foreground'>Already have an account? </span>
          <Link href='/login' className='text-primary hover:underline font-medium'>
            Login
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

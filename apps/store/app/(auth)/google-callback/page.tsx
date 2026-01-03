"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiRequest } from "@/lib/api-client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function GoogleCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleCallback = async () => {
            const code = searchParams.get("code");
            const urlError = searchParams.get("error");

            if (urlError) {
                setError(urlError);
                toast.error(`Google login failed: ${urlError}`);
                router.push("/login");
                return;
            }

            if (!code) {
                setError("No authorization code found");
                router.push("/login");
                return;
            }

            try {
                const origin = window.location.origin;
                const redirectUri = `${origin}/google-callback`;

                const data = await apiRequest<any>(
                    "GET",
                    `/auth/google?code=${code}&redirectUri=${encodeURIComponent(redirectUri)}`
                );

                toast.success("Login successful!");

                // Redirect based on user role
                const userRole = data.user?.role || "customer";
                if (userRole === "admin") {
                    router.push("/admin");
                } else if (userRole === "merchant") {
                    router.push("/merchant");
                } else {
                    router.push("/account");
                }
            } catch (err: any) {
                const message = err.message || "Authentication failed";
                setError(message);
                toast.error(message);
                router.push("/login");
            }
        };

        handleCallback();
    }, [searchParams, router]);

    return (
        <div className='min-h-screen flex flex-col items-center justify-center p-4'>
            <div className='max-w-md w-full text-center space-y-4'>
                {!error ? (
                    <>
                        <Loader2 className='w-12 h-12 animate-spin text-primary mx-auto' />
                        <h1 className='text-2xl font-bold'>Authenticating with Google</h1>
                        <p className='text-muted-foreground'>Please wait while we complete your login...</p>
                    </>
                ) : (
                    <>
                        <div className='text-destructive text-5xl mb-4'>!</div>
                        <h1 className='text-2xl font-bold'>Authentication Failed</h1>
                        <p className='text-muted-foreground mt-2'>{error}</p>
                        <p className='text-sm mt-4'>Redirecting you back to login...</p>
                    </>
                )}
            </div>
        </div>
    );
}

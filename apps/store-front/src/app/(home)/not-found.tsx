"use client";

import Link from "next/link";
import { MoveLeft, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
            <div className="space-y-6">
                <div className="relative">
                    <h1 className="text-9xl font-black tracking-tighter text-primary/5">
                        404
                    </h1>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <h2 className="text-3xl font-bold tracking-tight">Oops! Page Missing</h2>
                    </div>
                </div>

                <p className="mx-auto max-w-[500px] text-muted-foreground">
                    We couldn't find the page you're looking for. It might have been moved or
                    deleted. Let's get you back to shopping!
                </p>

                <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
                    <Button variant="outline" asChild size="lg">
                        <Link href=".." className="gap-2">
                            <MoveLeft className="h-4 w-4" />
                            Go Back
                        </Link>
                    </Button>
                    <Button asChild size="lg">
                        <Link href="/" className="gap-2">
                            <ShoppingBag className="h-4 w-4" />
                            Continue Shopping
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}

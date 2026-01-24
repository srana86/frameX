"use client";

import Link from "next/link";
import { MoveLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
    return (
        <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
            <div className="space-y-4">
                <div className="relative">
                    <h1 className="text-9xl font-extrabold tracking-tighter text-muted-foreground/10">
                        404
                    </h1>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <h2 className="text-3xl font-bold tracking-tight">Page Not Found</h2>
                    </div>
                </div>

                <p className="mx-auto max-w-[500px] text-muted-foreground">
                    The page you are looking for might have been removed, had its name changed,
                    or is temporarily unavailable.
                </p>

                <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
                    <Button variant="outline" asChild>
                        <Link href=".." className="gap-2">
                            <MoveLeft className="h-4 w-4" />
                            Go Back
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href="/" className="gap-2">
                            <Home className="h-4 w-4" />
                            Return Overview
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}

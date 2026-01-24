"use client";

import Link from "next/link";
import { MoveLeft, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
    return (
        <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
            <div className="space-y-6">
                <div className="relative">
                    <h1 className="text-9xl font-black tracking-tighter text-primary/5">
                        404
                    </h1>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <h2 className="text-3xl font-bold tracking-tight">Dashboard Page Not Found</h2>
                    </div>
                </div>

                <p className="mx-auto max-w-[500px] text-muted-foreground">
                    The dashboard section you are looking for doesn't exist. It might have been
                    moved or you might not have access to it.
                </p>

                <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
                    <Button variant="outline" asChild size="lg">
                        <Link href=".." className="gap-2">
                            <MoveLeft className="h-4 w-4" />
                            Go Back
                        </Link>
                    </Button>
                    <Button asChild size="lg">
                        <Link href="/owner" className="gap-2">
                            <LayoutDashboard className="h-4 w-4" />
                            Back to Dashboard
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}

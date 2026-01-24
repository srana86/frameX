import Link from "next/link";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4 text-center">
            <div className="w-full max-w-md space-y-8 rounded-2xl border bg-background p-8 shadow-xl">
                <div className="space-y-4">
                    <div className="relative">
                        <h1 className="text-8xl font-black tracking-tighter text-muted-foreground/10">
                            404
                        </h1>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <h2 className="text-2xl font-bold tracking-tight">Access Denied or Not Found</h2>
                        </div>
                    </div>

                    <p className="text-muted-foreground">
                        The resource you are looking for does not exist or you do not have permission to view it.
                    </p>

                    <div className="pt-6">
                        <Button asChild className="w-full">
                            <Link href="/" className="gap-2">
                                <Home className="h-4 w-4" />
                                Return to Safety
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="pt-4 text-xs text-muted-foreground">
                    &copy; {new Date().getFullYear()} FrameX Admin Platform. All rights reserved.
                </div>
            </div>
        </div>
    );
}

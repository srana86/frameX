import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
            <div className="space-y-8">
                <div className="relative">
                    <h1 className="text-[12rem] font-black leading-none tracking-tighter text-muted-foreground/5">
                        404
                    </h1>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
                        <h2 className="text-4xl font-bold tracking-tight">Store Link Broken</h2>
                        <p className="mt-4 text-lg text-muted-foreground">This store link doesn't seem to exist.</p>
                    </div>
                </div>

                <div className="pt-8">
                    <Button asChild size="lg" className="rounded-full px-8">
                        <Link href="/" className="gap-2">
                            <ShoppingBag className="h-5 w-5" />
                            Go to Home Page
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}

import Link from "next/link";
import { Home, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center selection:bg-primary selection:text-primary-foreground">
            <div className="relative mb-8">
                <h1 className="text-[15rem] font-black leading-none tracking-tighter text-muted-foreground/5 sm:text-[20rem]">
                    404
                </h1>
                <div className="absolute inset-0 flex flex-col items-center justify-center pt-10">
                    <h2 className="font-urbanist text-3xl font-bold tracking-tight sm:text-5xl">Lost in space?</h2>
                    <p className="mt-4 font-nunito-sans text-lg text-muted-foreground sm:text-xl">
                        The page you're looking for has drifted away.
                    </p>
                </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
                <Button asChild size="lg" className="h-12 rounded-full px-8 font-semibold">
                    <Link href="/" className="gap-2">
                        <Home className="h-5 w-5" />
                        Back to Home
                    </Link>
                </Button>
                <Button variant="outline" asChild size="lg" className="h-12 rounded-full px-8 font-semibold">
                    <Link href="/contact-us" className="gap-2">
                        Contact Support
                        <ArrowRight className="h-5 w-5" />
                    </Link>
                </Button>
            </div>

            <div className="mt-16 text-sm text-muted-foreground">
                Need your own store? <Link href="/#pricing" className="font-semibold text-primary hover:underline">Build it with FrameX &rarr;</Link>
            </div>
        </div>
    );
}

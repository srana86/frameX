import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { StorefrontIcon } from "./StorefrontIcon";

export default function StoreNotFoundPage() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="max-w-md w-full text-center border-dashed animate-scale-in">
                <CardHeader className="pb-0">
                    {/* Icon */}
                    <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                        <StorefrontIcon className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-2xl">Store Not Found</CardTitle>
                    <CardDescription className="text-base mt-2">
                        There is no store registered for this domain.
                    </CardDescription>
                </CardHeader>

                <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">
                        The store you&apos;re looking for might have been removed, had its
                        domain changed, or is temporarily unavailable.
                    </p>
                </CardContent>

                <CardFooter className="flex flex-col gap-3 pt-2">
                    <Button asChild className="w-full">
                        <Link href="https://localhost">Visit Main Platform</Link>
                    </Button>
                    <Button variant="outline" asChild className="w-full">
                        <Link href="/">Try Again</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

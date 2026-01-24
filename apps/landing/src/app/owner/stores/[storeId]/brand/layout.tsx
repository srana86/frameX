"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { cn } from "@/utils/cn";
import {
    Palette,
    ImageIcon,
    Globe,
    Phone,
    Share2,
    Settings,
    Image as ImageIconLucide,
    CreditCard
} from "lucide-react";

interface BrandLayoutProps {
    children: ReactNode;
}

export default function BrandLayout({ children }: BrandLayoutProps) {
    const pathname = usePathname();
    const params = useParams();
    const storeId = params.storeId as string;

    const tabs = [
        { id: "identity", label: "Identity", href: `/owner/stores/${storeId}/brand/identity`, icon: Palette },
        { id: "logo", label: "Logo", href: `/owner/stores/${storeId}/brand/logo`, icon: ImageIconLucide },
        { id: "seo", label: "SEO", href: `/owner/stores/${storeId}/brand/seo`, icon: Globe },
        { id: "contact", label: "Contact", href: `/owner/stores/${storeId}/brand/contact`, icon: Phone },
        { id: "social", label: "Social", href: `/owner/stores/${storeId}/brand/social`, icon: Share2 },
        { id: "theme", label: "Theme", href: `/owner/stores/${storeId}/brand/theme`, icon: Settings },
        { id: "hero-slides", label: "Hero Slides", href: `/owner/stores/${storeId}/brand/hero-slides`, icon: ImageIconLucide },
        { id: "payment", label: "Payment", href: `/owner/stores/${storeId}/brand/payment`, icon: CreditCard },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Brand Configuration</h1>
                    <p className="text-muted-foreground">
                        Manage your store's brand identity, visuals, and settings.
                    </p>
                </div>
            </div>

            <div className="border-b overflow-x-auto">
                <nav className="flex space-x-8 min-w-max px-1" aria-label="Tabs">
                    {tabs.map((tab) => {
                        const isActive = pathname === tab.href || (tab.id === "identity" && pathname === `/owner/stores/${storeId}/brand`);
                        return (
                            <Link
                                key={tab.id}
                                href={tab.href}
                                className={cn(
                                    "flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-all whitespace-nowrap",
                                    isActive
                                        ? "border-primary text-primary"
                                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                                )}
                            >
                                <tab.icon className="h-4 w-4" />
                                {tab.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="mt-6">{children}</div>
        </div>
    );
}

"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    Menu,
    Store,
    X,
    Settings,
    Receipt,
    CreditCard,
    LogOut,
    Loader2,
    Plus,
    ChevronDown,
    Check,
    Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api-client";

interface NavItem {
    title: string;
    href: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    description?: string;
}

interface NavGroup {
    label: string;
    items: NavItem[];
}

interface StoreInfo {
    id: string;
    name: string;
    slug?: string;
    status: string;
    customDomain?: string;
}

const NAV_GROUPS: NavGroup[] = [
    {
        label: "Main",
        items: [
            {
                title: "Overview",
                href: "/owner",
                icon: LayoutDashboard,
                description: "Dashboard overview",
            },
            {
                title: "My Stores",
                href: "/owner/stores",
                icon: Store,
                description: "Manage your stores",
            },
            {
                title: "Staff",
                href: "/owner/staff",
                icon: Users,
                description: "Manage staff accounts",
            },
        ],
    },
    {
        label: "Billing",
        items: [
            {
                title: "Subscriptions",
                href: "/owner/subscriptions",
                icon: CreditCard,
                description: "Manage store subscriptions",
            },
            {
                title: "Invoices",
                href: "/owner/invoices",
                icon: Receipt,
                description: "Billing history",
            },
        ],
    },
    {
        label: "Account",
        items: [
            {
                title: "Settings",
                href: "/owner/settings",
                icon: Settings,
                description: "Account settings",
            },
        ],
    },
];

const ALL_NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

function isActive(pathname: string, target: string) {
    if (target === "/owner") {
        return pathname === "/owner";
    }
    return pathname === target || pathname.startsWith(`${target}/`);
}

interface Breadcrumb {
    href: string;
    label: string;
}

function buildBreadcrumbs(pathname: string): Breadcrumb[] {
    if (pathname === "/owner") {
        return [{ href: "/owner", label: "Overview" }];
    }

    const segments = pathname.split("/").filter(Boolean);
    const crumbs: Breadcrumb[] = [{ href: "/owner", label: "Overview" }];

    segments.forEach((segment, index) => {
        if (segment === "owner") return;
        const href = `/owner/${segments.slice(1, index + 1).join("/")}`;
        const navItem = ALL_NAV_ITEMS.find((item) => item.href === href);
        const label = navItem?.title ?? segment.replace(/-/g, " ");
        crumbs.push({
            href,
            label: label
                .split(" ")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" "),
        });
    });

    return crumbs.filter(
        (crumb, index, array) =>
            index === array.findIndex((item) => item.href === crumb.href)
    );
}

export function OwnerShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { logout, user, isLoading: authLoading } = useAuth();
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);
    const [stores, setStores] = useState<StoreInfo[]>([]);
    const [selectedStore, setSelectedStore] = useState<StoreInfo | null>(null);
    const [isLoadingStores, setIsLoadingStores] = useState(true);
    const [hasOwnerProfile, setHasOwnerProfile] = useState<boolean | null>(null);

    const activeItem = useMemo(
        () => ALL_NAV_ITEMS.find((item) => isActive(pathname, item.href)),
        [pathname]
    );
    const breadcrumbs = useMemo(() => buildBreadcrumbs(pathname), [pathname]);

    // Load owner profile and stores
    useEffect(() => {
        const loadOwnerData = async () => {
            if (!user) return;

            try {
                const ownerData = await api.get<{
                    stores: Array<{ tenant: StoreInfo }>;
                }>("/owner/profile");

                setHasOwnerProfile(true);

                // Extract stores from owner data
                const storesList: StoreInfo[] = ownerData.stores?.map(s => ({
                    id: s.tenant.id,
                    name: s.tenant.name,
                    slug: s.tenant.slug,
                    status: s.tenant.status,
                    customDomain: s.tenant.customDomain,
                })) || [];

                setStores(storesList);

                // Select first store by default
                if (storesList.length > 0 && !selectedStore) {
                    setSelectedStore(storesList[0]);
                }
            } catch (error: any) {
                if (error?.statusCode === 404) {
                    setHasOwnerProfile(false);
                }
            } finally {
                setIsLoadingStores(false);
            }
        };

        if (!authLoading && user) {
            loadOwnerData();
        }
    }, [user, authLoading, selectedStore]);

    // Authorization check
    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            router.push("/login");
            return;
        }

        const role = user.role?.toUpperCase();
        // OWNER, TENANT (store admin), STAFF, SUPER_ADMIN, and ADMIN can all access the owner panel
        // They will see different stores based on their permissions
        if (role === "OWNER" || role === "TENANT" || role === "STAFF" || role === "SUPER_ADMIN" || role === "ADMIN") {
            // Authorized - continue to render
        } else {
            // CUSTOMER and other roles - redirect to store home
            window.location.href = process.env.NEXT_PUBLIC_STORE_URL || "http://localhost:3000";
        }
    }, [user, authLoading, router]);

    const handleStoreSelect = (store: StoreInfo) => {
        setSelectedStore(store);
        setStoreDropdownOpen(false);
        // Could store in localStorage or context for persistence
    };

    // Show loading state
    if (authLoading || isLoadingStores) {
        return (
            <div className="min-h-screen bg-muted/30 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="mt-4 text-muted-foreground">Loading your stores...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/30">
            <div className="flex min-h-screen">
                {mobileNavOpen ? (
                    <div
                        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
                        aria-hidden="true"
                        onClick={() => setMobileNavOpen(false)}
                    />
                ) : null}

                <aside
                    className={cn(
                        "fixed inset-y-0 left-0 z-50 w-64 border-r bg-background transition-transform duration-200 ease-out",
                        mobileNavOpen
                            ? "translate-x-0 shadow-xl"
                            : "-translate-x-full lg:translate-x-0"
                    )}
                >
                    <div className="flex h-16 items-center justify-between border-b px-6">
                        <Link href="/owner" className="text-lg font-semibold tracking-tight">
                            FrameX Owner
                        </Link>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="lg:hidden"
                            onClick={() => setMobileNavOpen(false)}
                            aria-label="Close navigation"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Store Selector */}
                    <div className="border-b px-4 py-3">
                        <div className="relative">
                            <button
                                onClick={() => setStoreDropdownOpen(!storeDropdownOpen)}
                                className="flex w-full items-center justify-between rounded-lg border bg-muted/50 px-3 py-2 text-sm hover:bg-muted"
                            >
                                <div className="flex items-center gap-2 truncate">
                                    <Store className="h-4 w-4 text-primary" />
                                    <span className="truncate font-medium">
                                        {selectedStore?.name || "Select a store"}
                                    </span>
                                </div>
                                <ChevronDown
                                    className={cn(
                                        "h-4 w-4 text-muted-foreground transition-transform",
                                        storeDropdownOpen && "rotate-180"
                                    )}
                                />
                            </button>

                            {storeDropdownOpen && (
                                <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-auto rounded-lg border bg-background shadow-lg">
                                    {stores.map((store) => (
                                        <button
                                            key={store.id}
                                            onClick={() => handleStoreSelect(store)}
                                            className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                                        >
                                            {selectedStore?.id === store.id ? (
                                                <Check className="h-4 w-4 text-primary" />
                                            ) : (
                                                <div className="h-4 w-4" />
                                            )}
                                            <span className="truncate">{store.name}</span>
                                            <span
                                                className={cn(
                                                    "ml-auto rounded-full px-2 py-0.5 text-xs",
                                                    store.status === "ACTIVE"
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-yellow-100 text-yellow-700"
                                                )}
                                            >
                                                {store.status}
                                            </span>
                                        </button>
                                    ))}
                                    <div className="border-t p-2">
                                        <Link href="/owner/stores/new">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="w-full"
                                                onClick={() => setStoreDropdownOpen(false)}
                                            >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Create New Store
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex h-[calc(100vh-8rem)] flex-col overflow-y-auto px-4 py-6">
                        <nav className="space-y-8">
                            {NAV_GROUPS.map((group) => (
                                <div key={group.label} className="space-y-2">
                                    <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                                        {group.label}
                                    </h3>
                                    <div className="space-y-1">
                                        {group.items.map((item) => {
                                            const Icon = item.icon;
                                            const active = isActive(pathname, item.href);

                                            return (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    className={cn(
                                                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                                                        active
                                                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                                            : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
                                                    )}
                                                    onClick={() => setMobileNavOpen(false)}
                                                >
                                                    <Icon
                                                        className={cn(
                                                            "h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
                                                            active
                                                                ? "text-primary-foreground"
                                                                : "text-muted-foreground group-hover:text-primary"
                                                        )}
                                                    />
                                                    <div className="flex flex-col">
                                                        <span className="leading-none">{item.title}</span>
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </nav>

                        <div className="mt-8 pt-8 border-t">
                            <div className="flex items-center gap-3 px-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                                    {user?.email?.charAt(0).toUpperCase() || "O"}
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                    <span className="text-sm font-semibold truncate">
                                        {user?.email || "Store Owner"}
                                    </span>
                                    <span className="text-xs text-muted-foreground capitalize">
                                        {stores.length} store{stores.length !== 1 ? "s" : ""}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 rounded-xl border bg-gradient-to-br from-primary/5 to-primary/10 p-4 text-sm">
                            <p className="font-medium text-primary">Need more stores?</p>
                            <p className="mt-1 text-muted-foreground">
                                Upgrade your plan to add more stores to your account.
                            </p>
                            <Link href="/owner/subscriptions" className="mt-3 inline-flex">
                                <Button size="sm" className="w-full">
                                    View Plans
                                </Button>
                            </Link>
                        </div>
                    </div>
                </aside>

                <div className="flex flex-1 flex-col lg:pl-64">
                    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
                        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
                            <div className="flex items-center gap-3">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="lg:hidden"
                                    onClick={() => setMobileNavOpen(true)}
                                    aria-label="Open navigation"
                                >
                                    <Menu className="h-5 w-5" />
                                </Button>

                                <div className="flex flex-col">
                                    <nav className="hidden items-center gap-2 text-sm text-muted-foreground md:flex">
                                        {breadcrumbs.map((crumb, index) => (
                                            <div key={crumb.href} className="flex items-center gap-2">
                                                {index > 0 ? (
                                                    <span className="text-muted-foreground/70">/</span>
                                                ) : null}
                                                {index === breadcrumbs.length - 1 ? (
                                                    <span className="font-medium text-foreground">
                                                        {crumb.label}
                                                    </span>
                                                ) : (
                                                    <Link
                                                        href={crumb.href}
                                                        className="transition-colors hover:text-foreground hover:underline"
                                                    >
                                                        {crumb.label}
                                                    </Link>
                                                )}
                                            </div>
                                        ))}
                                    </nav>
                                    <div className="text-lg font-semibold leading-tight">
                                        {activeItem?.title ?? "Overview"}
                                    </div>
                                    {activeItem?.description ? (
                                        <p className="hidden text-xs text-muted-foreground sm:block">
                                            {activeItem.description}
                                        </p>
                                    ) : null}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={logout}
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                >
                                    <LogOut className="h-4 w-4 mr-2" />
                                    Logout
                                </Button>
                            </div>
                        </div>
                    </header>

                    <main className="flex-1">
                        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}

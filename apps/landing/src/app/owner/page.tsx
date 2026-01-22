"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Store,
    Plus,
    TrendingUp,
    ShoppingCart,
    Users,
    CreditCard,
    ArrowRight,
    Loader2,
} from "lucide-react";
import { api } from "@/lib/api-client";

interface StoreStats {
    id: string;
    name: string;
    slug?: string;
    status: string;
    subscription: {
        planName?: string;
        status: string;
    } | null;
    stats: {
        orders: number;
        products: number;
        customers: number;
    };
    createdAt: string;
}

export default function OwnerDashboardPage() {
    const [stores, setStores] = useState<StoreStats[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasOwnerProfile, setHasOwnerProfile] = useState<boolean | null>(null);

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                const storesData = await api.get<StoreStats[]>("/owner/stores");
                setStores(storesData);
                setHasOwnerProfile(true);
            } catch (error: any) {
                if (error?.statusCode === 404) {
                    setHasOwnerProfile(false);
                }
                console.error("Failed to load dashboard data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadDashboardData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // No owner profile - show setup prompt
    if (hasOwnerProfile === false) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="text-center max-w-md">
                    <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                        <Store className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Welcome to FrameX!</h1>
                    <p className="text-muted-foreground mb-6">
                        Set up your store owner profile to start creating and managing your
                        online stores.
                    </p>
                    <Link href="/owner/settings">
                        <Button size="lg">
                            Set Up Profile
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    // Calculate totals
    const totalOrders = stores.reduce((sum, s) => sum + (s.stats?.orders || 0), 0);
    const totalProducts = stores.reduce((sum, s) => sum + (s.stats?.products || 0), 0);
    const totalCustomers = stores.reduce((sum, s) => sum + (s.stats?.customers || 0), 0);
    const activeStores = stores.filter((s) => s.status === "ACTIVE").length;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">
                        Manage all your stores from one place
                    </p>
                </div>
                <Link href="/owner/stores/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Create New Store
                    </Button>
                </Link>
            </div>

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Stores</CardTitle>
                        <Store className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stores.length}</div>
                        <p className="text-xs text-muted-foreground">
                            {activeStores} active
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalOrders}</div>
                        <p className="text-xs text-muted-foreground">Across all stores</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalProducts}</div>
                        <p className="text-xs text-muted-foreground">Listed products</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalCustomers}</div>
                        <p className="text-xs text-muted-foreground">Registered customers</p>
                    </CardContent>
                </Card>
            </div>

            {/* Stores List */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Your Stores</h2>
                    <Link href="/owner/stores">
                        <Button variant="ghost" size="sm">
                            View All
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </div>

                {stores.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Store className="h-12 w-12 text-muted-foreground/50 mb-4" />
                            <h3 className="text-lg font-medium mb-2">No stores yet</h3>
                            <p className="text-muted-foreground text-center mb-4">
                                Create your first store to start selling online
                            </p>
                            <Link href="/owner/stores/new">
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Your First Store
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {stores.slice(0, 6).map((store) => (
                            <Card key={store.id} className="hover:shadow-md transition-shadow">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="text-lg">{store.name}</CardTitle>
                                            <CardDescription>
                                                {store.slug ? `${store.slug}.framextech.com` : "No domain"}
                                            </CardDescription>
                                        </div>
                                        <span
                                            className={`rounded-full px-2 py-1 text-xs font-medium ${store.status === "ACTIVE"
                                                    ? "bg-green-100 text-green-700"
                                                    : store.status === "TRIAL"
                                                        ? "bg-blue-100 text-blue-700"
                                                        : "bg-gray-100 text-gray-700"
                                                }`}
                                        >
                                            {store.status}
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-3 gap-4 text-center border-t pt-4">
                                        <div>
                                            <div className="text-lg font-semibold">
                                                {store.stats?.orders || 0}
                                            </div>
                                            <div className="text-xs text-muted-foreground">Orders</div>
                                        </div>
                                        <div>
                                            <div className="text-lg font-semibold">
                                                {store.stats?.products || 0}
                                            </div>
                                            <div className="text-xs text-muted-foreground">Products</div>
                                        </div>
                                        <div>
                                            <div className="text-lg font-semibold">
                                                {store.stats?.customers || 0}
                                            </div>
                                            <div className="text-xs text-muted-foreground">Customers</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                        <div className="flex items-center gap-2 text-sm">
                                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-muted-foreground">
                                                {store.subscription?.planName || "No Plan"}
                                            </span>
                                        </div>
                                        <Link href={`/owner/stores/${store.id}`}>
                                            <Button size="sm" variant="outline">
                                                Manage
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

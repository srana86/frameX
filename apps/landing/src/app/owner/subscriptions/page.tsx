"use client";

import { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    CreditCard,
    Store,
    Calendar,
    Loader2,
    ArrowUpRight,
} from "lucide-react";
import { api } from "@/lib/api-client";

interface StoreSubscription {
    id: string;
    name: string;
    slug?: string;
    status: string;
    subscription: {
        id: string;
        planName?: string;
        status: string;
        amount: number;
        billingCycleMonths: number;
        currentPeriodEnd: string;
        plan?: {
            name: string;
            price: number;
        };
    } | null;
}

export default function SubscriptionsPage() {
    const [stores, setStores] = useState<StoreSubscription[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadStores = async () => {
            try {
                const data = await api.get<StoreSubscription[]>("/owner/stores");
                setStores(data);
            } catch (error) {
                console.error("Failed to load subscriptions:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadStores();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "ACTIVE":
                return "bg-green-100 text-green-700 border-green-200";
            case "TRIAL":
                return "bg-blue-100 text-blue-700 border-blue-200";
            case "PAST_DUE":
                return "bg-yellow-100 text-yellow-700 border-yellow-200";
            case "CANCELLED":
            case "EXPIRED":
                return "bg-red-100 text-red-700 border-red-200";
            default:
                return "bg-gray-100 text-gray-700 border-gray-200";
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Subscriptions</h1>
                <p className="text-muted-foreground">
                    Manage subscriptions for all your stores
                </p>
            </div>

            {/* Subscriptions List */}
            {stores.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <CreditCard className="h-12 w-12 text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-medium mb-2">No stores yet</h3>
                        <p className="text-muted-foreground text-center">
                            Create a store to manage subscriptions
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {stores.map((store) => (
                        <Card key={store.id}>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                            <Store className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">{store.name}</CardTitle>
                                            <CardDescription>
                                                {store.slug
                                                    ? `${store.slug}.framextech.com`
                                                    : "No domain"}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className={getStatusColor(store.status)}
                                    >
                                        {store.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {store.subscription ? (
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium">
                                                    {store.subscription.planName ||
                                                        store.subscription.plan?.name ||
                                                        "Unknown Plan"}
                                                </span>
                                                <Badge
                                                    variant="outline"
                                                    className={getStatusColor(store.subscription.status)}
                                                >
                                                    {store.subscription.status}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Calendar className="h-4 w-4" />
                                                <span>
                                                    Renews on{" "}
                                                    {formatDate(store.subscription.currentPeriodEnd)}
                                                </span>
                                            </div>
                                            <div className="text-sm">
                                                <span className="text-2xl font-bold">
                                                    ৳{store.subscription.amount}
                                                </span>
                                                <span className="text-muted-foreground">
                                                    /{store.subscription.billingCycleMonths} month
                                                    {store.subscription.billingCycleMonths > 1 ? "s" : ""}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm">
                                                Change Plan
                                            </Button>
                                            <Button variant="outline" size="sm">
                                                Manage
                                                <ArrowUpRight className="ml-2 h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <div className="text-muted-foreground">
                                            No active subscription
                                        </div>
                                        <Button size="sm">
                                            Choose Plan
                                            <ArrowUpRight className="ml-2 h-3 w-3" />
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

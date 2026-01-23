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
import { Badge } from "@/components/ui/badge";
import {
    Store,
    Plus,
    ExternalLink,
    Settings,
    Trash2,
    Loader2,
    Search,
    MoreHorizontal,
    CreditCard,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface StoreData {
    id: string;
    name: string;
    slug?: string;
    email: string;
    status: string;
    customDomain?: string;
    deploymentUrl?: string;
    role: string;
    subscription: {
        id: string;
        planName?: string;
        status: string;
        currentPeriodEnd: string;
    } | null;
    stats: {
        orders: number;
        products: number;
        customers: number;
    };
    createdAt: string;
}

export default function StoresListPage() {
    const [stores, setStores] = useState<StoreData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [storeToDelete, setStoreToDelete] = useState<StoreData | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const loadStores = async () => {
        try {
            const data = await api.get<StoreData[]>("/owner/stores");
            setStores(data);
        } catch (error) {
            console.error("Failed to load stores:", error);
            toast.error("Failed to load stores");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadStores();
    }, []);

    const handleDeleteStore = async () => {
        if (!storeToDelete) return;

        setIsDeleting(true);
        try {
            await api.delete(`/owner/stores/${storeToDelete.id}`);
            toast.success("Store deleted successfully");
            setStores((prev) => prev.filter((s) => s.id !== storeToDelete.id));
            setDeleteDialogOpen(false);
            setStoreToDelete(null);
        } catch (error: any) {
            toast.error(error?.message || "Failed to delete store");
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredStores = stores.filter(
        (store) =>
            store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            store.slug?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case "ACTIVE":
                return "bg-green-100 text-green-700 border-green-200";
            case "TRIAL":
                return "bg-blue-100 text-blue-700 border-blue-200";
            case "SUSPENDED":
                return "bg-red-100 text-red-700 border-red-200";
            default:
                return "bg-gray-100 text-gray-700 border-gray-200";
        }
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
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Stores</h1>
                    <p className="text-muted-foreground">
                        Manage all your online stores
                    </p>
                </div>
                <Link href="/owner/stores/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Create New Store
                    </Button>
                </Link>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Search stores..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Stores Grid */}
            {filteredStores.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Store className="h-12 w-12 text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-medium mb-2">
                            {searchQuery ? "No stores found" : "No stores yet"}
                        </h3>
                        <p className="text-muted-foreground text-center mb-4">
                            {searchQuery
                                ? "Try adjusting your search query"
                                : "Create your first store to start selling online"}
                        </p>
                        {!searchQuery && (
                            <Link href="/owner/stores/new">
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Your First Store
                                </Button>
                            </Link>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredStores.map((store) => (
                        <Card
                            key={store.id}
                            className="group hover:shadow-lg transition-all duration-200 cursor-pointer relative"
                        >
                            {/* Clickable overlay for entire card */}
                            <Link
                                href={`/owner/stores/${store.id}/dashboard`}
                                className="absolute inset-0 z-10"
                                aria-label={`Open ${store.name} dashboard`}
                            />
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <CardTitle className="text-lg truncate group-hover:text-primary transition-colors">
                                            {store.name}
                                        </CardTitle>
                                        <CardDescription className="truncate">
                                            {store.customDomain ||
                                                (store.slug
                                                    ? `${store.slug}.framextech.com`
                                                    : store.email)}
                                        </CardDescription>
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className={getStatusColor(store.status)}
                                    >
                                        {store.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-4 text-center border rounded-lg p-3 bg-muted/30">
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

                                {/* Subscription Info */}
                                <div className="flex items-center gap-2 text-sm">
                                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">
                                        {store.subscription?.planName || "No subscription"}
                                    </span>
                                    {store.subscription?.status && (
                                        <Badge
                                            variant="outline"
                                            className={
                                                store.subscription.status === "ACTIVE"
                                                    ? "bg-green-50 text-green-600 border-green-200"
                                                    : "bg-yellow-50 text-yellow-600 border-yellow-200"
                                            }
                                        >
                                            {store.subscription.status}
                                        </Badge>
                                    )}
                                </div>

                                {/* Actions - z-20 to be above clickable overlay */}
                                <div className="flex items-center gap-2 pt-2 border-t relative z-20">
                                    <Link href={`/owner/stores/${store.id}/dashboard`} className="flex-1">
                                        <Button size="sm" className="w-full">
                                            Open Dashboard
                                        </Button>
                                    </Link>
                                    {store.deploymentUrl && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            asChild
                                        >
                                            <a
                                                href={store.deploymentUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <ExternalLink className="h-3 w-3" />
                                            </a>
                                        </Button>
                                    )}
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        asChild
                                    >
                                        <Link href={`/owner/stores/${store.id}/settings`}>
                                            <Settings className="h-3 w-3" />
                                        </Link>
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setStoreToDelete(store);
                                            setDeleteDialogOpen(true);
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Store</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete{" "}
                            <strong>{storeToDelete?.name}</strong>? This action cannot be
                            undone. All store data including products, orders, and customers
                            will be permanently deleted.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteStore}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete Store"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Store,
    ArrowLeft,
    ExternalLink,
    Settings,
    Trash2,
    Loader2,
    Globe,
    Mail,
    Phone,
    CreditCard,
    Calendar,
    Save,
    AlertTriangle,
    ShoppingCart,
    Users,
    Package,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface StoreDetail {
    id: string;
    name: string;
    slug?: string;
    email: string;
    phone?: string;
    status: string;
    customDomain?: string;
    deploymentUrl?: string;
    subscription: {
        planName?: string;
        status: string;
        currentPeriodEnd?: string;
    } | null;
    stats: {
        orders: number;
        products: number;
        customers: number;
    };
    createdAt: string;
}

export default function StoreDetailPage() {
    const params = useParams();
    const router = useRouter();
    const storeId = params.id as string;

    const [store, setStore] = useState<StoreDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Form state attributes
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [slug, setSlug] = useState("");
    const [phone, setPhone] = useState("");
    const [domain, setDomain] = useState("");
    const [confirmDeleteName, setConfirmDeleteName] = useState("");

    const loadStoreData = async () => {
        setIsLoading(true);
        try {
            const data = await api.get<StoreDetail>(`/owner/stores/${storeId}`);
            setStore(data);
            setName(data.name);
            setEmail(data.email);
            setSlug(data.slug || "");
            setPhone(data.phone || "");
            setDomain(data.customDomain || "");
        } catch (error: any) {
            console.error("Failed to load store data:", error);
            toast.error(error?.message || "Failed to load store data");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (storeId) {
            loadStoreData();
        }
    }, [storeId]);

    const handleUpdateSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await api.put(`/owner/stores/${storeId}`, {
                name,
                email,
                slug,
                phone,
                customDomain: domain,
            });
            toast.success("Store settings updated successfully");
            loadStoreData(); // Refresh data
        } catch (error: any) {
            toast.error(error?.message || "Failed to update settings");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteStore = async () => {
        if (confirmDeleteName !== store?.name) {
            toast.error("Please type the store name correctly to confirm");
            return;
        }

        setIsDeleting(true);
        try {
            await api.delete(`/owner/stores/${storeId}`);
            toast.success("Store deleted successfully");
            router.push("/owner/stores");
        } catch (error: any) {
            toast.error(error?.message || "Failed to delete store");
        } finally {
            setIsDeleting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!store) {
        return (
            <div className="text-center py-20">
                <Store className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h2 className="text-xl font-bold">Store Not Found</h2>
                <p className="text-muted-foreground mt-2">The store you are looking for does not exist or you don't have access to it.</p>
                <Button className="mt-6" asChild>
                    <Link href="/owner/stores">Back to Stores</Link>
                </Button>
            </div>
        );
    }

    const domainUrl = store.deploymentUrl || (store.slug ? `http://${store.slug}.localhost:3000` : "#");

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link href="/owner/stores" className="text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                            Store ID: {store.id.slice(0, 8)}...
                        </Badge>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">{store.name}</h1>
                    <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                        <Globe className="h-4 w-4" />
                        <a href={domainUrl} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                            {store.slug ? `${store.slug}.framextech.com` : "Setup domain"}
                            <ExternalLink className="h-3 w-3" />
                        </a>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" asChild>
                        <a href={domainUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Visit Store
                        </a>
                    </Button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Orders</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{store.stats?.orders || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Products</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{store.stats?.products || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Customers</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{store.stats?.customers || 0}</div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-8">
                    <TabsTrigger value="general">General Settings</TabsTrigger>
                    <TabsTrigger value="domain">Domain & SEO</TabsTrigger>
                    <TabsTrigger value="billing">Plan & Billing</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                            <CardDescription>Manage your store identity and contact details.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form id="general-settings" onSubmit={handleUpdateSettings} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="store-name">Store Name</Label>
                                        <div className="relative">
                                            <Store className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                id="store-name"
                                                value={name}
                                                onChange={e => setName(e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="store-email">Contact Email</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                id="store-email"
                                                type="email"
                                                value={email}
                                                onChange={e => setEmail(e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="store-phone">Phone Number</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                id="store-phone"
                                                value={phone}
                                                onChange={e => setPhone(e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="store-slug">Subdomain Identifier (Slug)</Label>
                                        <Input
                                            id="store-slug"
                                            value={slug}
                                            onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"))}
                                        />
                                        <p className="text-xs text-muted-foreground">Used for your internal URL: {slug}.framextech.com</p>
                                    </div>
                                </div>
                            </form>
                        </CardContent>
                        <CardFooter className="border-t pt-6">
                            <Button form="general-settings" type="submit" disabled={isSaving}>
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Changes
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card className="border-red-200">
                        <CardHeader>
                            <CardTitle className="text-red-600 flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5" />
                                Danger Zone
                            </CardTitle>
                            <CardDescription>Actions in this area are irreversible. Be careful.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between p-4 border rounded-lg bg-red-50/50">
                                <div>
                                    <p className="font-semibold text-red-700">Delete Store</p>
                                    <p className="text-sm text-red-600/70">Once you delete a store, there is no going back. All data will be wiped.</p>
                                </div>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete Store
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="sm:max-w-md border-0 shadow-2xl">
                                        {/* Warning Banner */}
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2">
                                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-500/25 ring-4 ring-background">
                                                <AlertTriangle className="h-10 w-10 text-white" strokeWidth={2.5} />
                                            </div>
                                        </div>

                                        <AlertDialogHeader className="pt-12 text-center">
                                            <AlertDialogTitle className="text-xl font-bold text-foreground">
                                                Delete {store.name}?
                                            </AlertDialogTitle>
                                            <AlertDialogDescription asChild>
                                                <div className="space-y-4 pt-2">
                                                    <p className="text-muted-foreground">
                                                        This action is <span className="font-semibold text-rose-600 dark:text-rose-400">permanent</span> and cannot be undone.
                                                        You will lose all data associated with this store.
                                                    </p>

                                                    {/* Warning Box */}
                                                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-left dark:border-amber-900/50 dark:bg-amber-950/30">
                                                        <div className="flex items-start gap-3">
                                                            <div className="flex-shrink-0">
                                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
                                                                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                                                </div>
                                                            </div>
                                                            <div className="text-sm text-amber-800 dark:text-amber-200">
                                                                <p className="font-medium">Impact of deletion:</p>
                                                                <ul className="mt-1 list-inside list-disc space-y-0.5 text-amber-700 dark:text-amber-300">
                                                                    <li>Loss of all product and category data</li>
                                                                    <li>Permanent removal of order history</li>
                                                                    <li>Deletion of store-specific settings</li>
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Confirmation Input */}
                                                    <div className="space-y-2 pt-2">
                                                        <Label htmlFor="confirm-delete" className="text-sm text-foreground">
                                                            Type <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm font-semibold text-rose-600 dark:text-rose-400">{store.name}</code> to confirm:
                                                        </Label>
                                                        <Input
                                                            id="confirm-delete"
                                                            value={confirmDeleteName}
                                                            onChange={(e) => setConfirmDeleteName(e.target.value)}
                                                            placeholder={store.name}
                                                            className="border-muted-foreground/25 bg-muted/50 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 transition-colors focus-visible:border-rose-500 focus-visible:ring-rose-500/20"
                                                        />
                                                    </div>
                                                </div>
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter className="mt-6 gap-2 sm:gap-2">
                                            <AlertDialogCancel
                                                onClick={() => setConfirmDeleteName("")}
                                                className="flex-1 border-muted-foreground/25 bg-transparent hover:bg-muted"
                                            >
                                                Cancel
                                            </AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={handleDeleteStore}
                                                disabled={isDeleting || confirmDeleteName !== store.name}
                                                className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-500/25 transition-all hover:from-red-700 hover:to-rose-700 hover:shadow-red-500/40 disabled:from-muted disabled:to-muted disabled:text-muted-foreground disabled:shadow-none"
                                            >
                                                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="mr-2 h-4 w-4" />}
                                                Delete Store
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="domain" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Domain Settings</CardTitle>
                            <CardDescription>Configure how customers find your store online.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="p-4 rounded-lg border bg-primary/5">
                                    <div className="flex items-center justify-between mb-2">
                                        <Label className="font-bold">System Domain</Label>
                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">ACTIVE</Badge>
                                    </div>
                                    <div className="flex items-center gap-2 text-primary font-medium">
                                        <Globe className="h-4 w-4" />
                                        {store.slug ? `${store.slug}.framextech.com` : "Not assigned"}
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-2">Default system subdomain assigned to your store.</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="custom-domain">Custom Domain</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="custom-domain"
                                            placeholder="e.g. shop.yourbrand.com"
                                            value={domain}
                                            onChange={e => setDomain(e.target.value)}
                                        />
                                        <Button variant="outline" disabled={isSaving} onClick={handleUpdateSettings}>
                                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Link Custom Domain
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">After linking, you'll need to configure your CNAME records.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="billing" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Subscription Overview</CardTitle>
                            <CardDescription>Manage your store plan and billing lifecycle.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="flex-1 p-6 rounded-xl border bg-gradient-to-br from-primary/5 to-primary/10">
                                    <div className="flex items-center justify-between mb-4">
                                        <CardTitle className="text-lg">Current Plan</CardTitle>
                                        <Badge className="bg-primary text-primary-foreground font-bold">
                                            {store.subscription?.planName || "Trial"}
                                        </Badge>
                                    </div>
                                    <div className="text-3xl font-bold mb-2">
                                        {store.subscription?.status === "ACTIVE" ? "Pro Plan" : "Free Trial"}
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                        <Calendar className="h-4 w-4" />
                                        Next billing date: {store.subscription?.currentPeriodEnd ? new Date(store.subscription.currentPeriodEnd).toLocaleDateString() : "N/A"}
                                    </div>
                                    <Button className="w-full mt-6" asChild>
                                        <Link href="/owner/subscriptions">Upgrade Plan</Link>
                                    </Button>
                                </div>

                                <div className="flex-1 space-y-4">
                                    <CardTitle className="text-lg">Billing Info</CardTitle>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-sm p-3 border rounded-lg bg-muted/30">
                                            <span className="text-muted-foreground flex items-center gap-2">
                                                <CreditCard className="h-4 w-4" />
                                                Payment Method
                                            </span>
                                            <span className="font-medium">Visa •••• 4242</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm p-3 border rounded-lg bg-muted/30">
                                            <span className="text-muted-foreground">Status</span>
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                {store.subscription?.status || "TRIAL"}
                                            </Badge>
                                        </div>
                                    </div>
                                    <Button variant="outline" className="w-full" asChild>
                                        <Link href="/owner/invoices">View Invoices</Link>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

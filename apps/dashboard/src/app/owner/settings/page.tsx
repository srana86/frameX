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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
import {
    User,
    Building,
    Phone,
    MapPin,
    Mail,
    Loader2,
    Save,
    Trash2,
    AlertTriangle,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface OwnerProfile {
    id: string;
    displayName?: string;
    companyName?: string;
    phone?: string;
    address?: string;
    billingEmail?: string;
    billingAddress?: string;
    vatNumber?: string;
    user: {
        name: string;
        email: string;
    };
}

export default function SettingsPage() {
    const [profile, setProfile] = useState<OwnerProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [hasProfile, setHasProfile] = useState<boolean | null>(null);
    const [formData, setFormData] = useState({
        displayName: "",
        companyName: "",
        phone: "",
        address: "",
        billingEmail: "",
        billingAddress: "",
        vatNumber: "",
    });
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState("");
    const router = useRouter();
    const { logout } = useAuth();

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const data = await api.get<OwnerProfile>("/owner/profile");
                setProfile(data);
                setHasProfile(true);
                setFormData({
                    displayName: data.displayName || "",
                    companyName: data.companyName || "",
                    phone: data.phone || "",
                    address: data.address || "",
                    billingEmail: data.billingEmail || data.user.email || "",
                    billingAddress: data.billingAddress || "",
                    vatNumber: data.vatNumber || "",
                });
            } catch (error: any) {
                if (error?.statusCode === 404) {
                    setHasProfile(false);
                }
            } finally {
                setIsLoading(false);
            }
        };

        loadProfile();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            if (hasProfile) {
                await api.put("/owner/profile", formData);
                toast.success("Profile updated successfully");
            } else {
                await api.post("/owner/profile", formData);
                setHasProfile(true);
                toast.success("Profile created successfully");
            }
        } catch (error: any) {
            toast.error(error?.message || "Failed to save profile");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            await api.delete("/owner/account");
            toast.success("Account deleted successfully. Redirecting...");

            // Sessions are already deleted on the backend
            // Clear auth cookies manually to prevent stale auth state
            document.cookie = "better-auth.session_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            document.cookie = "better-auth.session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

            // Use hard redirect to clear all React state and force fresh page load
            setTimeout(() => {
                window.location.href = "/";
            }, 1500);
        } catch (error: any) {
            toast.error(error?.message || "Failed to delete account");
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

    return (
        <div className="space-y-6 max-w-3xl">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">
                    Manage your store owner profile and billing information
                </p>
            </div>

            {/* Profile Information */}
            <Card>
                <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>
                        Your personal and business information
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="displayName">Display Name</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="displayName"
                                    placeholder="Your name"
                                    value={formData.displayName}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            displayName: e.target.value,
                                        }))
                                    }
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="companyName">Company Name</Label>
                            <div className="relative">
                                <Building className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="companyName"
                                    placeholder="Your company"
                                    value={formData.companyName}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            companyName: e.target.value,
                                        }))
                                    }
                                    className="pl-10"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="phone"
                                    placeholder="+880 1700 000000"
                                    value={formData.phone}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, phone: e.target.value }))
                                    }
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="address"
                                    placeholder="Your address"
                                    value={formData.address}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            address: e.target.value,
                                        }))
                                    }
                                    className="pl-10"
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Billing Information */}
            <Card>
                <CardHeader>
                    <CardTitle>Billing Information</CardTitle>
                    <CardDescription>
                        Used for invoices and payment receipts
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="billingEmail">Billing Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="billingEmail"
                                    type="email"
                                    placeholder="billing@example.com"
                                    value={formData.billingEmail}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            billingEmail: e.target.value,
                                        }))
                                    }
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="vatNumber">VAT / Tax Number</Label>
                            <Input
                                id="vatNumber"
                                placeholder="Optional"
                                value={formData.vatNumber}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        vatNumber: e.target.value,
                                    }))
                                }
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="billingAddress">Billing Address</Label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="billingAddress"
                                placeholder="Full billing address"
                                value={formData.billingAddress}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        billingAddress: e.target.value,
                                    }))
                                }
                                className="pl-10"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                        </>
                    )}
                </Button>
            </div>

            <Separator className="my-8" />

            {/* Danger Zone */}
            <Card className="border-destructive/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        Danger Zone
                    </CardTitle>
                    <CardDescription>
                        Irreversible actions that affect your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Delete Account</p>
                            <p className="text-sm text-muted-foreground">
                                Permanently deactivate your account and all associated data
                            </p>
                        </div>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" disabled={isDeleting}>
                                    {isDeleting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete Account
                                        </>
                                    )}
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
                                        Delete Your Account?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription asChild>
                                        <div className="space-y-4 pt-2">
                                            <p className="text-muted-foreground">
                                                This action is <span className="font-semibold text-rose-600 dark:text-rose-400">permanent</span> and cannot be undone.
                                                You will lose access to all your stores, data, and settings.
                                            </p>

                                            {/* Warning Box */}
                                            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
                                                <div className="flex items-start gap-3">
                                                    <div className="flex-shrink-0">
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
                                                            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                                        </div>
                                                    </div>
                                                    <div className="text-left text-sm text-amber-800 dark:text-amber-200">
                                                        <p className="font-medium">What will be deleted:</p>
                                                        <ul className="mt-1 list-inside list-disc space-y-0.5 text-amber-700 dark:text-amber-300">
                                                            <li>All stores and their configurations</li>
                                                            <li>Customer and order data</li>
                                                            <li>Payment and billing history</li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Confirmation Input */}
                                            <div className="space-y-2 pt-2">
                                                <p className="text-sm text-foreground">
                                                    Type <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm font-semibold text-rose-600 dark:text-rose-400">delete my account</code> to confirm:
                                                </p>
                                                <Input
                                                    value={deleteConfirmation}
                                                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                                                    placeholder="delete my account"
                                                    className="border-muted-foreground/25 bg-muted/50 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 transition-colors focus-visible:border-rose-500 focus-visible:ring-rose-500/20"
                                                />
                                            </div>
                                        </div>
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="mt-6 gap-2 sm:gap-2">
                                    <AlertDialogCancel
                                        onClick={() => setDeleteConfirmation("")}
                                        className="flex-1 border-muted-foreground/25 bg-transparent hover:bg-muted"
                                    >
                                        Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleDeleteAccount}
                                        disabled={deleteConfirmation !== "delete my account"}
                                        className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-500/25 transition-all hover:from-red-700 hover:to-rose-700 hover:shadow-red-500/40 disabled:from-muted disabled:to-muted disabled:text-muted-foreground disabled:shadow-none"
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete Account
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

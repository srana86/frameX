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
    User,
    Building,
    Phone,
    MapPin,
    Mail,
    Loader2,
    Save,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

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
        </div>
    );
}

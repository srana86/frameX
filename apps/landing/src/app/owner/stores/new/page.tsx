"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import {
    Store,
    ArrowLeft,
    ArrowRight,
    Check,
    Loader2,
    Globe,
    Mail,
    Phone,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

interface FormData {
    name: string;
    email: string;
    slug: string;
    phone: string;
}

const STEPS = [
    { id: 1, title: "Store Details", description: "Basic information" },
    { id: 2, title: "Domain Setup", description: "Choose your domain" },
    { id: 3, title: "Review", description: "Confirm and create" },
];

export default function CreateStorePage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        name: "",
        email: "",
        slug: "",
        phone: "",
    });
    const [errors, setErrors] = useState<Partial<FormData>>({});

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");
    };

    const handleNameChange = (value: string) => {
        setFormData((prev) => ({
            ...prev,
            name: value,
            slug: prev.slug || generateSlug(value),
        }));
    };

    const validateStep = (step: number): boolean => {
        const newErrors: Partial<FormData> = {};

        if (step === 1) {
            if (!formData.name.trim()) {
                newErrors.name = "Store name is required";
            } else if (formData.name.length < 2) {
                newErrors.name = "Store name must be at least 2 characters";
            }

            if (!formData.email.trim()) {
                newErrors.email = "Email is required";
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                newErrors.email = "Invalid email address";
            }
        }

        if (step === 2) {
            if (!formData.slug.trim()) {
                newErrors.slug = "Subdomain is required";
            } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
                newErrors.slug = "Subdomain must be lowercase letters, numbers, and hyphens only";
            } else if (formData.slug.length < 3) {
                newErrors.slug = "Subdomain must be at least 3 characters";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep((prev) => Math.min(prev + 1, 3));
        }
    };

    const handleBack = () => {
        setCurrentStep((prev) => Math.max(prev - 1, 1));
    };

    const handleCreate = async () => {
        setIsCreating(true);
        try {
            await api.post("/owner/stores", formData);
            toast.success("Store created successfully!");
            router.push("/owner/stores");
        } catch (error: any) {
            toast.error(error?.message || "Failed to create store");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <Link
                    href="/owner/stores"
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Stores
                </Link>
                <h1 className="text-3xl font-bold tracking-tight">Create New Store</h1>
                <p className="text-muted-foreground">
                    Set up a new online store in just a few steps
                </p>
            </div>

            {/* Progress Steps */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    {STEPS.map((step, index) => (
                        <div key={step.id} className="flex items-center">
                            <div
                                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${currentStep > step.id
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : currentStep === step.id
                                            ? "border-primary text-primary"
                                            : "border-muted-foreground/30 text-muted-foreground"
                                    }`}
                            >
                                {currentStep > step.id ? (
                                    <Check className="h-5 w-5" />
                                ) : (
                                    step.id
                                )}
                            </div>
                            {index < STEPS.length - 1 && (
                                <div
                                    className={`mx-4 h-1 w-16 rounded ${currentStep > step.id ? "bg-primary" : "bg-muted"
                                        }`}
                                />
                            )}
                        </div>
                    ))}
                </div>
                <div className="mt-2 flex justify-between">
                    {STEPS.map((step) => (
                        <div
                            key={step.id}
                            className={`text-center ${currentStep === step.id
                                    ? "text-foreground"
                                    : "text-muted-foreground"
                                }`}
                        >
                            <p className="text-sm font-medium">{step.title}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Form Card */}
            <Card>
                <CardHeader>
                    <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
                    <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Step 1: Store Details */}
                    {currentStep === 1 && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="name">Store Name *</Label>
                                <div className="relative">
                                    <Store className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="name"
                                        placeholder="My Awesome Store"
                                        value={formData.name}
                                        onChange={(e) => handleNameChange(e.target.value)}
                                        className={`pl-10 ${errors.name ? "border-red-500" : ""}`}
                                    />
                                </div>
                                {errors.name && (
                                    <p className="text-sm text-red-500">{errors.name}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Store Email *</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="store@example.com"
                                        value={formData.email}
                                        onChange={(e) =>
                                            setFormData((prev) => ({ ...prev, email: e.target.value }))
                                        }
                                        className={`pl-10 ${errors.email ? "border-red-500" : ""}`}
                                    />
                                </div>
                                {errors.email && (
                                    <p className="text-sm text-red-500">{errors.email}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone (Optional)</Label>
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
                        </>
                    )}

                    {/* Step 2: Domain Setup */}
                    {currentStep === 2 && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="slug">Subdomain *</Label>
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                        <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="slug"
                                            placeholder="my-store"
                                            value={formData.slug}
                                            onChange={(e) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    slug: e.target.value.toLowerCase(),
                                                }))
                                            }
                                            className={`pl-10 ${errors.slug ? "border-red-500" : ""}`}
                                        />
                                    </div>
                                    <span className="text-muted-foreground whitespace-nowrap">
                                        .framextech.com
                                    </span>
                                </div>
                                {errors.slug && (
                                    <p className="text-sm text-red-500">{errors.slug}</p>
                                )}
                                <p className="text-sm text-muted-foreground">
                                    Your store will be accessible at{" "}
                                    <strong>{formData.slug || "your-store"}.framextech.com</strong>
                                </p>
                            </div>

                            <div className="rounded-lg border bg-muted/30 p-4">
                                <h4 className="font-medium mb-2">Custom Domain</h4>
                                <p className="text-sm text-muted-foreground">
                                    You can add a custom domain (like shop.yourbrand.com) after
                                    creating your store from the store settings.
                                </p>
                            </div>
                        </>
                    )}

                    {/* Step 3: Review */}
                    {currentStep === 3 && (
                        <div className="space-y-4">
                            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Store Name</span>
                                    <span className="font-medium">{formData.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Email</span>
                                    <span className="font-medium">{formData.email}</span>
                                </div>
                                {formData.phone && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Phone</span>
                                        <span className="font-medium">{formData.phone}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Domain</span>
                                    <span className="font-medium">
                                        {formData.slug}.framextech.com
                                    </span>
                                </div>
                            </div>

                            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                                <h4 className="font-medium text-primary mb-2">What&apos;s Next?</h4>
                                <ul className="text-sm text-muted-foreground space-y-1">
                                    <li>• Your store will be created with a free trial</li>
                                    <li>• Add products and customize your store</li>
                                    <li>• Choose a subscription plan to go live</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex justify-between pt-4 border-t">
                        <Button
                            variant="outline"
                            onClick={handleBack}
                            disabled={currentStep === 1}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>

                        {currentStep < 3 ? (
                            <Button onClick={handleNext}>
                                Next
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        ) : (
                            <Button onClick={handleCreate} disabled={isCreating}>
                                {isCreating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Check className="mr-2 h-4 w-4" />
                                        Create Store
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

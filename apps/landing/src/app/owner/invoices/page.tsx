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
    Receipt,
    Download,
    Loader2,
    ExternalLink,
    Calendar,
} from "lucide-react";
import { api } from "@/lib/api-client";

interface Invoice {
    id: string;
    invoiceNumber: string;
    amount: number;
    currency: string;
    status: string;
    dueDate?: string;
    paidAt?: string;
    description?: string;
    items?: Array<{
        storeId: string;
        storeName: string;
        amount: number;
    }>;
    createdAt: string;
}

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadInvoices = async () => {
            try {
                const data = await api.get<Invoice[]>("/owner/invoices");
                setInvoices(data);
            } catch (error) {
                console.error("Failed to load invoices:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadInvoices();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "PAID":
                return "bg-green-100 text-green-700 border-green-200";
            case "PENDING":
                return "bg-yellow-100 text-yellow-700 border-yellow-200";
            case "OVERDUE":
                return "bg-red-100 text-red-700 border-red-200";
            default:
                return "bg-gray-100 text-gray-700 border-gray-200";
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
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
                <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
                <p className="text-muted-foreground">
                    View and download your billing history
                </p>
            </div>

            {/* Invoices List */}
            {invoices.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Receipt className="h-12 w-12 text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-medium mb-2">No invoices yet</h3>
                        <p className="text-muted-foreground text-center">
                            Your invoices will appear here once you have active subscriptions
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Billing History</CardTitle>
                        <CardDescription>
                            All invoices for your store subscriptions
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="divide-y">
                            {invoices.map((invoice) => (
                                <div
                                    key={invoice.id}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-4"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                                            <Receipt className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">
                                                    {invoice.invoiceNumber}
                                                </span>
                                                <Badge
                                                    variant="outline"
                                                    className={getStatusColor(invoice.status)}
                                                >
                                                    {invoice.status}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                                <Calendar className="h-3 w-3" />
                                                <span>{formatDate(invoice.createdAt)}</span>
                                                {invoice.description && (
                                                    <>
                                                        <span>•</span>
                                                        <span>{invoice.description}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className="font-semibold">
                                                {invoice.currency} {invoice.amount.toFixed(2)}
                                            </div>
                                            {invoice.paidAt && (
                                                <div className="text-xs text-muted-foreground">
                                                    Paid on {formatDate(invoice.paidAt)}
                                                </div>
                                            )}
                                        </div>
                                        <Button variant="ghost" size="sm">
                                            <Download className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

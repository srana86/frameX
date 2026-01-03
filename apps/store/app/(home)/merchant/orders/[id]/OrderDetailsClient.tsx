"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Order, Product, OrderStatus, OrderType, PaymentStatus } from "@/lib/types";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Info, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { useCurrencySymbol } from "@/hooks/use-currency";
import { format } from "date-fns";
import { generateReceiptHTML } from "@/utils";
import type { CourierServicesConfig, CourierService } from "@/types/delivery-config-types";
import type { FraudCheckData } from "@/lib/types";
import { getRiskBadgeColor, type FraudRiskLevel } from "@/lib/fraud-check/common";
import { transformOnecodesoftResponse, type OnecodesoftFraudCheckResponse } from "@/lib/fraud-check/fraudshield-api";
import { OrderHeader } from "./OrderHeader";
import { MobileFloatingNav } from "./MobileFloatingNav";
import { KeyMetrics } from "./KeyMetrics";
import { OrderItemsCard } from "./OrderItemsCard";
import { PaymentSummaryCard } from "./PaymentSummaryCard";
import { DeliveryInfoCard } from "./DeliveryInfoCard";
import { CustomerInfoCard } from "./CustomerInfoCard";
import { OrderSettingsCard } from "./OrderSettingsCard";
import { OrderNotesCard } from "./OrderNotesCard";
import { OrderTimeline } from "./OrderTimeline";
import { DeliveryDialog } from "./DeliveryDialog";
import { RemoveCourierDialog } from "./RemoveCourierDialog";
import { ReplaceCourierDialog } from "./ReplaceCourierDialog";
import { ManualDeliveryDialog } from "./ManualDeliveryDialog";

interface OrderDetailsClientProps {
  initialOrder: Order;
  products: Product[];
  prevOrderId?: string | null;
  nextOrderId?: string | null;
}

const orderStatusOptions: OrderStatus[] = [
  "pending",
  "waiting_for_confirmation",
  "confirmed",
  "processing",
  "restocking",
  "packed",
  "sent_to_logistics",
  "shipped",
  "delivered",
  "cancelled",
];
const orderTypeOptions: OrderType[] = ["online", "offline"];
const paymentStatusOptions: PaymentStatus[] = ["pending", "completed", "failed", "cancelled", "refunded"];

const deliveryFormSchema = z.object({
  recipientName: z.string().min(2, "Recipient name is required"),
  recipientPhone: z.string().min(8, "Recipient phone is required"),
  recipientAddress: z.string().min(10, "Recipient address must be at least 10 characters"),
  city: z.string().min(1, "City is required"),
  zone: z.string().optional(),
  area: z.string().min(1, "Area is required"),
  amountToCollect: z.coerce.number().nonnegative("Amount must be 0 or greater"),
  itemWeight: z.coerce.number().positive("Item weight must be greater than 0"),
  specialInstruction: z.string().optional(),
});

export function OrderDetailsClient({ initialOrder, products, prevOrderId, nextOrderId }: OrderDetailsClientProps) {
  const currencySymbol = useCurrencySymbol();
  const [order, setOrder] = useState<Order>({
    ...initialOrder,
    orderType: initialOrder.orderType || "online", // Default to "online" if not set
    discountPercentage: initialOrder.discountPercentage ?? 0,
    discountAmount: initialOrder.discountAmount ?? 0,
    vatTaxPercentage: initialOrder.vatTaxPercentage ?? 0,
    vatTaxAmount: initialOrder.vatTaxAmount ?? 0,
    paidAmount: initialOrder.paidAmount ?? (initialOrder.paymentStatus === "completed" ? initialOrder.total : 0),
  });
  const [saving, setSaving] = useState(false);
  const [productMap, setProductMap] = useState<Map<string, Product>>(new Map());
  const [courierServices, setCourierServices] = useState<CourierService[]>([]);
  const [loadingCouriers, setLoadingCouriers] = useState<boolean>(true);
  const [selectedCourierId, setSelectedCourierId] = useState<string>(initialOrder.courier?.serviceId || "");
  const [consignmentId, setConsignmentId] = useState<string>(initialOrder.courier?.consignmentId || "");
  const [deliveryStatus, setDeliveryStatus] = useState<string>(initialOrder.courier?.deliveryStatus || "");
  const [syncingCourier, setSyncingCourier] = useState<boolean>(false);
  const [sendingCourier, setSendingCourier] = useState<boolean>(false);
  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false);
  const [removeCourierDialogOpen, setRemoveCourierDialogOpen] = useState(false);
  const [replaceCourierDialogOpen, setReplaceCourierDialogOpen] = useState(false);
  const [manualDeliveryDialogOpen, setManualDeliveryDialogOpen] = useState(false);
  const [addingManualCourier, setAddingManualCourier] = useState(false);
  const [fraudData, setFraudData] = useState<FraudCheckData | null>(null);
  const [loadingFraud, setLoadingFraud] = useState(false);
  const [fraudError, setFraudError] = useState<string | null>(null);
  const [savingFraud, setSavingFraud] = useState(false);
  const [isCustomerBlocked, setIsCustomerBlocked] = useState(false);
  const [blockingCustomer, setBlockingCustomer] = useState(false);

  const deliveryForm = useForm({
    resolver: zodResolver(deliveryFormSchema),
    defaultValues: {
      recipientName: initialOrder.customer.fullName,
      recipientPhone: initialOrder.customer.phone,
      recipientAddress: initialOrder.customer.addressLine1,
      city: "",
      area: "",
      // If payment is completed, do not collect any amount from courier.
      amountToCollect: initialOrder.paymentStatus === "completed" ? 0 : initialOrder.paymentMethod === "cod" ? initialOrder.total : 0,
      itemWeight: 1,
      specialInstruction: initialOrder.customer.notes || "",
    },
  });

  // Calculate totals - memoized calculation
  const calculateTotals = useMemo(() => {
    const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Calculate discount amount - use percentage if set, otherwise use amount
    let discountAmount = order.discountAmount ?? 0;
    if (order.discountPercentage && order.discountPercentage > 0) {
      discountAmount = (subtotal * order.discountPercentage) / 100;
    }

    // Calculate subtotal after discount
    const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);

    // Calculate VAT/TAX amount - use percentage if set, otherwise use amount
    let vatTaxAmount = order.vatTaxAmount ?? 0;
    if (order.vatTaxPercentage && order.vatTaxPercentage > 0) {
      vatTaxAmount = (subtotalAfterDiscount * order.vatTaxPercentage) / 100;
    }

    // Calculate total
    const total = subtotalAfterDiscount + vatTaxAmount + (order.shipping || 0);

    return { subtotal, discountAmount, vatTaxAmount, total };
  }, [order.items, order.discountPercentage, order.discountAmount, order.vatTaxPercentage, order.vatTaxAmount, order.shipping]);

  // Update order totals when calculations change
  useEffect(() => {
    if (
      Math.abs(order.subtotal - calculateTotals.subtotal) > 0.01 ||
      Math.abs((order.discountAmount ?? 0) - calculateTotals.discountAmount) > 0.01 ||
      Math.abs((order.vatTaxAmount ?? 0) - calculateTotals.vatTaxAmount) > 0.01 ||
      Math.abs(order.total - calculateTotals.total) > 0.01
    ) {
      setOrder((prev) => ({
        ...prev,
        subtotal: calculateTotals.subtotal,
        discountAmount: calculateTotals.discountAmount,
        vatTaxAmount: calculateTotals.vatTaxAmount,
        total: calculateTotals.total,
      }));
    }
  }, [calculateTotals]);

  useEffect(() => {
    const map = new Map<string, Product>();
    products.forEach((product) => {
      map.set(product.id, product);
    });
    setProductMap(map);
  }, [products]);

  // Load active courier services for this merchant
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoadingCouriers(true);
        const res = await fetch("/api/delivery-config?type=courier", { cache: "no-store" });
        if (!res.ok) {
          throw new Error("Failed to load courier services");
        }
        const data = (await res.json()) as CourierServicesConfig;
        if (!active) return;
        // Supported courier services in this dashboard (including Paperfly)
        const supportedIds = new Set<string>(["pathao", "redx", "steadfast", "paperfly"]);
        const activeServices = (data.services || []).filter((s) => s.enabled && supportedIds.has(s.id));
        setCourierServices(activeServices);
        if (!selectedCourierId && activeServices.length === 1) {
          setSelectedCourierId(activeServices[0].id);
        }
      } catch (error) {
        console.error("Failed to load courier services config", error);
        toast.error("Failed to load courier services");
      } finally {
        if (active) {
          setLoadingCouriers(false);
        }
      }
    })();
    return () => {
      active = false;
    };
    // We intentionally exclude selectedCourierId from deps to avoid resetting it after user change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order),
      });

      if (!res.ok) {
        throw new Error("Failed to save order");
      }

      const updatedOrder = await res.json();
      setOrder(updatedOrder);
      toast.success("Order updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to save order");
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async () => {
    try {
      toast.loading("Generating PDF receipt...", { id: "receipt-download" });

      // Fetch receipt data
      const res = await fetch(`/api/orders/${order.id}/receipt`);
      if (!res.ok) {
        throw new Error("Failed to fetch receipt data");
      }

      const data = await res.json();
      const { order: receiptOrder, brandConfig, totals } = data;

      // Generate HTML receipt
      const receiptHTML = generateReceiptHTML(receiptOrder, brandConfig, totals, currencySymbol);

      // Create a temporary iframe for better HTML rendering
      const iframe = document.createElement("iframe");
      iframe.style.position = "absolute";
      iframe.style.left = "-9999px";
      iframe.style.width = "800px";
      iframe.style.border = "none";
      document.body.appendChild(iframe);

      // Write HTML to iframe
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        throw new Error("Failed to access iframe document");
      }

      iframeDoc.open();
      iframeDoc.write(receiptHTML);
      iframeDoc.close();

      // Wait for content to render and images to load
      await new Promise<void>((resolve) => {
        const checkLoad = () => {
          if (iframe.contentWindow) {
            iframe.contentWindow.onload = () => {
              setTimeout(resolve, 1000); // Extra time for images
            };
          }
        };
        checkLoad();
        // Fallback timeout in case onload doesn't fire
        setTimeout(resolve, 2000);
      });

      // Get the body element from iframe
      const iframeBody = iframeDoc.body;
      if (!iframeBody) {
        throw new Error("Failed to access iframe body");
      }

      // Convert HTML to canvas
      const canvas = await html2canvas(iframeBody, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        width: 800,
        windowWidth: 800,
      });

      // Remove temporary iframe
      document.body.removeChild(iframe);

      // Create PDF
      const imgData = canvas.toDataURL("image/png", 1.0);
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = pdfWidth / imgWidth;
      const imgScaledWidth = imgWidth * ratio;
      const imgScaledHeight = imgHeight * ratio;

      // Add image to PDF
      let heightLeft = imgScaledHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, "PNG", 0, position, imgScaledWidth, imgScaledHeight);
      heightLeft -= pdfHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgScaledHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgScaledWidth, imgScaledHeight);
        heightLeft -= pdfHeight;
      }

      // Save PDF
      pdf.save(`receipt-${order.id.slice(-7)}-${new Date().toISOString().split("T")[0]}.pdf`);

      toast.success("PDF receipt downloaded successfully!", { id: "receipt-download" });
    } catch (error: any) {
      console.error("Error generating PDF:", error);
      toast.error(error.message || "Failed to download PDF receipt", { id: "receipt-download" });
    }
  };

  const handlePrint = async () => {
    try {
      toast.loading("Preparing receipt for printing...", { id: "receipt-print" });

      // Fetch receipt data
      const res = await fetch(`/api/orders/${order.id}/receipt`);
      if (!res.ok) {
        throw new Error("Failed to fetch receipt data");
      }

      const data = await res.json();
      const { order: receiptOrder, brandConfig, totals } = data;

      // Generate HTML receipt
      const receiptHTML = generateReceiptHTML(receiptOrder, brandConfig, totals, currencySymbol);

      // Create a new window for printing
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        throw new Error("Please allow popups to print receipt");
      }

      printWindow.document.write(receiptHTML);
      printWindow.document.close();

      // Wait for content to load, then print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          toast.success("Receipt ready for printing!", { id: "receipt-print" });
        }, 500);
      };
    } catch (error: any) {
      console.error("Error printing receipt:", error);
      toast.error(error.message || "Failed to print receipt", { id: "receipt-print" });
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const updateItemQuantity = (itemIndex: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    const updatedItems = [...order.items];
    updatedItems[itemIndex] = {
      ...updatedItems[itemIndex],
      quantity: newQuantity,
    };
    const newSubtotal = updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    setOrder({
      ...order,
      items: updatedItems,
      subtotal: newSubtotal,
      total: newSubtotal + order.shipping,
    });
  };

  const getStatusColor = (status: OrderStatus) => {
    const colors: Record<OrderStatus, string> = {
      pending: "bg-amber-100 text-amber-800 border-amber-200",
      waiting_for_confirmation: "bg-yellow-100 text-yellow-800 border-yellow-200",
      confirmed: "bg-cyan-100 text-cyan-800 border-cyan-200",
      processing: "bg-blue-100 text-blue-800 border-blue-200",
      restocking: "bg-orange-100 text-orange-800 border-orange-200",
      packed: "bg-purple-100 text-purple-800 border-purple-200",
      sent_to_logistics: "bg-indigo-100 text-indigo-800 border-indigo-200",
      shipped: "bg-violet-100 text-violet-800 border-violet-200",
      delivered: "bg-green-100 text-green-800 border-green-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
    };
    return colors[status] || colors.pending;
  };

  const getPaymentStatusColor = (status: PaymentStatus) => {
    const colors: Record<PaymentStatus, string> = {
      pending: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
      completed: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
      failed: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
      cancelled: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
      refunded: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
    };
    return colors[status] || colors.pending;
  };

  const getPaymentStatusLabel = (status: PaymentStatus) => {
    const labels: Record<PaymentStatus, string> = {
      pending: "Pending",
      completed: "Fully Paid",
      failed: "Failed",
      cancelled: "Cancelled",
      refunded: "Refunded",
    };
    return labels[status] || "Pending";
  };

  const getStatusLabel = (status: OrderStatus) => {
    const labels: Record<OrderStatus, string> = {
      pending: "Order Placed",
      waiting_for_confirmation: "Waiting for Confirmation",
      confirmed: "Confirmed",
      processing: "Processing",
      restocking: "Restocking",
      packed: "Packed",
      sent_to_logistics: "Sent to Logistics",
      shipped: "Shipped",
      delivered: "Delivered",
      cancelled: "Cancelled",
    };
    return labels[status] || status;
  };

  const digitalReceiptUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/receipt/${order.id}${Date.now()}`;

  // Wrapper functions for component callbacks
  const handleUpdateItemPrice = (index: number, price: number) => {
    const updatedItems = [...order.items];
    updatedItems[index] = { ...updatedItems[index], price };
    const newSubtotal = updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    setOrder({
      ...order,
      items: updatedItems,
      subtotal: newSubtotal,
      total: newSubtotal + order.shipping,
    });
  };

  const handleUpdateItemQuantity = (index: number, quantity: number) => {
    if (quantity < 1) return;
    updateItemQuantity(index, quantity);
  };

  const handleUpdateShipping = (shipping: number) => {
    const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const subtotalAfterDiscount = subtotal - (order.discountAmount ?? 0);
    const total = subtotalAfterDiscount + (order.vatTaxAmount ?? 0) + shipping;
    setOrder({
      ...order,
      shipping,
      total,
    });
  };

  const handleUpdatePaidAmount = (paidAmount: number, paymentStatus: PaymentStatus) => {
    setOrder({
      ...order,
      paidAmount,
      paymentStatus,
    });
  };

  const handleUpdateCustomer = async (updates: Partial<Order["customer"]>) => {
    const updatedOrder = {
      ...order,
      customer: { ...order.customer, ...updates },
    };

    // Update local state immediately
    setOrder(updatedOrder);

    // Save to database
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedOrder),
      });

      if (!res.ok) {
        throw new Error("Failed to save customer information");
      }

      const savedOrder = await res.json();
      setOrder(savedOrder);
    } catch (error: any) {
      // Revert local state on error
      setOrder(order);
      toast.error(error.message || "Failed to save customer information");
      throw error;
    }
  };

  const handleUpdateOrderType = (orderType: OrderType) => {
    setOrder({ ...order, orderType });
  };

  const handleUpdateOrderStatus = (status: OrderStatus) => {
    setOrder({ ...order, status });
  };

  const handleUpdatePaymentStatus = (status: PaymentStatus, paidAmount: number) => {
    setOrder({
      ...order,
      paymentStatus: status,
      paidAmount,
    });
  };

  const handleUpdateNotes = (notes: string) => {
    setOrder({
      ...order,
      customer: { ...order.customer, notes },
    });
  };

  const syncCourierStatus = async (options?: { silent?: boolean }) => {
    if (!selectedCourierId || !consignmentId.trim()) {
      return;
    }

    const silent = options?.silent ?? false;
    setSyncingCourier(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/courier`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: selectedCourierId,
          consignmentId: consignmentId.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Failed to fetch courier status");
      }

      const data = await res.json();
      setDeliveryStatus(data.deliveryStatus || "");
      setOrder((prev) => ({
        ...prev,
        courier: {
          serviceId: data.serviceId,
          serviceName: data.serviceName,
          consignmentId: data.consignmentId,
          deliveryStatus: data.deliveryStatus,
          lastSyncedAt: data.lastSyncedAt,
        },
      }));
      if (!silent) {
        toast.success("Courier status updated");
      }
    } catch (error: any) {
      if (!silent) {
        toast.error(error?.message || "Failed to update courier status");
      }
    } finally {
      setSyncingCourier(false);
    }
  };

  // Auto-sync courier status in real time when consignment is present
  useEffect(() => {
    if (!selectedCourierId || !consignmentId) return;

    let stopped = false;

    const run = async () => {
      if (stopped) return;
      await syncCourierStatus({ silent: true });
    };

    // Initial sync
    run();

    // Poll every 30 seconds while the details page is open
    const intervalId = setInterval(run, 30000);

    return () => {
      stopped = true;
      clearInterval(intervalId);
    };
  }, [selectedCourierId, consignmentId]);

  // Function to check fraud and auto-save to order
  const checkFraudAndSave = async (forceRefresh = false) => {
    if (!order.customer?.phone) return;

    setLoadingFraud(true);
    setFraudError(null);

    try {
      const res = await fetch("/api/merchant/fraud-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: order.customer.phone.trim() }),
      });

      const data = await res.json();

      let fraudInfo: FraudCheckData | null = null;

      // Handle Onecodesoft API response structure (from super-admin)
      if (data.success && data.data) {
        // Check if it's the new Onecodesoft format
        if (data.data.total_parcel !== undefined && data.data.response !== undefined) {
          // Transform Onecodesoft response to CustomerFraudData format
          fraudInfo = {
            ...transformOnecodesoftResponse(data.data as OnecodesoftFraudCheckResponse),
            checkedAt: new Date().toISOString(),
          };
        } else if (data.data.total_parcels !== undefined) {
          // Already in CustomerFraudData format (backward compatibility)
          fraudInfo = {
            ...data.data,
            checkedAt: new Date().toISOString(),
          };
        }
      } else if (data.status === "success" && data.courierData) {
        // Handle old legacy API response structure (backward compatibility)
        const summary = data.courierData.summary;
        const successRate = summary.success_ratio;
        const fraud_risk: FraudRiskLevel = successRate >= 90 ? "low" : successRate >= 70 ? "medium" : "high";

        const courier_history = Object.entries(data.courierData)
          .filter(([key]) => key !== "summary")
          .map(([key, item]: [string, any]) => {
            if ("name" in item && "logo" in item) {
              return {
                courier: item.name,
                total: item.total_parcel,
                successful: item.success_parcel,
                failed: item.cancelled_parcel,
                success_rate: item.success_ratio,
                logo: item.logo,
              };
            }
            return null;
          })
          .filter((item): item is NonNullable<typeof item> => item !== null && item.total > 0);

        fraudInfo = {
          phone: order.customer.phone,
          total_parcels: summary.total_parcel,
          successful_deliveries: summary.success_parcel,
          failed_deliveries: summary.cancelled_parcel,
          success_rate: successRate,
          fraud_risk,
          courier_history,
          checkedAt: new Date().toISOString(),
        };
      }

      if (!fraudInfo) {
        setFraudError(data.message || "Failed to retrieve fraud data");
        return;
      }

      // Update local state
      setFraudData(fraudInfo);

      // Auto-save fraud data to order
      if (fraudInfo) {
        setSavingFraud(true);
        try {
          const saveRes = await fetch(`/api/orders/${order.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...order,
              fraudCheck: fraudInfo,
            }),
          });

          if (!saveRes.ok) {
            throw new Error("Failed to save fraud data");
          }

          // Update local order state
          setOrder((prev) => ({
            ...prev,
            fraudCheck: fraudInfo,
          }));

          toast.success("Fraud check completed and saved", { duration: 2000 });
        } catch (saveError: any) {
          console.error("Failed to save fraud data:", saveError);
          toast.error("Fraud check completed but failed to save. Please save manually.", { duration: 3000 });
        } finally {
          setSavingFraud(false);
        }
      }
    } catch (error: any) {
      setFraudError("Failed to check customer fraud data");
      console.error("Fraud check error:", error);
      toast.error("Failed to check fraud data", { duration: 3000 });
    } finally {
      setLoadingFraud(false);
    }
  };

  // Use stored fraud data if available, otherwise fetch fresh data
  useEffect(() => {
    // If fraudCheck data is already stored in order, use it
    if ((order as any).fraudCheck) {
      setFraudData((order as any).fraudCheck);
      setLoadingFraud(false);
      return;
    }

    // Otherwise, fetch fresh fraud data
    checkFraudAndSave(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order.customer?.phone]);

  // Check if customer is blocked on load
  useEffect(() => {
    const checkBlockStatus = async () => {
      if (!order.customer?.phone) return;

      try {
        const res = await fetch("/api/blocked-customers/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: order.customer.phone,
            email: order.customer.email,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setIsCustomerBlocked(data.isBlocked);
        }
      } catch (error) {
        console.error("Error checking block status:", error);
      }
    };

    checkBlockStatus();
  }, [order.customer?.phone, order.customer?.email]);

  // Function to block/unblock customer
  const handleToggleFraudBlock = async (block: boolean) => {
    if (!order.customer?.phone) {
      toast.error("Customer phone number is required to block");
      return;
    }

    setBlockingCustomer(true);
    try {
      if (block) {
        // Block the customer
        const res = await fetch("/api/blocked-customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: order.customer.phone,
            email: order.customer.email,
            customerName: order.customer.fullName,
            reason: "fraud",
            notes: `Marked as fraud from order #${order.id}`,
            orderId: order.id,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to block customer");
        }

        setIsCustomerBlocked(true);
        toast.success("Customer blocked successfully. They cannot place new orders.");
      } else {
        // Find and unblock the customer
        const checkRes = await fetch(`/api/blocked-customers?phone=${encodeURIComponent(order.customer.phone)}`);
        if (!checkRes.ok) throw new Error("Failed to find blocked customer");

        const checkData = await checkRes.json();
        if (checkData.customer?.id) {
          const res = await fetch(`/api/blocked-customers/${checkData.customer.id}`, {
            method: "DELETE",
          });

          if (!res.ok) {
            throw new Error("Failed to unblock customer");
          }
        }

        setIsCustomerBlocked(false);
        toast.success("Customer unblocked. They can place orders again.");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update block status";
      toast.error(message);
      // Revert the switch state
      setIsCustomerBlocked(!block);
    } finally {
      setBlockingCustomer(false);
    }
  };

  const handleRemoveCourier = async () => {
    if (!order.courier?.consignmentId) {
      return;
    }

    // Close any other open dialogs first
    setReplaceCourierDialogOpen(false);
    setDeliveryDialogOpen(false);
    setRemoveCourierDialogOpen(true);
  };

  const confirmRemoveCourier = async () => {
    setRemoveCourierDialogOpen(false);
    try {
      const res = await fetch(`/api/orders/${order.id}/courier`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Failed to remove courier service");
      }

      // Update local state immediately to hide remove button and change button text
      setOrder((prev) => ({
        ...prev,
        courier: undefined,
      }));
      setConsignmentId("");
      setDeliveryStatus("");
      // Keep selectedCourierId so user can easily send a new one
      toast.success("Courier service removed successfully. You can now select a new one.");
    } catch (error: any) {
      toast.error(error.message || "Failed to remove courier service");
      // Re-open dialog if there was an error
      setRemoveCourierDialogOpen(true);
    }
  };

  const openDeliveryDialog = () => {
    deliveryForm.reset({
      recipientName: order.customer.fullName,
      recipientPhone: order.customer.phone,
      recipientAddress: order.customer.addressLine1,
      city: "",
      area: "",
      amountToCollect: order.paymentStatus === "completed" ? 0 : order.paymentMethod === "cod" ? order.total : 0,
      itemWeight: 1,
      specialInstruction: order.customer.notes || "",
    });
    setDeliveryDialogOpen(true);
  };

  const handleSendCourierOrder = async () => {
    if (!selectedCourierId) {
      toast.error("Please select a delivery service provider");
      return;
    }

    // If courier already exists, show replace dialog
    if (order.courier?.consignmentId) {
      const isCancelled = deliveryStatus.toLowerCase().includes("cancelled") || order.status === "cancelled";
      if (isCancelled) {
        // For cancelled orders, auto-remove and proceed
        try {
          const res = await fetch(`/api/orders/${order.id}/courier`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
          });

          if (!res.ok) {
            const err = await res.json().catch(() => null);
            throw new Error(err?.error || "Failed to remove courier service");
          }

          // Update local state immediately
          setOrder((prev) => ({
            ...prev,
            courier: undefined,
          }));
          setConsignmentId("");
          setDeliveryStatus("");

          // Wait for state to update, then open delivery dialog
          setTimeout(() => {
            openDeliveryDialog();
          }, 150);
        } catch (error: any) {
          toast.error(error.message || "Failed to remove courier service");
        }
      } else {
        // For active orders, ask for confirmation
        setReplaceCourierDialogOpen(true);
      }
      return;
    }

    // No existing courier, open dialog directly
    openDeliveryDialog();
  };

  const confirmReplaceCourier = async () => {
    setReplaceCourierDialogOpen(false);

    try {
      const res = await fetch(`/api/orders/${order.id}/courier`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Failed to remove courier service");
      }

      // Update local state immediately
      setOrder((prev) => ({
        ...prev,
        courier: undefined,
      }));
      setConsignmentId("");
      setDeliveryStatus("");

      // Wait a bit for state to update, then open delivery dialog
      setTimeout(() => {
        openDeliveryDialog();
      }, 150);
    } catch (error: any) {
      toast.error(error.message || "Failed to remove courier service");
      // Re-open dialog if there was an error
      setReplaceCourierDialogOpen(true);
    }
  };

  const handleSubmitDelivery = async (values: any) => {
    if (!selectedCourierId) {
      toast.error("Please select a delivery service provider");
      return;
    }

    // Allow replacing courier if it was removed or doesn't exist
    // (The removal should have been handled in handleSendCourierOrder)

    setSendingCourier(true);
    try {
      // Send delivery details for all couriers (from modal form)
      const payload = {
        serviceId: selectedCourierId,
        deliveryDetails: {
          ...values,
          amountToCollect: Number(values.amountToCollect ?? 0),
          itemWeight: Number(values.itemWeight ?? 0),
        },
      };

      const res = await fetch(`/api/orders/${order.id}/courier/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Failed to send delivery order");
      }

      const data = await res.json();
      setConsignmentId(data.consignmentId || "");
      setDeliveryStatus(data.deliveryStatus || "");
      setOrder((prev) => ({
        ...prev,
        courier: {
          serviceId: data.serviceId,
          serviceName: data.serviceName,
          consignmentId: data.consignmentId,
          deliveryStatus: data.deliveryStatus,
          lastSyncedAt: data.lastSyncedAt,
        },
      }));
      toast.success("Delivery request created successfully");
      setDeliveryDialogOpen(false);
    } catch (error: any) {
      toast.error(error?.message || "Failed to create courier delivery order");
    } finally {
      setSendingCourier(false);
    }
  };

  const handleManualAddDelivery = async (serviceId: string, consignmentId: string) => {
    setAddingManualCourier(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/courier`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId,
          consignmentId,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Failed to add delivery partner");
      }

      const data = await res.json();
      setSelectedCourierId(data.serviceId);
      setConsignmentId(data.consignmentId || "");
      setDeliveryStatus(data.deliveryStatus || "");
      setOrder((prev) => ({
        ...prev,
        courier: {
          serviceId: data.serviceId,
          serviceName: data.serviceName,
          consignmentId: data.consignmentId,
          deliveryStatus: data.deliveryStatus,
          lastSyncedAt: data.lastSyncedAt,
          rawStatus: data.rawStatus,
        },
      }));
      toast.success("Delivery partner added successfully. Order updated with current delivery status.");
    } catch (error: any) {
      toast.error(error?.message || "Failed to add delivery partner");
      throw error; // Re-throw so dialog can handle it
    } finally {
      setAddingManualCourier(false);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-background via-background to-muted/30 animate-in fade-in duration-300'>
      <OrderHeader 
          saving={saving} 
          orderId={order.id}
          customOrderId={order.customOrderId}
          orderDate={order.createdAt}
          orderStatus={order.status}
          prevOrderId={prevOrderId}
          nextOrderId={nextOrderId}
          onSave={handleSave} 
          onDownload={handleDownload} 
          onPrint={handlePrint} 
        />

      {/* Main Content with Modern Layout */}
      <div className='w-full mx-auto py-4 sm:py-6 lg:py-8 pb-52 sm:pb-8'>
        <KeyMetrics order={order} calculateTotals={calculateTotals} currencySymbol={currencySymbol} />

        {/* Main Grid Layout - Fully Responsive */}
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 lg:gap-6'>
          {/* Mobile-First Layout: Important info first */}
          <div className='lg:hidden space-y-4'>
            {/* Customer Information Card - First on mobile */}
            <CustomerInfoCard
              order={order}
              fraudData={fraudData}
              loadingFraud={loadingFraud}
              savingFraud={savingFraud}
              fraudError={fraudError}
              isCustomerBlocked={isCustomerBlocked}
              blockingCustomer={blockingCustomer}
              onUpdateCustomer={handleUpdateCustomer}
              onCheckFraud={checkFraudAndSave}
              onToggleFraudBlock={handleToggleFraudBlock}
            />

            {/* Order Notes Card - Second on mobile (important for context) */}
            <OrderNotesCard order={order} onUpdateNotes={handleUpdateNotes} />

            {/* Order Settings Card - Third on mobile */}
            <OrderSettingsCard
              order={order}
              currencySymbol={currencySymbol}
              orderStatusOptions={orderStatusOptions}
              orderTypeOptions={orderTypeOptions}
              paymentStatusOptions={paymentStatusOptions}
              getStatusLabel={getStatusLabel}
              onUpdateOrderType={handleUpdateOrderType}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onUpdatePaymentStatus={handleUpdatePaymentStatus}
            />

            {/* Order Items Card */}
            <OrderItemsCard
              order={order}
              productMap={productMap}
              currencySymbol={currencySymbol}
              onUpdateItemPrice={handleUpdateItemPrice}
              onUpdateItemQuantity={handleUpdateItemQuantity}
              getPaymentStatusColor={getPaymentStatusColor}
              getPaymentStatusLabel={getPaymentStatusLabel}
              getStatusColor={getStatusColor}
              getStatusLabel={getStatusLabel}
            />

            {/* Payment Summary Card */}
            <PaymentSummaryCard
              order={order}
              calculateTotals={calculateTotals}
              currencySymbol={currencySymbol}
              getPaymentStatusColor={getPaymentStatusColor}
              getPaymentStatusLabel={getPaymentStatusLabel}
              onUpdateShipping={handleUpdateShipping}
              onUpdatePaidAmount={handleUpdatePaidAmount}
            />

            {/* Delivery Information Card */}
            <DeliveryInfoCard
              order={order}
              courierServices={courierServices}
              loadingCouriers={loadingCouriers}
              selectedCourierId={selectedCourierId}
              consignmentId={consignmentId}
              deliveryStatus={deliveryStatus}
              syncingCourier={syncingCourier}
              sendingCourier={sendingCourier}
              onSelectCourier={setSelectedCourierId}
              onRemoveCourier={handleRemoveCourier}
              onSendCourierOrder={handleSendCourierOrder}
              onCopyToClipboard={copyToClipboard}
              onManualAdd={() => setManualDeliveryDialogOpen(true)}
              customOrderId={order.customOrderId}
            />

            {/* Order Timeline Card - Last on mobile */}
            <OrderTimeline timeline={order.timeline || []} currentStatus={order.status} createdAt={order.createdAt} />
          </div>

          {/* Desktop Layout: Left Column - Main Content (8 columns) */}
          <div className='hidden lg:block lg:col-span-8 space-y-5 lg:space-y-6'>
            <OrderItemsCard
              order={order}
              productMap={productMap}
              currencySymbol={currencySymbol}
              onUpdateItemPrice={handleUpdateItemPrice}
              onUpdateItemQuantity={handleUpdateItemQuantity}
              getPaymentStatusColor={getPaymentStatusColor}
              getPaymentStatusLabel={getPaymentStatusLabel}
              getStatusColor={getStatusColor}
              getStatusLabel={getStatusLabel}
            />

            {/* Payment & Financial Summary Card */}
            <PaymentSummaryCard
              order={order}
              calculateTotals={calculateTotals}
              currencySymbol={currencySymbol}
              getPaymentStatusColor={getPaymentStatusColor}
              getPaymentStatusLabel={getPaymentStatusLabel}
              onUpdateShipping={handleUpdateShipping}
              onUpdatePaidAmount={handleUpdatePaidAmount}
            />

            {/* Delivery Information Card */}
            <DeliveryInfoCard
              order={order}
              courierServices={courierServices}
              loadingCouriers={loadingCouriers}
              selectedCourierId={selectedCourierId}
              consignmentId={consignmentId}
              deliveryStatus={deliveryStatus}
              syncingCourier={syncingCourier}
              sendingCourier={sendingCourier}
              onSelectCourier={setSelectedCourierId}
              onRemoveCourier={handleRemoveCourier}
              onSendCourierOrder={handleSendCourierOrder}
              onCopyToClipboard={copyToClipboard}
              onManualAdd={() => setManualDeliveryDialogOpen(true)}
              customOrderId={order.customOrderId}
            />
          </div>

          {/* Desktop Layout: Right Column - Sidebar (4 columns) */}
          <div className='hidden lg:block lg:col-span-4 space-y-5 lg:space-y-6'>
            {/* Customer Information Card */}
            <CustomerInfoCard
              order={order}
              fraudData={fraudData}
              loadingFraud={loadingFraud}
              savingFraud={savingFraud}
              fraudError={fraudError}
              isCustomerBlocked={isCustomerBlocked}
              blockingCustomer={blockingCustomer}
              onUpdateCustomer={handleUpdateCustomer}
              onCheckFraud={checkFraudAndSave}
              onToggleFraudBlock={handleToggleFraudBlock}
            />

            {/* Order Settings Card */}
            <OrderSettingsCard
              order={order}
              currencySymbol={currencySymbol}
              orderStatusOptions={orderStatusOptions}
              orderTypeOptions={orderTypeOptions}
              paymentStatusOptions={paymentStatusOptions}
              getStatusLabel={getStatusLabel}
              onUpdateOrderType={handleUpdateOrderType}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onUpdatePaymentStatus={handleUpdatePaymentStatus}
            />

            {/* Order Notes Card */}
            <OrderNotesCard order={order} onUpdateNotes={handleUpdateNotes} />

            {/* Order Timeline Card */}
            <OrderTimeline timeline={order.timeline || []} currentStatus={order.status} createdAt={order.createdAt} />
          </div>
        </div>
      </div>

      {/* Mobile Floating Navigation */}
      <MobileFloatingNav
        saving={saving}
        orderId={order.id}
        prevOrderId={prevOrderId}
        nextOrderId={nextOrderId}
        customerPhone={order.customer?.phone}
        onSave={handleSave}
        onDownload={handleDownload}
        onPrint={handlePrint}
      />

      <DeliveryDialog
        open={deliveryDialogOpen}
        onOpenChange={setDeliveryDialogOpen}
        form={deliveryForm}
        order={order}
        sendingCourier={sendingCourier}
        onSubmit={handleSubmitDelivery}
      />

      <RemoveCourierDialog
        open={removeCourierDialogOpen}
        onOpenChange={setRemoveCourierDialogOpen}
        onConfirm={confirmRemoveCourier}
        onCloseOtherDialogs={() => setReplaceCourierDialogOpen(false)}
      />

      <ReplaceCourierDialog
        open={replaceCourierDialogOpen}
        onOpenChange={setReplaceCourierDialogOpen}
        onConfirm={confirmReplaceCourier}
        onCloseOtherDialogs={() => {
          setRemoveCourierDialogOpen(false);
          setDeliveryDialogOpen(false);
        }}
      />

      <ManualDeliveryDialog
        open={manualDeliveryDialogOpen}
        onOpenChange={setManualDeliveryDialogOpen}
        courierServices={courierServices}
        loadingCouriers={loadingCouriers}
        onAdd={handleManualAddDelivery}
      />
    </div>
  );
}

"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { Order, OrderStatus, PaymentStatus, Product } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/shared/Pagination";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import CloudImage from "@/components/site/CloudImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { format, subDays, subMonths, startOfDay, endOfDay } from "date-fns";
import {
  Edit2,
  Eye,
  Package,
  AlertTriangle,
  Plus,
  X,
  Search,
  Copy,
  ExternalLink,
  RefreshCw,
  Loader2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Calendar,
  Filter,
  MoreVertical,
  ChevronRight,
  Phone,
  User,
  Clock,
  DollarSign,
  Truck,
  CheckCircle2,
  XCircle,
  MapPin,
  ShoppingBag,
  LayoutGrid,
  List,
} from "lucide-react";
import { useCurrencySymbol } from "@/hooks/use-currency";
import { useOrdersSocket } from "@/hooks/use-orders-socket";
import { getOrders, updateOrderStatus } from "./actions";
import { cn } from "@/lib/utils";

type PaginationData = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

// Mobile Order Card Component
function MobileOrderCard({
  order,
  currencySymbol,
  isBlocked,
  onStatusChange,
  getPathaoTrackingUrl,
  copyToClipboard,
}: {
  order: Order;
  currencySymbol: string;
  isBlocked: boolean;
  onStatusChange: (id: string, status: OrderStatus) => void;
  getPathaoTrackingUrl: (consignmentId: string, phone: string) => string;
  copyToClipboard: (text: string, label: string) => void;
}) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const effectiveStatus: OrderStatus = order.paymentStatus === "failed" || order.paymentStatus === "cancelled" ? "cancelled" : order.status;
  const displayStatus = order.courier?.deliveryStatus || effectiveStatus;

  return (
    <div className='bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden transition-all duration-200 active:scale-[0.99]'>
      {/* Header with Status */}
      <div className='px-4 py-3 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-900/50 border-b border-slate-100 dark:border-slate-800'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <span className='font-mono text-xs font-bold text-slate-700 dark:text-slate-300'>
              {order.courier?.merchantOrderId || order.customOrderId || `#${order.id.slice(-7).toUpperCase()}`}
            </span>
            <Badge className={`${statusBadgeClass(displayStatus)} font-semibold text-xs px-2.5 py-1`}>
              {displayStatus.replace(/_/g, " ")}
            </Badge>
            {order.orderType === "offline" ? (
              <Badge className='bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400 border-purple-200 text-[10px] px-1.5'>
                Offline
              </Badge>
            ) : (
              <Badge className='bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border-blue-200 text-[10px] px-1.5'>
                Online
              </Badge>
            )}
          </div>
          <div className='flex items-center gap-1'>
            {isBlocked && (
              <Badge variant='destructive' className='h-5 px-1.5 text-[10px] font-semibold flex items-center gap-0.5'>
                <AlertTriangle className='h-2.5 w-2.5' />
                FRAUD
              </Badge>
            )}
            <DropdownMenu open={showStatusMenu} onOpenChange={setShowStatusMenu}>
              <DropdownMenuTrigger asChild>
                <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                  <MoreVertical className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-48'>
                <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(
                  [
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
                  ] as OrderStatus[]
                ).map((status) => (
                  <DropdownMenuItem
                    key={status}
                    onClick={() => {
                      onStatusChange(order.id, status);
                      setShowStatusMenu(false);
                    }}
                    className={cn(effectiveStatus === status && "bg-accent")}
                  >
                    <span className='capitalize'>{status.replace(/_/g, " ")}</span>
                    {effectiveStatus === status && <CheckCircle2 className='ml-auto h-3 w-3' />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='p-4 space-y-4'>
        {/* Customer Info */}
        <div className='flex items-start gap-3'>
          <div className='h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0'>
            <User className='h-5 w-5 text-primary' />
          </div>
          <div className='flex-1 min-w-0'>
            <p className='font-semibold text-sm text-slate-900 dark:text-slate-100 truncate'>{order.customer.fullName}</p>
            <a href={`tel:${order.customer.phone}`} className='text-xs text-primary flex items-center gap-1 mt-0.5 hover:underline'>
              <Phone className='h-3 w-3' />
              {order.customer.phone}
            </a>
            <p className='text-xs text-muted-foreground mt-0.5 flex items-center gap-1 truncate'>
              <MapPin className='h-3 w-3 shrink-0' />
              <span className='truncate'>{order.customer.city || order.customer.addressLine1}</span>
            </p>
          </div>
          <div className='text-right shrink-0'>
            <p className='text-lg font-bold text-slate-900 dark:text-slate-100'>
              {currencySymbol}
              {order.total.toFixed(0)}
            </p>
            <p className='text-[10px] text-muted-foreground'>
              {order.items.length} item{order.items.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Product Preview */}
        <div className='flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl'>
          <div className='flex -space-x-2'>
            {order.items.slice(0, 3).map((item, idx) => (
              <div
                key={idx}
                className='relative h-12 w-12 overflow-hidden rounded-lg border-2 border-white dark:border-slate-900 bg-white shadow-sm'
              >
                <CloudImage src={item.image} alt={item.name} fill className='object-contain p-1' />
              </div>
            ))}
            {order.items.length > 3 && (
              <div className='relative h-12 w-12 flex items-center justify-center rounded-lg border-2 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-700 shadow-sm'>
                <span className='text-xs font-bold text-slate-600 dark:text-slate-300'>+{order.items.length - 3}</span>
              </div>
            )}
          </div>
          <div className='flex-1 min-w-0'>
            <p className='text-sm font-medium text-slate-900 dark:text-slate-100 truncate'>{order.items[0].name}</p>
            {order.items[0].color || order.items[0].size ? (
              <p className='text-xs text-muted-foreground'>
                {order.items[0].color}
                {order.items[0].color && order.items[0].size && " / "}
                {order.items[0].size}
              </p>
            ) : null}
            {order.items.length > 1 && <p className='text-[10px] text-muted-foreground'>+{order.items.length - 1} more</p>}
          </div>
        </div>

        {/* Fraud Check & Info Row */}
        <div className='flex items-center justify-between text-xs'>
          <div className='flex items-center gap-3'>
            <div className='flex items-center gap-1 text-muted-foreground'>
              <Clock className='h-3 w-3' />
              <span>{format(new Date(order.createdAt), "MMM d, h:mm a")}</span>
            </div>
            {order.paymentMethod === "online" && (
              <Badge variant='outline' className={`${paymentStatusBadgeClass(order.paymentStatus)} text-[10px] px-1.5 py-0`}>
                {order.paymentStatus ?? "pending"}
              </Badge>
            )}
          </div>
          {order.fraudCheck && (
            <div className='flex items-center gap-1.5'>
              <Badge
                variant='outline'
                className={`text-[10px] font-medium px-1.5 py-0 ${
                  order.fraudCheck.fraud_risk === "low"
                    ? "border-green-200 text-green-600 bg-green-50/50"
                    : order.fraudCheck.fraud_risk === "medium"
                    ? "border-yellow-200 text-yellow-600 bg-yellow-50/50"
                    : "border-red-200 text-red-600 bg-red-50/50"
                }`}
              >
                {order.fraudCheck.fraud_risk.toUpperCase()} RISK
              </Badge>
              <span
                className={`text-[10px] font-semibold ${
                  order.fraudCheck.success_rate >= 90
                    ? "text-green-600"
                    : order.fraudCheck.success_rate >= 70
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}
              >
                {order.fraudCheck.success_rate.toFixed(0)}%
              </span>
            </div>
          )}
        </div>

        {/* Courier Info */}
        {order.courier?.consignmentId && (
          <div className='flex items-center justify-between p-2.5 bg-primary/5 rounded-lg'>
            <div className='flex items-center gap-2'>
              <Truck className='h-4 w-4 text-primary' />
              <span className='text-xs font-medium'>{order.courier.serviceName || "Courier"}</span>
              {order.courier.deliveryStatus?.toLowerCase() === "pending" && (
                <Badge variant='outline' className='bg-yellow-50 text-yellow-700 border-yellow-300 text-[9px] px-1.5'>
                  Pending
                </Badge>
              )}
            </div>
            {order.courier.serviceId === "pathao" && order.customer.phone && (
              <div className='flex items-center gap-1'>
                <a
                  href={getPathaoTrackingUrl(order.courier.consignmentId, order.customer.phone)}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-xs text-primary hover:underline flex items-center gap-0.5'
                >
                  <ExternalLink className='h-3 w-3' />
                  Track
                </a>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() =>
                    copyToClipboard(getPathaoTrackingUrl(order.courier!.consignmentId!, order.customer.phone!), "Tracking link")
                  }
                  className='h-6 w-6 p-0'
                >
                  <Copy className='h-3 w-3' />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className='px-4 py-3 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800'>
        <div className='flex items-center gap-2'>
          <Link href={`/merchant/orders/${order.id}`} className='flex-1'>
            <Button variant='outline' size='sm' className='w-full h-10 text-sm font-medium transition-all duration-200 hover:bg-primary/5'>
              <Eye className='h-4 w-4 mr-2' />
              View Details
            </Button>
          </Link>
          <Button
            size='sm'
            className='flex-1 h-10 text-sm font-medium'
            onClick={() => (window.location.href = `tel:${order.customer.phone}`)}
          >
            <Phone className='h-4 w-4 mr-2' />
            Call
          </Button>
        </div>
      </div>
    </div>
  );
}

// Mobile Filter Drawer Component
function MobileFilterDrawer({
  open,
  onOpenChange,
  statusFilter,
  categoryFilter,
  paymentStatusFilter,
  dateRange,
  amountRange,
  categories,
  onStatusChange,
  onCategoryChange,
  onPaymentStatusChange,
  onDateRangeChange,
  onAmountRangeChange,
  onClearFilters,
  hasActiveFilters,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  statusFilter: OrderStatus | "all";
  categoryFilter: string;
  paymentStatusFilter: PaymentStatus | "all";
  dateRange: { from?: Date; to?: Date };
  amountRange: { min?: number; max?: number };
  categories: string[];
  onStatusChange: (status: OrderStatus | "all") => void;
  onCategoryChange: (category: string) => void;
  onPaymentStatusChange: (status: PaymentStatus | "all") => void;
  onDateRangeChange: (range: { from?: Date; to?: Date }) => void;
  onAmountRangeChange: (range: { min?: number; max?: number }) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className='max-h-[85vh]'>
        <DrawerHeader className='border-b pb-4'>
          <div className='flex items-center justify-between'>
            <div>
              <DrawerTitle className='text-lg'>Filters</DrawerTitle>
              <DrawerDescription>Refine your order search</DrawerDescription>
            </div>
            {hasActiveFilters && (
              <Button variant='ghost' size='sm' onClick={onClearFilters} className='text-primary'>
                Clear All
              </Button>
            )}
          </div>
        </DrawerHeader>

        <div className='p-4 space-y-6 overflow-y-auto flex-1'>
          {/* Order Status */}
          <div className='space-y-3'>
            <Label className='text-sm font-semibold text-slate-900 dark:text-slate-100'>Order Status</Label>
            <div className='grid grid-cols-2 gap-2'>
              {[
                { value: "all", label: "All" },
                { value: "pending", label: "Pending" },
                { value: "confirmed", label: "Confirmed" },
                { value: "processing", label: "Processing" },
                { value: "shipped", label: "Shipped" },
                { value: "delivered", label: "Delivered" },
                { value: "cancelled", label: "Cancelled" },
              ].map(({ value, label }) => (
                <Button
                  key={value}
                  variant={statusFilter === value ? "default" : "outline"}
                  size='sm'
                  className='h-10 justify-start'
                  onClick={() => onStatusChange(value as OrderStatus | "all")}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* Category */}
          {categories.length > 0 && (
            <div className='space-y-3'>
              <Label className='text-sm font-semibold text-slate-900 dark:text-slate-100'>Category</Label>
              <Select value={categoryFilter} onValueChange={onCategoryChange}>
                <SelectTrigger className='h-11'>
                  <SelectValue placeholder='All categories' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Payment Status */}
          <div className='space-y-3'>
            <Label className='text-sm font-semibold text-slate-900 dark:text-slate-100'>Payment Status</Label>
            <div className='grid grid-cols-3 gap-2'>
              {[
                { value: "all", label: "All" },
                { value: "pending", label: "Pending" },
                { value: "completed", label: "Paid" },
                { value: "failed", label: "Failed" },
              ].map(({ value, label }) => (
                <Button
                  key={value}
                  variant={paymentStatusFilter === value ? "default" : "outline"}
                  size='sm'
                  className='h-10'
                  onClick={() => onPaymentStatusChange(value as PaymentStatus | "all")}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* Quick Date Filters */}
          <div className='space-y-3'>
            <Label className='text-sm font-semibold text-slate-900 dark:text-slate-100'>Date Range</Label>
            <div className='grid grid-cols-3 gap-2'>
              {[
                { label: "Today", days: 0 },
                { label: "3 Days", days: 3 },
                { label: "7 Days", days: 7 },
                { label: "1 Month", days: 30 },
                { label: "3 Months", days: 90 },
                { label: "All Time", days: -1 },
              ].map(({ label, days }) => (
                <Button
                  key={label}
                  variant={
                    days === -1
                      ? !dateRange.from && !dateRange.to
                        ? "default"
                        : "outline"
                      : dateRange.from && days === 0 && dateRange.from.toDateString() === new Date().toDateString()
                      ? "default"
                      : "outline"
                  }
                  size='sm'
                  className='h-10'
                  onClick={() => {
                    if (days === -1) {
                      onDateRangeChange({});
                    } else if (days === 0) {
                      const today = new Date();
                      onDateRangeChange({ from: startOfDay(today), to: endOfDay(today) });
                    } else {
                      const today = new Date();
                      onDateRangeChange({ from: startOfDay(subDays(today, days)), to: endOfDay(today) });
                    }
                  }}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* Amount Range */}
          <div className='space-y-3'>
            <Label className='text-sm font-semibold text-slate-900 dark:text-slate-100'>Amount Range</Label>
            <div className='flex gap-3'>
              <div className='flex-1'>
                <Input
                  type='number'
                  placeholder='Min'
                  value={amountRange.min || ""}
                  onChange={(e) =>
                    onAmountRangeChange({
                      ...amountRange,
                      min: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  className='h-11'
                />
              </div>
              <div className='flex items-center text-muted-foreground'>to</div>
              <div className='flex-1'>
                <Input
                  type='number'
                  placeholder='Max'
                  value={amountRange.max || ""}
                  onChange={(e) =>
                    onAmountRangeChange({
                      ...amountRange,
                      max: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  className='h-11'
                />
              </div>
            </div>
          </div>
        </div>

        <DrawerFooter className='border-t pt-4'>
          <Button className='w-full h-12 text-base font-semibold' onClick={() => onOpenChange(false)}>
            Apply Filters
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

// Quick Status Pills for mobile
function QuickStatusPills({
  currentStatus,
  onChange,
}: {
  currentStatus: OrderStatus | "all";
  onChange: (status: OrderStatus | "all") => void;
}) {
  const statuses = [
    { value: "all", label: "All", icon: LayoutGrid },
    { value: "pending", label: "Pending", icon: Clock },
    { value: "confirmed", label: "Confirmed", icon: CheckCircle2 },
    { value: "processing", label: "Processing", icon: Package },
    { value: "shipped", label: "Shipped", icon: Truck },
    { value: "delivered", label: "Delivered", icon: CheckCircle2 },
    { value: "cancelled", label: "Cancelled", icon: XCircle },
  ];

  return (
    <div className='flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4'>
      {statuses.map(({ value, label, icon: Icon }) => (
        <Button
          key={value}
          variant={currentStatus === value ? "default" : "outline"}
          size='sm'
          className={cn("h-9 px-4 shrink-0 rounded-full transition-all", currentStatus === value && "shadow-md")}
          onClick={() => onChange(value as OrderStatus | "all")}
        >
          <Icon className='h-3.5 w-3.5 mr-1.5' />
          {label}
        </Button>
      ))}
    </div>
  );
}

export function OrdersClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currencySymbol = useCurrencySymbol();

  // View mode state
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  // Get initial values from URL or use defaults
  const initialPage = parseInt(searchParams.get("page") || "1", 10);
  const initialLimit = parseInt(searchParams.get("limit") || "30", 10);
  const initialStatus = (searchParams.get("status") as OrderStatus | "all") || "all";
  const initialSearch = searchParams.get("search") || "";
  const initialCategory = searchParams.get("category") || "all";

  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 30,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">(initialStatus);
  const [categoryFilter, setCategoryFilter] = useState<string>(initialCategory);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [blockedPhones, setBlockedPhones] = useState<Set<string>>(new Set());
  const [isSyncingCourier, setIsSyncingCourier] = useState(false);

  // Multi-select state
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());

  // Sorting state
  type SortField = "date" | "amount" | "status" | "customer" | "none";
  type SortDirection = "asc" | "desc";
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Advanced filters
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [amountRange, setAmountRange] = useState<{ min?: number; max?: number }>({});
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<PaymentStatus | "all">("all");
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Get merchant ID from multiple sources
  useEffect(() => {
    const fetchMerchantId = async () => {
      try {
        const res = await fetch("/api/merchant/context");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data?.merchant?.id) {
            setMerchantId(data.data.merchant.id);
            return;
          }
        }
      } catch (error) {
        console.warn("[Orders] Failed to get merchant ID from context:", error);
      }
    };

    fetchMerchantId();
  }, []);

  // Update URL when filters change
  const updateURL = useCallback(
    (updates: { page?: number; limit?: number; status?: string; search?: string; category?: string }) => {
      const params = new URLSearchParams(searchParams.toString());

      if (updates.page !== undefined) {
        if (updates.page === 1) {
          params.delete("page");
        } else {
          params.set("page", updates.page.toString());
        }
      }

      if (updates.limit !== undefined) {
        if (updates.limit === 30) {
          params.delete("limit");
        } else {
          params.set("limit", updates.limit.toString());
        }
      }

      if (updates.status !== undefined) {
        if (updates.status === "all") {
          params.delete("status");
        } else {
          params.set("status", updates.status);
        }
      }

      if (updates.search !== undefined) {
        if (updates.search === "") {
          params.delete("search");
        } else {
          params.set("search", updates.search);
        }
      }

      if (updates.category !== undefined) {
        if (updates.category === "all") {
          params.delete("category");
        } else {
          params.set("category", updates.category);
        }
      }

      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [searchParams, router]
  );

  const loadOrders = useCallback(
    async (page: number = 1, status: OrderStatus | "all" = "all", search: string = "", category: string = "all") => {
      try {
        setLoading(true);
        const [ordersData, productsRes, blockedRes] = await Promise.all([
          getOrders(page, limit, status !== "all" ? status : undefined, search.trim() || undefined),
          fetch("/api/products", {
            cache: "force-cache",
            next: { revalidate: 60 },
          }),
          fetch("/api/blocked-customers?activeOnly=true", {
            cache: "force-cache",
            next: { revalidate: 60 },
          }),
        ]);

        if (!productsRes.ok) throw new Error("Failed to load products");

        const productsResponse = (await productsRes.json()) as { products?: Product[] } | Product[];
        const productsData = Array.isArray(productsResponse) ? productsResponse : productsResponse.products || [];

        if (blockedRes.ok) {
          const blockedData = await blockedRes.json();
          const phones = new Set<string>();
          (blockedData.customers || []).forEach((c: { phone: string }) => {
            if (c.phone) {
              const normalized = c.phone.replace(/\D/g, "").slice(-11);
              phones.add(c.phone);
              phones.add(normalized);
              phones.add(normalized.slice(-10));
            }
          });
          setBlockedPhones(phones);
        }

        setOrders(ordersData.orders);
        setPagination(ordersData.pagination);
        setProducts(productsData);
      } catch (error: any) {
        console.error("Error loading orders:", error);
        toast.error(error?.message || "Failed to load orders");
      } finally {
        setLoading(false);
      }
    },
    [limit]
  );

  // Handle new order from socket
  const handleNewOrder = useCallback(
    (newOrder: Order) => {
      setOrders((prev) => {
        const exists = prev.some((o) => o.id === newOrder.id);
        if (exists) {
          return prev;
        }
        return [newOrder, ...prev];
      });
      if (currentPage === 1) {
        loadOrders(1, statusFilter, query, categoryFilter);
      }
    },
    [currentPage, statusFilter, query, categoryFilter, loadOrders]
  );

  // Handle order update from socket
  const handleOrderUpdate = useCallback(
    (updatedOrder: Order) => {
      setOrders((prev) => {
        const exists = prev.some((o) => o.id === updatedOrder.id);
        if (exists) {
          return prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o));
        } else {
          return [updatedOrder, ...prev];
        }
      });
      if (currentPage === 1) {
        loadOrders(1, statusFilter, query, categoryFilter);
      }
    },
    [currentPage, statusFilter, query, categoryFilter, loadOrders]
  );

  useOrdersSocket(merchantId, handleNewOrder, handleOrderUpdate);

  useEffect(() => {
    const urlPage = parseInt(searchParams.get("page") || "1", 10);
    const urlStatus = (searchParams.get("status") as OrderStatus | "all") || "all";
    const urlSearch = searchParams.get("search") || "";
    const urlCategory = searchParams.get("category") || "all";
    const urlLimit = parseInt(searchParams.get("limit") || "30", 10);

    if (urlPage !== currentPage) setCurrentPage(urlPage);
    if (urlStatus !== statusFilter) setStatusFilter(urlStatus);
    if (urlSearch !== query) setQuery(urlSearch);
    if (urlCategory !== categoryFilter) setCategoryFilter(urlCategory);
    if (urlLimit !== limit) setLimit(urlLimit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    loadOrders(currentPage, statusFilter, query, categoryFilter);
  }, [currentPage, statusFilter, query, categoryFilter, loadOrders]);

  // Get unique categories
  const categories = useMemo(() => {
    if (!Array.isArray(products)) return [];
    const categorySet = new Set<string>();
    products.forEach((product) => {
      if (product.category) {
        categorySet.add(product.category);
      }
    });
    return Array.from(categorySet).sort();
  }, [products]);

  // Get product map for category lookup
  const productMap = useMemo(() => {
    if (!Array.isArray(products)) return new Map<string, Product>();
    const map = new Map<string, Product>();
    products.forEach((product) => {
      map.set(product.id, product);
    });
    return map;
  }, [products]);

  // Check if customer is blocked/fraud
  const isCustomerBlocked = (phone: string | undefined): boolean => {
    if (!phone) return false;
    const normalized = phone.replace(/\D/g, "").slice(-11);
    return blockedPhones.has(phone) || blockedPhones.has(normalized) || blockedPhones.has(normalized.slice(-10));
  };

  // Generate Pathao tracking URL
  const getPathaoTrackingUrl = (consignmentId: string, phone: string): string => {
    return `https://merchant.pathao.com/tracking?consignment_id=${encodeURIComponent(consignmentId)}&phone=${encodeURIComponent(phone)}`;
  };

  // Copy to clipboard helper
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast.success(`${label} copied to clipboard`);
      },
      () => {
        toast.error("Failed to copy to clipboard");
      }
    );
  };

  // Filter and sort orders
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    // Category filter
    if (categoryFilter !== "all") {
      result = result.filter((o) => {
        const orderCategories = o.items.map((item) => productMap.get(item.productId)?.category).filter(Boolean) as string[];
        return orderCategories.includes(categoryFilter);
      });
    }

    // Payment status filter
    if (paymentStatusFilter !== "all") {
      result = result.filter((o) => o.paymentStatus === paymentStatusFilter);
    }

    // Date range filter
    if (dateRange.from || dateRange.to) {
      result = result.filter((o) => {
        const orderDate = new Date(o.createdAt);
        if (dateRange.from && orderDate < dateRange.from) return false;
        if (dateRange.to) {
          const toDate = new Date(dateRange.to);
          toDate.setHours(23, 59, 59, 999);
          if (orderDate > toDate) return false;
        }
        return true;
      });
    }

    // Amount range filter
    if (amountRange.min !== undefined || amountRange.max !== undefined) {
      result = result.filter((o) => {
        if (amountRange.min !== undefined && o.total < amountRange.min) return false;
        if (amountRange.max !== undefined && o.total > amountRange.max) return false;
        return true;
      });
    }

    // Sorting
    if (sortField !== "none") {
      result.sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case "date":
            comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            break;
          case "amount":
            comparison = a.total - b.total;
            break;
          case "status":
            comparison = a.status.localeCompare(b.status);
            break;
          case "customer":
            comparison = a.customer.fullName.localeCompare(b.customer.fullName);
            break;
        }
        return sortDirection === "asc" ? comparison : -comparison;
      });
    }

    return result;
  }, [orders, categoryFilter, paymentStatusFilter, dateRange, amountRange, sortField, sortDirection, productMap]);

  // Multi-select handlers
  const toggleSelectAll = useCallback(() => {
    if (selectedOrders.size === filteredOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(filteredOrders.map((o) => o.id)));
    }
  }, [filteredOrders, selectedOrders.size]);

  const toggleSelectOrder = useCallback((orderId: string) => {
    setSelectedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  }, []);

  // Bulk actions
  const bulkUpdateStatus = useCallback(
    async (status: OrderStatus) => {
      if (selectedOrders.size === 0) {
        toast.error("No orders selected");
        return;
      }

      try {
        const promises = Array.from(selectedOrders).map((id) => updateOrderStatus(id, status));
        await Promise.all(promises);
        toast.success(`Updated ${selectedOrders.size} order(s) to ${status}`);
        setSelectedOrders(new Set());
        loadOrders(currentPage, statusFilter, query, categoryFilter);
      } catch (error: any) {
        toast.error(error?.message || "Failed to update orders");
      }
    },
    [selectedOrders, currentPage, statusFilter, query, categoryFilter, loadOrders]
  );

  // Export to CSV
  const exportToCSV = useCallback(() => {
    const ordersToExport = filteredOrders.filter((o) => selectedOrders.size === 0 || selectedOrders.has(o.id));

    if (ordersToExport.length === 0) {
      toast.error("No orders to export");
      return;
    }

    const headers = [
      "Order ID",
      "Date",
      "Customer",
      "Phone",
      "Email",
      "Status",
      "Payment Status",
      "Items",
      "Subtotal",
      "Shipping",
      "Total",
      "Address",
    ];
    const rows = ordersToExport.map((o) => [
      o.id,
      new Date(o.createdAt).toLocaleString(),
      o.customer.fullName,
      o.customer.phone,
      o.customer.email || "",
      o.status,
      o.paymentStatus || "",
      o.items.map((i) => `${i.name} (x${i.quantity})`).join("; "),
      o.subtotal.toFixed(2),
      o.shipping.toFixed(2),
      o.total.toFixed(2),
      `${o.customer.addressLine1}, ${o.customer.city}, ${o.customer.postalCode}`,
    ]);

    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `orders_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${ordersToExport.length} order(s) to CSV`);
  }, [filteredOrders, selectedOrders]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    updateURL({ page: newPage });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setCurrentPage(1);
    updateURL({ limit: newLimit, page: 1 });
  };

  const handleStatusChange = (status: OrderStatus | "all") => {
    setStatusFilter(status);
    setCurrentPage(1);
    updateURL({ status, page: 1 });
  };

  const handleSearchChange = (value: string) => {
    setQuery(value);
    setCurrentPage(1);
    updateURL({ search: value, page: 1 });
  };

  const handleCategoryChange = (category: string) => {
    setCategoryFilter(category);
    setCurrentPage(1);
    updateURL({ category, page: 1 });
  };

  const handleClearFilters = () => {
    setQuery("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setPaymentStatusFilter("all");
    setDateRange({});
    setAmountRange({});
    setCurrentPage(1);
    updateURL({ search: "", status: "all", category: "all", page: 1 });
  };

  const hasActiveFilters =
    query.trim() !== "" ||
    statusFilter !== "all" ||
    categoryFilter !== "all" ||
    paymentStatusFilter !== "all" ||
    dateRange.from !== undefined ||
    dateRange.to !== undefined ||
    amountRange.min !== undefined ||
    amountRange.max !== undefined;

  // Sync courier status
  const syncAllCourierStatus = async () => {
    setIsSyncingCourier(true);
    try {
      const response = await fetch("/api/orders/sync-courier-status", {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        const { updated, skipped, failed, totalOrders } = data.results;
        if (updated > 0) {
          toast.success(`Synced ${updated} orders`, {
            description: `${skipped} unchanged, ${failed} failed out of ${totalOrders} total`,
          });
          loadOrders(currentPage, statusFilter, query, categoryFilter);
        } else if (totalOrders === 0) {
          toast.info("No orders to sync", {
            description: "No orders with courier info found",
          });
        } else {
          toast.info("All orders up to date", {
            description: `${totalOrders} orders checked, no changes needed`,
          });
        }
      } else {
        toast.error("Sync failed", {
          description: data.error || "Failed to sync courier statuses",
        });
      }
    } catch (error: any) {
      toast.error("Sync failed", {
        description: error?.message || "Failed to sync courier statuses",
      });
    } finally {
      setIsSyncingCourier(false);
    }
  };

  const updateStatus = async (id: string, status: OrderStatus) => {
    const prevSnapshot = orders;
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    try {
      await updateOrderStatus(id, status);
      loadOrders(currentPage, statusFilter, query, categoryFilter);
      toast.success("Order status updated");
    } catch (error: any) {
      setOrders(prevSnapshot);
      toast.error(error?.message || "Failed to update status");
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    const pending = filteredOrders.filter((o) => o.status === "pending").length;
    const processing = filteredOrders.filter((o) => ["confirmed", "processing", "packed", "sent_to_logistics"].includes(o.status)).length;
    const shipped = filteredOrders.filter((o) => o.status === "shipped").length;
    const delivered = filteredOrders.filter((o) => o.status === "delivered").length;
    const totalRevenue = filteredOrders.filter((o) => o.status === "delivered").reduce((sum, o) => sum + o.total, 0);
    return { pending, processing, shipped, delivered, totalRevenue };
  }, [filteredOrders]);

  return (
    <div className='w-full space-y-4'>
      {/* Mobile Header with Stats */}
      <div className='lg:hidden'>
        {/* Search Bar */}
        <div className='relative mb-4'>
          <Search className='absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none' />
          <Input
            placeholder='Search by order ID, customer name or phone...'
            value={query}
            onChange={(e) => handleSearchChange(e.target.value)}
            className='pl-12 h-12 text-base rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
          />
          {query && (
            <Button
              variant='ghost'
              size='sm'
              className='absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0'
              onClick={() => handleSearchChange("")}
            >
              <X className='h-4 w-4' />
            </Button>
          )}
        </div>

        {/* Quick Status Pills - Horizontal Scrollable */}
        <QuickStatusPills currentStatus={statusFilter} onChange={handleStatusChange} />

        {/* Action Bar */}
        <div className='flex items-center justify-between mt-4 mb-2'>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              className={cn("h-9 rounded-full", hasActiveFilters && "border-primary text-primary")}
              onClick={() => setShowFilterDrawer(true)}
            >
              <Filter className='h-4 w-4 mr-1.5' />
              Filters
              {hasActiveFilters && (
                <span className='ml-1.5 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center'>
                  !
                </span>
              )}
            </Button>
            <Button variant='outline' size='sm' className='h-9 rounded-full' onClick={syncAllCourierStatus} disabled={isSyncingCourier}>
              {isSyncingCourier ? <Loader2 className='h-4 w-4 animate-spin' /> : <RefreshCw className='h-4 w-4' />}
            </Button>
          </div>
          <div className='flex items-center gap-2'>
            <div className='flex items-center border rounded-full p-0.5 bg-slate-100 dark:bg-slate-800'>
              <Button
                variant={viewMode === "cards" ? "default" : "ghost"}
                size='sm'
                className='h-7 w-7 p-0 rounded-full'
                onClick={() => setViewMode("cards")}
              >
                <LayoutGrid className='h-3.5 w-3.5' />
              </Button>
              <Button
                variant={viewMode === "table" ? "default" : "ghost"}
                size='sm'
                className='h-7 w-7 p-0 rounded-full'
                onClick={() => setViewMode("table")}
              >
                <List className='h-3.5 w-3.5' />
              </Button>
            </div>
            <Button asChild size='sm' className='h-9 rounded-full'>
              <Link href='/merchant/orders/new'>
                <Plus className='h-4 w-4 mr-1' />
                New
              </Link>
            </Button>
          </div>
        </div>

        {/* Results Count */}
        <p className='text-xs text-muted-foreground mb-4'>
          {loading ? (
            "Loading..."
          ) : (
            <>
              Showing {filteredOrders.length} of {pagination.total} orders
            </>
          )}
        </p>
      </div>

      {/* Desktop Header */}
      <div className='hidden lg:block'>
        <div className='rounded-xl border border-slate-200/50 overflow-hidden'>
          <div className='p-4 border-b border-slate-200/50 dark:border-slate-800/30 bg-gradient-to-r from-slate-50/80 to-white dark:from-slate-900/40 dark:to-slate-950/20'>
            <div className='flex items-center justify-between gap-4'>
              <div>
                <h3 className='text-lg font-bold text-slate-900 dark:text-slate-100'>Orders</h3>
                <p className='text-sm text-muted-foreground'>{pagination.total} total orders</p>
              </div>
              <div className='flex items-center gap-3'>
                {/* Search */}
                <div className='relative w-64'>
                  <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                  <Input
                    placeholder='Search orders...'
                    value={query}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className='pl-10 h-10'
                  />
                </div>
                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={(v) => handleStatusChange(v as any)}>
                  <SelectTrigger className='h-10 w-40'>
                    <SelectValue placeholder='All statuses' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Statuses</SelectItem>
                    <SelectItem value='pending'>Pending</SelectItem>
                    <SelectItem value='confirmed'>Confirmed</SelectItem>
                    <SelectItem value='processing'>Processing</SelectItem>
                    <SelectItem value='shipped'>Shipped</SelectItem>
                    <SelectItem value='delivered'>Delivered</SelectItem>
                    <SelectItem value='cancelled'>Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                {/* Category Filter */}
                <Select value={categoryFilter} onValueChange={handleCategoryChange}>
                  <SelectTrigger className='h-10 w-40'>
                    <SelectValue placeholder='All categories' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {hasActiveFilters && (
                  <Button variant='outline' size='sm' onClick={handleClearFilters}>
                    <X className='h-4 w-4 mr-1' />
                    Clear
                  </Button>
                )}
                <Button variant='outline' onClick={syncAllCourierStatus} disabled={isSyncingCourier}>
                  {isSyncingCourier ? <Loader2 className='h-4 w-4 animate-spin mr-2' /> : <RefreshCw className='h-4 w-4 mr-2' />}
                  Sync Courier
                </Button>
                <Button asChild>
                  <Link href='/merchant/orders/new'>
                    <Plus className='h-4 w-4 mr-2' />
                    Create Order
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <MobileFilterDrawer
        open={showFilterDrawer}
        onOpenChange={setShowFilterDrawer}
        statusFilter={statusFilter}
        categoryFilter={categoryFilter}
        paymentStatusFilter={paymentStatusFilter}
        dateRange={dateRange}
        amountRange={amountRange}
        categories={categories}
        onStatusChange={handleStatusChange}
        onCategoryChange={handleCategoryChange}
        onPaymentStatusChange={setPaymentStatusFilter}
        onDateRangeChange={setDateRange}
        onAmountRangeChange={setAmountRange}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Content Area */}
      {loading ? (
        <>
          {/* Mobile Loading Skeleton */}
          <div className='lg:hidden space-y-4'>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className='bg-white dark:bg-slate-900 rounded-2xl border p-4 space-y-4'>
                <div className='flex items-center justify-between'>
                  <Skeleton className='h-6 w-24' />
                  <Skeleton className='h-8 w-8 rounded-full' />
                </div>
                <div className='flex items-start gap-3'>
                  <Skeleton className='h-10 w-10 rounded-full' />
                  <div className='flex-1 space-y-2'>
                    <Skeleton className='h-4 w-32' />
                    <Skeleton className='h-3 w-24' />
                  </div>
                  <Skeleton className='h-6 w-16' />
                </div>
                <Skeleton className='h-16 w-full rounded-xl' />
              </div>
            ))}
          </div>
          {/* Desktop Loading Skeleton */}
          <div className='hidden lg:block rounded-lg border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-12'>
                    <Skeleton className='h-4 w-4' />
                  </TableHead>
                  <TableHead>
                    <Skeleton className='h-4 w-32' />
                  </TableHead>
                  <TableHead>
                    <Skeleton className='h-4 w-20' />
                  </TableHead>
                  <TableHead>
                    <Skeleton className='h-4 w-24' />
                  </TableHead>
                  <TableHead>
                    <Skeleton className='h-4 w-20' />
                  </TableHead>
                  <TableHead>
                    <Skeleton className='h-4 w-16' />
                  </TableHead>
                  <TableHead>
                    <Skeleton className='h-4 w-12' />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className='h-4 w-4' />
                    </TableCell>
                    <TableCell>
                      <Skeleton className='h-10 w-full' />
                    </TableCell>
                    <TableCell>
                      <Skeleton className='h-6 w-20' />
                    </TableCell>
                    <TableCell>
                      <Skeleton className='h-4 w-24' />
                    </TableCell>
                    <TableCell>
                      <Skeleton className='h-10 w-24' />
                    </TableCell>
                    <TableCell>
                      <Skeleton className='h-4 w-16' />
                    </TableCell>
                    <TableCell>
                      <Skeleton className='h-8 w-8' />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      ) : filteredOrders.length === 0 ? (
        <div className='rounded-2xl border border-dashed p-12 text-center'>
          <div className='mx-auto h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4'>
            <ShoppingBag className='h-6 w-6 text-muted-foreground' />
          </div>
          <h3 className='text-lg font-semibold mb-1'>No orders found</h3>
          <p className='text-sm text-muted-foreground mb-4'>
            {hasActiveFilters ? "Try adjusting your filters" : "Orders will appear here when customers place them"}
          </p>
          {hasActiveFilters && (
            <Button variant='outline' onClick={handleClearFilters}>
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className={cn("lg:hidden space-y-4", viewMode === "table" && "hidden")}>
            {filteredOrders.map((order) => (
              <MobileOrderCard
                key={order.id}
                order={order}
                currencySymbol={currencySymbol}
                isBlocked={isCustomerBlocked(order.customer.phone)}
                onStatusChange={updateStatus}
                getPathaoTrackingUrl={getPathaoTrackingUrl}
                copyToClipboard={copyToClipboard}
              />
            ))}
          </div>

          {/* Mobile Table View (when toggled) */}
          <div className={cn("lg:hidden", viewMode === "cards" && "hidden")}>
            <div className='rounded-xl border overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='text-xs'>Customer</TableHead>
                    <TableHead className='text-xs'>Status</TableHead>
                    <TableHead className='text-xs text-right'>Amount</TableHead>
                    <TableHead className='text-xs w-10'></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const effectiveStatus: OrderStatus =
                      order.paymentStatus === "failed" || order.paymentStatus === "cancelled" ? "cancelled" : order.status;
                    const displayStatus = order.courier?.deliveryStatus || effectiveStatus;

                    return (
                      <TableRow
                        key={order.id}
                        className='cursor-pointer hover:bg-muted/50 transition-colors duration-150'
                        onClick={() => router.push(`/merchant/orders/${order.id}`)}
                      >
                        <TableCell className='py-3'>
                          <Link
                            href={`/merchant/orders/${order.id}`}
                            prefetch={true}
                            className='block'
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className='space-y-0.5'>
                              <p className='font-medium text-sm truncate max-w-[120px]'>{order.customer.fullName}</p>
                              <p className='text-xs text-muted-foreground'>{format(new Date(order.createdAt), "MMM d")}</p>
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell className='py-3'>
                          <Badge className={cn(statusBadgeClass(displayStatus), "text-[10px] px-1.5")}>
                            {displayStatus.replace(/_/g, " ").slice(0, 10)}
                          </Badge>
                        </TableCell>
                        <TableCell className='py-3 text-right'>
                          <span className='font-semibold text-sm'>
                            {currencySymbol}
                            {order.total.toFixed(0)}
                          </span>
                        </TableCell>
                        <TableCell className='py-3'>
                          <ChevronRight className='h-4 w-4 text-muted-foreground' />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className='hidden lg:block rounded-xl border overflow-hidden'>
            {/* Bulk Actions Bar */}
            {selectedOrders.size > 0 && (
              <div className='flex items-center justify-between p-3 bg-primary/5 border-b'>
                <div className='flex items-center gap-2'>
                  <span className='text-sm font-medium'>
                    {selectedOrders.size} order{selectedOrders.size > 1 ? "s" : ""} selected
                  </span>
                  <Button variant='ghost' size='sm' onClick={() => setSelectedOrders(new Set())} className='h-7 text-xs'>
                    Clear
                  </Button>
                </div>
                <div className='flex items-center gap-2'>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant='outline' size='sm' className='h-8'>
                        <Package className='h-3.5 w-3.5 mr-1.5' />
                        Bulk Status
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {(["processing", "packed", "sent_to_logistics", "shipped", "delivered", "cancelled"] as OrderStatus[]).map(
                        (status) => (
                          <DropdownMenuItem key={status} onClick={() => bulkUpdateStatus(status)}>
                            {status.replace(/_/g, " ")}
                          </DropdownMenuItem>
                        )
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button variant='outline' size='sm' className='h-8' onClick={exportToCSV}>
                    <Download className='h-3.5 w-3.5 mr-1.5' />
                    Export
                  </Button>
                </div>
              </div>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='py-3 w-12'>
                    <Checkbox
                      checked={selectedOrders.size > 0 && selectedOrders.size === filteredOrders.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead className='py-3'>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='h-6 -ml-2'
                      onClick={() => {
                        if (sortField === "customer") {
                          setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                        } else {
                          setSortField("customer");
                          setSortDirection("asc");
                        }
                      }}
                    >
                      Order & Customer
                      {sortField === "customer" &&
                        (sortDirection === "asc" ? <ArrowUp className='h-3 w-3 ml-1' /> : <ArrowDown className='h-3 w-3 ml-1' />)}
                      {sortField !== "customer" && <ArrowUpDown className='h-3 w-3 ml-1 opacity-50' />}
                    </Button>
                  </TableHead>
                  <TableHead className='py-3'>Status</TableHead>
                  <TableHead className='py-3'>Fraud Risk</TableHead>
                  <TableHead className='py-3'>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='h-6 -ml-2'
                      onClick={() => {
                        if (sortField === "date") {
                          setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                        } else {
                          setSortField("date");
                          setSortDirection("desc");
                        }
                      }}
                    >
                      Date
                      {sortField === "date" &&
                        (sortDirection === "asc" ? <ArrowUp className='h-3 w-3 ml-1' /> : <ArrowDown className='h-3 w-3 ml-1' />)}
                      {sortField !== "date" && <ArrowUpDown className='h-3 w-3 ml-1 opacity-50' />}
                    </Button>
                  </TableHead>
                  <TableHead className='py-3'>Products</TableHead>
                  <TableHead className='py-3'>Courier</TableHead>
                  <TableHead className='py-3 text-right'>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='h-6'
                      onClick={() => {
                        if (sortField === "amount") {
                          setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                        } else {
                          setSortField("amount");
                          setSortDirection("desc");
                        }
                      }}
                    >
                      Amount
                      {sortField === "amount" &&
                        (sortDirection === "asc" ? <ArrowUp className='h-3 w-3 ml-1' /> : <ArrowDown className='h-3 w-3 ml-1' />)}
                      {sortField !== "amount" && <ArrowUpDown className='h-3 w-3 ml-1 opacity-50' />}
                    </Button>
                  </TableHead>
                  <TableHead className='py-3 text-right w-20'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((o) => {
                  const effectiveStatus: OrderStatus =
                    o.paymentStatus === "failed" || o.paymentStatus === "cancelled" ? "cancelled" : o.status;
                  const displayStatus = o.courier?.deliveryStatus || effectiveStatus;

                  return (
                    <TableRow key={o.id} className={cn("hover:bg-accent/50", selectedOrders.has(o.id) && "bg-primary/5")}>
                      <TableCell className='py-3'>
                        <Checkbox checked={selectedOrders.has(o.id)} onCheckedChange={() => toggleSelectOrder(o.id)} />
                      </TableCell>
                      <TableCell className='py-3'>
                        <div className='space-y-0.5'>
                          <div className='flex items-center gap-1.5 flex-wrap'>
                            <span className='font-mono text-xs font-bold text-primary/80'>
                              {o.courier?.merchantOrderId || o.customOrderId || `#${o.id.slice(-7).toUpperCase()}`}
                            </span>
                            <span className='text-muted-foreground text-xs'>•</span>
                            <span className='font-semibold text-sm'>{o.items.map((item) => item.name)[0]}</span>
                            {o.items.length > 1 && <span className='text-muted-foreground text-xs'>(+{o.items.length - 1})</span>}
                            {o.orderType === "offline" ? (
                              <Badge className='bg-purple-50 text-purple-700 border-purple-200 h-4 px-1 text-[9px]'>Offline</Badge>
                            ) : (
                              <Badge className='bg-blue-50 text-blue-700 border-blue-200 h-4 px-1 text-[9px]'>Online</Badge>
                            )}
                            {isCustomerBlocked(o.customer.phone) && (
                              <Badge variant='destructive' className='h-4 px-1 text-[9px]'>
                                <AlertTriangle className='h-2.5 w-2.5 mr-0.5' />
                                FRAUD
                              </Badge>
                            )}
                          </div>
                          <div className='text-xs text-muted-foreground'>{o.customer.fullName}</div>
                          <div className='text-xs text-muted-foreground'>{o.customer.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell className='py-3'>
                        <div className='flex flex-col gap-1'>
                          <div className='flex items-center gap-1.5'>
                            <Badge className={cn(statusBadgeClass(displayStatus), "text-[10px] px-1.5")}>
                              {displayStatus.replace(/_/g, " ")}
                            </Badge>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant='ghost' size='sm' className='h-5 w-5 p-0'>
                                  <Edit2 className='h-3 w-3' />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className='w-48 p-1.5' align='start'>
                                <div className='space-y-0.5'>
                                  {(
                                    [
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
                                    ] as OrderStatus[]
                                  ).map((status) => (
                                    <Button
                                      key={status}
                                      variant={effectiveStatus === status ? "secondary" : "ghost"}
                                      size='sm'
                                      className='w-full justify-start text-xs h-7'
                                      onClick={() => updateStatus(o.id, status)}
                                    >
                                      <span className='capitalize'>{status.replace(/_/g, " ")}</span>
                                      {effectiveStatus === status && <span className='ml-auto text-[10px]'>✓</span>}
                                    </Button>
                                  ))}
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                          {o.paymentMethod === "online" && (
                            <Badge variant='outline' className={cn(paymentStatusBadgeClass(o.paymentStatus), "text-[9px] px-1.5 w-fit")}>
                              {o.paymentStatus ?? "pending"}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className='py-3'>
                        {o.fraudCheck ? (
                          <div className='space-y-1'>
                            <Badge
                              variant='outline'
                              className={cn(
                                "text-[9px] font-medium px-1.5",
                                o.fraudCheck.fraud_risk === "low" && "border-green-200 text-green-600 bg-green-50/50",
                                o.fraudCheck.fraud_risk === "medium" && "border-yellow-200 text-yellow-600 bg-yellow-50/50",
                                o.fraudCheck.fraud_risk === "high" && "border-red-200 text-red-600 bg-red-50/50"
                              )}
                            >
                              {o.fraudCheck.fraud_risk.toUpperCase()}
                            </Badge>
                            <div className='flex items-center gap-1'>
                              <div className='w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden'>
                                <div
                                  className={cn(
                                    "h-full",
                                    o.fraudCheck.success_rate >= 90 && "bg-green-400",
                                    o.fraudCheck.success_rate >= 70 && o.fraudCheck.success_rate < 90 && "bg-yellow-400",
                                    o.fraudCheck.success_rate < 70 && "bg-red-400"
                                  )}
                                  style={{ width: `${o.fraudCheck.success_rate}%` }}
                                />
                              </div>
                              <span className='text-[10px] text-muted-foreground'>{o.fraudCheck.success_rate.toFixed(0)}%</span>
                            </div>
                          </div>
                        ) : (
                          <span className='text-xs text-muted-foreground'>—</span>
                        )}
                      </TableCell>
                      <TableCell className='py-3'>
                        <div className='text-xs'>{format(new Date(o.createdAt), "MMM d, yyyy")}</div>
                        <div className='text-[10px] text-muted-foreground'>{format(new Date(o.createdAt), "h:mm a")}</div>
                      </TableCell>
                      <TableCell className='py-3'>
                        <div className='flex items-center gap-2'>
                          <div className='flex -space-x-1.5'>
                            {o.items.slice(0, 3).map((item, idx) => (
                              <div
                                key={idx}
                                className='relative h-9 w-9 overflow-hidden rounded-md border-2 border-background bg-accent/30'
                              >
                                <CloudImage src={item.image} alt={item.name} fill className='object-contain p-0.5' />
                              </div>
                            ))}
                            {o.items.length > 3 && (
                              <div className='relative h-9 w-9 flex items-center justify-center rounded-md border-2 border-background bg-muted/50'>
                                <span className='text-[9px] font-semibold text-muted-foreground'>+{o.items.length - 3}</span>
                              </div>
                            )}
                          </div>
                          <div className='text-xs'>
                            <div className='font-medium'>{o.items.length} items</div>
                            <div className='text-muted-foreground'>{o.items.reduce((acc, it) => acc + it.quantity, 0)} qty</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className='py-3'>
                        {o.courier?.consignmentId && o.courier?.serviceId === "pathao" && o.customer.phone ? (
                          <div className='flex items-center gap-1'>
                            <a
                              href={getPathaoTrackingUrl(o.courier.consignmentId, o.customer.phone)}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='text-xs text-primary hover:underline flex items-center gap-0.5'
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className='h-3 w-3' />
                              Track
                            </a>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(getPathaoTrackingUrl(o.courier!.consignmentId!, o.customer.phone!), "Tracking link");
                              }}
                              className='h-5 w-5 p-0'
                            >
                              <Copy className='h-2.5 w-2.5' />
                            </Button>
                          </div>
                        ) : o.courier?.consignmentId ? (
                          <span className='text-xs text-muted-foreground'>{o.courier.serviceName || "Courier"}</span>
                        ) : (
                          <span className='text-xs text-muted-foreground'>—</span>
                        )}
                      </TableCell>
                      <TableCell className='py-3 text-right'>
                        <div className='text-sm font-semibold'>
                          {currencySymbol}
                          {o.total.toFixed(2)}
                        </div>
                        <div className='text-[10px] text-muted-foreground'>
                          Sub: {currencySymbol}
                          {o.subtotal.toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell className='py-3 text-right'>
                        <Button variant='outline' size='sm' className='h-8 w-8 p-0' asChild>
                          <Link href={`/merchant/orders/${o.id}`}>
                            <Eye className='h-4 w-4' />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination.total > 0 && (
            <div className='mt-6'>
              <Pagination
                pagination={pagination}
                currentPage={currentPage}
                limit={limit}
                onPageChange={handlePageChange}
                onLimitChange={handleLimitChange}
                loading={loading}
                itemName='orders'
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function statusBadgeClass(status: OrderStatus | string): string {
  const statusLower = String(status).toLowerCase();

  switch (statusLower) {
    case "pending":
      return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800";
    case "waiting_for_confirmation":
      return "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950/50 dark:text-yellow-400 dark:border-yellow-800";
    case "confirmed":
      return "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-950/50 dark:text-cyan-400 dark:border-cyan-800";
    case "processing":
      return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800";
    case "restocking":
      return "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-400 dark:border-orange-800";
    case "packed":
      return "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-400 dark:border-purple-800";
    case "sent_to_logistics":
      return "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-400 dark:border-indigo-800";
    case "shipped":
      return "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950/50 dark:text-violet-400 dark:border-violet-800";
    case "delivered":
      return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800";
    case "cancelled":
      return "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800";
  }

  if (statusLower.includes("delivered") || statusLower.includes("completed")) {
    return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800";
  }
  if (statusLower.includes("cancelled") || statusLower.includes("failed") || statusLower.includes("returned")) {
    return "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800";
  }
  if (statusLower.includes("shipped") || statusLower.includes("transit") || statusLower.includes("on-the-way")) {
    return "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-400 dark:border-indigo-800";
  }
  if (statusLower.includes("processing") || statusLower.includes("in_review") || statusLower.includes("ready-for-delivery")) {
    return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800";
  }

  return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-950/50 dark:text-gray-400 dark:border-gray-800";
}

function paymentStatusBadgeClass(status?: PaymentStatus) {
  switch (status) {
    case "completed":
      return "border-emerald-200 text-emerald-700 bg-emerald-50";
    case "failed":
    case "cancelled":
      return "border-rose-200 text-rose-700 bg-rose-50";
    case "refunded":
      return "border-indigo-200 text-indigo-700 bg-indigo-50";
    case "pending":
    default:
      return "border-amber-200 text-amber-700 bg-amber-50";
  }
}

export default OrdersClient;

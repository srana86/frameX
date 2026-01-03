"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import type { Product, Order } from "@/lib/types";
import type { ProductCategory } from "@/app/api/products/categories/route";
import type { Investment } from "@/app/(home)/merchant/investments/actions";
import { useCurrencySymbol } from "@/hooks/use-currency";
import { useOrdersSocket } from "@/hooks/use-orders-socket";
import { toast } from "sonner";

import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  ArrowUpRight,
  MoreVertical,
  GripVertical,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  Package,
  Calculator,
  Wallet,
  BarChart3,
  Eye,
  Store,
  ShoppingBag,
  Sparkles,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import Link from "next/link";
import { format, startOfDay, endOfDay } from "date-fns";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { OrderTimeAnalytics } from "./subscription/OrderTimeAnalytics";

type DashboardData = {
  products: Product[];
  orders: Order[];
  categories: ProductCategory[];
  investments: Investment[];
};

type Props = {
  initialData: DashboardData;
  brandName?: string;
};

type TimePeriod = "7days" | "30days" | "3months" | "all";

export function DashboardClient({ initialData, brandName = "E-Commerce Store" }: Props) {
  const currencySymbol = useCurrencySymbol();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("7days");
  const [orders, setOrders] = useState<Order[]>(initialData.orders);
  const [investments, setInvestments] = useState<Investment[]>(initialData.investments);
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState<string>("rgb(59, 130, 246)"); // Default blue fallback
  const [isSyncingCourier, setIsSyncingCourier] = useState(false);

  // Get merchant ID
  useEffect(() => {
    fetch("/api/merchant/context")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.merchant?.id) {
          setMerchantId(data.data.merchant.id);
        }
      })
      .catch(() => {
        // Silently fail
      });
  }, []);

  // Get computed primary color from CSS variable
  useEffect(() => {
    const getPrimaryColor = () => {
      if (typeof window !== "undefined") {
        const root = document.documentElement;
        const primaryHsl = getComputedStyle(root).getPropertyValue("--primary").trim();

        if (primaryHsl) {
          // Convert HSL to RGB if needed, or use directly if it's already RGB
          if (primaryHsl.startsWith("hsl")) {
            // Parse HSL and convert to RGB
            const hslMatch = primaryHsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
            if (hslMatch) {
              const h = parseInt(hslMatch[1]) / 360;
              const s = parseInt(hslMatch[2]) / 100;
              const l = parseInt(hslMatch[3]) / 100;

              const c = (1 - Math.abs(2 * l - 1)) * s;
              const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
              const m = l - c / 2;

              let r = 0,
                g = 0,
                b = 0;

              if (h * 6 < 1) {
                r = c;
                g = x;
                b = 0;
              } else if (h * 6 < 2) {
                r = x;
                g = c;
                b = 0;
              } else if (h * 6 < 3) {
                r = 0;
                g = c;
                b = x;
              } else if (h * 6 < 4) {
                r = 0;
                g = x;
                b = c;
              } else if (h * 6 < 5) {
                r = x;
                g = 0;
                b = c;
              } else {
                r = c;
                g = 0;
                b = x;
              }

              r = Math.round((r + m) * 255);
              g = Math.round((g + m) * 255);
              b = Math.round((b + m) * 255);

              setPrimaryColor(`rgb(${r}, ${g}, ${b})`);
            } else {
              setPrimaryColor(primaryHsl);
            }
          } else {
            setPrimaryColor(primaryHsl);
          }
        }
      }
    };

    getPrimaryColor();
    // Re-check on theme changes
    const observer = new MutationObserver(getPrimaryColor);
    if (typeof window !== "undefined") {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class", "style"],
      });
    }

    return () => observer.disconnect();
  }, []);

  // Handle new order from socket
  const handleNewOrder = useCallback((newOrder: Order) => {
    setOrders((prev) => {
      // Check if order already exists (prevent duplicates)
      const exists = prev.some((o) => o.id === newOrder.id);
      if (exists) {
        return prev;
      }
      // Add new order at the beginning
      return [newOrder, ...prev];
    });
  }, []);

  // Handle order update from socket
  const handleOrderUpdate = useCallback((updatedOrder: Order) => {
    setOrders((prev) => {
      // Check if order exists - if yes, update it; if no, add it
      const exists = prev.some((o) => o.id === updatedOrder.id);
      if (exists) {
        // Update existing order
        return prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o));
      } else {
        // Add new order at the beginning
        return [updatedOrder, ...prev];
      }
    });
  }, []);

  // Use socket for real-time order updates
  useOrdersSocket(merchantId, handleNewOrder, handleOrderUpdate);

  const stats = useMemo(() => {
    const totalProducts = initialData.products.length;
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

    // Calculate total shipping charges
    const totalShippingCharges = orders.reduce((sum, order) => sum + (order.shipping || 0), 0);

    // Calculate revenue without shipping (product sales only)
    const revenueWithoutShipping = orders.reduce((sum, order) => {
      return sum + order.total - (order.shipping || 0);
    }, 0);

    // Calculate total investments
    const totalInvestments = investments.reduce((sum, investment) => sum + investment.value, 0);

    // Calculate total buy costs from products
    const totalBuyCosts = initialData.products.reduce((sum, product) => {
      if (product.buyPrice) {
        return sum + product.buyPrice;
      }
      return sum;
    }, 0);

    // Calculate net profit: product sales (excluding shipping) - investments
    const netProfit = revenueWithoutShipping - totalInvestments;

    // Calculate average profit and profit margin from actual order sales (after discounts)
    // Create a product map for quick lookup
    const productMap = new Map<string, Product>();
    initialData.products.forEach((product) => {
      productMap.set(product.id, product);
    });

    let totalProfitFromSales = 0;
    let totalBuyCostFromSales = 0;
    let totalItemsSold = 0;

    orders.forEach((order) => {
      // Calculate subtotal from order items
      const orderSubtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

      // Calculate discount amount
      let discountAmount = order.discountAmount ?? 0;
      if (order.discountPercentage && order.discountPercentage > 0) {
        discountAmount = (orderSubtotal * order.discountPercentage) / 100;
      }

      // Calculate subtotal after discount
      const subtotalAfterDiscount = Math.max(0, orderSubtotal - discountAmount);

      // Calculate discount ratio (how much each item's price is reduced)
      const discountRatio = orderSubtotal > 0 ? subtotalAfterDiscount / orderSubtotal : 1;

      // Process each order item
      order.items.forEach((item) => {
        const product = productMap.get(item.productId);
        if (product && product.buyPrice && product.buyPrice > 0) {
          // Calculate actual sale price per unit after discount
          const actualSalePricePerUnit = item.price * discountRatio;

          // Calculate profit per unit
          const profitPerUnit = actualSalePricePerUnit - product.buyPrice;

          // Calculate total profit and cost for this item (multiply by quantity)
          const itemProfit = profitPerUnit * item.quantity;
          const itemBuyCost = product.buyPrice * item.quantity;

          totalProfitFromSales += itemProfit;
          totalBuyCostFromSales += itemBuyCost;
          totalItemsSold += item.quantity;
        }
      });
    });

    // Calculate average profit per item sold
    const averageProfit = totalItemsSold > 0 ? totalProfitFromSales / totalItemsSold : 0;

    // Calculate profit margin percentage
    const profitMargin = totalBuyCostFromSales > 0 ? (totalProfitFromSales / totalBuyCostFromSales) * 100 : 0;

    // Calculate Product Profit: Product Sales - Buy Costs (simple calculation)
    const productProfit = revenueWithoutShipping - totalBuyCostFromSales;

    // Calculate comprehensive analytics based on buy prices and sales
    // Product sales performance map
    const productSalesMap = new Map<
      string,
      {
        product: Product;
        totalSold: number;
        totalRevenue: number;
        totalProfit: number;
        totalBuyCost: number;
        averageSalePrice: number;
        profitMargin: number;
      }
    >();

    // Process all orders to build product sales performance
    orders.forEach((order) => {
      const orderSubtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      let discountAmount = order.discountAmount ?? 0;
      if (order.discountPercentage && order.discountPercentage > 0) {
        discountAmount = (orderSubtotal * order.discountPercentage) / 100;
      }
      const subtotalAfterDiscount = Math.max(0, orderSubtotal - discountAmount);
      const discountRatio = orderSubtotal > 0 ? subtotalAfterDiscount / orderSubtotal : 1;

      order.items.forEach((item) => {
        const product = productMap.get(item.productId);
        if (product && product.buyPrice && product.buyPrice > 0) {
          const actualSalePricePerUnit = item.price * discountRatio;
          const profitPerUnit = actualSalePricePerUnit - product.buyPrice;
          const itemProfit = profitPerUnit * item.quantity;
          const itemRevenue = actualSalePricePerUnit * item.quantity;
          const itemBuyCost = product.buyPrice * item.quantity;

          const existing = productSalesMap.get(item.productId);
          if (existing) {
            existing.totalSold += item.quantity;
            existing.totalRevenue += itemRevenue;
            existing.totalProfit += itemProfit;
            existing.totalBuyCost += itemBuyCost;
            existing.averageSalePrice = existing.totalRevenue / existing.totalSold;
            existing.profitMargin = existing.totalBuyCost > 0 ? (existing.totalProfit / existing.totalBuyCost) * 100 : 0;
          } else {
            productSalesMap.set(item.productId, {
              product,
              totalSold: item.quantity,
              totalRevenue: itemRevenue,
              totalProfit: itemProfit,
              totalBuyCost: itemBuyCost,
              averageSalePrice: actualSalePricePerUnit,
              profitMargin: product.buyPrice > 0 ? (profitPerUnit / product.buyPrice) * 100 : 0,
            });
          }
        }
      });
    });

    // Top products by profit
    const topProductsByProfit = Array.from(productSalesMap.values())
      .sort((a, b) => b.totalProfit - a.totalProfit)
      .slice(0, 5);

    // Products with negative profit (selling below cost)
    const negativeProfitProducts = Array.from(productSalesMap.values())
      .filter((p) => p.totalProfit < 0)
      .sort((a, b) => a.totalProfit - b.totalProfit)
      .slice(0, 5);

    // Calculate total inventory value (based on buy prices)
    const totalInventoryValue = initialData.products.reduce((sum, product) => {
      if (product.buyPrice && product.stock) {
        return sum + product.buyPrice * product.stock;
      }
      return sum;
    }, 0);

    // Calculate total potential revenue from inventory
    const totalPotentialRevenue = initialData.products.reduce((sum, product) => {
      if (product.price && product.stock) {
        return sum + product.price * product.stock;
      }
      return sum;
    }, 0);

    // Calculate total potential profit from inventory
    const totalPotentialProfit = initialData.products.reduce((sum, product) => {
      if (product.buyPrice && product.price && product.stock) {
        const profitPerUnit = product.price - product.buyPrice;
        return sum + profitPerUnit * product.stock;
      }
      return sum;
    }, 0);

    // Category performance by profit
    const categoryProfitMap = new Map<
      string,
      {
        category: string;
        totalRevenue: number;
        totalProfit: number;
        totalBuyCost: number;
        productCount: number;
        profitMargin: number;
      }
    >();

    productSalesMap.forEach((sales) => {
      const category = sales.product.category || "Uncategorized";
      const existing = categoryProfitMap.get(category);
      if (existing) {
        existing.totalRevenue += sales.totalRevenue;
        existing.totalProfit += sales.totalProfit;
        existing.totalBuyCost += sales.totalBuyCost;
        existing.productCount += 1;
        existing.profitMargin = existing.totalBuyCost > 0 ? (existing.totalProfit / existing.totalBuyCost) * 100 : 0;
      } else {
        categoryProfitMap.set(category, {
          category,
          totalRevenue: sales.totalRevenue,
          totalProfit: sales.totalProfit,
          totalBuyCost: sales.totalBuyCost,
          productCount: 1,
          profitMargin: sales.totalBuyCost > 0 ? (sales.totalProfit / sales.totalBuyCost) * 100 : 0,
        });
      }
    });

    const topCategoriesByProfit = Array.from(categoryProfitMap.values())
      .sort((a, b) => b.totalProfit - a.totalProfit)
      .slice(0, 5);

    // Products needing attention (low stock + high profit potential)
    const productsNeedingAttention = initialData.products
      .filter((product) => {
        if (!product.buyPrice || !product.price || !product.stock) return false;
        const profitPerUnit = product.price - product.buyPrice;
        const profitMargin = product.buyPrice > 0 ? (profitPerUnit / product.buyPrice) * 100 : 0;
        return product.stock <= 10 && profitMargin > 20; // Low stock but high profit margin
      })
      .sort((a, b) => {
        const aProfit = a.price - (a.buyPrice || 0);
        const bProfit = b.price - (b.buyPrice || 0);
        return bProfit - aProfit;
      })
      .slice(0, 5);

    // Calculate ROI (Return on Investment)
    const roi = totalInvestments > 0 ? ((totalProfitFromSales - totalInvestments) / totalInvestments) * 100 : 0;

    // Calculate growth (comparing last 30 days to previous 30 days)
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const previous30Days = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const recentOrders = orders.filter((o) => new Date(o.createdAt) >= last30Days);
    const previousOrders = orders.filter((o) => new Date(o.createdAt) >= previous30Days && new Date(o.createdAt) < last30Days);

    // Calculate shipping analytics
    const averageShippingPerOrder = totalOrders > 0 ? totalShippingCharges / totalOrders : 0;
    const shippingAsPercentageOfRevenue = totalRevenue > 0 ? (totalShippingCharges / totalRevenue) * 100 : 0;

    // Calculate shipping growth
    const recentShipping = recentOrders.reduce((sum, order) => sum + (order.shipping || 0), 0);
    const previousShipping = previousOrders.reduce((sum, order) => sum + (order.shipping || 0), 0);
    const shippingGrowth = previousShipping > 0 ? ((recentShipping - previousShipping) / previousShipping) * 100 : 0;

    // Calculate net profit including shipping (revenue includes shipping, so net profit already accounts for it)
    // But we can show breakdown: Product Profit + Shipping Revenue
    const netProfitWithShippingBreakdown = {
      productProfit: totalProfitFromSales,
      shippingRevenue: totalShippingCharges,
      total: totalProfitFromSales + totalShippingCharges - totalInvestments,
    };

    const recentRevenue = recentOrders.reduce((sum, order) => sum + order.total, 0);
    const previousRevenue = previousOrders.reduce((sum, order) => sum + order.total, 0);
    const revenueGrowth = previousRevenue > 0 ? ((recentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    // New customers (unique customers in last 30 days)
    const recentCustomers = new Set(recentOrders.map((o) => o.customer.email || o.customer.phone));
    const previousCustomers = new Set(previousOrders.map((o) => o.customer.email || o.customer.phone));
    const newCustomersCount = recentCustomers.size;
    const previousCustomersCount = previousCustomers.size;
    const customersGrowth = previousCustomersCount > 0 ? ((newCustomersCount - previousCustomersCount) / previousCustomersCount) * 100 : 0;

    // Active accounts (total unique customers)
    const allCustomers = new Set(orders.map((o) => o.customer.email || o.customer.phone));
    const activeAccountsCount = allCustomers.size;
    const previousActiveAccounts = previousCustomers.size;
    const activeAccountsGrowth =
      previousActiveAccounts > 0 ? ((activeAccountsCount - previousActiveAccounts) / previousActiveAccounts) * 100 : 0;

    // Order counts by status
    const ordersByStatus = {
      pending: orders.filter((o) => o.status === "pending").length,
      processing: orders.filter((o) => o.status === "processing").length,
      shipped: orders.filter((o) => o.status === "shipped").length,
      delivered: orders.filter((o) => o.status === "delivered").length,
      cancelled: orders.filter((o) => o.status === "cancelled").length,
    };

    // Growth rate (overall revenue growth)
    const growthRate = revenueGrowth;

    return {
      totalRevenue,
      totalInvestments,
      totalBuyCosts,
      netProfit,
      averageProfit,
      profitMargin,
      revenueGrowth,
      newCustomersCount,
      customersGrowth,
      activeAccountsCount,
      activeAccountsGrowth,
      growthRate,
      totalOrders,
      ordersByStatus,
      // Shipping analytics
      totalShippingCharges,
      revenueWithoutShipping,
      averageShippingPerOrder,
      shippingAsPercentageOfRevenue,
      shippingGrowth,
      netProfitWithShippingBreakdown,
      // Analytics data
      topProductsByProfit,
      negativeProfitProducts,
      totalInventoryValue,
      totalPotentialRevenue,
      totalPotentialProfit,
      topCategoriesByProfit,
      productsNeedingAttention,
      roi,
      totalProfitFromSales,
      totalBuyCostFromSales,
      productProfit,
    };
  }, [orders, investments, initialData.products]);

  // Revenue chart data based on selected time period
  const revenueChartData = useMemo(() => {
    if (timePeriod === "all") {
      // For "all" option, get all orders and group by date
      if (orders.length === 0) return [];

      // Find the earliest and latest order dates
      const orderDates = orders.map((o) => new Date(o.createdAt));
      const earliestDate = new Date(Math.min(...orderDates.map((d) => d.getTime())));
      const latestDate = new Date(Math.max(...orderDates.map((d) => d.getTime())));

      // Calculate number of days between earliest and latest
      const daysDiff = Math.ceil((latestDate.getTime() - earliestDate.getTime()) / (24 * 60 * 60 * 1000));
      const days = daysDiff + 1; // Include both start and end days

      const data = [];
      const startDate = startOfDay(earliestDate);

      for (let i = 0; i < days; i++) {
        const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
        const dateStr = format(date, days <= 7 ? "MMM dd" : days <= 30 ? "MMM dd" : days <= 90 ? "MMM dd" : "MMM dd, yyyy");
        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);

        const dayOrders = orders.filter((o) => {
          const orderDate = new Date(o.createdAt);
          return orderDate >= dayStart && orderDate <= dayEnd;
        });

        const revenue = dayOrders.reduce((sum, order) => sum + order.total, 0);

        data.push({
          date: dateStr,
          revenue: Math.round(revenue * 100) / 100,
        });
      }

      return data;
    }

    // For fixed time periods
    let days = 7;
    if (timePeriod === "30days") days = 30;
    if (timePeriod === "3months") days = 90;

    const data = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = format(date, days <= 7 ? "MMM dd" : days <= 30 ? "MMM dd" : "MMM dd");
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      const dayOrders = orders.filter((o) => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= dayStart && orderDate <= dayEnd;
      });

      const revenue = dayOrders.reduce((sum, order) => sum + order.total, 0);

      data.push({
        date: dateStr,
        revenue: Math.round(revenue * 100) / 100,
      });
    }

    return data;
  }, [orders, timePeriod]);

  // Recent orders for table
  const recentOrders = useMemo(() => {
    return orders.slice(0, 10).map((order) => {
      const productCount = order.items.length;
      const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
      return {
        ...order,
        productCount,
        totalQuantity,
      };
    });
  }, [orders]);

  // Orders grouped by status
  const ordersByStatus = useMemo(() => {
    const statusGroups: Record<string, Order[]> = {
      pending: [],
      processing: [],
      shipped: [],
      delivered: [],
      cancelled: [],
    };

    orders.forEach((order) => {
      if (statusGroups[order.status]) {
        statusGroups[order.status].push(order);
      }
    });

    return statusGroups;
  }, [orders]);

  // Status counts
  const statusCounts = useMemo(() => {
    return {
      pending: ordersByStatus.pending.length,
      processing: ordersByStatus.processing.length,
      shipped: ordersByStatus.shipped.length,
      delivered: ordersByStatus.delivered.length,
      cancelled: ordersByStatus.cancelled.length,
    };
  }, [ordersByStatus]);

  // Category-wise statistics
  const categoryStats = useMemo(() => {
    const categoryMap = new Map<string, { name: string; orders: Set<string>; revenue: number; items: number; quantity: number }>();

    // Create a product map for quick lookup
    const productMap = new Map<string, Product>();
    initialData.products.forEach((product) => {
      productMap.set(product.id, product);
    });

    // Process all orders
    orders.forEach((order) => {
      order.items.forEach((item) => {
        const product = productMap.get(item.productId);
        if (product && product.category) {
          const categoryName = product.category;
          const existing = categoryMap.get(categoryName);

          if (existing) {
            existing.orders.add(order.id);
            existing.revenue += item.price * item.quantity;
            existing.items += 1;
            existing.quantity += item.quantity;
          } else {
            categoryMap.set(categoryName, {
              name: categoryName,
              orders: new Set([order.id]),
              revenue: item.price * item.quantity,
              items: 1,
              quantity: item.quantity,
            });
          }
        }
      });
    });

    // Convert to array and format
    return Array.from(categoryMap.values())
      .map((stat) => ({
        name: stat.name,
        orders: stat.orders.size,
        revenue: stat.revenue,
        items: stat.items,
        quantity: stat.quantity,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [orders, initialData.products]);

  const chartConfig = useMemo(
    () => ({
      revenue: {
        label: "Revenue",
        color: primaryColor,
      },
    }),
    [primaryColor]
  );

  // Function to sync all courier statuses
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

  // Helper function to get status badge class based on delivery status or order status
  const getStatusBadgeClass = (status: string) => {
    const statusLower = String(status).toLowerCase();

    // Check for exact OrderStatus matches first
    switch (statusLower) {
      case "pending":
        return "bg-amber-100 hover:bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/30 border-amber-300 dark:border-amber-700";
      case "processing":
        return "bg-blue-100 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/30 border-blue-300 dark:border-blue-700";
      case "shipped":
        return "bg-indigo-100 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700";
      case "delivered":
        return "bg-green-100 hover:bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/30 border-green-300 dark:border-green-700";
      case "cancelled":
        return "bg-red-100 hover:bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/30 border-red-300 dark:border-red-700";
    }

    // Handle deliveryStatus strings by checking for keywords
    if (statusLower.includes("delivered") || statusLower.includes("completed")) {
      return "bg-green-100 hover:bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/30 border-green-300 dark:border-green-700";
    }
    if (statusLower.includes("cancelled") || statusLower.includes("failed") || statusLower.includes("returned")) {
      return "bg-red-100 hover:bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/30 border-red-300 dark:border-red-700";
    }
    if (
      statusLower.includes("shipped") ||
      statusLower.includes("transit") ||
      statusLower.includes("on-the-way") ||
      statusLower.includes("delivery-in-progress")
    ) {
      return "bg-indigo-100 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700";
    }
    if (
      statusLower.includes("processing") ||
      statusLower.includes("in_review") ||
      statusLower.includes("ready-for-delivery") ||
      statusLower.includes("pickup-pending")
    ) {
      return "bg-blue-100 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/30 border-blue-300 dark:border-blue-700";
    }

    // Default fallback for unknown statuses
    return "bg-gray-100 hover:bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 dark:hover:bg-gray-900/30 border-gray-300 dark:border-gray-700";
  };

  // Helper function to get status icon based on status
  const getStatusIcon = (status: string) => {
    const statusLower = String(status).toLowerCase();

    if (statusLower === "pending") {
      return <Clock className='h-3 w-3 mr-1 inline' />;
    }
    if (
      statusLower === "processing" ||
      statusLower.includes("processing") ||
      statusLower.includes("in_review") ||
      statusLower.includes("pickup")
    ) {
      return <Package className='h-3 w-3 mr-1 inline' />;
    }
    if (
      statusLower === "shipped" ||
      statusLower.includes("shipped") ||
      statusLower.includes("transit") ||
      statusLower.includes("on-the-way")
    ) {
      return <Truck className='h-3 w-3 mr-1 inline' />;
    }
    if (statusLower === "delivered" || statusLower.includes("delivered") || statusLower.includes("completed")) {
      return <CheckCircle className='h-3 w-3 mr-1 inline' />;
    }
    if (
      statusLower === "cancelled" ||
      statusLower.includes("cancelled") ||
      statusLower.includes("failed") ||
      statusLower.includes("returned")
    ) {
      return <XCircle className='h-3 w-3 mr-1 inline' />;
    }

    // Default icon
    return <Package className='h-3 w-3 mr-1 inline' />;
  };

  return (
    <div className='w-full space-y-4 sm:space-y-5 md:space-y-6 mt-4'>
      {/* Store Header - Cool Design */}
      <div className='flex items-center justify-between p-4 sm:p-6 rounded-xl border bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 dark:from-primary/10 dark:via-primary/20 dark:to-primary/10 mb-4 sm:mb-6'>
        <div className='flex items-center gap-3 sm:gap-4'>
          <div className='relative'>
            <div className='p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg'>
              <Store className='h-6 w-6 sm:h-8 sm:w-8 text-primary-foreground' />
            </div>
            <div className='absolute -top-1 -right-1 p-1.5 rounded-full bg-background border-2 border-primary'>
              <Sparkles className='h-3 w-3 text-primary' />
            </div>
          </div>
          <div>
            <h1 className='text-xl sm:text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2'>
              {brandName} Store
              <ShoppingBag className='h-5 w-5 sm:h-6 sm:w-6 text-primary' />
            </h1>
            <p className='text-xs sm:text-sm text-muted-foreground mt-0.5'>Dashboard Overview</p>
          </div>
        </div>
        <div className='flex items-center gap-2 sm:gap-3'>
          <Button
            variant='outline'
            size='sm'
            onClick={syncAllCourierStatus}
            disabled={isSyncingCourier}
            className='gap-1.5 text-xs sm:text-sm'
          >
            {isSyncingCourier ? <Loader2 className='h-3.5 w-3.5 animate-spin' /> : <RefreshCw className='h-3.5 w-3.5' />}
            <span className='hidden sm:inline'>Resync Courier</span>
            <span className='sm:hidden'>Sync</span>
          </Button>
          <div className='hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/50 border'>
            <Package className='h-4 w-4 text-muted-foreground' />
            <span className='text-xs font-medium text-muted-foreground'>{stats.totalOrders} Orders</span>
          </div>
        </div>
      </div>

      {/* Stats Cards - Cool Icon Design */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mb-4 sm:mb-6'>
        {/* Total Revenue - Primary Blue */}
        <div className='flex flex-col gap-1.5 xl:gap-3 p-3 sm:p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow'>
          <div className='flex items-center gap-2'>
            <div className='p-2 rounded-full border shrink-0 bg-transparent'>
              <DollarSign className='size-4 md:size-5 text-primary' />
            </div>
            <p className='text-[10px] sm:text-base font-medium text-foreground tracking-wide'>Total Revenue</p>
          </div>
          <div className='text-base sm:text-lg md:text-xl font-bold text-foreground truncate'>
            {currencySymbol}
            {stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </div>
        </div>

        {/* Total Orders - Indigo */}
        <div className='flex flex-col gap-1.5 xl:gap-3 p-3 sm:p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow'>
          <div className='flex items-center gap-2'>
            <div className='p-2 rounded-full border shrink-0 bg-transparent'>
              <Package className='size-4 md:size-5 text-indigo-600 dark:text-indigo-400' />
            </div>
            <p className='text-[10px] sm:text-base font-medium text-foreground tracking-wide'>Total Orders</p>
          </div>
          <div className='text-base sm:text-lg md:text-xl font-bold text-foreground'>{stats.totalOrders.toLocaleString()}</div>
        </div>

        {/* New Customers - Sky Blue */}
        <div className='flex flex-col gap-1.5 xl:gap-3 p-3 sm:p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow'>
          <div className='flex items-center gap-2'>
            <div className='p-2 rounded-full border shrink-0 bg-transparent'>
              <Users className='size-4 md:size-5 text-sky-600 dark:text-sky-400' />
            </div>
            <p className='text-[10px] sm:text-base font-medium text-foreground tracking-wide'>New Customers</p>
          </div>
          <div className='text-base sm:text-lg md:text-xl font-bold text-foreground'>{stats.newCustomersCount.toLocaleString()}</div>
        </div>

        {/* Growth Rate - Green */}
        <div className='flex flex-col gap-1.5 xl:gap-3 p-3 sm:p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow'>
          <div className='flex items-center gap-2'>
            <div className='p-2 rounded-full border shrink-0 bg-transparent'>
              <TrendingUp className='size-4 md:size-5 text-green-600 dark:text-green-400' />
            </div>
            <p className='text-[10px] sm:text-base font-medium text-foreground tracking-wide'>Growth Rate</p>
          </div>
          <div className='text-base sm:text-lg md:text-xl font-bold text-foreground'>{stats.growthRate.toFixed(1)}%</div>
        </div>

        {/* Net Profit - Emerald */}
        <div className='flex flex-col gap-1.5 xl:gap-3 p-3 sm:p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow'>
          <div className='flex items-center gap-2'>
            <div className='p-2 rounded-full border shrink-0 bg-transparent'>
              <DollarSign className='size-4 md:size-5 text-emerald-600 dark:text-emerald-400' />
            </div>
            <p className='text-[10px] sm:text-base font-medium text-foreground tracking-wide'>Net Profit</p>
          </div>
          <div
            className={`text-base sm:text-lg md:text-xl font-bold truncate ${
              stats.netProfit >= 0 ? "text-foreground" : "text-destructive"
            }`}
          >
            {currencySymbol}
            {stats.netProfit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </div>
        </div>

        {/* Average Profit - Teal/Cyan */}
        <div className='flex flex-col gap-1.5 xl:gap-3 p-3 sm:p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow'>
          <div className='flex items-center gap-2'>
            <div className='p-2 rounded-full border shrink-0 bg-transparent'>
              <TrendingUp
                className={`size-4 md:size-5 ${stats.averageProfit >= 0 ? "text-teal-600 dark:text-teal-400" : "text-destructive"}`}
              />
            </div>
            <p className='text-[10px] sm:text-base font-medium text-foreground tracking-wide'>Avg Profit</p>
          </div>
          <div
            className={`text-base sm:text-lg md:text-xl font-bold truncate ${
              stats.averageProfit >= 0 ? "text-foreground" : "text-destructive"
            }`}
          >
            {currencySymbol}
            {stats.averageProfit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </div>
        </div>

        {/* Profit Margin - Purple/Violet */}
        <div className='flex flex-col gap-1.5 xl:gap-3 p-3 sm:p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow'>
          <div className='flex items-center gap-2'>
            <div className='p-2 rounded-full border shrink-0 bg-transparent'>
              <BarChart3
                className={`size-4 md:size-5 ${stats.profitMargin >= 0 ? "text-purple-600 dark:text-purple-400" : "text-destructive"}`}
              />
            </div>
            <p className='text-[10px] sm:text-base font-medium text-foreground tracking-wide'>Profit Margin</p>
          </div>
          <div className={`text-base sm:text-lg md:text-xl font-bold ${stats.profitMargin >= 0 ? "text-foreground" : "text-destructive"}`}>
            {stats.profitMargin.toFixed(1)}%
          </div>
        </div>

        {/* Shipping Revenue - Orange/Amber */}
        <div className='flex flex-col gap-1.5 xl:gap-3 p-3 sm:p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow'>
          <div className='flex items-center gap-2'>
            <div className='p-2 rounded-full border shrink-0 bg-transparent'>
              <Truck className='size-4 md:size-5 text-orange-600 dark:text-orange-400' />
            </div>
            <p className='text-[10px] sm:text-base font-medium text-foreground tracking-wide'>Shipping</p>
          </div>
          <div className='text-base sm:text-lg md:text-xl font-bold text-foreground truncate'>
            {currencySymbol}
            {stats.totalShippingCharges.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Revenue Chart and Order Status */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6'>
        {/* Revenue Chart - 2 columns */}
        <div className='lg:col-span-2 rounded-xl border border-slate-200/50 overflow-hidden'>
          <div className='p-3 sm:p-4 border-b border-slate-200/50 dark:border-slate-800/30 bg-gradient-to-r from-slate-50/80 to-white dark:from-slate-900/40 dark:to-slate-950/20'>
            <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4'>
              <div className='flex items-center gap-2 md:gap-3'>
                <div>
                  <h3 className='text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100'>Total Revenue</h3>
                </div>
              </div>
              <div className='flex flex-wrap gap-1.5 sm:gap-2 items-center'>
                <Button
                  variant={timePeriod === "7days" ? "default" : "outline"}
                  size='sm'
                  onClick={() => setTimePeriod("7days")}
                  className={`text-xs sm:text-sm px-2 sm:px-3 h-7 ${
                    timePeriod === "7days" ? "bg-primary hover:bg-primary/90 text-white border-primary" : ""
                  }`}
                >
                  <span className='hidden sm:inline'>Last </span>7d
                </Button>
                <Button
                  variant={timePeriod === "30days" ? "default" : "outline"}
                  size='sm'
                  onClick={() => setTimePeriod("30days")}
                  className={`text-xs sm:text-sm px-2 sm:px-3 h-7 ${
                    timePeriod === "30days" ? "bg-primary hover:bg-primary/90 text-white border-primary" : ""
                  }`}
                >
                  <span className='hidden sm:inline'>Last </span>30d
                </Button>
                <Button
                  variant={timePeriod === "3months" ? "default" : "outline"}
                  size='sm'
                  onClick={() => setTimePeriod("3months")}
                  className={`text-xs sm:text-sm px-2 sm:px-3 h-7 ${
                    timePeriod === "3months" ? "bg-primary hover:bg-primary/90 text-white border-primary" : ""
                  }`}
                >
                  <span className='hidden sm:inline'>Last </span>3m
                </Button>
                <Button
                  variant={timePeriod === "all" ? "default" : "outline"}
                  size='sm'
                  onClick={() => setTimePeriod("all")}
                  className={`text-xs sm:text-sm px-2 sm:px-3 h-7 ${
                    timePeriod === "all" ? "bg-primary hover:bg-primary/90 text-white border-primary" : ""
                  }`}
                >
                  All
                </Button>
                <Button variant='secondary' size='sm' asChild>
                  <Link href='/merchant/profit-analysis'>Profit Analysis</Link>
                </Button>
              </div>
            </div>
          </div>
          <div className='p-2 sm:p-3 md:p-4 lg:p-5'>
            <ChartContainer config={chartConfig} className='h-[200px] sm:h-[250px] md:h-[300px] w-full'>
              <AreaChart data={revenueChartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <defs>
                  <linearGradient id='colorRevenue' x1='0' y1='0' x2='0' y2='1'>
                    <stop offset='5%' stopColor={primaryColor} stopOpacity={0.9} />
                    <stop offset='50%' stopColor={primaryColor} stopOpacity={0.5} />
                    <stop offset='95%' stopColor={primaryColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray='3 3' className='stroke-slate-200 dark:stroke-slate-800' />
                <XAxis
                  dataKey='date'
                  className='text-[10px] sm:text-base text-slate-600 dark:text-slate-400'
                  tick={{ fill: "currentColor", fontSize: 10 }}
                  axisLine={{ stroke: "currentColor", strokeWidth: 1 }}
                  tickMargin={4}
                  interval='preserveStartEnd'
                />
                <YAxis
                  className='text-[10px] sm:text-base text-slate-600 dark:text-slate-400'
                  tick={{ fill: "currentColor", fontSize: 10 }}
                  axisLine={{ stroke: "currentColor", strokeWidth: 1 }}
                  tickMargin={4}
                  width={40}
                />
                <ChartTooltip
                  content={<ChartTooltipContent className='rounded-lg border bg-white dark:bg-slate-900 shadow-lg text-xs' />}
                  cursor={{ stroke: primaryColor, strokeWidth: 2, strokeDasharray: "5 5" }}
                />
                <Area
                  type='monotone'
                  dataKey='revenue'
                  stroke={primaryColor}
                  strokeWidth={2}
                  fill='url(#colorRevenue)'
                  dot={false}
                  activeDot={{ r: 4, stroke: primaryColor, strokeWidth: 2 }}
                />
              </AreaChart>
            </ChartContainer>
          </div>
        </div>

        {/* Order Status Card - 1 column */}
        <div className='rounded-xl border border-slate-200/50 dark:border-slate-800/50 overflow-hidden bg-card'>
          <div className='px-3 sm:px-4 pt-3 md:pt-4'>
            <div className='flex items-center justify-between gap-2 md:gap-3'>
              <h3 className='text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100'>Order Status</h3>
              <Button className='rounded-full px-5' variant='outline' size='sm'>
                <Link href='/merchant/orders'>More</Link>
              </Button>
            </div>
          </div>
          <div className='p-3 sm:p-4 md:p-5 space-y-2.5 sm:space-y-4'>
            {/* Pending */}
            <div className='flex items-center justify-between py-1'>
              <div className='flex items-center gap-2.5 sm:gap-3'>
                <div className='p-1.5 sm:p-2 rounded-full border shrink-0 bg-transparent'>
                  <Clock className='h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400' />
                </div>
                <p className='text-xs sm:text-sm font-medium text-foreground'>Pending</p>
              </div>
              <p className='text-sm sm:text-base font-bold text-foreground'>{statusCounts.pending}</p>
            </div>

            {/* Processing */}
            <div className='flex items-center justify-between py-1'>
              <div className='flex items-center gap-2.5 sm:gap-3'>
                <div className='p-1.5 sm:p-2 rounded-full border shrink-0 bg-transparent'>
                  <Package className='h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400' />
                </div>
                <p className='text-xs sm:text-sm font-medium text-foreground'>Processing</p>
              </div>
              <p className='text-sm sm:text-base font-bold text-foreground'>{statusCounts.processing}</p>
            </div>

            {/* Shipped */}
            <div className='flex items-center justify-between py-1'>
              <div className='flex items-center gap-2.5 sm:gap-3'>
                <div className='p-1.5 sm:p-2 rounded-full border shrink-0 bg-transparent'>
                  <Truck className='h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 dark:text-indigo-400' />
                </div>
                <p className='text-xs sm:text-sm font-medium text-foreground'>Shipped</p>
              </div>
              <p className='text-sm sm:text-base font-bold text-foreground'>{statusCounts.shipped}</p>
            </div>

            {/* Delivered */}
            <div className='flex items-center justify-between py-1'>
              <div className='flex items-center gap-2.5 sm:gap-3'>
                <div className='p-1.5 sm:p-2 rounded-full border shrink-0 bg-transparent'>
                  <CheckCircle className='h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400' />
                </div>
                <p className='text-xs sm:text-sm font-medium text-foreground'>Delivered</p>
              </div>
              <p className='text-sm sm:text-base font-bold text-foreground'>{statusCounts.delivered}</p>
            </div>

            {/* Cancelled */}
            <div className='flex items-center justify-between py-1'>
              <div className='flex items-center gap-2.5 sm:gap-3'>
                <div className='p-1.5 sm:p-2 rounded-full border shrink-0 bg-transparent'>
                  <XCircle className='h-4 w-4 sm:h-5 sm:w-5 text-red-600 dark:text-red-400' />
                </div>
                <p className='text-xs sm:text-sm font-medium text-foreground'>Cancelled</p>
              </div>
              <p className='text-sm sm:text-base font-bold text-foreground'>{statusCounts.cancelled}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Order Time Analytics */}
      <OrderTimeAnalytics orders={orders} className='rounded-xl' />

      {/* Recent Orders Table */}
      <div className='rounded-xl border -slate-200/50 overflow-hidden'>
        <div className='px-3 sm:px-4 py-3'>
          <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4'>
            <div className='flex items-center gap-2 md:gap-3'>
              <h3 className='text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100'>Recent Orders</h3>
            </div>
            <Button variant='outline' size='sm' asChild className='px-5 rounded-full'>
              <Link href='/merchant/orders' className=' text-sm'>
                View All
              </Link>
            </Button>
          </div>
        </div>
        <div className=''>
          {recentOrders.length > 0 ? (
            <>
              {/* Mobile Card View */}
              <div className='md:hidden space-y-2.5 p-3'>
                {recentOrders.map((order) => (
                  <Link key={order.id} href={`/merchant/orders/${order.id}`} className='block'>
                    <Card className='border hover:shadow-sm transition-shadow'>
                      <CardContent className='p-3'>
                        {/* Header Row */}
                        <div className='flex items-start justify-between mb-2'>
                          <div className='flex-1 min-w-0'>
                            <div className='font-semibold text-xs text-foreground mb-0.5'>{order.customer.fullName}</div>
                            <div className='text-[10px] text-muted-foreground truncate'>{order.customer.email || order.customer.phone}</div>
                          </div>
                          <div className='flex flex-col items-end gap-1.5 ml-2'>
                            <Badge
                              className={`${getStatusBadgeClass(
                                order.courier?.deliveryStatus || order.status
                              )} capitalize font-medium text-[10px] px-1.5 py-0.5`}
                            >
                              {getStatusIcon(order.courier?.deliveryStatus || order.status)}
                              {order.courier?.deliveryStatus || order.status}
                            </Badge>
                            <div className='text-sm font-bold text-foreground'>
                              {currencySymbol}
                              {order.total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                            </div>
                          </div>
                        </div>

                        {/* Items Row */}
                        <div className='flex items-center justify-between mb-2 pb-2 border-b border-slate-100 dark:border-slate-800'>
                          <div className='text-[10px] font-medium text-foreground'>
                            {order.productCount} {order.productCount === 1 ? "item" : "items"} • {order.totalQuantity} qty
                          </div>
                          <div className='text-[10px] text-muted-foreground'>{format(new Date(order.createdAt), "MMM dd, yyyy")}</div>
                        </div>

                        {/* Footer */}
                        <div className='flex items-center justify-between pt-1'>
                          <div className='text-[10px] text-muted-foreground'>Order #{order.id.slice(-8).toUpperCase()}</div>
                          <div className='flex items-center gap-1 text-[10px] text-primary'>
                            <Eye className='h-3 w-3' />
                            View
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className='hidden md:block overflow-hidden'>
                <Table>
                  <TableHeader>
                    <TableRow className='border-b border-slate-200 dark:border-slate-800'>
                      <TableHead className='font-semibold text-xs text-slate-700 dark:text-slate-300 min-w-[160px] pl-4'>
                        Customer
                      </TableHead>
                      <TableHead className='font-semibold text-xs text-slate-700 dark:text-slate-300 min-w-[90px]'>Items</TableHead>
                      <TableHead className='font-semibold text-xs text-slate-700 dark:text-slate-300 min-w-[110px]'>Status</TableHead>
                      <TableHead className='font-semibold text-xs text-slate-700 dark:text-slate-300 min-w-[100px]'>Total</TableHead>
                      <TableHead className='font-semibold text-xs text-slate-700 dark:text-slate-300 min-w-[120px]'>Date</TableHead>
                      <TableHead className='font-semibold text-xs text-slate-700 dark:text-slate-300 w-16 pr-4'>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentOrders.map((order) => (
                      <TableRow
                        key={order.id}
                        className='hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors border-b border-slate-100 dark:border-slate-800/50'
                      >
                        <TableCell className='py-2.5 px-3 min-w-[160px] pl-4'>
                          <div className='text-xs font-medium text-slate-900 dark:text-slate-100 truncate'>{order.customer.fullName}</div>
                          <div className='text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5'>
                            {order.customer.email || order.customer.phone}
                          </div>
                        </TableCell>
                        <TableCell className='py-2.5 px-3 min-w-[90px]'>
                          <div className='text-xs text-slate-900 dark:text-slate-100'>
                            {order.productCount} {order.productCount === 1 ? "item" : "items"}
                          </div>
                          <div className='text-[10px] text-slate-500 dark:text-slate-400 mt-0.5'>{order.totalQuantity} qty</div>
                        </TableCell>
                        <TableCell className='py-2.5 px-3 min-w-[110px]'>
                          <Badge
                            className={`${getStatusBadgeClass(
                              order.courier?.deliveryStatus || order.status
                            )} capitalize font-medium text-[10px] px-2 py-0.5`}
                          >
                            {getStatusIcon(order.courier?.deliveryStatus || order.status)}
                            {order.courier?.deliveryStatus || order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className='font-semibold text-xs text-slate-900 dark:text-slate-100 py-2.5 px-3 min-w-[100px]'>
                          {currencySymbol}
                          {order.total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className='text-xs text-slate-600 dark:text-slate-400 py-2.5 px-3 min-w-[120px]'>
                          <div className='text-[10px]'>{format(new Date(order.createdAt), "MMM dd, yyyy")}</div>
                          <div className='text-[9px] text-slate-500 dark:text-slate-400 mt-0.5'>
                            {format(new Date(order.createdAt), "HH:mm")}
                          </div>
                        </TableCell>
                        <TableCell className='py-2.5 px-3 pr-4'>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant='ghost' size='sm' className='h-7 w-7 p-0 hover:bg-slate-100 dark:hover:bg-slate-800'>
                                <MoreVertical className='h-3.5 w-3.5 text-slate-600 dark:text-slate-400' />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end' className='border-slate-200 dark:border-slate-800'>
                              <DropdownMenuItem asChild>
                                <Link href={`/merchant/orders/${order.id}`}>View Details</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>Edit Status</DropdownMenuItem>
                              <DropdownMenuItem className='text-destructive'>Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <div className='text-xs sm:text-sm text-slate-500 dark:text-slate-400 py-8 sm:py-12 text-center bg-slate-50/50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-800'>
              No recent orders to display.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useMemo } from "react";
import type { Product, Order } from "@/lib/types";
import type { Investment } from "@/app/(home)/merchant/investments/actions";
import { useCurrencySymbol } from "@/hooks/use-currency";
import { DollarSign, TrendingUp, Package, Truck, Wallet, BarChart3, Clock, CheckCircle, XCircle, PauseCircle } from "lucide-react";

type ProfitAnalysisData = {
  products: Product[];
  orders: Order[];
  investments: Investment[];
};

type Props = {
  initialData: ProfitAnalysisData;
};

// Helper function to determine order delivery category based on courier status
function getDeliveryCategory(order: Order): "delivered" | "pending" | "on_hold" | "returned" | "paid_return" | "cancelled" {
  const deliveryStatus = order.courier?.deliveryStatus?.toLowerCase() || "";
  const orderStatus = order.status?.toLowerCase() || "";

  // Check for delivered/completed
  if (orderStatus === "delivered" || deliveryStatus.includes("delivered") || deliveryStatus.includes("completed")) {
    return "delivered";
  }

  // Check for cancelled (from order status or courier status)
  if (
    orderStatus === "cancelled" ||
    deliveryStatus.includes("cancelled") ||
    deliveryStatus.includes("pickup cancelled") ||
    deliveryStatus.includes("pickup_cancelled")
  ) {
    return "cancelled";
  }

  // Check for paid return (customer gets refund)
  if (deliveryStatus.includes("paid return") || deliveryStatus.includes("paid_return")) {
    return "paid_return";
  }

  // Check for regular return (no refund)
  if (deliveryStatus.includes("return") && !deliveryStatus.includes("paid")) {
    return "returned";
  }

  // Check for failed (treat as returned)
  if (deliveryStatus.includes("failed")) {
    return "returned";
  }

  // Check for on-hold status
  if (deliveryStatus.includes("on hold") || deliveryStatus.includes("on-hold") || deliveryStatus.includes("hold")) {
    return "on_hold";
  }

  // Everything else is pending (pickup requested, in transit, assigned for delivery, pending, processing, shipped, unknown)
  return "pending";
}

export function ProfitAnalysisClient({ initialData }: Props) {
  const currencySymbol = useCurrencySymbol();
  const { orders, investments, products } = initialData;

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const totalShippingCharges = orders.reduce((sum, order) => sum + (order.shipping || 0), 0);
    const revenueWithoutShipping = orders.reduce((sum, order) => {
      return sum + order.total - (order.shipping || 0);
    }, 0);
    const totalInvestments = investments.reduce((sum, investment) => sum + investment.value, 0);
    const netProfit = revenueWithoutShipping - totalInvestments;

    // Create product map for buy price lookup
    const productMap = new Map<string, Product>();
    products.forEach((product) => {
      productMap.set(product.id, product);
    });

    let totalProfitFromSales = 0;
    let totalBuyCostFromSales = 0;
    let totalItemsSold = 0;

    // Revenue breakdown by delivery status
    let deliveredRevenue = 0;
    let pendingRevenue = 0;
    let onHoldRevenue = 0;
    let returnedRevenue = 0;
    let paidReturnRevenue = 0;
    let cancelledRevenue = 0;
    let deliveredProfit = 0;
    let pendingProfit = 0;
    let onHoldProfit = 0;
    let deliveredBuyCost = 0;
    let deliveredOrderCount = 0;
    let pendingOrderCount = 0;
    let onHoldOrderCount = 0;
    let returnedOrderCount = 0;
    let paidReturnOrderCount = 0;
    let cancelledOrderCount = 0;

    // For returned orders, track actual loss (only delivery charges - product is returned)
    let returnedDeliveryCharges = 0;

    // For paid return orders, track refund amount (no loss - product is returned)
    let paidReturnRefundAmount = 0; // Total amount refunded to customers

    orders.forEach((order) => {
      const orderSubtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      let discountAmount = order.discountAmount ?? 0;
      if (order.discountPercentage && order.discountPercentage > 0) {
        discountAmount = (orderSubtotal * order.discountPercentage) / 100;
      }
      const subtotalAfterDiscount = Math.max(0, orderSubtotal - discountAmount);
      const discountRatio = orderSubtotal > 0 ? subtotalAfterDiscount / orderSubtotal : 1;

      // Calculate order revenue (excluding shipping)
      const orderRevenue = order.total - (order.shipping || 0);
      const orderShipping = order.shipping || 0;

      // Calculate order profit based on product buy prices
      let orderProfit = 0;
      let orderBuyCost = 0;
      order.items.forEach((item) => {
        const product = productMap.get(item.productId);
        if (product && product.buyPrice && product.buyPrice > 0) {
          const actualSalePricePerUnit = item.price * discountRatio;
          const profitPerUnit = actualSalePricePerUnit - product.buyPrice;
          const itemProfit = profitPerUnit * item.quantity;
          const itemBuyCost = product.buyPrice * item.quantity;

          totalProfitFromSales += itemProfit;
          totalBuyCostFromSales += itemBuyCost;
          totalItemsSold += item.quantity;
          orderProfit += itemProfit;
          orderBuyCost += itemBuyCost;
        }
      });

      // Categorize by delivery status
      const category = getDeliveryCategory(order);
      switch (category) {
        case "delivered":
          deliveredRevenue += orderRevenue;
          deliveredProfit += orderProfit;
          deliveredBuyCost += orderBuyCost;
          deliveredOrderCount++;
          break;
        case "paid_return":
          // For paid returns, there's no loss - we refund the customer but get the product back
          // Just track the refund amount for reporting purposes
          paidReturnRevenue += orderRevenue;
          paidReturnRefundAmount += order.total;
          paidReturnOrderCount++;
          break;
        case "returned":
          // For returned orders, the loss is only the delivery charge (we get the product back)
          returnedRevenue += orderRevenue;
          returnedDeliveryCharges += orderShipping;
          returnedOrderCount++;
          break;
        case "cancelled":
          // For cancelled orders, track separately (no loss if cancelled before shipping)
          cancelledRevenue += orderRevenue;
          cancelledOrderCount++;
          break;
        case "on_hold":
          onHoldRevenue += orderRevenue;
          onHoldProfit += orderProfit;
          onHoldOrderCount++;
          break;
        default:
          pendingRevenue += orderRevenue;
          pendingProfit += orderProfit;
          pendingOrderCount++;
      }
    });

    // Total loss from returns = only delivery charges (product is returned, so no buy cost loss)
    const returnedTotalLoss = returnedDeliveryCharges;

    // Total loss from paid returns = 0 (we refund customer but get product back, so no actual loss)
    const paidReturnTotalLoss = 0;

    // Combined return loss (only regular returns have loss - delivery charges)
    const totalReturnLoss = returnedTotalLoss;

    // Delivery rate: delivered orders / total orders
    const deliveryRate = orders.length > 0 ? (deliveredOrderCount / orders.length) * 100 : 0;

    // Return rate: (returned + paid return) / total orders
    const returnRate = orders.length > 0 ? ((returnedOrderCount + paidReturnOrderCount) / orders.length) * 100 : 0;

    // Paid return rate: paid return orders / total orders
    const paidReturnRate = orders.length > 0 ? (paidReturnOrderCount / orders.length) * 100 : 0;

    // Cancelled rate: cancelled orders / total orders
    const cancelledRate = orders.length > 0 ? (cancelledOrderCount / orders.length) * 100 : 0;

    const averageProfit = totalItemsSold > 0 ? totalProfitFromSales / totalItemsSold : 0;
    const profitMargin = totalBuyCostFromSales > 0 ? (totalProfitFromSales / totalBuyCostFromSales) * 100 : 0;
    const productProfit = revenueWithoutShipping - totalBuyCostFromSales;
    const averageShippingPerOrder = orders.length > 0 ? totalShippingCharges / orders.length : 0;
    const shippingAsPercentageOfRevenue = totalRevenue > 0 ? (totalShippingCharges / totalRevenue) * 100 : 0;

    // Real profit margin (only from delivered orders)
    const realProfitMargin = deliveredBuyCost > 0 ? (deliveredProfit / deliveredBuyCost) * 100 : 0;

    return {
      totalRevenue,
      totalShippingCharges,
      revenueWithoutShipping,
      totalInvestments,
      netProfit,
      totalBuyCostFromSales,
      averageProfit,
      profitMargin,
      productProfit,
      averageShippingPerOrder,
      shippingAsPercentageOfRevenue,
      // Delivery status metrics
      deliveredRevenue,
      pendingRevenue,
      onHoldRevenue,
      returnedRevenue,
      cancelledRevenue,
      deliveredProfit,
      pendingProfit,
      onHoldProfit,
      realProfitMargin,
      deliveredOrderCount,
      pendingOrderCount,
      onHoldOrderCount,
      returnedOrderCount,
      cancelledOrderCount,
      totalOrderCount: orders.length,
      // Return loss details
      returnedDeliveryCharges,
      returnedTotalLoss,
      // Paid return details (no loss, just tracking refund amount)
      paidReturnRefundAmount,
      paidReturnTotalLoss,
      paidReturnOrderCount,
      paidReturnRevenue,
      // Combined metrics
      totalReturnLoss,
      deliveryRate,
      returnRate,
      paidReturnRate,
      cancelledRate,
    };
  }, [orders, investments, products]);

  return (
    <div className='w-full space-y-4 sm:space-y-5 md:space-y-6 mt-4'>
      {/* Status Cards - Dashboard Style */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mb-4 sm:mb-6'>
        {/* Real Profit - Delivered */}
        <div className='flex flex-col gap-1.5 xl:gap-3 p-3 sm:p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow'>
          <div className='flex items-center gap-2'>
            <div className='p-2 rounded-full border shrink-0 bg-transparent'>
              <CheckCircle className='size-4 md:size-5 text-green-600 dark:text-green-400' />
            </div>
            <p className='text-[10px] sm:text-sm font-medium text-foreground tracking-wide'>Real Profit</p>
          </div>
          <div
            className={`text-base sm:text-lg md:text-xl font-bold truncate ${
              stats.deliveredProfit >= 0 ? "text-green-600 dark:text-green-400" : "text-destructive"
            }`}
          >
            {currencySymbol}
            {stats.deliveredProfit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <p className='text-[10px] text-muted-foreground'>{stats.deliveredOrderCount} delivered</p>
        </div>

        {/* Pending Revenue */}
        <div className='flex flex-col gap-1.5 xl:gap-3 p-3 sm:p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow'>
          <div className='flex items-center gap-2'>
            <div className='p-2 rounded-full border shrink-0 bg-transparent'>
              <Clock className='size-4 md:size-5 text-amber-600 dark:text-amber-400' />
            </div>
            <p className='text-[10px] sm:text-sm font-medium text-foreground tracking-wide'>Pending</p>
          </div>
          <div className='text-base sm:text-lg md:text-xl font-bold text-amber-600 dark:text-amber-400 truncate'>
            {currencySymbol}
            {stats.pendingRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <p className='text-[10px] text-muted-foreground'>{stats.pendingOrderCount} orders</p>
        </div>

        {/* On Hold */}
        <div className='flex flex-col gap-1.5 xl:gap-3 p-3 sm:p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow'>
          <div className='flex items-center gap-2'>
            <div className='p-2 rounded-full border shrink-0 bg-transparent'>
              <PauseCircle className='size-4 md:size-5 text-blue-600 dark:text-blue-400' />
            </div>
            <p className='text-[10px] sm:text-sm font-medium text-foreground tracking-wide'>On Hold</p>
          </div>
          <div className='text-base sm:text-lg md:text-xl font-bold text-blue-600 dark:text-blue-400 truncate'>
            {currencySymbol}
            {stats.onHoldRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <p className='text-[10px] text-muted-foreground'>{stats.onHoldOrderCount} orders</p>
        </div>

        {/* Return Loss */}
        <div className='flex flex-col gap-1.5 xl:gap-3 p-3 sm:p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow'>
          <div className='flex items-center gap-2'>
            <div className='p-2 rounded-full border shrink-0 bg-transparent'>
              <XCircle className='size-4 md:size-5 text-red-600 dark:text-red-400' />
            </div>
            <p className='text-[10px] sm:text-sm font-medium text-foreground tracking-wide'>Return Loss</p>
          </div>
          <div className='text-base sm:text-lg md:text-xl font-bold text-red-600 dark:text-red-400 truncate'>
            -{currencySymbol}
            {stats.totalReturnLoss.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className='space-y-0.5'>
            <p className='text-[10px] text-muted-foreground'>
              {stats.returnedOrderCount} regular • {stats.paidReturnOrderCount} paid
            </p>
            <p className='text-[10px] text-muted-foreground'>
              Rate: {stats.returnRate.toFixed(1)}% • Delivery: {stats.deliveryRate.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Delivery & Return Rates - Quick Stats */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mb-4 sm:mb-6'>
        {/* Delivery Rate */}
        <div className='flex flex-col gap-1.5 xl:gap-3 p-3 sm:p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow'>
          <div className='flex items-center gap-2'>
            <div className='p-2 rounded-full border shrink-0 bg-transparent'>
              <CheckCircle className='size-4 md:size-5 text-green-600 dark:text-green-400' />
            </div>
            <p className='text-[10px] sm:text-sm font-medium text-foreground tracking-wide'>Delivery Rate</p>
          </div>
          <div className='text-base sm:text-lg md:text-xl font-bold text-green-600 dark:text-green-400 truncate'>
            {stats.deliveryRate.toFixed(1)}%
          </div>
          <p className='text-[10px] text-muted-foreground'>
            {stats.deliveredOrderCount} of {stats.totalOrderCount} orders
          </p>
        </div>

        {/* Return Rate */}
        <div className='flex flex-col gap-1.5 xl:gap-3 p-3 sm:p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow'>
          <div className='flex items-center gap-2'>
            <div className='p-2 rounded-full border shrink-0 bg-transparent'>
              <XCircle className='size-4 md:size-5 text-red-600 dark:text-red-400' />
            </div>
            <p className='text-[10px] sm:text-sm font-medium text-foreground tracking-wide'>Return Rate</p>
          </div>
          <div className='text-base sm:text-lg md:text-xl font-bold text-red-600 dark:text-red-400 truncate'>
            {stats.returnRate.toFixed(1)}%
          </div>
          <p className='text-[10px] text-muted-foreground'>{stats.returnedOrderCount + stats.paidReturnOrderCount} orders</p>
        </div>

        {/* Paid Return Rate */}
        <div className='flex flex-col gap-1.5 xl:gap-3 p-3 sm:p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow'>
          <div className='flex items-center gap-2'>
            <div className='p-2 rounded-full border shrink-0 bg-transparent'>
              <DollarSign className='size-4 md:size-5 text-orange-600 dark:text-orange-400' />
            </div>
            <p className='text-[10px] sm:text-sm font-medium text-foreground tracking-wide'>Paid Return Rate</p>
          </div>
          <div className='text-base sm:text-lg md:text-xl font-bold text-orange-600 dark:text-orange-400 truncate'>
            {stats.paidReturnRate.toFixed(1)}%
          </div>
          <p className='text-[10px] text-muted-foreground'>
            {stats.paidReturnOrderCount} orders • {currencySymbol}
            {stats.paidReturnRefundAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
        </div>

        {/* Cancelled Rate */}
        <div className='flex flex-col gap-1.5 xl:gap-3 p-3 sm:p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow'>
          <div className='flex items-center gap-2'>
            <div className='p-2 rounded-full border shrink-0 bg-transparent'>
              <XCircle className='size-4 md:size-5 text-gray-600 dark:text-gray-400' />
            </div>
            <p className='text-[10px] sm:text-sm font-medium text-foreground tracking-wide'>Cancelled Rate</p>
          </div>
          <div className='text-base sm:text-lg md:text-xl font-bold text-gray-600 dark:text-gray-400 truncate'>
            {stats.cancelledRate.toFixed(1)}%
          </div>
          <p className='text-[10px] text-muted-foreground'>{stats.cancelledOrderCount} orders cancelled</p>
        </div>
      </div>

      {/* Revenue & Costs Cards */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mb-4 sm:mb-6'>
        {/* Total Revenue */}
        <div className='flex flex-col gap-1.5 xl:gap-3 p-3 sm:p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow'>
          <div className='flex items-center gap-2'>
            <div className='p-2 rounded-full border shrink-0 bg-transparent'>
              <DollarSign className='size-4 md:size-5 text-primary' />
            </div>
            <p className='text-[10px] sm:text-sm font-medium text-foreground tracking-wide'>Total Revenue</p>
          </div>
          <div className='text-base sm:text-lg md:text-xl font-bold text-foreground truncate'>
            {currencySymbol}
            {stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
        </div>

        {/* Product Sales */}
        <div className='flex flex-col gap-1.5 xl:gap-3 p-3 sm:p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow'>
          <div className='flex items-center gap-2'>
            <div className='p-2 rounded-full border shrink-0 bg-transparent'>
              <Package className='size-4 md:size-5 text-indigo-600 dark:text-indigo-400' />
            </div>
            <p className='text-[10px] sm:text-sm font-medium text-foreground tracking-wide'>Product Sales</p>
          </div>
          <div className='text-base sm:text-lg md:text-xl font-bold text-foreground truncate'>
            {currencySymbol}
            {stats.revenueWithoutShipping.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
        </div>

        {/* Shipping */}
        <div className='flex flex-col gap-1.5 xl:gap-3 p-3 sm:p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow'>
          <div className='flex items-center gap-2'>
            <div className='p-2 rounded-full border shrink-0 bg-transparent'>
              <Truck className='size-4 md:size-5 text-orange-600 dark:text-orange-400' />
            </div>
            <p className='text-[10px] sm:text-sm font-medium text-foreground tracking-wide'>Shipping</p>
          </div>
          <div className='text-base sm:text-lg md:text-xl font-bold text-foreground truncate'>
            {currencySymbol}
            {stats.totalShippingCharges.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
        </div>

        {/* Buy Costs */}
        <div className='flex flex-col gap-1.5 xl:gap-3 p-3 sm:p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow'>
          <div className='flex items-center gap-2'>
            <div className='p-2 rounded-full border shrink-0 bg-transparent'>
              <Package className='size-4 md:size-5 text-purple-600 dark:text-purple-400' />
            </div>
            <p className='text-[10px] sm:text-sm font-medium text-foreground tracking-wide'>Buy Costs</p>
          </div>
          <div className='text-base sm:text-lg md:text-xl font-bold text-foreground truncate'>
            {currencySymbol}
            {stats.totalBuyCostFromSales.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>

      {/* Profit Metrics Cards */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mb-4 sm:mb-6'>
        {/* Investments */}
        <div className='flex flex-col gap-1.5 xl:gap-3 p-3 sm:p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow'>
          <div className='flex items-center gap-2'>
            <div className='p-2 rounded-full border shrink-0 bg-transparent'>
              <Wallet className='size-4 md:size-5 text-orange-600 dark:text-orange-400' />
            </div>
            <p className='text-[10px] sm:text-sm font-medium text-foreground tracking-wide'>Investments</p>
          </div>
          <div className='text-base sm:text-lg md:text-xl font-bold text-foreground truncate'>
            {currencySymbol}
            {stats.totalInvestments.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
        </div>

        {/* Product Profit */}
        <div className='flex flex-col gap-1.5 xl:gap-3 p-3 sm:p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow'>
          <div className='flex items-center gap-2'>
            <div className='p-2 rounded-full border shrink-0 bg-transparent'>
              <DollarSign className='size-4 md:size-5 text-emerald-600 dark:text-emerald-400' />
            </div>
            <p className='text-[10px] sm:text-sm font-medium text-foreground tracking-wide'>Product Profit</p>
          </div>
          <div
            className={`text-base sm:text-lg md:text-xl font-bold truncate ${
              stats.productProfit >= 0 ? "text-foreground" : "text-destructive"
            }`}
          >
            {currencySymbol}
            {stats.productProfit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <p className='text-[10px] text-muted-foreground'>Sales - Buy Costs</p>
        </div>

        {/* Avg Profit/Item */}
        <div className='flex flex-col gap-1.5 xl:gap-3 p-3 sm:p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow'>
          <div className='flex items-center gap-2'>
            <div className='p-2 rounded-full border shrink-0 bg-transparent'>
              <TrendingUp
                className={`size-4 md:size-5 ${stats.averageProfit >= 0 ? "text-teal-600 dark:text-teal-400" : "text-destructive"}`}
              />
            </div>
            <p className='text-[10px] sm:text-sm font-medium text-foreground tracking-wide'>Avg Profit/Item</p>
          </div>
          <div
            className={`text-base sm:text-lg md:text-xl font-bold truncate ${
              stats.averageProfit >= 0 ? "text-foreground" : "text-destructive"
            }`}
          >
            {currencySymbol}
            {stats.averageProfit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
        </div>

        {/* Profit Margin */}
        <div className='flex flex-col gap-1.5 xl:gap-3 p-3 sm:p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow'>
          <div className='flex items-center gap-2'>
            <div className='p-2 rounded-full border shrink-0 bg-transparent'>
              <BarChart3
                className={`size-4 md:size-5 ${stats.profitMargin >= 0 ? "text-purple-600 dark:text-purple-400" : "text-destructive"}`}
              />
            </div>
            <p className='text-[10px] sm:text-sm font-medium text-foreground tracking-wide'>Profit Margin</p>
          </div>
          <div className={`text-base sm:text-lg md:text-xl font-bold ${stats.profitMargin >= 0 ? "text-foreground" : "text-destructive"}`}>
            {stats.profitMargin.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Order Status & Return Breakdown */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 md:gap-6'>
        {/* Order Status Summary */}
        <div className='rounded-xl border overflow-hidden'>
          <div className='px-3 sm:px-4 py-3 border-b bg-muted/30'>
            <h3 className='text-sm sm:text-base font-semibold text-foreground'>Order Status Summary</h3>
          </div>
          <div className='p-3 sm:p-4 space-y-3'>
            {/* Delivered */}
            <div className='flex items-center justify-between py-1'>
              <div className='flex items-center gap-2.5'>
                <div className='p-1.5 rounded-full border shrink-0 bg-transparent'>
                  <CheckCircle className='h-4 w-4 text-green-600 dark:text-green-400' />
                </div>
                <p className='text-xs sm:text-sm font-medium text-foreground'>Delivered</p>
              </div>
              <div className='flex items-center gap-3'>
                <span className='text-xs text-muted-foreground'>{stats.deliveredOrderCount}</span>
                <span className='text-xs sm:text-sm font-semibold text-green-600 dark:text-green-400 w-24 text-right'>
                  +{currencySymbol}
                  {stats.deliveredProfit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>

            {/* Pending */}
            <div className='flex items-center justify-between py-1'>
              <div className='flex items-center gap-2.5'>
                <div className='p-1.5 rounded-full border shrink-0 bg-transparent'>
                  <Clock className='h-4 w-4 text-amber-600 dark:text-amber-400' />
                </div>
                <p className='text-xs sm:text-sm font-medium text-foreground'>Pending</p>
              </div>
              <div className='flex items-center gap-3'>
                <span className='text-xs text-muted-foreground'>{stats.pendingOrderCount}</span>
                <span className='text-xs sm:text-sm font-semibold text-amber-600 dark:text-amber-400 w-24 text-right'>
                  ~{currencySymbol}
                  {stats.pendingProfit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>

            {/* On Hold */}
            <div className='flex items-center justify-between py-1'>
              <div className='flex items-center gap-2.5'>
                <div className='p-1.5 rounded-full border shrink-0 bg-transparent'>
                  <PauseCircle className='h-4 w-4 text-blue-600 dark:text-blue-400' />
                </div>
                <p className='text-xs sm:text-sm font-medium text-foreground'>On Hold</p>
              </div>
              <div className='flex items-center gap-3'>
                <span className='text-xs text-muted-foreground'>{stats.onHoldOrderCount}</span>
                <span className='text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 w-24 text-right'>
                  ~{currencySymbol}
                  {stats.onHoldProfit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>

            {/* Returned (Regular Returns) */}
            <div className='flex items-center justify-between py-1'>
              <div className='flex items-center gap-2.5'>
                <div className='p-1.5 rounded-full border shrink-0 bg-transparent'>
                  <XCircle className='h-4 w-4 text-red-600 dark:text-red-400' />
                </div>
                <p className='text-xs sm:text-sm font-medium text-foreground'>Returned</p>
              </div>
              <div className='flex items-center gap-3'>
                <span className='text-xs text-muted-foreground'>{stats.returnedOrderCount}</span>
                <span className='text-xs sm:text-sm font-semibold text-red-600 dark:text-red-400 w-24 text-right'>
                  -{currencySymbol}
                  {stats.returnedTotalLoss.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>

            {/* Cancelled */}
            <div className='flex items-center justify-between py-1'>
              <div className='flex items-center gap-2.5'>
                <div className='p-1.5 rounded-full border shrink-0 bg-transparent'>
                  <XCircle className='h-4 w-4 text-gray-600 dark:text-gray-400' />
                </div>
                <p className='text-xs sm:text-sm font-medium text-foreground'>Cancelled</p>
              </div>
              <div className='flex items-center gap-3'>
                <span className='text-xs text-muted-foreground'>{stats.cancelledOrderCount}</span>
                <span className='text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 w-24 text-right'>{currencySymbol}0</span>
              </div>
            </div>

            {/* Paid Return */}
            <div className='flex items-center justify-between py-1'>
              <div className='flex items-center gap-2.5'>
                <div className='p-1.5 rounded-full border shrink-0 bg-transparent'>
                  <XCircle className='h-4 w-4 text-orange-600 dark:text-orange-400' />
                </div>
                <p className='text-xs sm:text-sm font-medium text-foreground'>Paid Return</p>
              </div>
              <div className='flex items-center gap-3'>
                <span className='text-xs text-muted-foreground'>{stats.paidReturnOrderCount}</span>
                <span className='text-xs sm:text-sm font-semibold text-orange-600 dark:text-orange-400 w-24 text-right'>
                  -{currencySymbol}
                  {stats.paidReturnTotalLoss.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Return Loss Breakdown */}
        <div className='rounded-xl border overflow-hidden'>
          <div className='px-3 sm:px-4 py-3 border-b bg-muted/30'>
            <h3 className='text-sm sm:text-base font-semibold text-foreground'>Return Loss Breakdown</h3>
          </div>
          <div className='p-3 sm:p-4 space-y-3'>
            {/* Regular Returns Section */}
            <div className='space-y-2 pb-2 border-b'>
              <p className='text-xs font-semibold text-foreground'>Regular Returns ({stats.returnedOrderCount})</p>
              <p className='text-[10px] text-muted-foreground mb-1'>Loss: Delivery charges only (product returned)</p>
              <div className='flex items-center justify-between py-1'>
                <div className='flex items-center gap-2.5'>
                  <div className='p-1.5 rounded-full border shrink-0 bg-transparent'>
                    <Truck className='h-3 w-3 text-red-600 dark:text-red-400' />
                  </div>
                  <p className='text-[10px] sm:text-xs font-medium text-muted-foreground'>Delivery Charges Loss</p>
                </div>
                <span className='text-[10px] sm:text-xs font-semibold text-red-600 dark:text-red-400'>
                  -{currencySymbol}
                  {stats.returnedDeliveryCharges.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>

            {/* Paid Returns Section */}
            <div className='space-y-2 pb-2 border-b'>
              <p className='text-xs font-semibold text-foreground'>Paid Returns ({stats.paidReturnOrderCount})</p>
              <p className='text-[10px] text-muted-foreground mb-1'>No loss: Product returned, refund issued</p>
              <div className='flex items-center justify-between py-1'>
                <div className='flex items-center gap-2.5'>
                  <div className='p-1.5 rounded-full border shrink-0 bg-transparent'>
                    <DollarSign className='h-3 w-3 text-muted-foreground' />
                  </div>
                  <p className='text-[10px] sm:text-xs font-medium text-muted-foreground'>Refund Amount</p>
                </div>
                <span className='text-[10px] sm:text-xs font-semibold text-muted-foreground'>
                  {currencySymbol}
                  {stats.paidReturnRefundAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className='flex items-center justify-between py-1'>
                <p className='text-[10px] sm:text-xs font-medium text-green-600 dark:text-green-400'>Net Loss</p>
                <span className='text-[10px] sm:text-xs font-semibold text-green-600 dark:text-green-400'>{currencySymbol}0</span>
              </div>
            </div>

            {/* Total Loss */}
            <div className='flex items-center justify-between py-2 mt-2 border-t'>
              <p className='text-xs sm:text-sm font-semibold text-foreground'>Total Return Loss</p>
              <span className='text-sm sm:text-base font-bold text-red-600 dark:text-red-400'>
                -{currencySymbol}
                {stats.totalReturnLoss.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>

            {/* Rates */}
            <div className='space-y-1 pt-2 border-t'>
              <div className='flex items-center justify-between py-1'>
                <p className='text-[10px] sm:text-xs font-medium text-muted-foreground'>Delivery Rate</p>
                <span className='text-[10px] sm:text-xs font-semibold text-green-600 dark:text-green-400'>
                  {stats.deliveryRate.toFixed(1)}%
                </span>
              </div>
              <div className='flex items-center justify-between py-1'>
                <p className='text-[10px] sm:text-xs font-medium text-muted-foreground'>Return Rate</p>
                <span className='text-[10px] sm:text-xs font-semibold text-red-600 dark:text-red-400'>{stats.returnRate.toFixed(1)}%</span>
              </div>
              <div className='flex items-center justify-between py-1'>
                <p className='text-[10px] sm:text-xs font-medium text-muted-foreground'>Paid Return Rate</p>
                <span className='text-[10px] sm:text-xs font-semibold text-orange-600 dark:text-orange-400'>
                  {stats.paidReturnRate.toFixed(1)}%
                </span>
              </div>
              <div className='flex items-center justify-between py-1'>
                <p className='text-[10px] sm:text-xs font-medium text-muted-foreground'>Cancelled Rate</p>
                <span className='text-[10px] sm:text-xs font-semibold text-gray-600 dark:text-gray-400'>
                  {stats.cancelledRate.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Profit Margins */}
      {products.length > 0 && (
        <div className='rounded-xl border overflow-hidden'>
          <div className='px-3 sm:px-4 py-3 border-b bg-muted/30'>
            <h3 className='text-sm sm:text-base font-semibold text-foreground'>Product Profit Margins</h3>
          </div>
          <div className='p-3 sm:p-4'>
            <div className='space-y-2 max-h-64 overflow-y-auto'>
              {products.slice(0, 10).map((product) => {
                const profitMargin =
                  product.buyPrice && product.price > product.buyPrice
                    ? ((product.price - product.buyPrice) / product.buyPrice) * 100
                    : null;
                const profitAmount = product.buyPrice ? product.price - product.buyPrice : null;

                return (
                  <div key={product.id} className='flex items-center justify-between py-2 border-b last:border-0'>
                    <div className='flex-1 min-w-0'>
                      <p className='text-xs sm:text-sm font-medium truncate'>{product.name}</p>
                      <p className='text-[10px] text-muted-foreground'>
                        Sell: {currencySymbol}
                        {product.price.toFixed(0)}
                        {product.buyPrice && ` • Buy: ${currencySymbol}${product.buyPrice.toFixed(0)}`}
                      </p>
                    </div>
                    {profitAmount !== null && profitMargin !== null && (
                      <div className='text-right ml-3'>
                        <p
                          className={`text-xs sm:text-sm font-semibold ${
                            profitAmount >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {profitAmount >= 0 ? "+" : ""}
                          {currencySymbol}
                          {profitAmount.toFixed(0)}
                        </p>
                        <p className='text-[10px] text-muted-foreground'>{profitMargin.toFixed(1)}%</p>
                      </div>
                    )}
                  </div>
                );
              })}
              {products.length > 10 && (
                <p className='text-[10px] text-muted-foreground text-center py-2'>Showing 10 of {products.length} products</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Copy, DollarSign, TrendingUp, Package, Wallet, Gift, CheckCircle, Clock, XCircle, ExternalLink, Truck } from "lucide-react";
import { toast } from "sonner";
import { useCurrencySymbol } from "@/hooks/use-currency";
import type { Affiliate, AffiliateCommission, AffiliateWithdrawal } from "@/lib/affiliate-types";
import type { Coupon } from "@/lib/coupon-types";

export default function AffiliatePage() {
  const currencySymbol = useCurrencySymbol();
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [commissions, setCommissions] = useState<Array<AffiliateCommission & { order?: any }>>([]);
  const [withdrawals, setWithdrawals] = useState<AffiliateWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentDetails, setPaymentDetails] = useState<any>({});
  const [assignedCoupon, setAssignedCoupon] = useState<Coupon | null>(null);
  const [systemEnabled, setSystemEnabled] = useState(true);
  const [commissionFilter, setCommissionFilter] = useState("all");
  const [progress, setProgress] = useState<{
    currentLevel: number;
    deliveredOrders: number;
    nextLevel: number | null;
    nextLevelRequiredSales: number;
    progress: number;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const { apiRequest } = await import("@/lib/api-client");

      // Get affiliate info
      // apiRequest handles errors, but here we want to handle the case where affiliate system is disabled
      // or user has no affiliate account gracefully.
      let response;
      try {
        response = await apiRequest<any>("GET", "/affiliate/me");
      } catch (err) {
        console.warn("Affiliate check failed", err);
        return;
      }

      // Backend returns { success: true, ..., data: { affiliate: Affiliate | null, enabled: boolean } }
      if (response && response.data?.enabled === false) {
        // Affiliate system disabled for this tenant
        setSystemEnabled(false);
        setLoading(false);
        return;
      }
      setSystemEnabled(true);

      const affiliateData = response?.data?.affiliate;

      if (affiliateData) {
        setAffiliate(affiliateData);

        // Load commissions
        const commissionsData = await apiRequest<any>("GET", "/affiliate/commissions");
        setCommissions(commissionsData.data?.commissions || []);

        // Load withdrawals
        const withdrawalsData = await apiRequest<any>("GET", "/affiliate/withdrawals");
        setWithdrawals(withdrawalsData.data?.withdrawals || []);

        // Load progress
        const progressData = await apiRequest<any>("GET", "/affiliate/progress");
        if (progressData && progressData.data) {
          setProgress(progressData.data);
        }

        // Load assigned coupon if exists
        if (affiliateData.assignedCouponId) {
          try {
            // Assuming /coupon/:id or similar
            // Check coupon route later.
            // Use safe fetch for now or skip until verify.
            // Let's use apiRequest but wrap catch.
            // Coupon routes: need to verify public access or owned access.
            // Only admins/tenants usually read coupons? Affiliate needs to read THEIR coupon.
            const couponData = await apiRequest<Coupon>("GET", `/coupon/${affiliateData.assignedCouponId}`);
            setAssignedCoupon(couponData);
          } catch (error) {
            console.error("Error loading assigned coupon:", error);
          }
        }
      }
    } catch (error) {
      console.error("Error loading affiliate data:", error);
      toast.error("Failed to load affiliate data");
    } finally {
      setLoading(false);
    }
  };

  const createAffiliateAccount = async () => {
    try {
      setCreating(true);
      const { apiRequest } = await import("@/lib/api-client");
      const data = await apiRequest<any>("POST", "/affiliate/me", {});

      // Backend returns the created affiliate object
      setAffiliate(data);
      toast.success("Affiliate account created successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to create affiliate account");
    } finally {
      setCreating(false);
    }
  };

  const copyPromoCode = () => {
    if (affiliate?.promoCode) {
      navigator.clipboard.writeText(affiliate.promoCode);
      toast.success("Promo code copied to clipboard!");
    }
  };

  const copyAffiliateLink = () => {
    if (affiliate?.promoCode) {
      const link = `${window.location.origin}?ref=${affiliate.promoCode}`;
      navigator.clipboard.writeText(link);
      toast.success("Affiliate link copied to clipboard!");
    }
  };

  const handleWithdrawal = async () => {
    try {
      if (!withdrawAmount || !paymentMethod) {
        toast.error("Please fill in all required fields");
        return;
      }

      const amount = parseFloat(withdrawAmount);
      if (isNaN(amount) || amount <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }

      const { apiRequest } = await import("@/lib/api-client");
      await apiRequest(
        "POST",
        "/affiliate/withdrawals",
        {
          action: "create",
          amount,
          paymentMethod,
          paymentDetails,
        }
      );

      toast.success("Withdrawal request submitted successfully!");
      setWithdrawDialogOpen(false);
      setWithdrawAmount("");
      setPaymentMethod("");
      setPaymentDetails({});
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to request withdrawal");
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-background to-accent/5 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto'></div>
          <p className='mt-4 text-muted-foreground'>Loading...</p>
        </div>
      </div>
    );
  }

  if (!systemEnabled) {
    return (
      <div className='min-h-screen bg-background'>
        <div className='mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12'>
          <div className='mb-8 sm:mb-12 text-center'>
            <h1 className='text-2xl sm:text-3xl lg:text-4xl font-light tracking-tight mb-2'>Affiliate Program</h1>
            <p className='text-sm sm:text-base text-muted-foreground'>Earn commissions on every sale you refer</p>
          </div>

          <Card className='border border-destructive/20 bg-destructive/5'>
            <CardContent className='pt-6 text-center shadow-none border-none'>
              <XCircle className='w-12 h-12 text-destructive mx-auto mb-4 opacity-50' />
              <h2 className='text-lg font-medium mb-1'>System Currently Disabled</h2>
              <p className='text-sm text-muted-foreground'>
                The affiliate program is currently disabled for this store. Please check back later or contact support if you have
                any questions.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className='min-h-screen bg-background'>
        <div className='mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12'>
          <div className='mb-8 sm:mb-12 text-center'>
            <h1 className='text-2xl sm:text-3xl lg:text-4xl font-light tracking-tight mb-2'>Become an Affiliate</h1>
            <p className='text-sm sm:text-base text-muted-foreground'>Earn commissions on every sale you refer</p>
          </div>

          <Card className='border border-border/50'>
            <CardHeader className='pb-4'>
              <CardTitle className='text-lg sm:text-xl font-light'>Create Affiliate Account</CardTitle>
              <CardDescription className='text-sm'>Get your unique promo code and referral link to start earning</CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='space-y-4 text-sm'>
                <div className='flex items-start gap-3'>
                  <CheckCircle className='w-4 h-4 text-muted-foreground shrink-0 mt-0.5' />
                  <div>
                    <p className='font-medium mb-1'>Instant Setup</p>
                    <p className='text-muted-foreground text-xs'>Get your unique promo code and referral link immediately</p>
                  </div>
                </div>
                <div className='flex items-start gap-3'>
                  <CheckCircle className='w-4 h-4 text-muted-foreground shrink-0 mt-0.5' />
                  <div>
                    <p className='font-medium mb-1'>30-Day Tracking</p>
                    <p className='text-muted-foreground text-xs'>Referrals are tracked for 30 days after clicking your link</p>
                  </div>
                </div>
                <div className='flex items-start gap-3'>
                  <CheckCircle className='w-4 h-4 text-muted-foreground shrink-0 mt-0.5' />
                  <div>
                    <p className='font-medium mb-1'>Easy Withdrawals</p>
                    <p className='text-muted-foreground text-xs'>Request withdrawals anytime to your preferred payment method</p>
                  </div>
                </div>
              </div>
              <div className='pt-4 border-t border-border/50'>
                <Button onClick={createAffiliateAccount} disabled={creating} className='w-full' size='lg'>
                  {creating ? "Creating..." : "Create Account"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Calculate stats from commissions - only count delivered orders
  const deliveredCommissions = commissions.filter((c) => c.order?.status === "delivered");
  const pendingCommissions = commissions.filter((c) => c.order?.status && c.order.status !== "delivered" && c.order.status !== "cancelled");
  const deliveredEarnings = deliveredCommissions.reduce((sum, c) => sum + Number(c.commissionAmount || 0), 0);
  const pendingEarnings = pendingCommissions.reduce((sum, c) => sum + Number(c.commissionAmount || 0), 0);

  const stats = [
    {
      label: "Delivered Earnings",
      value: `${currencySymbol}${deliveredEarnings.toFixed(2)}`,
      icon: DollarSign,
      color: "text-green-600",
      subtitle: pendingEarnings > 0 ? `${currencySymbol}${pendingEarnings.toFixed(2)} pending` : undefined,
    },
    {
      label: "Available Balance",
      value: `${currencySymbol}${Number(affiliate.availableBalance || 0).toFixed(2)}`,
      icon: Wallet,
      color: "text-blue-600",
    },
    {
      label: "Delivered Orders",
      value: affiliate.deliveredOrders || 0,
      icon: CheckCircle,
      color: "text-purple-600",
      subtitle: pendingCommissions.length > 0 ? `${pendingCommissions.length} pending` : `Level ${affiliate.currentLevel || 1}`,
    },
    {
      label: "Total Withdrawn",
      value: `${currencySymbol}${Number(affiliate.totalWithdrawn || 0).toFixed(2)}`,
      icon: TrendingUp,
      color: "text-orange-600",
    },
  ];

  return (
    <div className='min-h-screen bg-background'>
      <div className='mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12'>
        <div className='mb-8 sm:mb-12'>
          <h1 className='text-2xl sm:text-3xl lg:text-4xl font-light tracking-tight mb-2'>Affiliate Dashboard</h1>
          <p className='text-sm sm:text-base text-muted-foreground'>Track your earnings and manage your referrals</p>
        </div>

        {/* Stats Grid */}
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12'>
          {stats.map((stat, index) => (
            <Card key={index} className='border border-border/50'>
              <CardContent className='p-4 sm:p-6'>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
                  <div className='flex-1'>
                    <p className='text-xs sm:text-sm text-muted-foreground mb-1'>{stat.label}</p>
                    <p className={`text-xl sm:text-2xl font-light ${stat.color}`}>{stat.value}</p>
                    {(stat as any).subtitle && <p className='text-xs text-muted-foreground mt-1'>{(stat as any).subtitle}</p>}
                  </div>
                  <stat.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.color} opacity-40 shrink-0`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Level Progress Card */}
        {progress && (
          <Card className='mb-8 sm:mb-12 border border-border/50'>
            <CardHeader className='pb-4'>
              <CardTitle className='text-lg sm:text-xl font-light'>Level Progress</CardTitle>
              <CardDescription className='text-sm'>
                Current level: {progress.currentLevel} • {progress.deliveredOrders} delivered orders
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              {progress.nextLevel && (
                <div className='space-y-3'>
                  <div className='flex items-center justify-between text-sm'>
                    <span className='text-muted-foreground'>Progress to Level {progress.nextLevel}</span>
                    <span className='font-medium'>
                      {progress.deliveredOrders} / {progress.nextLevelRequiredSales}
                    </span>
                  </div>
                  <div className='relative w-full h-1.5 bg-muted overflow-hidden'>
                    <div
                      className='absolute left-0 top-0 h-full bg-foreground transition-all duration-500'
                      style={{ width: `${Math.min(100, (progress.deliveredOrders / progress.nextLevelRequiredSales) * 100)}%` }}
                    />
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    {progress.nextLevelRequiredSales - progress.deliveredOrders} more orders needed
                  </p>
                </div>
              )}
              {!progress.nextLevel && (
                <div className='py-4 border-t border-border/50'>
                  <p className='text-sm font-medium'>Maximum level reached</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className='grid gap-6 lg:grid-cols-3'>
          {/* Main Content */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Promo Code Card */}
            <Card className='border border-border/50'>
              <CardHeader className='pb-4'>
                <CardTitle className='text-lg sm:text-xl font-light'>Referral Information</CardTitle>
                <CardDescription className='text-sm'>Share your promo code or referral link to earn commissions</CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='space-y-2'>
                  <Label className='text-sm font-medium'>Promo Code</Label>
                  <div className='flex items-center gap-2'>
                    <Input value={affiliate.promoCode} readOnly className='font-mono text-base sm:text-lg font-light' />
                    <Button onClick={copyPromoCode} size='icon' variant='outline' className='shrink-0'>
                      <Copy className='w-4 h-4' />
                    </Button>
                  </div>
                </div>
                <div className='space-y-2'>
                  <Label className='text-sm font-medium'>Referral Link</Label>
                  <div className='flex items-center gap-2'>
                    <Input
                      value={`${typeof window !== "undefined" ? window.location.origin : ""}?ref=${affiliate.promoCode}`}
                      readOnly
                      className='font-mono text-xs sm:text-sm font-light'
                    />
                    <Button onClick={copyAffiliateLink} size='icon' variant='outline' className='shrink-0'>
                      <Copy className='w-4 h-4' />
                    </Button>
                  </div>
                </div>
                <div className='pt-4 border-t border-border/50'>
                  <div className='flex items-center gap-2'>
                    <div className='w-2 h-2 rounded-full bg-green-500' />
                    <span className='text-sm text-muted-foreground'>Account active</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Assigned Coupon Card */}
            {assignedCoupon && (
              <Card className='border border-border/50'>
                <CardHeader className='pb-4'>
                  <CardTitle className='text-lg sm:text-xl font-light'>Assigned Coupon</CardTitle>
                  <CardDescription className='text-sm'>Special coupon code to share with your referrals</CardDescription>
                </CardHeader>
                <CardContent className='space-y-6'>
                  <div className='space-y-3'>
                    <div>
                      <p className='text-sm font-medium mb-1'>{assignedCoupon.name}</p>
                      {assignedCoupon.description && <p className='text-sm text-muted-foreground'>{assignedCoupon.description}</p>}
                    </div>
                    <div className='space-y-2'>
                      <Label className='text-sm font-medium'>Coupon Code</Label>
                      <div className='flex items-center gap-2'>
                        <Input value={assignedCoupon.code} readOnly className='font-mono text-base sm:text-lg font-light' />
                        <Button
                          onClick={() => {
                            navigator.clipboard.writeText(assignedCoupon.code);
                            toast.success("Coupon code copied");
                          }}
                          size='icon'
                          variant='outline'
                          className='shrink-0'
                        >
                          <Copy className='w-4 h-4' />
                        </Button>
                      </div>
                    </div>
                    <div className='grid grid-cols-2 gap-4 pt-4 border-t border-border/50'>
                      <div>
                        <p className='text-xs text-muted-foreground mb-1'>Discount</p>
                        <p className='text-sm font-medium'>
                          {assignedCoupon.type === "percentage"
                            ? `${assignedCoupon.discountValue}%`
                            : `${currencySymbol}${assignedCoupon.discountValue}`}
                        </p>
                      </div>
                      <div>
                        <p className='text-xs text-muted-foreground mb-1'>Valid Until</p>
                        <p className='text-sm font-medium'>{new Date(assignedCoupon.endDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Commissions Table */}
            <Card className='border border-border/50'>
              <CardHeader className='pb-4'>
                <CardTitle className='text-lg sm:text-xl font-light'>Commission History</CardTitle>
                <CardDescription className='text-sm'>
                  Track your earnings from referred orders (only delivered orders count towards earnings)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {commissions.length === 0 ? (
                  <div className='text-center py-12 sm:py-16'>
                    <Package className='w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30' />
                    <p className='text-sm text-muted-foreground mb-4'>No commissions yet</p>
                    <Button onClick={copyAffiliateLink} variant='outline' size='sm'>
                      <Copy className='w-4 h-4 mr-2' />
                      Copy Referral Link
                    </Button>
                  </div>
                ) : (
                  <div className='space-y-4'>
                    {/* Filter tabs */}
                    <div className='flex gap-2 border-b border-border/50'>
                      <button
                        onClick={() => setCommissionFilter("all")}
                        className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${commissionFilter === "all" ? "border-primary text-primary" : "border-transparent text-muted-foreground"
                          }`}
                      >
                        All ({commissions.length})
                      </button>
                      <button
                        onClick={() => setCommissionFilter("delivered")}
                        className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${commissionFilter === "delivered" ? "border-primary text-primary" : "border-transparent text-muted-foreground"
                          }`}
                      >
                        Delivered ({deliveredCommissions.length})
                      </button>
                      <button
                        onClick={() => setCommissionFilter("pending")}
                        className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${commissionFilter === "pending" ? "border-primary text-primary" : "border-transparent text-muted-foreground"
                          }`}
                      >
                        Pending ({pendingCommissions.length})
                      </button>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order ID</TableHead>
                          <TableHead>Order Total</TableHead>
                          <TableHead>Commission</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Tracking</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {commissions
                          .filter((c) => {
                            if (commissionFilter === "delivered") return c.order?.status === "delivered";
                            if (commissionFilter === "pending")
                              return c.order?.status && c.order.status !== "delivered" && c.order.status !== "cancelled";
                            return true;
                          })
                          .map((commission) => {
                            const orderStatus = commission.order?.status || "unknown";
                            const isPendingDelivery = orderStatus !== "delivered" && orderStatus !== "cancelled";
                            const courier = commission.order?.courier;
                            const hasTracking = courier?.consignmentId;

                            return (
                              <TableRow key={commission.id}>
                                <TableCell className='font-mono text-sm'>{commission.orderId.slice(-6)}</TableCell>
                                <TableCell>
                                  {currencySymbol}
                                  {Number(commission.orderTotal).toFixed(2)}
                                </TableCell>
                                <TableCell className='font-semibold text-green-600'>
                                  {currencySymbol}
                                  {Number(commission.commissionAmount).toFixed(2)} ({commission.commissionPercentage}%)
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      commission.status === "approved"
                                        ? "default"
                                        : commission.status === "pending"
                                          ? "secondary"
                                          : "destructive"
                                    }
                                  >
                                    {commission.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {isPendingDelivery && hasTracking ? (
                                    <div className='space-y-1.5'>
                                      <div className='flex items-center gap-1.5 flex-wrap'>
                                        <Truck className='w-3.5 h-3.5 text-primary shrink-0' />
                                        <span className='text-xs font-mono font-medium text-foreground'>{courier.consignmentId}</span>
                                        <Button
                                          size='icon'
                                          variant='ghost'
                                          className='h-5 w-5 shrink-0'
                                          onClick={() => {
                                            navigator.clipboard.writeText(courier.consignmentId);
                                            toast.success("Tracking ID copied!");
                                          }}
                                        >
                                          <Copy className='w-3 h-3' />
                                        </Button>
                                      </div>
                                      {courier.serviceName && (
                                        <Badge variant='outline' className='text-xs'>
                                          {courier.serviceName}
                                        </Badge>
                                      )}
                                      {courier.deliveryStatus && (
                                        <p className='text-xs text-muted-foreground flex items-center gap-1'>
                                          <Clock className='w-3 h-3' />
                                          {courier.deliveryStatus}
                                        </p>
                                      )}
                                    </div>
                                  ) : isPendingDelivery ? (
                                    <div className='flex items-center gap-1.5'>
                                      <Clock className='w-3.5 h-3.5 text-muted-foreground' />
                                      <span className='text-xs text-muted-foreground'>Awaiting shipment</span>
                                    </div>
                                  ) : orderStatus === "delivered" ? (
                                    <div className='flex items-center gap-1.5'>
                                      <CheckCircle className='w-3.5 h-3.5 text-green-600' />
                                      <span className='text-xs text-green-600'>Delivered</span>
                                    </div>
                                  ) : (
                                    <span className='text-xs text-muted-foreground'>-</span>
                                  )}
                                </TableCell>
                                <TableCell>{new Date(commission.createdAt).toLocaleDateString()}</TableCell>
                              </TableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            {/* Withdrawal Card */}
            <Card className='border border-border/50'>
              <CardHeader className='pb-4'>
                <CardTitle className='text-lg sm:text-xl font-light'>Withdraw Earnings</CardTitle>
                <CardDescription className='text-sm'>Request a withdrawal of your available balance</CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='pb-4 border-b border-border/50'>
                  <p className='text-xs text-muted-foreground mb-1'>Available Balance</p>
                  <p className='text-2xl sm:text-3xl font-light'>
                    {currencySymbol}
                    {Number(affiliate.availableBalance || 0).toFixed(2)}
                  </p>
                </div>
                <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      className='w-full'
                      disabled={
                        Number(affiliate.availableBalance || 0) <= 0 ||
                        commissions.some((c) => c.order?.status && c.order.status !== "delivered" && c.order.status !== "cancelled")
                      }
                    >
                      {commissions.some((c) => c.order?.status && c.order.status !== "delivered" && c.order.status !== "cancelled")
                        ? "Pending Orders - Wait for Delivery"
                        : "Request Withdrawal"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Request Withdrawal</DialogTitle>
                      <DialogDescription>Enter the amount and payment details for your withdrawal request</DialogDescription>
                    </DialogHeader>
                    <div className='space-y-4'>
                      <div>
                        <Label htmlFor='amount'>Amount</Label>
                        <Input
                          id='amount'
                          type='number'
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          placeholder='0.00'
                          min='0'
                          step='0.01'
                        />
                      </div>
                      <div>
                        <Label htmlFor='paymentMethod'>Payment Method *</Label>
                        <Input
                          id='paymentMethod'
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          placeholder='e.g., Bank Transfer, Mobile Banking, bKash, Nagad, Rocket'
                          required
                        />
                      </div>
                      {(paymentMethod.toLowerCase().includes("bank") || paymentMethod.toLowerCase().includes("transfer")) && (
                        <>
                          <div>
                            <Label htmlFor='accountName'>Account Name *</Label>
                            <Input
                              id='accountName'
                              value={paymentDetails.accountName || ""}
                              onChange={(e) => setPaymentDetails({ ...paymentDetails, accountName: e.target.value })}
                              placeholder='Enter account holder name'
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor='accountNumber'>Account Number *</Label>
                            <Input
                              id='accountNumber'
                              value={paymentDetails.accountNumber || ""}
                              onChange={(e) => setPaymentDetails({ ...paymentDetails, accountNumber: e.target.value })}
                              placeholder='Enter account number (minimum 8 digits)'
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor='bankName'>Bank Name *</Label>
                            <Input
                              id='bankName'
                              value={paymentDetails.bankName || ""}
                              onChange={(e) => setPaymentDetails({ ...paymentDetails, bankName: e.target.value })}
                              placeholder='Enter bank name'
                              required
                            />
                          </div>
                        </>
                      )}
                      {(paymentMethod.toLowerCase().includes("mobile") ||
                        paymentMethod.toLowerCase().includes("bkash") ||
                        paymentMethod.toLowerCase().includes("nagad") ||
                        paymentMethod.toLowerCase().includes("rocket")) && (
                          <div>
                            <Label htmlFor='mobileNumber'>Mobile Number *</Label>
                            <Input
                              id='mobileNumber'
                              value={paymentDetails.mobileNumber || ""}
                              onChange={(e) => setPaymentDetails({ ...paymentDetails, mobileNumber: e.target.value })}
                              placeholder='01XXXXXXXXX (11 digits)'
                              required
                            />
                          </div>
                        )}
                      <Button onClick={handleWithdrawal} className='w-full'>
                        Submit Request
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* Withdrawal History */}
            <Card className='border border-border/50'>
              <CardHeader className='pb-4'>
                <CardTitle className='text-lg sm:text-xl font-light'>Withdrawal History</CardTitle>
              </CardHeader>
              <CardContent>
                {withdrawals.length === 0 ? (
                  <p className='text-sm text-muted-foreground text-center py-8'>No withdrawals yet</p>
                ) : (
                  <div className='space-y-3'>
                    {withdrawals.map((withdrawal) => (
                      <div key={withdrawal.id} className='flex items-center justify-between py-3 border-b border-border/50 last:border-0'>
                        <div>
                          <p className='text-sm font-medium'>
                            {currencySymbol}
                            {Number(withdrawal.amount).toFixed(2)}
                          </p>
                          <p className='text-xs text-muted-foreground mt-1'>{new Date(withdrawal.requestedAt).toLocaleDateString()}</p>
                        </div>
                        <Badge
                          variant={
                            withdrawal.status === "completed"
                              ? "default"
                              : withdrawal.status === "approved"
                                ? "secondary"
                                : withdrawal.status === "pending"
                                  ? "outline"
                                  : "destructive"
                          }
                          className='text-xs'
                        >
                          {withdrawal.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, Copy, Tag } from "lucide-react";
import { toast } from "sonner";
import { useCurrencySymbol } from "@/hooks/use-currency";
import type { AffiliateCommission } from "@/lib/affiliate-types";
import type { Coupon } from "@/lib/coupon-types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AffiliateWithUser {
  id: string;
  userId: string;
  promoCode: string;
  status: string;
  totalEarnings: number;
  totalWithdrawn: number;
  availableBalance: number;
  totalOrders: number;
  deliveredOrders: number;
  currentLevel: number;
  assignedCouponId?: string;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    email?: string;
    phone?: string;
  };
  totalCommissions: number;
  pendingCommissions: number;
  completedCommissions: number;
}

export default function AffiliatesListClient() {
  const currencySymbol = useCurrencySymbol();
  const [affiliates, setAffiliates] = useState<AffiliateWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAffiliate, setSelectedAffiliate] = useState<AffiliateWithUser | null>(null);
  const [commissions, setCommissions] = useState<Array<AffiliateCommission & { order?: any }>>([]);
  const [commissionsDialogOpen, setCommissionsDialogOpen] = useState(false);
  const [loadingCommissions, setLoadingCommissions] = useState(false);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [assignCouponDialogOpen, setAssignCouponDialogOpen] = useState(false);
  const [selectedAffiliateForCoupon, setSelectedAffiliateForCoupon] = useState<AffiliateWithUser | null>(null);
  const [selectedCouponId, setSelectedCouponId] = useState<string>("");
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    loadAffiliates();
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      const response = await fetch("/api/coupons");
      if (response.ok) {
        const data = await response.json();
        setCoupons(data.coupons || []);
      }
    } catch (error) {
      console.error("Error loading coupons:", error);
    }
  };

  const loadAffiliates = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/affiliate/list");
      if (response.ok) {
        const data = await response.json();
        setAffiliates(data.affiliates || []);
      }
    } catch (error) {
      console.error("Error loading affiliates:", error);
      toast.error("Failed to load affiliates");
    } finally {
      setLoading(false);
    }
  };

  const loadCommissions = async (affiliateId: string) => {
    try {
      setLoadingCommissions(true);
      const response = await fetch(`/api/affiliate/commissions?affiliateId=${affiliateId}`);
      if (response.ok) {
        const data = await response.json();
        setCommissions(data.commissions || []);
      }
    } catch (error) {
      console.error("Error loading commissions:", error);
      toast.error("Failed to load commissions");
    } finally {
      setLoadingCommissions(false);
    }
  };

  const viewCommissions = (affiliate: AffiliateWithUser) => {
    setSelectedAffiliate(affiliate);
    setCommissionsDialogOpen(true);
    loadCommissions(affiliate.id);
  };

  const copyPromoCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Promo code copied!");
  };

  const openAssignCouponDialog = (affiliate: AffiliateWithUser) => {
    setSelectedAffiliateForCoupon(affiliate);
    setSelectedCouponId(affiliate.assignedCouponId || "none");
    setAssignCouponDialogOpen(true);
  };

  const assignCoupon = async () => {
    if (!selectedAffiliateForCoupon) return;

    try {
      setAssigning(true);
      const couponIdToSend = selectedCouponId === "none" || selectedCouponId === "" ? null : selectedCouponId;
      const response = await fetch("/api/affiliate/assign-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          affiliateId: selectedAffiliateForCoupon.id,
          couponId: couponIdToSend,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to assign coupon");
      }

      toast.success("Coupon assigned successfully!");
      setAssignCouponDialogOpen(false);
      loadAffiliates();
    } catch (error: any) {
      toast.error(error.message || "Failed to assign coupon");
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto'></div>
          <p className='mt-4 text-muted-foreground'>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>All Affiliates</CardTitle>
          <CardDescription>View and manage all affiliate accounts</CardDescription>
        </CardHeader>
        <CardContent>
          {affiliates.length === 0 ? (
            <p className='text-muted-foreground text-center py-8'>No affiliates yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Affiliate</TableHead>
                  <TableHead>Promo Code</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Delivered Orders</TableHead>
                  <TableHead>Total Earnings</TableHead>
                  <TableHead>Available Balance</TableHead>
                  <TableHead>Assigned Coupon</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {affiliates.map((affiliate) => (
                  <TableRow key={affiliate.id}>
                    <TableCell>
                      <div>
                        <p className='font-medium'>{affiliate.user.fullName}</p>
                        {affiliate.user.email && <p className='text-sm text-muted-foreground'>{affiliate.user.email}</p>}
                        {affiliate.user.phone && <p className='text-sm text-muted-foreground'>{affiliate.user.phone}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <code className='text-sm font-mono'>{affiliate.promoCode}</code>
                        <Button size='icon' variant='ghost' className='h-6 w-6' onClick={() => copyPromoCode(affiliate.promoCode)}>
                          <Copy className='w-3 h-3' />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant='outline' className='font-semibold'>
                        Level {affiliate.currentLevel || 1}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className='font-semibold'>{affiliate.deliveredOrders || 0}</p>
                        <p className='text-xs text-muted-foreground'>of {affiliate.totalOrders || 0} total</p>
                      </div>
                    </TableCell>
                    <TableCell className='font-semibold'>
                      {currencySymbol}
                      {affiliate.totalEarnings.toFixed(2)}
                    </TableCell>
                    <TableCell className='font-semibold text-green-600'>
                      {currencySymbol}
                      {affiliate.availableBalance.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {affiliate.assignedCouponId ? (
                        <Badge variant='outline' className='font-mono text-xs'>
                          {coupons.find((c) => c.id === affiliate.assignedCouponId)?.code || "N/A"}
                        </Badge>
                      ) : (
                        <span className='text-sm text-muted-foreground'>None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={affiliate.status === "active" ? "default" : "secondary"}>{affiliate.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <Button size='sm' variant='outline' onClick={() => viewCommissions(affiliate)}>
                          <Eye className='w-4 h-4 mr-2' />
                          View
                        </Button>
                        <Button size='sm' variant='outline' onClick={() => openAssignCouponDialog(affiliate)}>
                          <Tag className='w-4 h-4 mr-2' />
                          {affiliate.assignedCouponId ? "Change" : "Assign"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={commissionsDialogOpen} onOpenChange={setCommissionsDialogOpen}>
        <DialogContent className='max-w-4xl max-h-[80vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>
              Commissions for {selectedAffiliate?.user.fullName} ({selectedAffiliate?.promoCode})
            </DialogTitle>
            <DialogDescription>View all commissions and order details for this affiliate</DialogDescription>
          </DialogHeader>

          {loadingCommissions ? (
            <div className='flex items-center justify-center py-8'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
            </div>
          ) : (
            <div className='space-y-4'>
              <div className='grid grid-cols-3 gap-4'>
                <div className='p-4 border rounded-lg'>
                  <p className='text-sm text-muted-foreground'>Total Commissions</p>
                  <p className='text-2xl font-bold'>
                    {currencySymbol}
                    {selectedAffiliate?.totalEarnings.toFixed(2)}
                  </p>
                </div>
                <div className='p-4 border rounded-lg'>
                  <p className='text-sm text-muted-foreground'>Pending</p>
                  <p className='text-2xl font-bold text-yellow-600'>{selectedAffiliate?.pendingCommissions}</p>
                </div>
                <div className='p-4 border rounded-lg'>
                  <p className='text-sm text-muted-foreground'>Completed</p>
                  <p className='text-2xl font-bold text-green-600'>{selectedAffiliate?.completedCommissions}</p>
                </div>
              </div>

              {commissions.length === 0 ? (
                <p className='text-muted-foreground text-center py-8'>No commissions yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Order Total</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commissions.map((commission) => (
                      <TableRow key={commission.id}>
                        <TableCell className='font-mono text-sm'>{commission.orderId.slice(-6)}</TableCell>
                        <TableCell>
                          {currencySymbol}
                          {commission.orderTotal.toFixed(2)}
                        </TableCell>
                        <TableCell className='font-semibold text-green-600'>
                          {currencySymbol}
                          {commission.commissionAmount.toFixed(2)} ({commission.commissionPercentage}%)
                        </TableCell>
                        <TableCell>Level {commission.level}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              commission.status === "approved" ? "default" : commission.status === "pending" ? "secondary" : "destructive"
                            }
                          >
                            {commission.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(commission.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={assignCouponDialogOpen} onOpenChange={setAssignCouponDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Coupon to Affiliate</DialogTitle>
            <DialogDescription>
              Assign a coupon to {selectedAffiliateForCoupon?.user.fullName} ({selectedAffiliateForCoupon?.promoCode})
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div>
              <Label>Select Coupon</Label>
              <Select value={selectedCouponId || "none"} onValueChange={(value) => setSelectedCouponId(value === "none" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder='Select a coupon (or choose None to remove)' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='none'>None (Remove assignment)</SelectItem>
                  {coupons
                    .filter((c) => c.status === "active")
                    .map((coupon) => (
                      <SelectItem key={coupon.id} value={coupon.id}>
                        {coupon.code} - {coupon.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className='flex justify-end gap-2'>
              <Button variant='outline' onClick={() => setAssignCouponDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={assignCoupon} disabled={assigning}>
                {assigning ? "Assigning..." : "Assign Coupon"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

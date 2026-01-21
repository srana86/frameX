"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle, XCircle, Clock, Eye } from "lucide-react";
import { toast } from "sonner";
import { useCurrencySymbol } from "@/hooks/use-currency";
import type { AffiliateWithdrawal } from "@/lib/affiliate-types";
import { apiRequest } from "@/lib/api-client";

interface WithdrawalWithAffiliate extends AffiliateWithdrawal {
  affiliate?: {
    promoCode: string;
    user?: {
      fullName: string;
      email?: string;
      phone?: string;
    };
  };
}

export default function WithdrawalsClient() {
  const currencySymbol = useCurrencySymbol();
  const [withdrawals, setWithdrawals] = useState<WithdrawalWithAffiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalWithAffiliate | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadWithdrawals();
  }, []);

  const loadWithdrawals = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<any>("GET", "/affiliate/withdrawals");
      setWithdrawals(data.withdrawals || []);
    } catch (error) {
      console.error("Error loading withdrawals:", error);
      toast.error("Failed to load withdrawals");
    } finally {
      setLoading(false);
    }
  };

  const openDialog = (withdrawal: WithdrawalWithAffiliate) => {
    setSelectedWithdrawal(withdrawal);
    setNewStatus(withdrawal.status);
    setNotes(withdrawal.notes || "");
    setDialogOpen(true);
  };

  const processWithdrawal = async () => {
    if (!selectedWithdrawal || !newStatus) return;

    try {
      setProcessing(true);
      await apiRequest<any>("POST", "/affiliate/withdrawals", {
        action: "update",
        withdrawalId: selectedWithdrawal.id,
        status: newStatus,
        notes,
      });

      toast.success("Withdrawal updated successfully!");
      setDialogOpen(false);
      loadWithdrawals();
    } catch (error: any) {
      toast.error(error.message || "Failed to update withdrawal");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className='w-4 h-4 text-green-600' />;
      case "approved":
        return <CheckCircle className='w-4 h-4 text-blue-600' />;
      case "rejected":
        return <XCircle className='w-4 h-4 text-red-600' />;
      default:
        return <Clock className='w-4 h-4 text-yellow-600' />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "approved":
        return "secondary";
      case "rejected":
        return "destructive";
      default:
        return "outline";
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
          <CardTitle>Withdrawal Requests</CardTitle>
          <CardDescription>Manage affiliate withdrawal requests</CardDescription>
        </CardHeader>
        <CardContent>
          {withdrawals.length === 0 ? (
            <p className='text-muted-foreground text-center py-8'>No withdrawal requests</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Affiliate</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawals.map((withdrawal) => (
                  <TableRow key={withdrawal.id}>
                    <TableCell>
                      <div>
                        <p className='font-medium'>
                          {withdrawal.affiliate?.user?.fullName || "Unknown"}
                        </p>
                        <p className='text-sm text-muted-foreground'>
                          {withdrawal.affiliate?.promoCode}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className='font-semibold'>
                      {currencySymbol}
                      {withdrawal.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>{withdrawal.paymentMethod || "N/A"}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(withdrawal.status)}>
                        <span className='flex items-center gap-1'>
                          {getStatusIcon(withdrawal.status)}
                          {withdrawal.status}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(withdrawal.requestedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button size='sm' variant='outline' onClick={() => openDialog(withdrawal)}>
                        <Eye className='w-4 h-4 mr-2' />
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Withdrawal Request</DialogTitle>
            <DialogDescription>
              Update the status and add notes for this withdrawal request
            </DialogDescription>
          </DialogHeader>

          {selectedWithdrawal && (
            <div className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <Label>Amount</Label>
                  <p className='text-lg font-semibold'>
                    {currencySymbol}
                    {selectedWithdrawal.amount.toFixed(2)}
                  </p>
                </div>
                <div>
                  <Label>Payment Method</Label>
                  <p className='text-sm'>{selectedWithdrawal.paymentMethod || "N/A"}</p>
                </div>
              </div>

              {selectedWithdrawal.paymentDetails && (
                <div>
                  <Label>Payment Details</Label>
                  <div className='mt-1 p-3 bg-muted rounded-md text-sm space-y-1'>
                    {Object.entries(selectedWithdrawal.paymentDetails).map(([key, value]) => (
                      <p key={key}>
                        <span className='font-medium capitalize'>{key.replace(/([A-Z])/g, " $1")}:</span>{" "}
                        {String(value)}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor='status'>Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger id='status'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='pending'>Pending</SelectItem>
                    <SelectItem value='approved'>Approved</SelectItem>
                    <SelectItem value='rejected'>Rejected</SelectItem>
                    <SelectItem value='completed'>Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor='notes'>Notes</Label>
                <Textarea
                  id='notes'
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder='Add notes about this withdrawal...'
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant='outline' onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={processWithdrawal} disabled={processing}>
              {processing ? "Processing..." : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}


"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { CourierService } from "@/types/delivery-config-types";

interface ManualDeliveryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courierServices: CourierService[];
  loadingCouriers: boolean;
  onAdd: (serviceId: string, consignmentId: string) => Promise<void>;
}

export function ManualDeliveryDialog({ open, onOpenChange, courierServices, loadingCouriers, onAdd }: ManualDeliveryDialogProps) {
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [consignmentId, setConsignmentId] = useState<string>("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    setError(null);

    if (!selectedServiceId) {
      setError("Please select a delivery service provider");
      return;
    }

    if (!consignmentId.trim()) {
      setError("Please enter a tracking/consignment ID");
      return;
    }

    setAdding(true);
    try {
      await onAdd(selectedServiceId, consignmentId.trim());
      // Reset form on success
      setSelectedServiceId("");
      setConsignmentId("");
      setError(null);
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.message || "Failed to add delivery partner");
    } finally {
      setAdding(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      setSelectedServiceId("");
      setConsignmentId("");
      setError(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>Manually Add Delivery Partner</DialogTitle>
          <DialogDescription>
            Add a delivery partner by entering the tracking/consignment ID. The system will fetch the current delivery status and update the
            order.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          {error && (
            <Alert variant='destructive'>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className='space-y-2'>
            <Label htmlFor='courier-service'>Delivery Service Provider</Label>
            {loadingCouriers ? (
              <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                <Spinner className='h-4 w-4' />
                Loading courier services...
              </div>
            ) : courierServices.length === 0 ? (
              <p className='text-sm text-muted-foreground'>No active courier services available.</p>
            ) : (
              <Select value={selectedServiceId} onValueChange={setSelectedServiceId} disabled={adding}>
                <SelectTrigger id='courier-service' className='w-full'>
                  <SelectValue placeholder='Select delivery service provider' />
                </SelectTrigger>
                <SelectContent>
                  {courierServices.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='consignment-id'>Tracking / Consignment ID</Label>
            <Input
              id='consignment-id'
              placeholder='Enter tracking or consignment ID'
              value={consignmentId}
              onChange={(e) => setConsignmentId(e.target.value)}
              disabled={adding}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !adding && selectedServiceId && consignmentId.trim()) {
                  handleAdd();
                }
              }}
            />
            <p className='text-xs text-muted-foreground'>
              Enter the tracking ID or consignment ID provided by the delivery service. The system will automatically fetch the current
              delivery status.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => handleOpenChange(false)} disabled={adding}>
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            disabled={adding || !selectedServiceId || !consignmentId.trim() || loadingCouriers || courierServices.length === 0}
          >
            {adding ? (
              <>
                <Spinner className='mr-2 h-4 w-4' />
                Adding...
              </>
            ) : (
              "Add Delivery Partner"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

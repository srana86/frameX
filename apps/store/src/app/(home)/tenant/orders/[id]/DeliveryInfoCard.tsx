"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Truck, XCircle, Copy, ExternalLink, Plus, ChevronDown, ChevronUp, Send, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Order } from "@/lib/types";
import type { CourierService } from "@/types/delivery-config-types";

interface DeliveryInfoCardProps {
  order: Order;
  courierServices: CourierService[];
  loadingCouriers: boolean;
  selectedCourierId: string;
  consignmentId: string;
  deliveryStatus: string;
  syncingCourier: boolean;
  sendingCourier: boolean;
  onSelectCourier: (courierId: string) => void;
  onRemoveCourier: () => void;
  onSendCourierOrder: () => void;
  onCopyToClipboard: (text: string, label: string) => void;
  onManualAdd?: () => void;
  customOrderId?: string; // Custom order ID for display
}

export function DeliveryInfoCard({
  order,
  courierServices,
  loadingCouriers,
  selectedCourierId,
  consignmentId,
  deliveryStatus,
  syncingCourier,
  sendingCourier,
  onSelectCourier,
  onRemoveCourier,
  onSendCourierOrder,
  onCopyToClipboard,
  onManualAdd,
  customOrderId,
}: DeliveryInfoCardProps) {
  const [isExpanded, setIsExpanded] = useState(!!consignmentId);
  const [showAllDetails, setShowAllDetails] = useState(false);
  const hasDelivery = !!consignmentId || !!order.courier?.consignmentId;
  const currentService = courierServices.find((s) => s.id === selectedCourierId);

  // Use custom order ID if available, otherwise use last 7 chars of order ID
  const displayOrderId = customOrderId || order.id.slice(-7).toUpperCase();

  return (
    <Card className='border shadow-md overflow-hidden gap-0 !pt-0'>
      {/* Mobile: Compact Header */}
      <div className='sm:hidden'>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className='w-full px-3 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors'
        >
          <div className='flex items-center gap-2'>
            <div className={cn("p-1.5 rounded-lg", hasDelivery ? "bg-blue-500/10" : "bg-muted")}>
              <Truck className={cn("h-4 w-4", hasDelivery ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground")} />
            </div>
            <div className='text-left'>
              <span className='text-sm font-semibold block'>Delivery</span>
              <span className='text-xs text-muted-foreground'>{hasDelivery ? deliveryStatus || "Sent to courier" : "Not sent yet"}</span>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            {hasDelivery ? (
              <Badge variant='secondary' className='text-[10px]'>
                {currentService?.name || order.courier?.serviceId || "Courier"}
              </Badge>
            ) : (
              <Badge variant='outline' className='text-[10px] text-muted-foreground'>
                Pending
              </Badge>
            )}
            {isExpanded ? (
              <ChevronUp className='h-4 w-4 text-muted-foreground' />
            ) : (
              <ChevronDown className='h-4 w-4 text-muted-foreground' />
            )}
          </div>
        </button>

        {isExpanded && (
          <div className='px-3 pb-3 space-y-3'>
            {/* Quick Action: Send to Courier */}
            {!hasDelivery && (
              <div className='space-y-2'>
                {loadingCouriers ? (
                  <div className='flex items-center justify-center py-4'>
                    <Spinner className='h-4 w-4 mr-2' />
                    <span className='text-xs text-muted-foreground'>Loading couriers...</span>
                  </div>
                ) : courierServices.length === 0 ? (
                  <p className='text-xs text-muted-foreground text-center py-3'>No courier services configured</p>
                ) : (
                  <>
                    <Select value={selectedCourierId} onValueChange={onSelectCourier}>
                      <SelectTrigger className='w-full h-10 text-sm'>
                        <SelectValue placeholder='Select courier' />
                      </SelectTrigger>
                      <SelectContent>
                        {courierServices.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className='flex gap-2'>
                      {onManualAdd && (
                        <Button variant='outline' size='sm' onClick={onManualAdd} className='flex-1 h-10'>
                          <Plus className='h-4 w-4 mr-1.5' />
                          Manual
                        </Button>
                      )}
                      <Button
                        variant='default'
                        size='sm'
                        disabled={sendingCourier || !selectedCourierId}
                        onClick={onSendCourierOrder}
                        className='flex-1 h-10'
                      >
                        {sendingCourier ? (
                          <>
                            <Spinner className='h-4 w-4 mr-1.5' />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className='h-4 w-4 mr-1.5' />
                            Send Order
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Order ID - Always visible on mobile */}
            <div className='p-2 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20'>
              <div className='flex items-center justify-between'>
                <div className='flex-1 min-w-0'>
                  <p className='text-[10px] text-muted-foreground mb-0.5'>
                    Order ID {order.courier?.tenantOrderId ? "(Sent to Courier)" : ""}
                  </p>
                  <p className='text-sm font-mono font-bold'>{order.courier?.tenantOrderId || displayOrderId}</p>
                </div>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => onCopyToClipboard(order.courier?.tenantOrderId || displayOrderId, "Order ID")}
                  className='h-8 w-8 p-0 shrink-0'
                >
                  <Copy className='h-3.5 w-3.5' />
                </Button>
              </div>
              {order.courier?.tenantOrderId && <p className='text-[9px] text-muted-foreground mt-1'>This ID is used with the courier</p>}
            </div>

            {/* Tracking Info */}
            {hasDelivery && (
              <div className='space-y-2'>
                <div className='flex items-center justify-between p-2 bg-muted/30 rounded-lg'>
                  <div className='flex-1 min-w-0'>
                    <p className='text-[10px] text-muted-foreground mb-0.5'>Tracking ID</p>
                    <p className='text-xs font-mono font-semibold truncate'>{consignmentId}</p>
                  </div>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => onCopyToClipboard(consignmentId, "Tracking ID")}
                    className='h-8 w-8 p-0 shrink-0'
                  >
                    <Copy className='h-3.5 w-3.5' />
                  </Button>
                </div>

                <div className='flex items-center justify-between p-2 bg-muted/30 rounded-lg'>
                  <div>
                    <p className='text-[10px] text-muted-foreground mb-0.5'>Status</p>
                    <Badge variant='secondary' className='text-xs'>
                      {deliveryStatus || "Processing"}
                    </Badge>
                  </div>
                  {syncingCourier && <Spinner className='h-3 w-3' />}
                </div>

                {/* Courier Service Info */}
                {order.courier && (
                  <div className='p-2 bg-muted/20 rounded-lg space-y-1'>
                    <div className='flex items-center justify-between'>
                      <p className='text-[10px] text-muted-foreground'>Courier Service</p>
                      <Badge variant='outline' className='text-[10px]'>
                        {order.courier.serviceName || currentService?.name || order.courier.serviceId}
                      </Badge>
                    </div>
                    {order.courier.lastSyncedAt && (
                      <p className='text-[9px] text-muted-foreground'>
                        Updated {format(new Date(order.courier.lastSyncedAt), "MMM dd, h:mm a")}
                      </p>
                    )}
                  </div>
                )}

                {/* Pathao Link */}
                {order.courier?.serviceId === "pathao" && order.customer.phone && (
                  <a
                    href={`https://tenant.pathao.com/tracking?consignment_id=${encodeURIComponent(
                      consignmentId
                    )}&phone=${encodeURIComponent(order.customer.phone)}`}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='flex items-center justify-center gap-2 w-full h-10 bg-primary/10 text-primary rounded-lg text-sm font-medium'
                  >
                    <ExternalLink className='h-4 w-4' />
                    Track on Pathao
                  </a>
                )}

                {/* Remove Button */}
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={onRemoveCourier}
                  className='w-full h-9 text-destructive hover:text-destructive hover:bg-destructive/10'
                >
                  <XCircle className='h-4 w-4 mr-1.5' />
                  Remove Courier
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Desktop: Original Layout */}
      <CardHeader className='hidden sm:flex sm:pb-4 px-3 sm:px-4 pt-3 sm:pt-4 !pb-4 border-b'>
        <CardTitle className='flex items-center gap-2 text-base sm:text-lg md:text-xl'>
          <div className='p-1.5 sm:p-2 bg-blue-500/10 rounded-lg'>
            <Truck className='h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400' />
          </div>
          Delivery Information
        </CardTitle>
      </CardHeader>
      <CardContent className='hidden sm:block p-3 sm:p-4 space-y-3'>
        {/* Courier service selection */}
        <div className='p-2.5 sm:p-3 bg-muted/50 rounded-lg border space-y-2'>
          <div className='flex items-center justify-between gap-2'>
            <Label className='text-xs font-medium text-muted-foreground block'>Courier service</Label>
            {order.courier?.consignmentId && (
              <Button
                variant='ghost'
                size='sm'
                onClick={onRemoveCourier}
                className='h-6 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10'
              >
                <XCircle className='h-3 w-3 mr-1' />
                Remove
              </Button>
            )}
          </div>
          {loadingCouriers ? (
            <div className='flex items-center gap-2 text-xs text-muted-foreground'>
              <Spinner className='h-3 w-3' />
              Loading...
            </div>
          ) : courierServices.length === 0 ? (
            <p className='text-xs text-muted-foreground'>No active courier services. Configure in Delivery Support.</p>
          ) : (
            <Select
              value={selectedCourierId}
              onValueChange={onSelectCourier}
              disabled={
                !!order.courier?.consignmentId && !deliveryStatus.toLowerCase().includes("cancelled") && order.status !== "cancelled"
              }
            >
              <SelectTrigger className='w-full h-9 text-sm'>
                <SelectValue placeholder='Select courier service' />
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
          {order.courier?.consignmentId && (
            <p className='text-[10px] md:text-xs text-muted-foreground mt-1'>
              {deliveryStatus.toLowerCase().includes("cancelled") || order.status === "cancelled"
                ? "Order cancelled. Remove to select new courier."
                : "Remove current courier to change."}
            </p>
          )}
        </div>

        {/* Courier tracking ID */}
        <div className='p-2.5 sm:p-3 bg-muted/50 rounded-lg border space-y-2'>
          <Label className='text-xs font-medium text-muted-foreground block'>Courier tracking ID</Label>
          <div className='flex flex-col sm:flex-row sm:items-center gap-2'>
            {consignmentId ? (
              <div className='flex items-center gap-1.5 flex-1 min-w-0'>
                <Badge variant='secondary' className='font-mono text-xs px-2 py-1 truncate max-w-full'>
                  {consignmentId}
                </Badge>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => onCopyToClipboard(consignmentId, "Consignment ID")}
                  className='h-7 w-7 p-0 shrink-0'
                >
                  <Copy className='h-3.5 w-3.5' />
                </Button>
              </div>
            ) : (
              <p className='text-xs text-muted-foreground flex-1'>Will be generated after sending</p>
            )}
            <div className='flex gap-2 sm:w-auto w-full'>
              {onManualAdd && (
                <Button
                  variant='outline'
                  size='sm'
                  onClick={onManualAdd}
                  className='flex items-center gap-1.5 h-9 text-xs flex-1 sm:flex-initial'
                  title='Manually add delivery partner with tracking ID'
                >
                  <Plus className='h-3 w-3' />
                  <span className='hidden sm:inline'>Add Manually</span>
                  <span className='sm:hidden'>Manual</span>
                </Button>
              )}
              <Button
                variant='default'
                size='sm'
                disabled={sendingCourier || !selectedCourierId}
                onClick={onSendCourierOrder}
                className='flex items-center gap-1.5 h-9 text-xs flex-1 sm:flex-initial'
              >
                {sendingCourier ? (
                  <>
                    <Spinner className='h-3 w-3' />
                    Sending...
                  </>
                ) : order.courier?.consignmentId ? (
                  <>
                    <Truck className='h-3 w-3' />
                    Replace
                  </>
                ) : (
                  <>
                    <Truck className='h-3 w-3' />
                    Send Delivery
                  </>
                )}
              </Button>
            </div>
          </div>
          {/* Pathao Tracking Link */}
          {order.courier?.consignmentId && order.courier?.serviceId === "pathao" && order.customer.phone && (
            <div className='pt-2 border-t space-y-2'>
              <Label className='text-xs font-medium text-muted-foreground block'>Pathao Tracking</Label>
              <div className='flex items-center gap-2'>
                <a
                  href={`https://tenant.pathao.com/tracking?consignment_id=${encodeURIComponent(
                    order.courier.consignmentId
                  )}&phone=${encodeURIComponent(order.customer.phone)}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='flex items-center gap-1.5 text-xs text-primary hover:underline flex-1 min-w-0'
                >
                  <ExternalLink className='h-3.5 w-3.5 shrink-0' />
                  <span className='truncate'>Open Pathao Tracking</span>
                </a>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => {
                    const trackingUrl = `https://tenant.pathao.com/tracking?consignment_id=${encodeURIComponent(
                      order.courier!.consignmentId!
                    )}&phone=${encodeURIComponent(order.customer.phone!)}`;
                    onCopyToClipboard(trackingUrl, "Pathao tracking link");
                  }}
                  className='h-7 w-7 p-0 shrink-0'
                >
                  <Copy className='h-3.5 w-3.5' />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Order ID Display - Always visible */}
        <div className='p-2.5 sm:p-3 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20 space-y-2'>
          <Label className='text-xs font-medium text-muted-foreground block'>
            Order ID {order.courier?.tenantOrderId ? "(Sent to Courier)" : ""}
          </Label>
          <div className='flex items-center gap-2'>
            <Badge variant='outline' className='font-mono text-sm px-3 py-1 bg-background border-primary/30'>
              {order.courier?.tenantOrderId || displayOrderId}
            </Badge>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => onCopyToClipboard(order.courier?.tenantOrderId || displayOrderId, "Order ID")}
              className='h-7 w-7 p-0 shrink-0'
            >
              <Copy className='h-3.5 w-3.5' />
            </Button>
          </div>
          {order.courier?.tenantOrderId && (
            <p className='text-[10px] text-muted-foreground'>This ID is used to track your order with the courier</p>
          )}
        </div>

        {/* Courier live status */}
        <div className='p-2.5 sm:p-3 bg-muted/50 rounded-lg border space-y-2'>
          <div className='flex items-center justify-between gap-2'>
            <Label className='text-xs font-medium text-muted-foreground block'>Courier status</Label>
            {order.courier?.lastSyncedAt && (
              <span className='text-[10px] text-muted-foreground hidden sm:inline'>
                Synced {format(new Date(order.courier.lastSyncedAt), "MMM dd, h:mm a")}
              </span>
            )}
          </div>
          <div className='space-y-1'>
            <div className='flex items-center justify-between gap-2'>
              <div className='flex items-center gap-1.5'>
                <Badge variant='secondary' className='text-xs'>
                  {deliveryStatus || "Not sent yet"}
                </Badge>
                {syncingCourier && <Spinner className='h-3 w-3 text-muted-foreground' />}
              </div>
              {selectedCourierId && consignmentId && (
                <span className='text-[10px] text-muted-foreground hidden sm:inline'>Auto-updating 30s</span>
              )}
            </div>
          </div>
        </div>

        {/* Extended Courier Details - Only when order has been sent */}
        {hasDelivery && order.courier && (
          <div className='p-2.5 sm:p-3 bg-muted/30 rounded-lg border space-y-3'>
            <div className='flex items-center justify-between gap-2'>
              <Label className='text-xs font-medium text-muted-foreground flex items-center gap-1.5'>
                <Package className='h-3.5 w-3.5' />
                Courier Details
              </Label>
              <Button variant='ghost' size='sm' onClick={() => setShowAllDetails(!showAllDetails)} className='h-6 px-2 text-xs'>
                {showAllDetails ? "Hide" : "Show All"}
                {showAllDetails ? <ChevronUp className='h-3 w-3 ml-1' /> : <ChevronDown className='h-3 w-3 ml-1' />}
              </Button>
            </div>

            <div className='grid grid-cols-2 gap-2 text-xs'>
              <div className='space-y-0.5'>
                <p className='text-muted-foreground text-[10px]'>Service</p>
                <p className='font-medium'>{order.courier.serviceName || currentService?.name || order.courier.serviceId}</p>
              </div>
              <div className='space-y-0.5'>
                <p className='text-muted-foreground text-[10px]'>Status</p>
                <Badge variant='secondary' className='text-[10px]'>
                  {order.courier.deliveryStatus || "Processing"}
                </Badge>
              </div>
            </div>

            {showAllDetails && (
              <div className='space-y-2 pt-2 border-t'>
                <div className='grid grid-cols-1 gap-2 text-xs'>
                  {/* Tenant Order ID - The ID you sent to the courier */}
                  {order.courier.tenantOrderId && (
                    <div className='space-y-0.5'>
                      <p className='text-muted-foreground text-[10px]'>Your Order ID (sent to courier)</p>
                      <div className='flex items-center gap-1'>
                        <code className='text-[11px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono font-semibold'>
                          {order.courier.tenantOrderId}
                        </code>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => onCopyToClipboard(order.courier!.tenantOrderId!, "Tenant Order ID")}
                          className='h-5 w-5 p-0 shrink-0'
                        >
                          <Copy className='h-3 w-3' />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Courier Consignment ID - The ID the courier assigned */}
                  <div className='space-y-0.5'>
                    <p className='text-muted-foreground text-[10px]'>Courier Tracking ID</p>
                    <div className='flex items-center gap-1'>
                      <code className='text-[11px] bg-muted px-1.5 py-0.5 rounded font-mono break-all'>{order.courier.consignmentId}</code>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => onCopyToClipboard(order.courier!.consignmentId, "Consignment ID")}
                        className='h-5 w-5 p-0 shrink-0'
                      >
                        <Copy className='h-3 w-3' />
                      </Button>
                    </div>
                  </div>

                  {order.courier.lastSyncedAt && (
                    <div className='space-y-0.5'>
                      <p className='text-muted-foreground text-[10px]'>Last Updated</p>
                      <p className='font-medium'>{format(new Date(order.courier.lastSyncedAt), "MMM dd, yyyy 'at' h:mm a")}</p>
                    </div>
                  )}

                  {order.courier.rawStatus && (
                    <div className='space-y-0.5'>
                      <p className='text-muted-foreground text-[10px]'>Raw Status Data</p>
                      <pre className='text-[10px] bg-muted p-2 rounded overflow-x-auto max-h-24 overflow-y-auto'>
                        {typeof order.courier.rawStatus === "string"
                          ? order.courier.rawStatus
                          : JSON.stringify(order.courier.rawStatus, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default DeliveryInfoCard;

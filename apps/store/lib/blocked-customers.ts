// Types for blocked/fraud customers
export interface BlockedCustomer {
  id: string;
  phone: string;
  email?: string;
  customerName?: string;
  reason: "fraud" | "abuse" | "chargeback" | "other";
  notes?: string;
  blockedAt: string;
  blockedBy?: string;
  orderId?: string; // The order that triggered the block
  orderIds?: string[]; // All orders from this customer
  isActive: boolean;
  updatedAt?: string;
}

export interface BlockCheckResult {
  isBlocked: boolean;
  customer?: BlockedCustomer;
  message?: string;
}

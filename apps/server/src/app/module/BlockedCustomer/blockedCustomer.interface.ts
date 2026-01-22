export interface TBlockedCustomer {
  id: string;
  phone?: string;
  email?: string;
  reason: string;
  notes?: string;
  isActive: boolean;
  blockedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

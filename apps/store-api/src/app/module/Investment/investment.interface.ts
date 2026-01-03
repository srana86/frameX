export interface TInvestment {
  id: string;
  key: string; // Reason/description
  value: number; // Amount
  category?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

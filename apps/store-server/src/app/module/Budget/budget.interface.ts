export interface TBudget {
  id: string;
  name: string;
  category?: string;
  amount: number;
  spent: number;
  period: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

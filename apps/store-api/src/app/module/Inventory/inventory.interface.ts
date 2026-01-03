export type InventoryTransactionType =
  | "order"
  | "restock"
  | "adjustment"
  | "return";

export interface TInventoryTransaction {
  id: string;
  productId: string;
  productName?: string;
  type: InventoryTransactionType;
  quantity: number;
  previousStock: number;
  newStock: number;
  orderId?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

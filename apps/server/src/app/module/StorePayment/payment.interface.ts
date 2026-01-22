export interface TPayment {
  id: string;
  orderId: string;
  amount: number;
  paymentMethod: "cod" | "online";
  paymentStatus: "pending" | "completed" | "failed" | "cancelled" | "refunded";
  transactionId?: string;
  valId?: string;
  gatewayResponse?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PaymentInitPayload {
  orderId: string;
  customer: {
    fullName: string;
    email?: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    postalCode: string;
  };
}

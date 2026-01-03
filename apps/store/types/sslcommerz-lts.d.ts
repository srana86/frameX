declare module "sslcommerz-lts" {
  interface SSLCommerzInitData {
    total_amount: number;
    currency: string;
    tran_id: string;
    success_url: string;
    fail_url: string;
    cancel_url: string;
    ipn_url: string;
    shipping_method?: string;
    product_name?: string;
    product_category?: string;
    product_profile?: string;
    cus_name: string;
    cus_email: string;
    cus_add1: string;
    cus_add2?: string;
    cus_city: string;
    cus_state: string;
    cus_postcode: string;
    cus_country: string;
    cus_phone: string;
    cus_fax?: string;
    ship_name?: string;
    ship_add1?: string;
    ship_add2?: string;
    ship_city?: string;
    ship_state?: string;
    ship_postcode?: string;
    ship_country?: string;
  }

  interface SSLCommerzInitResponse {
    GatewayPageURL: string;
    sessionkey: string;
    storeLogo?: string;
    storeBanner?: string;
  }

  interface SSLCommerzValidateData {
    val_id: string;
  }

  interface SSLCommerzValidationResponse {
    status: string; // VALID, VALIDATED, INVALID_TRANSACTION
    tran_id: string;
    val_id: string;
    amount: string;
    currency: string;
    store_amount?: string;
    bank_tran_id?: string;
    card_type?: string;
    card_no?: string;
    card_issuer?: string;
    card_brand?: string;
    card_issuer_country?: string;
    card_issuer_country_code?: string;
    currency_type?: string;
    currency_amount?: string;
    risk_level?: string;
    risk_title?: string;
    tran_date?: string;
  }

  interface SSLCommerzRefundData {
    bank_tran_id: string;
    refund_trans_id: string;
    refund_amount: number;
    refund_remarks: string;
    refe_id?: string;
  }

  interface SSLCommerzRefundResponse {
    APIConnect: string;
    bank_tran_id: string;
    trans_id?: string;
    refund_ref_id?: string;
    status: string;
    errorReason?: string;
  }

  interface SSLCommerzRefundQueryData {
    refund_ref_id: string;
  }

  interface SSLCommerzRefundQueryResponse {
    APIConnect: string;
    bank_tran_id: string;
    tran_id?: string;
    refund_ref_id: string;
    initiated_on?: string;
    refunded_on?: string;
    status: string;
    errorReason?: string;
  }

  interface SSLCommerzTransactionQueryData {
    sessionkey?: string;
    tran_id?: string;
  }

  class SSLCommerzPayment {
    constructor(storeId: string, storePassword: string, isLive: boolean);
    init(data: SSLCommerzInitData): Promise<SSLCommerzInitResponse>;
    validate(data: SSLCommerzValidateData): Promise<SSLCommerzValidationResponse>;
    initiateRefund(data: SSLCommerzRefundData): Promise<SSLCommerzRefundResponse>;
    refundQuery(data: SSLCommerzRefundQueryData): Promise<SSLCommerzRefundQueryResponse>;
    transactionQueryByTransactionId(data: { tran_id: string }): Promise<any>;
    transactionQueryBySessionId(data: { sessionkey: string }): Promise<any>;
  }

  export default SSLCommerzPayment;
}

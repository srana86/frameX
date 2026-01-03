import { format } from "date-fns";
import type { Order } from "@/lib/types";

interface ReceiptTotals {
  subtotal: number;
  discountAmount: number;
  vatTaxAmount: number;
  shipping: number;
  total: number;
}

interface BrandConfig {
  brandName?: string;
  contact?: {
    address?: string;
    phone?: string;
    email?: string;
  };
  footer?: {
    copyrightText?: string;
  };
}

export function generateReceiptHTML(order: Order, brandConfig: BrandConfig, totals: ReceiptTotals, currencySymbol: string): string {
  const orderDate = new Date(order.createdAt);
  const formattedDate = format(orderDate, "MMMM dd, yyyy 'at' hh:mm a");

  const itemsHTML = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; text-align: left;">
          <div style="font-weight: 600; color: #000000; font-size: 11px;">${item.name}</div>
        </td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #000000; font-weight: 500; font-size: 11px;">
          ${item.quantity}
        </td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #000000; font-weight: 500; font-size: 11px;">
          ${currencySymbol}${item.price.toFixed(2)}
        </td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #000000; font-size: 11px;">
          ${currencySymbol}${(item.price * item.quantity).toFixed(2)}
        </td>
      </tr>
    `
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Receipt - ${order.id.slice(-7)}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.4;
      color: #111827;
      background: white;
      padding: 10px;
      margin: 0;
    }
    .receipt-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      box-shadow: none;
      border-radius: 0;
      overflow: hidden;
    }
    .receipt-header {
      background: white;
      color: #000000;
      padding: 15px 20px;
      text-align: center;
      border-bottom: 2px solid #000000;
    }
    .receipt-header h1 {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 6px;
      color: #000000;
    }
    .receipt-header p {
      font-size: 11px;
      color: #000000;
      margin: 2px 0;
    }
    .receipt-body {
      padding: 15px 20px;
    }
    .receipt-section {
      margin-bottom: 16px;
    }
    .receipt-section h2 {
      font-size: 14px;
      font-weight: 600;
      color: #000000;
      margin-bottom: 8px;
      padding-bottom: 4px;
      border-bottom: 1px solid #000000;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 12px;
    }
    .info-item {
      margin-bottom: 6px;
    }
    .info-label {
      font-size: 10px;
      font-weight: 600;
      color: #000000;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      margin-bottom: 2px;
    }
    .info-value {
      font-size: 12px;
      color: #000000;
      font-weight: 500;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      font-size: 11px;
    }
    th {
      background: #f9fafb;
      padding: 6px 8px;
      text-align: left;
      font-weight: 600;
      color: #000000;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      border-bottom: 1px solid #000000;
    }
    th:last-child {
      text-align: right;
    }
    .totals {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #e5e7eb;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      font-size: 12px;
    }
    .total-row.final {
      font-size: 16px;
      font-weight: 700;
      color: #000000;
      padding-top: 8px;
      margin-top: 8px;
      border-top: 2px solid #000000;
    }
    .total-label {
      color: #000000;
      font-weight: 500;
    }
    .total-value {
      font-weight: 600;
      color: #000000;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .badge-success {
      background: #d1fae5;
      color: #065f46;
    }
    .badge-pending {
      background: #fef3c7;
      color: #92400e;
    }
    .badge-cancelled {
      background: #fee2e2;
      color: #991b1b;
    }
    .footer {
      background: white;
      padding: 12px 20px;
      text-align: center;
      color: #000000;
      font-size: 10px;
      border-top: 1px solid #000000;
    }
    .footer p {
      margin: 4px 0;
      color: #000000;
    }
    @media print {
      body {
        padding: 0;
        margin: 0;
        background: white;
      }
      .receipt-container {
        box-shadow: none;
        border-radius: 0;
        max-width: 100%;
      }
      .receipt-header {
        padding: 10px;
      }
      .receipt-body {
        padding: 10px;
      }
      .footer {
        padding: 8px 10px;
      }
      @page {
        margin: 0.5cm;
        size: A4;
      }
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <div class="receipt-header">
      <h1>${brandConfig.brandName || "Order Receipt"}</h1>
      ${brandConfig.contact?.address ? `<p>${brandConfig.contact.address}</p>` : ""}
      ${brandConfig.contact?.phone ? `<p>Phone: ${brandConfig.contact.phone}</p>` : ""}
      ${brandConfig.contact?.email ? `<p>Email: ${brandConfig.contact.email}</p>` : ""}
    </div>
    
    <div class="receipt-body">
      <div style="text-align: center; margin-bottom: 12px; padding: 8px; background: #f9fafb; border-radius: 2px;">
        <p style="font-size: 12px; color: #000000; font-weight: 500; margin-bottom: 4px;">Dear ${order.customer.fullName},</p>
        <p style="font-size: 10px; color: #000000; line-height: 1.4;">Thank you for your order! This is your official receipt. Please keep this for your records.</p>
      </div>
      
      <div class="receipt-section">
        <h2>Order Information</h2>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Order Number</div>
            <div class="info-value">#${order.id.slice(-7)}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Order Date</div>
            <div class="info-value">${formattedDate}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Order Status</div>
            <div class="info-value">
              <span class="badge badge-${
                order.status === "delivered" ? "success" : order.status === "cancelled" ? "cancelled" : "pending"
              }">
                ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>
          </div>
          <div class="info-item">
            <div class="info-label">Payment Status</div>
            <div class="info-value">
              <span class="badge badge-${order.paymentStatus === "completed" ? "success" : "pending"}">
                ${
                  order.paymentStatus === "completed"
                    ? "Paid"
                    : order.paymentStatus
                    ? order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)
                    : "Pending"
                }
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="receipt-section">
        <h2>Delivery Address</h2>
        <div class="info-grid">
          <div class="info-item" style="grid-column: 1 / -1;">
            <div class="info-label">Name</div>
            <div class="info-value" style="font-size: 13px; margin-bottom: 6px;">${order.customer.fullName}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Phone</div>
            <div class="info-value">${order.customer.phone}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Email</div>
            <div class="info-value">${order.customer.email || "N/A"}</div>
          </div>
          <div class="info-item" style="grid-column: 1 / -1;">
            <div class="info-label">Shipping Address</div>
            <div class="info-value" style="line-height: 1.8;">
              ${order.customer.addressLine1}${order.customer.addressLine2 ? `, ${order.customer.addressLine2}` : ""}<br>
              ${order.customer.city ? `${order.customer.city}, ` : ""}${order.customer.postalCode || ""}
            </div>
          </div>
        </div>
      </div>

      <div class="receipt-section">
        <h2>Items Ordered</h2>
        <table>
          <thead>
            <tr>
              <th style="text-align: left; width: 50%;">Item Description</th>
              <th style="text-align: center; width: 20%;">Quantity</th>
              <th style="text-align: right; width: 15%;">Unit Price</th>
              <th style="text-align: right; width: 15%;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>
      </div>

      <div class="receipt-section">
        <div class="totals">
          <div class="total-row">
            <span class="total-label">Subtotal</span>
            <span class="total-value">${currencySymbol}${totals.subtotal.toFixed(2)}</span>
          </div>
          ${
            totals.discountAmount > 0
              ? `
          <div class="total-row">
            <span class="total-label">Discount${order.discountPercentage ? ` (${order.discountPercentage}%)` : ""}</span>
            <span class="total-value" style="color: #059669;">-${currencySymbol}${totals.discountAmount.toFixed(2)}</span>
          </div>
          `
              : ""
          }
          ${
            totals.vatTaxAmount > 0
              ? `
          <div class="total-row">
            <span class="total-label">VAT/TAX${order.vatTaxPercentage ? ` (${order.vatTaxPercentage}%)` : ""}</span>
            <span class="total-value">${currencySymbol}${totals.vatTaxAmount.toFixed(2)}</span>
          </div>
          `
              : ""
          }
          <div class="total-row">
            <span class="total-label">Shipping</span>
            <span class="total-value">${currencySymbol}${totals.shipping.toFixed(2)}</span>
          </div>
          <div class="total-row final">
            <span>Grand Total</span>
            <span>${currencySymbol}${totals.total.toFixed(2)}</span>
          </div>
          ${
            order.paidAmount !== undefined && order.paidAmount > 0
              ? `
          <div class="total-row">
            <span class="total-label">Amount Paid</span>
            <span class="total-value" style="color: #059669;">${currencySymbol}${order.paidAmount.toFixed(2)}</span>
          </div>
          <div class="total-row">
            <span class="total-label">Amount Due</span>
            <span class="total-value" style="color: ${
              totals.total - order.paidAmount > 0 ? "#dc2626" : "#059669"
            };">${currencySymbol}${Math.max(0, totals.total - order.paidAmount).toFixed(2)}</span>
          </div>
          `
              : ""
          }
        </div>
      </div>

      ${
        order.paymentMethod
          ? `
      <div class="receipt-section">
        <h2>Payment Information</h2>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Payment Method</div>
            <div class="info-value">${order.paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment"}</div>
          </div>
          ${
            order.paymentTransactionId
              ? `
          <div class="info-item">
            <div class="info-label">Transaction ID</div>
            <div class="info-value">${order.paymentTransactionId}</div>
          </div>
          `
              : ""
          }
        </div>
      </div>
      `
          : ""
      }

      ${
        order.courier
          ? `
      <div class="receipt-section">
        <h2>Delivery Information</h2>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Courier Service</div>
            <div class="info-value">${order.courier.serviceName || "N/A"}</div>
          </div>
          ${
            order.courier.consignmentId
              ? `
          <div class="info-item">
            <div class="info-label">Tracking ID</div>
            <div class="info-value">${order.courier.consignmentId}</div>
          </div>
          `
              : ""
          }
          ${
            order.courier.deliveryStatus
              ? `
          <div class="info-item">
            <div class="info-label">Delivery Status</div>
            <div class="info-value">${order.courier.deliveryStatus}</div>
          </div>
          `
              : ""
          }
        </div>
      </div>
      `
          : ""
      }
    </div>

    <div class="footer">
      <p style="font-size: 11px; font-weight: 600; margin-bottom: 4px;">Thank you for your purchase!</p>
      <p style="font-size: 9px; margin-bottom: 4px;">We appreciate your business and look forward to serving you again.</p>
      <p style="font-size: 9px; margin-top: 6px; padding-top: 6px; border-top: 1px solid #e5e7eb;">
        ${brandConfig.footer?.copyrightText || "All rights reserved."} | ${brandConfig.brandName || "Store"}
      </p>
      ${
        brandConfig.contact?.phone || brandConfig.contact?.email
          ? `
      <p style="font-size: 9px; margin-top: 4px;">
        For queries: ${brandConfig.contact?.phone ? `${brandConfig.contact.phone}` : ""}${
              brandConfig.contact?.phone && brandConfig.contact?.email ? " | " : ""
            }${brandConfig.contact?.email ? `${brandConfig.contact.email}` : ""}
      </p>
      `
          : ""
      }
    </div>
  </div>
</body>
</html>`;
}

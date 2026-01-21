"use server";

import { getTenantCollectionForAPI, buildTenantQuery } from "@/lib/api-helpers";
import type { Order } from "@/lib/types";

export type Customer = {
  id: string; // Unique identifier (phone or email)
  fullName: string;
  email?: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode: string;
  notes?: string;
  totalOrders: number;
  totalSpent: number;
  firstOrderDate: string;
  lastOrderDate: string;
  averageOrderValue: number;
  orderIds: string[];
};

export type CustomerStats = {
  totalCustomers: number;
  newCustomersLast30Days: number;
  repeatCustomers: number;
  averageOrdersPerCustomer: number;
  totalRevenue: number;
  averageOrderValue: number;
  topCustomers: Customer[];
};

type PaginationData = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export async function getCustomerStats(): Promise<CustomerStats> {
  try {
    const ordersCol = await getTenantCollectionForAPI("orders");
    const query = await buildTenantQuery();
    const docs = (await ordersCol.find(query).sort({ createdAt: -1 }).toArray()) as any[];

    // Aggregate customers from orders
    const customerMap = new Map<string, Customer>();

    docs.forEach((doc) => {
      const order: Order = {
        id: String(doc._id),
        createdAt: doc.createdAt,
        status: doc.status,
        orderType: doc.orderType || "online",
        items: doc.items,
        subtotal: Number(doc.subtotal ?? 0),
        discountPercentage: doc.discountPercentage !== undefined ? Number(doc.discountPercentage) : undefined,
        discountAmount: doc.discountAmount !== undefined ? Number(doc.discountAmount) : undefined,
        vatTaxPercentage: doc.vatTaxPercentage !== undefined ? Number(doc.vatTaxPercentage) : undefined,
        vatTaxAmount: doc.vatTaxAmount !== undefined ? Number(doc.vatTaxAmount) : undefined,
        shipping: Number(doc.shipping ?? 0),
        total: Number(doc.total ?? 0),
        paymentMethod: doc.paymentMethod,
        paymentStatus: doc.paymentStatus,
        paidAmount: doc.paidAmount !== undefined ? Number(doc.paidAmount) : undefined,
        paymentTransactionId: doc.paymentTransactionId,
        paymentValId: doc.paymentValId,
        customer: doc.customer,
        courier: doc.courier,
      };

      if (!order.customer) return;

      // Use phone as primary identifier, fallback to email
      const customerId = order.customer.phone || order.customer.email || "";
      if (!customerId) return;

      if (customerMap.has(customerId)) {
        const existing = customerMap.get(customerId)!;
        existing.totalOrders += 1;
        existing.totalSpent += order.total;
        existing.orderIds.push(order.id);
        if (new Date(order.createdAt) < new Date(existing.firstOrderDate)) {
          existing.firstOrderDate = order.createdAt;
        }
        if (new Date(order.createdAt) > new Date(existing.lastOrderDate)) {
          existing.lastOrderDate = order.createdAt;
        }
        existing.averageOrderValue = existing.totalSpent / existing.totalOrders;
      } else {
        customerMap.set(customerId, {
          id: customerId,
          fullName: order.customer.fullName,
          email: order.customer.email,
          phone: order.customer.phone,
          addressLine1: order.customer.addressLine1,
          addressLine2: order.customer.addressLine2,
          city: order.customer.city,
          postalCode: order.customer.postalCode,
          notes: order.customer.notes,
          totalOrders: 1,
          totalSpent: order.total,
          firstOrderDate: order.createdAt,
          lastOrderDate: order.createdAt,
          averageOrderValue: order.total,
          orderIds: [order.id],
        });
      }
    });

    const customers = Array.from(customerMap.values());

    // Calculate stats
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const newCustomersLast30Days = customers.filter((c) => new Date(c.firstOrderDate) >= last30Days).length;

    const repeatCustomers = customers.filter((c) => c.totalOrders > 1).length;

    const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
    const averageOrderValue =
      customers.length > 0 ? totalRevenue / customers.reduce((sum, c) => sum + c.totalOrders, 0) : 0;
    const averageOrdersPerCustomer =
      customers.length > 0 ? customers.reduce((sum, c) => sum + c.totalOrders, 0) / customers.length : 0;

    // Top customers by total spent
    const topCustomers = [...customers].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 10);

    return {
      totalCustomers: customers.length,
      newCustomersLast30Days,
      repeatCustomers,
      averageOrdersPerCustomer,
      totalRevenue,
      averageOrderValue,
      topCustomers,
    };
  } catch (error: any) {
    console.error("Failed to fetch customer stats:", error);
    throw new Error(error?.message || "Failed to fetch customer stats");
  }
}

export async function getCustomers(
  page: number = 1,
  limit: number = 30,
  search?: string
): Promise<{ customers: Customer[]; pagination: PaginationData; stats: CustomerStats }> {
  try {
    const skip = (page - 1) * limit;
    const ordersCol = await getTenantCollectionForAPI("orders");
    const query = await buildTenantQuery();
    const docs = (await ordersCol.find(query).sort({ createdAt: -1 }).toArray()) as any[];

    // Aggregate customers from orders
    const customerMap = new Map<string, Customer>();

    docs.forEach((doc) => {
      const order: Order = {
        id: String(doc._id),
        createdAt: doc.createdAt,
        status: doc.status,
        orderType: doc.orderType || "online",
        items: doc.items,
        subtotal: Number(doc.subtotal ?? 0),
        discountPercentage: doc.discountPercentage !== undefined ? Number(doc.discountPercentage) : undefined,
        discountAmount: doc.discountAmount !== undefined ? Number(doc.discountAmount) : undefined,
        vatTaxPercentage: doc.vatTaxPercentage !== undefined ? Number(doc.vatTaxPercentage) : undefined,
        vatTaxAmount: doc.vatTaxAmount !== undefined ? Number(doc.vatTaxAmount) : undefined,
        shipping: Number(doc.shipping ?? 0),
        total: Number(doc.total ?? 0),
        paymentMethod: doc.paymentMethod,
        paymentStatus: doc.paymentStatus,
        paidAmount: doc.paidAmount !== undefined ? Number(doc.paidAmount) : undefined,
        paymentTransactionId: doc.paymentTransactionId,
        paymentValId: doc.paymentValId,
        customer: doc.customer,
        courier: doc.courier,
      };

      if (!order.customer) return;

      // Use phone as primary identifier, fallback to email
      const customerId = order.customer.phone || order.customer.email || "";
      if (!customerId) return;

      if (customerMap.has(customerId)) {
        const existing = customerMap.get(customerId)!;
        existing.totalOrders += 1;
        existing.totalSpent += order.total;
        existing.orderIds.push(order.id);
        if (new Date(order.createdAt) < new Date(existing.firstOrderDate)) {
          existing.firstOrderDate = order.createdAt;
        }
        if (new Date(order.createdAt) > new Date(existing.lastOrderDate)) {
          existing.lastOrderDate = order.createdAt;
        }
        existing.averageOrderValue = existing.totalSpent / existing.totalOrders;
      } else {
        customerMap.set(customerId, {
          id: customerId,
          fullName: order.customer.fullName,
          email: order.customer.email,
          phone: order.customer.phone,
          addressLine1: order.customer.addressLine1,
          addressLine2: order.customer.addressLine2,
          city: order.customer.city,
          postalCode: order.customer.postalCode,
          notes: order.customer.notes,
          totalOrders: 1,
          totalSpent: order.total,
          firstOrderDate: order.createdAt,
          lastOrderDate: order.createdAt,
          averageOrderValue: order.total,
          orderIds: [order.id],
        });
      }
    });

    let customers = Array.from(customerMap.values());

    // Apply search filter
    if (search && search.trim()) {
      const searchTerm = search.toLowerCase().trim();
      customers = customers.filter(
        (c) =>
          c.fullName.toLowerCase().includes(searchTerm) ||
          c.email?.toLowerCase().includes(searchTerm) ||
          c.phone.toLowerCase().includes(searchTerm) ||
          c.city.toLowerCase().includes(searchTerm)
      );
    }

    // Sort by last order date (most recent first)
    customers.sort((a, b) => new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime());

    // Calculate stats (from all customers, not filtered)
    const allCustomers = Array.from(customerMap.values());
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const newCustomersLast30Days = allCustomers.filter((c) => new Date(c.firstOrderDate) >= last30Days).length;
    const repeatCustomers = allCustomers.filter((c) => c.totalOrders > 1).length;
    const totalRevenue = allCustomers.reduce((sum, c) => sum + c.totalSpent, 0);
    const averageOrderValue =
      allCustomers.length > 0 ? totalRevenue / allCustomers.reduce((sum, c) => sum + c.totalOrders, 0) : 0;
    const averageOrdersPerCustomer =
      allCustomers.length > 0 ? allCustomers.reduce((sum, c) => sum + c.totalOrders, 0) / allCustomers.length : 0;
    const topCustomers = [...allCustomers].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 10);

    const stats: CustomerStats = {
      totalCustomers: allCustomers.length,
      newCustomersLast30Days,
      repeatCustomers,
      averageOrdersPerCustomer,
      totalRevenue,
      averageOrderValue,
      topCustomers,
    };

    // Apply pagination
    const totalCount = customers.length;
    const paginatedCustomers = customers.slice(skip, skip + limit);

    return {
      customers: paginatedCustomers,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page * limit < totalCount,
        hasPrevPage: page > 1,
      },
      stats,
    };
  } catch (error: any) {
    console.error("Failed to fetch customers:", error);
    throw new Error(error?.message || "Failed to fetch customers");
  }
}


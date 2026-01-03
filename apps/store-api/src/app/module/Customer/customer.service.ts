/* eslint-disable @typescript-eslint/no-explicit-any */
import { Order } from "../Order/order.model";
import QueryBuilder from "../../builder/QueryBuilder";

// Get all customers with statistics
const getAllCustomersFromDB = async (query: Record<string, unknown>) => {
  // Aggregate orders to get customer statistics
  const customersAggregation = await Order.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: {
          phone: "$customer.phone",
          email: "$customer.email",
        },
        fullName: { $first: "$customer.fullName" },
        addressLine1: { $first: "$customer.addressLine1" },
        city: { $first: "$customer.city" },
        totalOrders: { $sum: 1 },
        totalSpent: { $sum: "$total" },
        firstOrderDate: { $min: "$createdAt" },
        lastOrderDate: { $max: "$createdAt" },
      },
    },
    {
      $project: {
        _id: 0,
        phone: "$_id.phone",
        email: "$_id.email",
        fullName: 1,
        addressLine1: 1,
        city: 1,
        totalOrders: 1,
        totalSpent: 1,
        firstOrderDate: 1,
        lastOrderDate: 1,
        averageOrderValue: { $divide: ["$totalSpent", "$totalOrders"] },
      },
    },
  ]);

  // Apply search filter if provided
  let filteredCustomers = customersAggregation;
  if (query.searchTerm) {
    const searchTerm = (query.searchTerm as string).toLowerCase();
    filteredCustomers = customersAggregation.filter(
      (customer: any) =>
        customer.fullName?.toLowerCase().includes(searchTerm) ||
        customer.email?.toLowerCase().includes(searchTerm) ||
        customer.phone?.includes(searchTerm)
    );
  }

  // Calculate statistics
  const stats = {
    totalCustomers: filteredCustomers.length,
    totalRevenue: filteredCustomers.reduce(
      (sum: number, c: any) => sum + (c.totalSpent || 0),
      0
    ),
    averageOrderValue:
      filteredCustomers.reduce(
        (sum: number, c: any) => sum + (c.averageOrderValue || 0),
        0
      ) / filteredCustomers.length || 0,
  };

  // Apply pagination
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 30;
  const skip = (page - 1) * limit;
  const paginatedCustomers = filteredCustomers.slice(skip, skip + limit);

  // Generate IDs for customers
  const customersWithIds = paginatedCustomers.map(
    (customer: any, index: number) => ({
      id: `CUST${Date.now()}${index}`,
      ...customer,
    })
  );

  const meta = {
    page,
    limit,
    total: filteredCustomers.length,
    totalPage: Math.ceil(filteredCustomers.length / limit),
  };

  return {
    customers: customersWithIds,
    stats,
    meta,
  };
};

export const CustomerServices = {
  getAllCustomersFromDB,
};

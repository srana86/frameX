/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma, PrismaQueryBuilder } from "@framex/database";

// Get all customers with statistics
const getAllCustomersFromDB = async (tenantId: string, query: Record<string, unknown>) => {
  const searchTerm = (query.searchTerm as string)?.toLowerCase();

  const where: any = { tenantId };
  if (searchTerm) {
    where.OR = [
      { name: { contains: searchTerm, mode: "insensitive" } },
      { email: { contains: searchTerm, mode: "insensitive" } },
      { phone: { contains: searchTerm } }
    ];
  }

  // Get customers
  const customers = await prisma.customer.findMany({
    where,
    include: {
      orders: {
        select: {
          total: true,
          createdAt: true
        }
      }
    },
    orderBy: { createdAt: "desc" },
    take: Number(query.limit) || 30,
    skip: ((Number(query.page) || 1) - 1) * (Number(query.limit) || 30)
  });

  const total = await prisma.customer.count({ where });

  // Calculate statistics for each customer
  const enrichedCustomers = customers.map(c => {
    const totalOrders = c.orders.length;
    const totalSpent = c.orders.reduce((sum, o) => sum + Number(o.total), 0);
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
    const firstOrderDate = c.orders.length > 0 ? c.orders[c.orders.length - 1].createdAt : null;
    const lastOrderDate = c.orders.length > 0 ? c.orders[0].createdAt : null;

    return {
      id: c.id,
      fullName: c.name,
      email: c.email,
      phone: c.phone,
      addressLine1: c.address,
      city: c.city,
      totalOrders,
      totalSpent,
      firstOrderDate,
      lastOrderDate,
      averageOrderValue
    };
  });

  // Calculate overall stats (approximate or need separate aggregation)
  // For precise overall stats, we would agg on all orders or customers, but that's expensive.
  // The original Mongoose code aggregated *all* orders to get stats.
  // We can do a separate aggregation on Order table if needed.

  const statsAggregate = await prisma.order.aggregate({
    where: { tenantId, status: { not: "CANCELLED" } }, // Assuming we exclude cancelled
    _sum: { total: true },
    _count: { _all: true } // total orders
  });

  // Total customers count
  const totalCustomers = await prisma.customer.count({ where: { tenantId } });

  const stats = {
    totalCustomers,
    totalRevenue: Number(statsAggregate._sum.total || 0),
    averageOrderValue: statsAggregate._count._all > 0 ? Number(statsAggregate._sum.total || 0) / statsAggregate._count._all : 0
  };

  return {
    customers: enrichedCustomers,
    stats,
    meta: {
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 30,
      total,
      totalPage: Math.ceil(total / (Number(query.limit) || 30))
    }
  };
};

export const CustomerServices = {
  getAllCustomersFromDB,
};

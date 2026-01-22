"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ShoppingCart,
  DollarSign,
  Package,
  Users,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalCustomers: number;
  pendingOrders: number;
  lowStockItems: number;
}

interface DashboardData {
  stats: DashboardStats;
  recentOrders: any[];
  topProducts: any[];
}

interface DashboardClientProps {
  initialData: DashboardData;
  storeId: string;
}

/**
 * Dashboard Client Component
 * Displays store overview and analytics
 */
export function DashboardClient({
  initialData,
  storeId,
}: DashboardClientProps) {
  const { stats } = initialData;

  const statCards = [
    {
      title: "Total Orders",
      value: stats.totalOrders,
      icon: ShoppingCart,
      description: `${stats.pendingOrders} pending`,
      trend: "+12%",
    },
    {
      title: "Total Revenue",
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      description: "This month",
      trend: "+8%",
    },
    {
      title: "Products",
      value: stats.totalProducts,
      icon: Package,
      description: `${stats.lowStockItems} low stock`,
      trend: "+5%",
    },
    {
      title: "Customers",
      value: stats.totalCustomers,
      icon: Users,
      description: "Total registered",
      trend: "+15%",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your store performance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{stat.description}</span>
                  {stat.trend && (
                    <span className="flex items-center text-green-600">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {stat.trend}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Alerts */}
      {stats.lowStockItems > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="h-5 w-5" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-yellow-700">
              You have {stats.lowStockItems} products with low stock. Consider
              restocking soon.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {initialData.recentOrders && initialData.recentOrders.length > 0 ? (
              <div className="space-y-2">
                {initialData.recentOrders.slice(0, 5).map((order: any) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div>
                      <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.customer?.name || "Guest"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${order.total}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No recent orders
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
          </CardHeader>
          <CardContent>
            {initialData.topProducts && initialData.topProducts.length > 0 ? (
              <div className="space-y-2">
                {initialData.topProducts.slice(0, 5).map((product: any) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.category}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${product.price}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.stock} in stock
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No products yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

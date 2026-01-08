"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ShoppingBag, Package, Tag, TrendingUp, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const quickActions = [
  {
    title: "New Order",
    description: "Create manual order",
    href: "/merchant/orders/new",
    icon: ShoppingBag,
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    hoverColor: "hover:bg-blue-500/20",
  },
  {
    title: "Add Product",
    description: "Create new product",
    href: "/merchant/products/new",
    icon: Package,
    color: "bg-green-500/10 text-green-600 dark:text-green-400",
    hoverColor: "hover:bg-green-500/20",
  },
  {
    title: "Create Coupon",
    description: "Add discount code",
    href: "/merchant/coupons/new",
    icon: Tag,
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    hoverColor: "hover:bg-purple-500/20",
  },
  {
    title: "View Analytics",
    description: "See statistics",
    href: "/merchant/statistics",
    icon: TrendingUp,
    color: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    hoverColor: "hover:bg-orange-500/20",
  },
  {
    title: "Customers",
    description: "Manage customers",
    href: "/merchant/customers",
    icon: Users,
    color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    hoverColor: "hover:bg-indigo-500/20",
  },
];

export function DashboardQuickActions() {
  return (
    <Card>
      <CardContent className='p-4'>
        <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3'>
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.href}
                asChild
                variant='ghost'
                className={cn("h-auto flex-col gap-2 p-4 transition-all", action.color, action.hoverColor)}
              >
                <Link href={action.href}>
                  <Icon className='h-6 w-6' />
                  <div className='text-center'>
                    <div className='font-semibold text-sm'>{action.title}</div>
                    <div className='text-xs opacity-70 mt-0.5'>{action.description}</div>
                  </div>
                </Link>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

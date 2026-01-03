import type { Metadata } from "next";
import OrdersClient from "./OrdersClient";

export const metadata: Metadata = {
  title: "Admin · Orders",
  description: "Manage orders and update their statuses.",
};

export default function AdminOrdersPage() {
  return (
    <div className="mx-auto w-full py-2 sm:py-4 px-4 sm:px-0">
      {/* Desktop Header - Hidden on mobile since OrdersClient has its own mobile header */}
      <div className="hidden lg:block mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
          All Orders
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1.5">
          Manage orders and update their statuses
        </p>
      </div>
      <OrdersClient />
    </div>
  );
}

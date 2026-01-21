import type { Metadata } from "next";
import { InvestmentsClient } from "./InvestmentsClient";
import { requireAuth } from "@/lib/auth-helpers";

export const metadata: Metadata = {
  title: "Tenant · Investments",
  description: "Manage and track all your investments",
};

export default async function InvestmentsPage() {
  await requireAuth("tenant");

  return (
    <div className='mx-auto w-full'>
      <div className='pt-4 pb-2 sm:pb-4'>
        <h1 className='text-xl sm:text-2xl md:text-3xl font-bold tracking-tight'>Investments Management</h1>
        <p className='text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2'>
          Track and manage all your investments with detailed calculations
        </p>
      </div>
      <InvestmentsClient />
    </div>
  );
}

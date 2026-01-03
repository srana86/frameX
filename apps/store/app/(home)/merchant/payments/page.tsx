import type { Metadata } from "next";
import Link from "next/link";
import { PaymentsClient } from "./PaymentsClient";
import { requireAuth } from "@/lib/auth-helpers";
import { Button } from "@/components/ui/button";
import { Coins } from "lucide-react";

export const metadata: Metadata = {
  title: "Merchant · Payment History",
  description: "View payment history and statistics",
};

export default async function PaymentsPage() {
  await requireAuth("merchant");

  return (
    <div className='mx-auto w-full'>
      <div className='pt-4 pb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-2xl md:text-3xl font-bold tracking-tight'>Payment History</h1>
          <p className='text-sm sm:text-base text-muted-foreground mt-1'>View and track all payment transactions</p>
        </div>
        <Button asChild variant='outline' size='sm' className='sm:mt-0'>
          <Link href='/merchant/payments/currency' className='flex items-center gap-2'>
            <Coins className='h-4 w-4' />
            Currency settings
          </Link>
        </Button>
      </div>
      <PaymentsClient />
    </div>
  );
}

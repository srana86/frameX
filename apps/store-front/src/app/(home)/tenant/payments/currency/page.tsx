import type { Metadata } from "next";
import Link from "next/link";
import { BrandConfigClient } from "@/app/(home)/tenant/brand/BrandConfigClient";
import { loadBrandConfig } from "@/app/(home)/tenant/brand/loadBrandConfig";
import { requireAuth } from "@/lib/auth-helpers";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Tenant · Currency",
  description: "Manage store currency and symbol",
};

export default async function CurrencyPage() {
  await requireAuth("tenant");
  const brandConfig = await loadBrandConfig();

  return (
    <div className='mx-auto w-full space-y-4'>
      <div className='flex items-center justify-between gap-3 pt-4'>
        <div>
          <h1 className='text-2xl md:text-3xl font-bold tracking-tight'>Currency</h1>
          <p className='text-sm sm:text-base text-muted-foreground mt-1'>Set your default currency and symbol</p>
        </div>
        <Button asChild variant='outline' size='sm'>
          <Link href='/tenant/payments' className='flex items-center gap-2'>
            <ArrowLeft className='h-4 w-4' />
            Back to payments
          </Link>
        </Button>
      </div>

      <div className='space-y-6'>
        <BrandConfigClient initialConfig={brandConfig} initialTab='payment' hideHeader showActions />
      </div>
    </div>
  );
}

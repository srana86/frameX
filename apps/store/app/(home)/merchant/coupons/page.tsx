import { Metadata } from "next";
import CouponsClient from "./CouponsClient";

export const metadata: Metadata = {
  title: "Coupons · Admin",
  description: "Manage discount coupons and promotional codes",
};

export default function CouponsPage() {
  return (
    <div className='space-y-4 sm:space-y-6 py-4'>
      <div>
        <h1 className='text-2xl sm:text-3xl font-bold tracking-tight'>Coupons</h1>
        <p className='text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2'>Manage discount codes and promotional offers</p>
      </div>
      <CouponsClient />
    </div>
  );
}

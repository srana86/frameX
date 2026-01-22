import { DeliveryServiceClient } from "./DeliveryServiceClient";
import { CourierServicesClient } from "./CourierServicesClient";
import { getDeliveryServiceConfig, getCourierServicesConfig } from "@/lib/delivery-config";
import { requireAuth } from "@/lib/auth-helpers";
import { Truck, Package } from "lucide-react";

export const metadata = {
  title: "Tenant · Delivery Support",
  description: "Configure delivery services and courier integrations",
};

export default async function DeliverySupportPage() {
  await requireAuth("tenant");

  // Load configs server-side
  const [deliveryServiceConfig, courierServicesConfig] = await Promise.all([getDeliveryServiceConfig(), getCourierServicesConfig()]);

  return (
    <div className='w-full max-w-[1440px] mx-auto py-4 space-y-6'>
      {/* Header Section */}
      <div className='relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-6 sm:p-8'>
        <div className='relative z-10'>
          <div className='flex items-center gap-3 mb-3'>
            <div className='p-3 rounded-xl bg-primary/20 backdrop-blur-sm'>
              <Truck className='h-6 w-6 sm:h-8 sm:w-8 text-primary' />
            </div>
            <div>
              <h1 className='text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent'>
                Delivery Support
              </h1>
              <p className='text-sm sm:text-base text-muted-foreground mt-1'>
                Configure delivery charges and manage courier service integrations
              </p>
            </div>
          </div>
        </div>
        <div className='absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2' />
      </div>

      {/* Main Content Grid */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Delivery Service - Takes 2 columns on large screens */}
        <div className='lg:col-span-2'>
          <DeliveryServiceClient initialConfig={deliveryServiceConfig} />
        </div>

        {/* Courier Services - Takes 1 column on large screens */}
        <div className='lg:col-span-1'>
          <CourierServicesClient initialConfig={courierServicesConfig} />
        </div>
      </div>
    </div>
  );
}

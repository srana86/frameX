"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Settings2, Bell, Shield } from "lucide-react";
import { SSLCommerzSettings } from "./_components/SSLCommerzSettings";
import { GeneralSettings } from "./_components/GeneralSettings";
import { NotificationSettings } from "./_components/NotificationSettings";

export default function SettingsPage() {
  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>Settings</h1>
        <p className='text-muted-foreground'>Configure system settings, payment gateways, and notifications</p>
      </div>

      <Tabs defaultValue='payment' className='space-y-6'>
        <TabsList className='grid w-full grid-cols-3 lg:w-[500px]'>
          <TabsTrigger value='payment' className='gap-2'>
            <CreditCard className='h-4 w-4' />
            Payment Gateway
          </TabsTrigger>
          <TabsTrigger value='general' className='gap-2'>
            <Settings2 className='h-4 w-4' />
            General
          </TabsTrigger>
          <TabsTrigger value='notifications' className='gap-2'>
            <Bell className='h-4 w-4' />
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value='payment'>
          <SSLCommerzSettings />
        </TabsContent>

        <TabsContent value='general'>
          <GeneralSettings />
        </TabsContent>

        <TabsContent value='notifications'>
          <NotificationSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}

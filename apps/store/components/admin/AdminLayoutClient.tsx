"use client";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import AdminNavbar from "@/components/admin/AdminNavbar";
import { MobileBottomNav } from "@/components/admin/MobileBottomNav";
import { KeyboardShortcuts } from "@/components/admin/KeyboardShortcuts";
import SubscriptionBanner from "@/components/site/SubscriptionBanner";
import type { BrandConfig } from "@/lib/brand-config";

interface AdminLayoutClientProps {
  children: React.ReactNode;
  brandConfig: BrandConfig;
}

export function AdminLayoutClient({ children, brandConfig }: AdminLayoutClientProps) {
  return (
    <div className='min-h-screen'>
      <SidebarProvider>
        <AdminSidebar brandConfig={brandConfig} />
        <SidebarInset>
          {/* Subscription Status Banner */}
          <SubscriptionBanner />
          <header className='sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4'>
            <SidebarTrigger className='-ml-1 hidden md:flex' />
            <div className='flex-1'>
              <AdminNavbar brandConfig={brandConfig} />
            </div>
          </header>
          <div className='flex w-full flex-1 flex-col gap-4 p-4 pt-0 pb-20 md:pb-4'>{children}</div>
        </SidebarInset>
        <MobileBottomNav />
        <KeyboardShortcuts />
      </SidebarProvider>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Bell,
  MoreHorizontal,
  Users,
  Settings,
  Truck,
  BarChart3,
  Percent,
  CreditCard,
  Palette,
  Globe,
  X,
  ChevronRight,
  TrendingUp,
  DollarSign,
  Boxes,
  FileText,
  Mail,
  Shield,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/api-client";

// Primary nav items (shown in bottom bar)
const primaryNavItems = [
  { title: "Home", href: "/merchant", icon: LayoutDashboard },
  { title: "Orders", href: "/merchant/orders", icon: ShoppingBag },
  { title: "Products", href: "/merchant/products", icon: Package },
  { title: "Alerts", href: "/merchant/notifications", icon: Bell },
];

// Secondary nav items (shown in "More" drawer)
const secondaryNavItems = [
  {
    category: "Sales & Analytics",
    items: [
      { title: "Statistics", href: "/merchant/statistics", icon: BarChart3 },
      { title: "Profit Analysis", href: "/merchant/profit-analysis", icon: DollarSign },
      { title: "Investments", href: "/merchant/investments", icon: TrendingUp },
    ],
  },
  {
    category: "Customers & Marketing",
    items: [
      { title: "Customers", href: "/merchant/customers", icon: Users },
      { title: "Coupons", href: "/merchant/coupons", icon: Percent },
      { title: "Affiliates", href: "/merchant/affiliates", icon: Users },
    ],
  },
  {
    category: "Operations",
    items: [
      { title: "Inventory", href: "/merchant/inventory", icon: Boxes },
      { title: "Delivery Support", href: "/merchant/delivery-support", icon: Truck },
      { title: "Fraud Check", href: "/merchant/fraud-check", icon: Shield },
    ],
  },
  {
    category: "Store Settings",
    items: [
      { title: "Brand & Theme", href: "/merchant/brand", icon: Palette },
      { title: "Domain", href: "/merchant/domain", icon: Globe },
      { title: "Payment Config", href: "/merchant/payment-config", icon: CreditCard },
      { title: "Email Settings", href: "/merchant/email-settings", icon: Mail },
      { title: "Pages", href: "/merchant/pages", icon: FileText },
    ],
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [moreDrawerOpen, setMoreDrawerOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Determine if we're on order details page
  const isOrderDetailsPage = pathname.match(/\/merchant\/orders\/[^/]+$/);

  // Fetch unread notifications count
  useEffect(() => {
    const fetchNotificationCount = async () => {
      try {
        const data = await apiRequest<any>("GET", "/notifications?limit=1&page=1");
        const unread = data.notifications?.filter((n: any) => !n.read).length || 0;
        setUnreadCount(unread > 0 ? unread : 0);
      } catch (error) {
        // Silently fail
      }
    };

    fetchNotificationCount();
    // Refresh every minute
    const interval = setInterval(fetchNotificationCount, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch pending orders count
  useEffect(() => {
    const fetchPendingOrders = async () => {
      try {
        const data = await apiRequest<any>("GET", "/orders?status=pending&limit=1");
        setPendingOrdersCount(data.pagination?.total || 0);
      } catch (error) {
        // Silently fail
      }
    };

    fetchPendingOrders();
    // Refresh every 2 minutes
    const interval = setInterval(fetchPendingOrders, 120000);
    return () => clearInterval(interval);
  }, []);

  // Smart hide on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDiff = currentScrollY - lastScrollY;

      if (scrollDiff > 10 && currentScrollY > 100) {
        setIsVisible(false);
      } else if (scrollDiff < -10 || currentScrollY < 100) {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const isActive = (href: string) => {
    if (href === "/merchant") {
      return pathname === "/merchant";
    }
    return pathname.startsWith(href);
  };

  const handleNavClick = (href: string) => {
    setMoreDrawerOpen(false);
    router.push(href);
  };

  // Don't show on order details page (has its own floating nav)
  if (isOrderDetailsPage) {
    return (
      <>
        {/* Spacer */}
        <div className='h-24 md:hidden' />

        {/* Minimal Nav for Order Details - Circle Design */}
        <nav
          className={cn(
            "fixed bottom-0 left-0 right-0 z-50 md:hidden",
            "transform transition-transform duration-300 ease-out",
            isVisible ? "translate-y-0" : "translate-y-full"
          )}
        >
          <div className='bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-800/50 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]'>
            <div className='flex items-stretch justify-around px-3 pt-2' style={{ paddingBottom: "env(safe-area-inset-bottom, 12px)" }}>
              {/* Back to Orders */}
              <Link
                href='/merchant/orders'
                className='relative flex flex-1 flex-col items-center justify-center py-1 px-1 transition-all duration-200 ease-out active:scale-95'
              >
                <div className='relative flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 transition-all duration-300'>
                  <ShoppingBag className='w-5 h-5 text-slate-500 dark:text-slate-400 stroke-[2px]' />
                  {pendingOrdersCount > 0 && (
                    <span className='absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[20px] h-[20px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold shadow-lg border-2 border-white dark:border-slate-950'>
                      {pendingOrdersCount > 99 ? "99+" : pendingOrdersCount}
                    </span>
                  )}
                </div>
                <span className='text-[10px] mt-1.5 font-medium text-slate-500 dark:text-slate-400'>Orders</span>
              </Link>

              {/* Dashboard */}
              <Link
                href='/merchant'
                className='relative flex flex-1 flex-col items-center justify-center py-1 px-1 transition-all duration-200 ease-out active:scale-95'
              >
                <div className='relative flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 transition-all duration-300'>
                  <LayoutDashboard className='w-5 h-5 text-slate-500 dark:text-slate-400 stroke-[2px]' />
                </div>
                <span className='text-[10px] mt-1.5 font-medium text-slate-500 dark:text-slate-400'>Home</span>
              </Link>

              {/* Notifications */}
              <Link
                href='/merchant/notifications'
                className='relative flex flex-1 flex-col items-center justify-center py-1 px-1 transition-all duration-200 ease-out active:scale-95'
              >
                <div className='relative flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 transition-all duration-300'>
                  <Bell className='w-5 h-5 text-slate-500 dark:text-slate-400 stroke-[2px]' />
                  {unreadCount > 0 && (
                    <span className='absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[20px] h-[20px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold shadow-lg animate-pulse border-2 border-white dark:border-slate-950'>
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </div>
                <span className='text-[10px] mt-1.5 font-medium text-slate-500 dark:text-slate-400'>Alerts</span>
              </Link>

              {/* More */}
              <Drawer open={moreDrawerOpen} onOpenChange={setMoreDrawerOpen}>
                <DrawerTrigger asChild>
                  <button className='relative flex flex-1 flex-col items-center justify-center py-1 px-1 transition-all duration-200 ease-out active:scale-95'>
                    <div
                      className={cn(
                        "relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300",
                        moreDrawerOpen ? "bg-primary shadow-lg shadow-primary/30 scale-110" : "bg-slate-100 dark:bg-slate-800"
                      )}
                    >
                      <MoreHorizontal
                        className={cn("w-5 h-5 stroke-[2px]", moreDrawerOpen ? "text-white" : "text-slate-500 dark:text-slate-400")}
                      />
                    </div>
                    <span
                      className={cn(
                        "text-[10px] mt-1.5 font-medium",
                        moreDrawerOpen ? "text-primary font-semibold" : "text-slate-500 dark:text-slate-400"
                      )}
                    >
                      More
                    </span>
                  </button>
                </DrawerTrigger>
                <DrawerContent className='max-h-[85vh]'>
                  <DrawerHeader className='border-b pb-4'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <DrawerTitle className='text-lg font-bold'>More Options</DrawerTitle>
                        <DrawerDescription>Quick access to all features</DrawerDescription>
                      </div>
                      <DrawerClose asChild>
                        <Button variant='ghost' size='sm' className='h-8 w-8 p-0 rounded-full'>
                          <X className='h-4 w-4' />
                        </Button>
                      </DrawerClose>
                    </div>
                  </DrawerHeader>
                  <ScrollArea className='flex-1 p-4'>
                    <div className='space-y-6'>
                      {secondaryNavItems.map((section, sectionIdx) => (
                        <div key={section.category}>
                          <h3 className='text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-1'>
                            {section.category}
                          </h3>
                          <div className='space-y-1'>
                            {section.items.map((item) => {
                              const active = isActive(item.href);
                              const Icon = item.icon;
                              return (
                                <button
                                  key={item.href}
                                  onClick={() => handleNavClick(item.href)}
                                  className={cn(
                                    "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200",
                                    "active:scale-[0.98]",
                                    active
                                      ? "bg-primary/10 text-primary"
                                      : "hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300"
                                  )}
                                >
                                  <div
                                    className={cn(
                                      "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                                      active ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                                    )}
                                  >
                                    <Icon className='h-4.5 w-4.5' />
                                  </div>
                                  <span className={cn("flex-1 text-left text-sm", active && "font-semibold")}>{item.title}</span>
                                  <ChevronRight className={cn("h-4 w-4 text-slate-400 dark:text-slate-500", active && "text-primary")} />
                                </button>
                              );
                            })}
                          </div>
                          {sectionIdx < secondaryNavItems.length - 1 && <Separator className='mt-4' />}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </DrawerContent>
              </Drawer>
            </div>
          </div>
        </nav>
      </>
    );
  }

  return (
    <>
      {/* Spacer to prevent content from being hidden behind nav */}
      <div className='h-24 md:hidden' />

      {/* Bottom Navigation */}
      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 md:hidden",
          "transform transition-transform duration-300 ease-out",
          isVisible ? "translate-y-0" : "translate-y-full"
        )}
      >
        {/* Glassmorphic background */}
        <div className='bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-800/50 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]'>
          {/* Navigation items */}
          <div className='flex items-stretch justify-around px-3 pt-2' style={{ paddingBottom: "env(safe-area-inset-bottom, 12px)" }}>
            {primaryNavItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              const showBadge =
                (item.href === "/merchant/notifications" && unreadCount > 0) ||
                (item.href === "/merchant/orders" && pendingOrdersCount > 0);
              const badgeCount = item.href === "/merchant/notifications" ? unreadCount : pendingOrdersCount;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex flex-1 flex-col items-center justify-center py-1 px-1",
                    "transition-all duration-200 ease-out",
                    "active:scale-95"
                  )}
                >
                  {/* Circle Icon Container */}
                  <div
                    className={cn(
                      "relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300",
                      active ? "bg-primary shadow-lg shadow-primary/30 scale-110" : "bg-slate-100 dark:bg-slate-800"
                    )}
                  >
                    <Icon
                      className={cn(
                        "transition-all duration-200",
                        active ? "w-5 h-5 text-white stroke-[2.5px]" : "w-5 h-5 text-slate-500 dark:text-slate-400 stroke-[2px]"
                      )}
                    />

                    {/* Notification badge */}
                    {showBadge && (
                      <span
                        className={cn(
                          "absolute -top-0.5 -right-0.5 flex items-center justify-center",
                          "min-w-[20px] h-[20px] px-1 rounded-full",
                          "bg-red-500 text-white text-[10px] font-bold",
                          "shadow-lg shadow-red-500/30",
                          "animate-pulse border-2 border-white dark:border-slate-950"
                        )}
                      >
                        {badgeCount > 99 ? "99+" : badgeCount}
                      </span>
                    )}
                  </div>

                  {/* Label */}
                  <span
                    className={cn(
                      "text-[10px] mt-1.5 font-medium transition-all duration-200",
                      active ? "text-primary font-semibold" : "text-slate-500 dark:text-slate-400"
                    )}
                  >
                    {item.title}
                  </span>
                </Link>
              );
            })}

            {/* More Button */}
            <Drawer open={moreDrawerOpen} onOpenChange={setMoreDrawerOpen}>
              <DrawerTrigger asChild>
                <button
                  className={cn(
                    "relative flex flex-1 flex-col items-center justify-center py-1 px-1",
                    "transition-all duration-200 ease-out",
                    "active:scale-95"
                  )}
                >
                  {/* Circle Icon Container */}
                  <div
                    className={cn(
                      "relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300",
                      moreDrawerOpen ? "bg-primary shadow-lg shadow-primary/30 scale-110" : "bg-slate-100 dark:bg-slate-800"
                    )}
                  >
                    <MoreHorizontal
                      className={cn(
                        "transition-all duration-200",
                        moreDrawerOpen ? "w-5 h-5 text-white stroke-[2.5px]" : "w-5 h-5 text-slate-500 dark:text-slate-400 stroke-[2px]"
                      )}
                    />
                  </div>
                  <span
                    className={cn(
                      "text-[10px] mt-1.5 font-medium transition-all duration-200",
                      moreDrawerOpen ? "text-primary font-semibold" : "text-slate-500 dark:text-slate-400"
                    )}
                  >
                    More
                  </span>
                </button>
              </DrawerTrigger>

              <DrawerContent className='max-h-[85vh]'>
                <DrawerHeader className='border-b pb-4'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <DrawerTitle className='text-lg font-bold'>More Options</DrawerTitle>
                      <DrawerDescription>Quick access to all features</DrawerDescription>
                    </div>
                    <DrawerClose asChild>
                      <Button variant='ghost' size='sm' className='h-8 w-8 p-0 rounded-full'>
                        <X className='h-4 w-4' />
                      </Button>
                    </DrawerClose>
                  </div>
                </DrawerHeader>

                <ScrollArea className='flex-1 p-4'>
                  <div className='space-y-6'>
                    {secondaryNavItems.map((section, sectionIdx) => (
                      <div key={section.category}>
                        <h3 className='text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-1'>
                          {section.category}
                        </h3>
                        <div className='space-y-1'>
                          {section.items.map((item) => {
                            const active = isActive(item.href);
                            const Icon = item.icon;

                            return (
                              <button
                                key={item.href}
                                onClick={() => handleNavClick(item.href)}
                                className={cn(
                                  "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200",
                                  "active:scale-[0.98]",
                                  active
                                    ? "bg-primary/10 text-primary"
                                    : "hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300"
                                )}
                              >
                                {/* Circle icon */}
                                <div
                                  className={cn(
                                    "h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-all",
                                    active
                                      ? "bg-primary text-white shadow-md shadow-primary/30"
                                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                                  )}
                                >
                                  <Icon className='h-4.5 w-4.5' />
                                </div>
                                <span className={cn("flex-1 text-left text-sm", active && "font-semibold")}>{item.title}</span>
                                <ChevronRight
                                  className={cn(
                                    "h-4 w-4 text-slate-400 dark:text-slate-500 transition-transform",
                                    active && "text-primary"
                                  )}
                                />
                              </button>
                            );
                          })}
                        </div>
                        {sectionIdx < secondaryNavItems.length - 1 && <Separator className='mt-4' />}
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Quick Actions Footer */}
                <div className='p-4 border-t bg-slate-50/50 dark:bg-slate-900/50'>
                  <div className='grid grid-cols-2 gap-3'>
                    <Button variant='outline' className='h-12 rounded-xl gap-2' onClick={() => handleNavClick("/merchant/subscription")}>
                      <div className='h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center'>
                        <CreditCard className='h-3.5 w-3.5 text-primary' />
                      </div>
                      <span className='text-xs'>Subscription</span>
                    </Button>
                    <Button variant='outline' className='h-12 rounded-xl gap-2' onClick={() => handleNavClick("/merchant/ai-assistant")}>
                      <div className='h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center'>
                        <Sparkles className='h-3.5 w-3.5 text-primary' />
                      </div>
                      <span className='text-xs'>AI Assistant</span>
                    </Button>
                  </div>
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        </div>
      </nav>
    </>
  );
}

export default MobileBottomNav;

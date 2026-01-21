"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Home,
  Settings,
  Palette,
  FileText,
  FolderTree,
  Image,
  Megaphone,
  ChevronRight,
  BarChart3,
  User,
  LogOut,
  MoreVertical,
  Warehouse,
  CreditCard,
  Coins,
  Users,
  Rocket,
  Globe,
  Truck,
  ShieldAlert,
  Tag,
  TrendingUp,
  Gift,
  HelpCircle,
  Mail,
  ServerCog,
  Phone,
  MapPin,
  Bot,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Logo } from "@/components/site/Logo";
import CloudImage from "@/components/site/CloudImage";
import { apiRequest } from "@/lib/api-client";
import type { BrandConfig } from "@/lib/brand-config";
import type { CurrentUser } from "@/lib/auth";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface AdminSidebarProps {
  brandConfig: BrandConfig;
}

const storeMenuItems = [
  { title: "Dashboard", url: "/tenant", icon: LayoutDashboard },
];

const salesMenuItems = [
  { title: "Orders", url: "/tenant/orders", icon: ShoppingBag },
  { title: "Customers", url: "/tenant/customers", icon: Users },
];

const financeMenuItems = [
  { title: "Payment History", url: "/tenant/payments", icon: CreditCard },
  {
    title: "Currency & Symbols",
    url: "/tenant/payments/currency",
    icon: Coins,
  },
  { title: "Payment Gateway", url: "/tenant/payment-config", icon: Settings },
];

const financeStandaloneItems = [
  { title: "Investments", url: "/tenant/investments", icon: TrendingUp },
];

const productMenuItems = [
  { title: "Products", url: "/tenant/products", icon: Package },
  {
    title: "Categories",
    url: "/tenant/products/categories",
    icon: FolderTree,
  },
  { title: "Inventory", url: "/tenant/inventory", icon: Warehouse },
];

const marketingMenuItems = [
  { title: "Coupons", url: "/tenant/coupons", icon: Tag },
  { title: "Affiliates", url: "/tenant/affiliates", icon: Gift },
  { title: "Ads & Tracking", url: "/tenant/ads-config", icon: Megaphone },
];

const analyticsMenuItems = [
  { title: "Statistics", url: "/tenant/statistics", icon: BarChart3 },
  { title: "AI Assistant", url: "/tenant/ai-assistant", icon: Bot },
  { title: "Fraud Check", url: "/tenant/fraud-check", icon: ShieldAlert },
  { title: "IP Analytics", url: "/tenant/ip-analytics", icon: MapPin },
];

const emailMenuItems = [
  { title: "Email Templates", url: "/tenant/email-templates", icon: Mail },
  { title: "Email Settings", url: "/tenant/email-settings", icon: ServerCog },
];

const brandMenuItems = [
  { title: "Brand Settings", url: "/tenant/brand", icon: Palette },
  { title: "Footer Pages", url: "/tenant/pages", icon: FileText },
];

const brandSettingsMenuItems = [
  { title: "Identity", url: "/tenant/brand/identity", icon: Palette },
  { title: "Logo", url: "/tenant/brand/logo", icon: Image },
  { title: "SEO", url: "/tenant/brand/seo", icon: BarChart3 },
  { title: "Contact", url: "/tenant/brand/contact", icon: Phone },
  { title: "Social", url: "/tenant/brand/social", icon: Globe },
  { title: "Theme", url: "/tenant/brand/theme", icon: Settings },
  { title: "Hero Slides", url: "/tenant/brand/hero-slides", icon: Image },
  {
    title: "Promotional Banner",
    url: "/tenant/brand/banner",
    icon: Megaphone,
  },
];

const accountMenuItems = [
  { title: "Subscription", url: "/tenant/subscription", icon: CreditCard },
  { title: "Custom Domain", url: "/tenant/domain", icon: Globe },
];

const configMenuItems = [
  {
    title: "OAuth Configuration",
    url: "/tenant/oauth-config",
    icon: Settings,
  },
  { title: "Delivery Support", url: "/tenant/delivery-support", icon: Truck },
];

const supportMenuItems = [
  {
    title: "Feature Request",
    url: "/support/feature-request",
    icon: HelpCircle,
  },
];

export function AdminSidebar({ brandConfig }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user: userProfile, logout } = useAuth();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout");
    }
  };

  return (
    <Sidebar
      collapsible="icon"
      className="**:data-[sidebar=sidebar]:bg-linear-to-b! from-slate-50/50 to-white dark:from-slate-950 dark:to-slate-900 border-r-2 border-slate-200/50 dark:border-slate-800/50"
    >
      <SidebarHeader className="h-16 border-b-2 border-slate-200/50 dark:border-slate-800/50 bg-linear-to-r from-slate-50/80 to-white dark:from-slate-900/40 dark:to-slate-950/20 flex items-center">
        <div className="px-4 w-full h-full flex items-center justify-between">
          {isCollapsed ? (
            // Collapsed: Show image logo or 5-letter brand name
            <Link
              href="/"
              className="flex items-center justify-center w-full h-full min-w-0"
            >
              {(brandConfig.logo.type === "image" &&
                brandConfig.logo.imagePath) ||
                (brandConfig.logo.type === "text" &&
                  brandConfig.logo.icon?.imagePath) ? (
                <div className="relative h-10 w-10 rounded-md flex items-center justify-center shrink-0">
                  <CloudImage
                    src={
                      brandConfig.logo.type === "image" &&
                        brandConfig.logo.imagePath
                        ? brandConfig.logo.imagePath
                        : brandConfig.logo.icon?.imagePath || ""
                    }
                    alt={
                      brandConfig.logo.altText ||
                      `${brandConfig.brandName} Logo`
                    }
                    fill
                    className="object-contain rounded-sm"
                  />
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-xs shrink-0 min-w-10">
                  {brandConfig.brandName?.slice(0, 5).toUpperCase() || "STORE"}
                </div>
              )}
            </Link>
          ) : (
            // Expanded: Show full logo with toggle button on mobile
            <>
              <Logo
                brandConfig={brandConfig}
                href="/"
                className="h-8 flex-1"
                showTagline={false}
              />
            </>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-white gap-0">
        {/* Overview */}
        <SidebarGroup className="px-2 py-1">
          {!isCollapsed && (
            <SidebarGroupLabel className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 px-3">
              Overview
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {storeMenuItems.map((item) => {
                const isActive = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className="h-10 w-full px-2.5 md:px-4 rounded-[5px] font-semibold transition-all duration-300 group relative overflow-hidden data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:dark:text-primary hover:bg-accent/50 dark:hover:bg-accent/20"
                    >
                      <Link
                        href={item.url}
                        className="flex items-center gap-3 relative z-10"
                      >
                        <item.icon className="w-5 h-5 transition-transform duration-300 data-[active=true]:scale-110 shrink-0" />
                        <span className="relative group-data-[collapsible=icon]:hidden">
                          {item.title}
                        </span>
                        {isActive && (
                          <div
                            className="absolute inset-0 bg-primary/5 rounded-[5px] animate-pulse"
                            style={{ animationDuration: "2s" }}
                          />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Sales & Customers */}
        <SidebarGroup className="px-2 py-1">
          {!isCollapsed && (
            <SidebarGroupLabel className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 px-3">
              Sales & Customers
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {/* Orders with Sub-items */}
              {isCollapsed ? (
                // Collapsed: Show sub-items as flat menu items
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === "/tenant/orders"}
                      tooltip="All Orders"
                      className="font-semibold h-10 w-full px-2.5 md:px-4 rounded-[5px] transition-all duration-300 group relative overflow-hidden data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:dark:text-primary hover:bg-accent/50 dark:hover:bg-accent/20"
                    >
                      <Link
                        href="/tenant/orders"
                        className="flex items-center gap-3 relative z-10"
                      >
                        <ShoppingBag className="w-5 h-5 transition-transform duration-300 data-[active=true]:scale-110 shrink-0" />
                        <span className="relative group-data-[collapsible=icon]:hidden">
                          All Orders
                        </span>
                        {pathname === "/tenant/orders" && (
                          <div
                            className="absolute inset-0 bg-primary/5 rounded-[5px] animate-pulse"
                            style={{ animationDuration: "2s" }}
                          />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === "/tenant/orders/categories"}
                      tooltip="Category Statistics"
                      className="font-semibold h-10 w-full px-2.5 md:px-4 rounded-[5px] transition-all duration-300 group relative overflow-hidden data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:dark:text-primary hover:bg-accent/50 dark:hover:bg-accent/20"
                    >
                      <Link
                        href="/tenant/orders/categories"
                        className="flex items-center gap-3 relative z-10"
                      >
                        <BarChart3 className="w-5 h-5 transition-transform duration-300 data-[active=true]:scale-110 shrink-0" />
                        <span className="relative group-data-[collapsible=icon]:hidden">
                          Category Statistics
                        </span>
                        {pathname === "/tenant/orders/categories" && (
                          <div
                            className="absolute inset-0 bg-primary/5 rounded-[5px] animate-pulse"
                            style={{ animationDuration: "2s" }}
                          />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              ) : (
                // Expanded: Show collapsible menu
                <Collapsible
                  asChild
                  defaultOpen={pathname?.startsWith("/tenant/orders")}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        isActive={pathname?.startsWith("/tenant/orders")}
                        tooltip="Orders"
                        className="font-semibold h-10 w-full px-2.5 md:px-4 rounded-[5px] transition-all duration-300 group relative overflow-hidden data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:dark:text-primary hover:bg-accent/50 dark:hover:bg-accent/20"
                      >
                        <ShoppingBag className="w-5 h-5 transition-transform duration-300 data-[active=true]:scale-110 shrink-0" />
                        <span className="relative">Orders</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        {pathname?.startsWith("/tenant/orders") && (
                          <div
                            className="absolute inset-0 bg-primary/5 rounded-[5px] animate-pulse"
                            style={{ animationDuration: "2s" }}
                          />
                        )}
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub className="mt-1 space-y-1">
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathname === "/tenant/orders"}
                            className="h-10 w-full px-2.5 md:px-4 rounded-[5px] font-medium transition-all duration-300 group relative overflow-hidden data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:dark:text-primary hover:bg-accent/50 dark:hover:bg-accent/20"
                          >
                            <Link
                              href="/tenant/orders"
                              className="flex items-center gap-3 relative z-10"
                            >
                              <ShoppingBag className="w-4 h-4 transition-transform duration-300 data-[active=true]:scale-110 shrink-0" />
                              <span className="relative">All Orders</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            asChild
                            isActive={
                              pathname === "/tenant/orders/categories"
                            }
                            className="h-10 w-full px-2.5 md:px-4 rounded-[5px] font-medium transition-all duration-300 group relative overflow-hidden data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:dark:text-primary hover:bg-accent/50 dark:hover:bg-accent/20"
                          >
                            <Link
                              href="/tenant/orders/categories"
                              className="flex items-center gap-3 relative z-10"
                            >
                              <BarChart3 className="w-4 h-4 transition-transform duration-300 data-[active=true]:scale-110 shrink-0" />
                              <span className="relative">
                                Category Statistics
                              </span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )}

              {/* Customers */}
              {salesMenuItems.slice(1).map((item) => {
                const isActive =
                  pathname === item.url || pathname?.startsWith(item.url + "/");
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className="h-10 w-full px-2.5 md:px-4 rounded-[5px] font-semibold transition-all duration-300 group relative overflow-hidden data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:dark:text-primary hover:bg-accent/50 dark:hover:bg-accent/20"
                    >
                      <Link
                        href={item.url}
                        className="flex items-center gap-3 relative z-10"
                      >
                        <item.icon className="w-5 h-5 transition-transform duration-300 data-[active=true]:scale-110 shrink-0" />
                        <span className="relative group-data-[collapsible=icon]:hidden">
                          {item.title}
                        </span>
                        {isActive && (
                          <div
                            className="absolute inset-0 bg-primary/5 rounded-[5px] animate-pulse"
                            style={{ animationDuration: "2s" }}
                          />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Finance */}
        <SidebarGroup className="px-2 py-1">
          {!isCollapsed && (
            <SidebarGroupLabel className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 px-3">
              Finance
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {isCollapsed ? (
                // Collapsed: Show sub-items as flat menu items
                <>
                  {financeMenuItems.map((item) => {
                    const isActive =
                      pathname === item.url ||
                      pathname?.startsWith(`${item.url}/`);
                    return (
                      <SidebarMenuItem key={item.url}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={item.title}
                          className="font-semibold h-10 w-full px-2.5 md:px-4 rounded-[5px] transition-all duration-300 group relative overflow-hidden data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:dark:text-primary hover:bg-accent/50 dark:hover:bg-accent/20"
                        >
                          <Link
                            href={item.url}
                            className="flex items-center gap-3 relative z-10"
                          >
                            <item.icon className="w-5 h-5 transition-transform duration-300 data-[active=true]:scale-110 shrink-0" />
                            <span className="relative group-data-[collapsible=icon]:hidden">
                              {item.title}
                            </span>
                            {isActive && (
                              <div
                                className="absolute inset-0 bg-primary/5 rounded-[5px] animate-pulse"
                                style={{ animationDuration: "2s" }}
                              />
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </>
              ) : (
                // Expanded: Show collapsible menu
                <Collapsible
                  asChild
                  defaultOpen={
                    pathname?.startsWith("/tenant/payments") ||
                    pathname?.startsWith("/tenant/payment-config")
                  }
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        isActive={
                          pathname?.startsWith("/tenant/payments") ||
                          pathname?.startsWith("/tenant/payment-config") ||
                          pathname === "/tenant/payment-config"
                        }
                        tooltip="Payments"
                        className="font-semibold h-10 w-full px-2.5 md:px-4 rounded-[5px] transition-all duration-300 group relative overflow-hidden data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:dark:text-primary hover:bg-accent/50 dark:hover:bg-accent/20"
                      >
                        <CreditCard className="w-5 h-5 transition-transform duration-300 data-[active=true]:scale-110 shrink-0" />
                        <span className="relative">Payments</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        {(pathname?.startsWith("/tenant/payments") ||
                          pathname?.startsWith("/tenant/payment-config")) && (
                            <div
                              className="absolute inset-0 bg-primary/5 rounded-[5px] animate-pulse"
                              style={{ animationDuration: "2s" }}
                            />
                          )}
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub className="mt-1 space-y-1">
                        {financeMenuItems.map((item) => {
                          const isActive =
                            pathname === item.url ||
                            pathname?.startsWith(`${item.url}/`);
                          return (
                            <SidebarMenuSubItem key={item.url}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={isActive}
                                className="h-10 w-full px-2.5 md:px-4 rounded-[5px] font-medium transition-all duration-300 group relative overflow-hidden data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:dark:text-primary hover:bg-accent/50 dark:hover:bg-accent/20"
                              >
                                <Link
                                  href={item.url}
                                  className="flex items-center gap-3 relative z-10"
                                >
                                  <item.icon className="w-4 h-4 transition-transform duration-300 data-[active=true]:scale-110 shrink-0" />
                                  <span className="relative">{item.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )}

              {financeStandaloneItems.map((item) => {
                const isActive =
                  pathname === item.url || pathname?.startsWith(item.url + "/");
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className="h-10 w-full px-2.5 md:px-4 rounded-[5px] font-semibold transition-all duration-300 group relative overflow-hidden data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:dark:text-primary hover:bg-accent/50 dark:hover:bg-accent/20"
                    >
                      <Link
                        href={item.url}
                        className="flex items-center gap-3 relative z-10"
                      >
                        <item.icon className="w-5 h-5 transition-transform duration-300 data-[active=true]:scale-110 shrink-0" />
                        <span className="relative group-data-[collapsible=icon]:hidden">
                          {item.title}
                        </span>
                        {isActive && (
                          <div
                            className="absolute inset-0 bg-primary/5 rounded-[5px] animate-pulse"
                            style={{ animationDuration: "2s" }}
                          />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Products & Inventory */}
        <SidebarGroup className="px-2 py-1">
          {!isCollapsed && (
            <SidebarGroupLabel className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 px-3">
              Products & Inventory
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {productMenuItems.map((item) => {
                let isActive = false;
                if (item.url === "/tenant/products") {
                  isActive =
                    pathname === item.url ||
                    (pathname?.startsWith("/tenant/products/") &&
                      !pathname?.startsWith("/tenant/products/categories"));
                } else if (item.url === "/tenant/products/categories") {
                  isActive =
                    pathname === item.url ||
                    pathname?.startsWith("/tenant/products/categories");
                } else {
                  isActive =
                    pathname === item.url ||
                    pathname?.startsWith(item.url + "/");
                }

                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className="h-10 w-full px-2.5 md:px-4 rounded-[5px] font-semibold transition-all duration-300 group relative overflow-hidden data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:dark:text-primary hover:bg-accent/50 dark:hover:bg-accent/20"
                    >
                      <Link
                        href={item.url}
                        className="flex items-center gap-3 relative z-10"
                      >
                        <item.icon className="w-5 h-5 transition-transform duration-300 data-[active=true]:scale-110 shrink-0" />
                        <span className="relative group-data-[collapsible=icon]:hidden">
                          {item.title}
                        </span>
                        {isActive && (
                          <div
                            className="absolute inset-0 bg-primary/5 rounded-[5px] animate-pulse"
                            style={{ animationDuration: "2s" }}
                          />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Marketing & Growth */}
        <SidebarGroup className="px-2 py-1">
          {!isCollapsed && (
            <SidebarGroupLabel className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 px-3">
              Marketing & Growth
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {marketingMenuItems.map((item) => {
                const isActive =
                  pathname === item.url || pathname?.startsWith(item.url + "/");
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className="h-10 w-full px-2.5 md:px-4 rounded-[5px] font-semibold transition-all duration-300 group relative overflow-hidden data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:dark:text-primary hover:bg-accent/50 dark:hover:bg-accent/20"
                    >
                      <Link
                        href={item.url}
                        className="flex items-center gap-3 relative z-10"
                      >
                        <item.icon className="w-5 h-5 transition-transform duration-300 data-[active=true]:scale-110 shrink-0" />
                        <span className="relative group-data-[collapsible=icon]:hidden">
                          {item.title}
                        </span>
                        {isActive && (
                          <div
                            className="absolute inset-0 bg-primary/5 rounded-[5px] animate-pulse"
                            style={{ animationDuration: "2s" }}
                          />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Analytics & Risk */}
        <SidebarGroup className="px-2 py-1">
          {!isCollapsed && (
            <SidebarGroupLabel className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 px-3">
              Analytics & Risk
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {analyticsMenuItems.map((item) => {
                const isActive =
                  pathname === item.url || pathname?.startsWith(item.url + "/");
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className="h-10 w-full px-2.5 md:px-4 rounded-[5px] font-semibold transition-all duration-300 group relative overflow-hidden data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:dark:text-primary hover:bg-accent/50 dark:hover:bg-accent/20"
                    >
                      <Link
                        href={item.url}
                        className="flex items-center gap-3 relative z-10"
                      >
                        <item.icon className="w-5 h-5 transition-transform duration-300 data-[active=true]:scale-110 shrink-0" />
                        <span className="relative group-data-[collapsible=icon]:hidden">
                          {item.title}
                        </span>
                        {isActive && (
                          <div
                            className="absolute inset-0 bg-primary/5 rounded-[5px] animate-pulse"
                            style={{ animationDuration: "2s" }}
                          />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Email */}
        <SidebarGroup className="px-2 py-1">
          {!isCollapsed && (
            <SidebarGroupLabel className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 px-3">
              Email
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {emailMenuItems.map((item) => {
                const isActive =
                  pathname === item.url || pathname?.startsWith(item.url + "/");
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className="h-10 w-full px-2.5 md:px-4 rounded-[5px] font-semibold transition-all duration-300 group relative overflow-hidden data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:dark:text-primary hover:bg-accent/50 dark:hover:bg-accent/20"
                    >
                      <Link
                        href={item.url}
                        className="flex items-center gap-3 relative z-10"
                      >
                        <item.icon className="w-5 h-5 transition-transform duration-300 data-[active=true]:scale-110 shrink-0" />
                        <span className="relative group-data-[collapsible=icon]:hidden">
                          {item.title}
                        </span>
                        {isActive && (
                          <div
                            className="absolute inset-0 bg-primary/5 rounded-[5px] animate-pulse"
                            style={{ animationDuration: "2s" }}
                          />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Brand & Content */}
        <SidebarGroup className="px-2 py-1">
          {!isCollapsed && (
            <SidebarGroupLabel className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 px-3">
              Brand & Content
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {/* Brand Settings with Sub-items */}
              {isCollapsed ? (
                // Collapsed: Show sub-items as flat menu items
                <>
                  {brandSettingsMenuItems.map((item) => {
                    const isActive =
                      pathname === item.url ||
                      pathname?.startsWith(`${item.url}/`);
                    return (
                      <SidebarMenuItem key={item.url}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={item.title}
                          className="font-semibold h-10 w-full px-2.5 md:px-4 rounded-[5px] transition-all duration-300 group relative overflow-hidden data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:dark:text-primary hover:bg-accent/50 dark:hover:bg-accent/20"
                        >
                          <Link
                            href={item.url}
                            className="flex items-center gap-3 relative z-10"
                          >
                            <item.icon className="w-5 h-5 transition-transform duration-300 data-[active=true]:scale-110 shrink-0" />
                            <span className="relative group-data-[collapsible=icon]:hidden">
                              {item.title}
                            </span>
                            {isActive && (
                              <div
                                className="absolute inset-0 bg-primary/5 rounded-[5px] animate-pulse"
                                style={{ animationDuration: "2s" }}
                              />
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </>
              ) : (
                // Expanded: Show collapsible menu
                <Collapsible
                  asChild
                  defaultOpen={pathname?.startsWith("/tenant/brand")}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        isActive={pathname?.startsWith("/tenant/brand")}
                        tooltip="Brand Settings"
                        className="font-semibold h-10 w-full px-2.5 md:px-4 rounded-[5px] transition-all duration-300 group relative overflow-hidden data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:dark:text-primary hover:bg-accent/50 dark:hover:bg-accent/20"
                      >
                        <Palette className="w-5 h-5 transition-transform duration-300 data-[active=true]:scale-110 shrink-0" />
                        <span className="relative">Brand Settings</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        {pathname?.startsWith("/tenant/brand") && (
                          <div
                            className="absolute inset-0 bg-primary/5 rounded-[5px] animate-pulse"
                            style={{ animationDuration: "2s" }}
                          />
                        )}
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub className="mt-1 space-y-1">
                        {brandSettingsMenuItems.map((item) => {
                          const isActive =
                            pathname === item.url ||
                            pathname?.startsWith(`${item.url}/`);
                          return (
                            <SidebarMenuSubItem key={item.url}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={isActive}
                                className="h-10 w-full px-2.5 md:px-4 rounded-[5px] font-medium transition-all duration-300 group relative overflow-hidden data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:dark:text-primary hover:bg-accent/50 dark:hover:bg-accent/20"
                              >
                                <Link
                                  href={item.url}
                                  className="flex items-center gap-3 relative z-10"
                                >
                                  <item.icon className="w-4 h-4 transition-transform duration-300 data-[active=true]:scale-110 shrink-0" />
                                  <span className="relative">{item.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )}

              {/* Footer Pages */}
              {brandMenuItems.slice(1).map((item) => {
                const isActive =
                  pathname === item.url || pathname?.startsWith(item.url + "/");
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className="h-10 w-full px-2.5 md:px-4 rounded-[5px] font-semibold transition-all duration-300 group relative overflow-hidden data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:dark:text-primary hover:bg-accent/50 dark:hover:bg-accent/20"
                    >
                      <Link
                        href={item.url}
                        className="flex items-center gap-3 relative z-10"
                      >
                        <item.icon className="w-5 h-5 transition-transform duration-300 data-[active=true]:scale-110 shrink-0" />
                        <span className="relative group-data-[collapsible=icon]:hidden">
                          {item.title}
                        </span>
                        {isActive && (
                          <div
                            className="absolute inset-0 bg-primary/5 rounded-[5px] animate-pulse"
                            style={{ animationDuration: "2s" }}
                          />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Account & Domains */}
        <SidebarGroup className="px-2 py-1">
          {!isCollapsed && (
            <SidebarGroupLabel className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 px-3">
              Account & Domains
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {accountMenuItems.map((item) => {
                const isActive =
                  pathname === item.url || pathname?.startsWith(item.url + "/");
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className="h-10 w-full px-2.5 md:px-4 rounded-[5px] font-semibold transition-all duration-300 group relative overflow-hidden data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:dark:text-primary hover:bg-accent/50 dark:hover:bg-accent/20"
                    >
                      <Link
                        href={item.url}
                        className="flex items-center gap-3 relative z-10"
                      >
                        <item.icon className="w-5 h-5 transition-transform duration-300 data-[active=true]:scale-110 shrink-0" />
                        <span className="relative group-data-[collapsible=icon]:hidden">
                          {item.title}
                        </span>
                        {isActive && (
                          <div
                            className="absolute inset-0 bg-primary/5 rounded-[5px] animate-pulse"
                            style={{ animationDuration: "2s" }}
                          />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Settings & Delivery */}
        <SidebarGroup className="px-2 py-1">
          {!isCollapsed && (
            <SidebarGroupLabel className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 px-3">
              Settings & Delivery
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {configMenuItems.map((item) => {
                const isActive =
                  pathname === item.url || pathname?.startsWith(item.url + "/");
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className="h-10 w-full px-2.5 md:px-4 rounded-[5px] font-semibold transition-all duration-300 group relative overflow-hidden data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:dark:text-primary hover:bg-accent/50 dark:hover:bg-accent/20"
                    >
                      <Link
                        href={item.url}
                        className="flex items-center gap-3 relative z-10"
                      >
                        <item.icon className="w-5 h-5 transition-transform duration-300 data-[active=true]:scale-110 shrink-0" />
                        <span className="relative group-data-[collapsible=icon]:hidden">
                          {item.title}
                        </span>
                        {isActive && (
                          <div
                            className="absolute inset-0 bg-primary/5 rounded-[5px] animate-pulse"
                            style={{ animationDuration: "2s" }}
                          />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Support */}
        <SidebarGroup className="px-2 py-1">
          {!isCollapsed && (
            <SidebarGroupLabel className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 px-3">
              Support
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {supportMenuItems.map((item) => {
                const isActive =
                  pathname === item.url || pathname?.startsWith(item.url + "/");
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className="h-10 w-full px-2.5 md:px-4 rounded-[5px] font-semibold transition-all duration-300 group relative overflow-hidden data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:dark:text-primary hover:bg-accent/50 dark:hover:bg-accent/20"
                    >
                      <Link
                        href={item.url}
                        className="flex items-center gap-3 relative z-10"
                      >
                        <item.icon className="w-5 h-5 transition-transform duration-300 data-[active=true]:scale-110 shrink-0" />
                        <span className="relative group-data-[collapsible=icon]:hidden">
                          {item.title}
                        </span>
                        {isActive && (
                          <div
                            className="absolute inset-0 bg-primary/5 rounded-[5px] animate-pulse"
                            style={{ animationDuration: "2s" }}
                          />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Back to Store */}
        <SidebarGroup className="px-2 py-1">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Back to Store"
                  className="h-10 w-full px-2.5 md:px-4 rounded-[5px] font-semibold transition-all duration-200 hover:bg-accent/50 dark:hover:bg-accent/20"
                >
                  <Link href="/" className="flex items-center gap-3">
                    <Home className="w-5 h-5 shrink-0" />
                    <span className="group-data-[collapsible=icon]:hidden">
                      Back to Store
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t-2 border-slate-200/50 dark:border-slate-800/50 bg-linear-to-r from-slate-50/80 to-white dark:from-slate-900/40 dark:to-slate-950/20">
        <SidebarGroup className="px-2 py-1">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                {userProfile ? (
                  <div className="flex items-center gap-2 w-full px-2">
                    <SidebarMenuButton
                      size="lg"
                      className="data-[collapsible=icon]:size-8 flex-1 rounded-[5px]"
                      asChild
                    >
                      <Link href="/account" className="cursor-pointer">
                        <div className="flex aspect-square size-8 items-center justify-center rounded-[5px] bg-primary text-primary-foreground shadow-sm">
                          <User className="size-4" />
                        </div>
                        <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                          <span className="truncate font-bold text-slate-900 dark:text-slate-100">
                            {userProfile.fullName ||
                              userProfile.email?.split("@")[0] ||
                              "User"}
                          </span>
                          <span className="truncate text-xs text-slate-600 dark:text-slate-400 font-medium">
                            {userProfile.email ||
                              userProfile.phone ||
                              userProfile.role ||
                              ""}
                          </span>
                        </div>
                      </Link>
                    </SidebarMenuButton>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex aspect-square size-8 items-center justify-center rounded-[5px] hover:bg-accent text-muted-foreground hover:text-foreground transition-colors outline-hidden">
                          <MoreVertical className="size-4" />
                          <span className="sr-only">More options</span>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        side={isCollapsed ? "right" : "top"}
                        className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                      >
                        {userProfile.role === "tenant" ||
                          userProfile.role === "admin" ? (
                          <DropdownMenuItem asChild>
                            <Link
                              href="/tenant"
                              className="cursor-pointer font-semibold"
                            >
                              <LayoutDashboard className="w-4 h-4" />
                              <span>Dashboard</span>
                            </Link>
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuItem asChild>
                          <Link
                            href="/account"
                            className="cursor-pointer font-semibold"
                          >
                            <User className="w-4 h-4" />
                            <span>My Account</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={handleLogout}
                          variant="destructive"
                          className="cursor-pointer font-semibold"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Logout</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 w-full p-2">
                    <SidebarMenuButton
                      size="lg"
                      className="data-[collapsible=icon]:size-8 flex-1 rounded-[5px]"
                      disabled
                    >
                      <div className="flex aspect-square size-8 items-center justify-center rounded-[5px] bg-muted text-muted-foreground">
                        <User className="size-4" />
                      </div>
                      <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                        <span className="truncate font-bold text-slate-900 dark:text-slate-100">
                          Admin Panel
                        </span>
                        <span className="truncate text-xs text-slate-600 dark:text-slate-400 font-medium">
                          Loading...
                        </span>
                      </div>
                    </SidebarMenuButton>
                    <button
                      className="flex aspect-square size-8 items-center justify-center rounded-[5px] hover:bg-accent text-muted-foreground transition-colors outline-hidden opacity-50"
                      disabled
                    >
                      <MoreVertical className="size-4" />
                      <span className="sr-only">More options</span>
                    </button>
                  </div>
                )}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
}

"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Menu,
  Package,
  ShoppingCart,
  Users,
  Settings,
  X,
  Store,
  ChevronLeft,
  BarChart3,
  Palette,
  FileText,
  Gift,
  Truck,
  CreditCard,
  Mail,
  Globe,
  Bell,
  Shield,
  TrendingUp,
  Box,
  Tag,
  Image as ImageIcon,
  Code,
  Zap,
  Phone,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";
import { useStore, useStorePermission } from "@/contexts/StoreContext";
import { useAuth } from "@/contexts/AuthContext";
import type { StaffPermission } from "@/contexts/StoreContext";
import { StoreSwitcher, CompactStoreSwitcher } from "@/components/ui/store-switcher";

/**
 * Navigation item for store admin
 */
interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  description?: string;
  permission?: StaffPermission; // Minimum permission required (null = owner only)
  badge?: string | number;
}

/**
 * Navigation groups for store admin
 */
const NAV_GROUPS: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "Overview",
    items: [
      {
        title: "Dashboard",
        href: "dashboard",
        icon: LayoutDashboard,
        description: "Store overview and analytics",
      },
      {
        title: "Statistics",
        href: "statistics",
        icon: BarChart3,
        description: "Detailed analytics",
      },
      {
        title: "Profit Analysis",
        href: "profit-analysis",
        icon: TrendingUp,
        description: "Revenue and profit insights",
      },
    ],
  },
  {
    label: "Products",
    items: [
      {
        title: "Products",
        href: "products",
        icon: Package,
        description: "Manage products",
      },
      {
        title: "Inventory",
        href: "inventory",
        icon: Box,
        description: "Stock management",
        permission: "EDIT",
      },
      {
        title: "Categories",
        href: "categories",
        icon: Tag,
        description: "Product categories",
      },
    ],
  },
  {
    label: "Orders",
    items: [
      {
        title: "Orders",
        href: "orders",
        icon: ShoppingCart,
        description: "Manage orders",
      },
      {
        title: "Payments",
        href: "payments",
        icon: CreditCard,
        description: "Payment transactions",
        permission: "EDIT",
      },
    ],
  },
  {
    label: "Customers",
    items: [
      {
        title: "Customers",
        href: "customers",
        icon: Users,
        description: "Customer management",
      },
      {
        title: "Affiliates",
        href: "affiliates",
        icon: Gift,
        description: "Affiliate program",
        permission: "EDIT",
      },
    ],
  },
  {
    label: "Marketing",
    items: [
      {
        title: "Coupons",
        href: "coupons",
        icon: Tag,
        description: "Discount codes",
        permission: "EDIT",
      },
      {
        title: "Pages",
        href: "pages",
        icon: FileText,
        description: "Content pages",
        permission: "EDIT",
      },
    ],
  },
  {
    label: "Settings",
    items: [
      {
        title: "Brand",
        href: "brand",
        icon: ImageIcon,
        description: "Branding & identity",
        permission: "FULL",
      },
      {
        title: "Identity",
        href: "brand/identity",
        icon: Palette,
        description: "Name & tagline",
        permission: "FULL",
      },
      {
        title: "Logo",
        href: "brand/logo",
        icon: ImageIcon,
        description: "Logo & icons",
        permission: "FULL",
      },
      {
        title: "SEO",
        href: "brand/seo",
        icon: Globe,
        description: "Search engine settings",
        permission: "FULL",
      },
      {
        title: "Contact",
        href: "brand/contact",
        icon: Phone,
        description: "Store contact info",
        permission: "FULL",
      },
      {
        title: "Social",
        href: "brand/social",
        icon: Share2,
        description: "Social media links",
        permission: "FULL",
      },
      {
        title: "Theme",
        href: "brand/theme",
        icon: Palette,
        description: "Colors & styles",
        permission: "FULL",
      },
      {
        title: "Hero Slides",
        href: "brand/hero-slides",
        icon: ImageIcon,
        description: "Homepage banners",
        permission: "FULL",
      },
      {
        title: "Domain",
        href: "domain",
        icon: Globe,
        description: "Domain configuration",
        permission: "FULL",
      },
      {
        title: "Payment",
        href: "payment-config",
        icon: CreditCard,
        description: "Payment settings",
        permission: "FULL",
      },
      {
        title: "Email",
        href: "email-settings",
        icon: Mail,
        description: "Email configuration",
        permission: "FULL",
      },
      {
        title: "Email Templates",
        href: "email-templates",
        icon: Mail,
        description: "Email templates",
        permission: "EDIT",
      },
      {
        title: "OAuth",
        href: "oauth-config",
        icon: Shield,
        description: "Social login",
        permission: "FULL",
      },
      {
        title: "Ads",
        href: "ads-config",
        icon: Zap,
        description: "Advertising settings",
        permission: "FULL",
      },
    ],
  },
  {
    label: "Advanced",
    items: [
      {
        title: "Delivery Support",
        href: "delivery-support",
        icon: Truck,
        description: "Courier services",
        permission: "EDIT",
      },
      {
        title: "Notifications",
        href: "notifications",
        icon: Bell,
        description: "Notification settings",
        permission: "EDIT",
      },
      {
        title: "IP Analytics",
        href: "ip-analytics",
        icon: BarChart3,
        description: "IP tracking",
        permission: "VIEW",
      },
      {
        title: "Fraud Check",
        href: "fraud-check",
        icon: Shield,
        description: "Fraud detection",
        permission: "EDIT",
      },
      {
        title: "Investments",
        href: "investments",
        icon: TrendingUp,
        description: "Investment tracking",
        permission: "EDIT",
      },
      {
        title: "AI Assistant",
        href: "ai-assistant",
        icon: Zap,
        description: "AI tools",
        permission: "EDIT",
      },
      {
        title: "Subscription",
        href: "subscription",
        icon: CreditCard,
        description: "Subscription management",
        permission: "FULL",
      },
    ],
  },
];

const ALL_NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

/**
 * Check if path is active
 */
function isActive(pathname: string, storeId: string, target: string): boolean {
  const storePath = `/owner/stores/${storeId}`;
  const fullTarget = `${storePath}/${target}`;
  return pathname === fullTarget || pathname.startsWith(`${fullTarget}/`);
}

/**
 * Check if user has permission for a nav item
 */
function hasPermissionForItem(
  permission: StaffPermission | null,
  item: NavItem
): boolean {
  // Owner has access to everything
  if (permission === null) return true;

  // No permission required
  if (!item.permission) return true;

  // Check permission level
  const permissionLevels: Record<StaffPermission, number> = {
    VIEW: 1,
    EDIT: 2,
    FULL: 3,
  };

  const userLevel = permissionLevels[permission] || 0;
  const requiredLevel = permissionLevels[item.permission] || 0;

  return userLevel >= requiredLevel;
}

/**
 * Build breadcrumbs
 */
interface Breadcrumb {
  href: string;
  label: string;
}

function buildBreadcrumbs(
  pathname: string,
  storeId: string,
  storeName: string
): Breadcrumb[] {
  const storePath = `/owner/stores/${storeId}`;
  const crumbs: Breadcrumb[] = [
    { href: "/owner", label: "Stores" },
    { href: storePath, label: storeName },
  ];

  const segments = pathname
    .replace(storePath, "")
    .split("/")
    .filter(Boolean);

  segments.forEach((segment, index) => {
    const href = `${storePath}/${segments.slice(0, index + 1).join("/")}`;
    const navItem = ALL_NAV_ITEMS.find((item) =>
      href.endsWith(`/${item.href}`)
    );
    const label =
      navItem?.title ??
      segment
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

    crumbs.push({ href, label });
  });

  return crumbs;
}

interface StoreAdminShellProps {
  children: React.ReactNode;
  storeId: string;
}

/**
 * Store Admin Shell Component
 * Provides navigation and layout for individual store management
 * Uses static theme (no tenant branding)
 */
export function StoreAdminShell({
  children,
  storeId,
}: StoreAdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentStore, switchStore, accessibleStores } = useStore();
  const { logout, user } = useAuth();
  const permission = useStorePermission();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Verify current store matches
  const store = currentStore?.id === storeId ? currentStore : null;

  // Filter nav items based on permission
  const filteredNavGroups = useMemo(() => {
    return NAV_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        hasPermissionForItem(permission, item)
      ),
    })).filter((group) => group.items.length > 0);
  }, [permission]);

  const activeItem = useMemo(
    () =>
      ALL_NAV_ITEMS.find((item) =>
        isActive(pathname || "", storeId, item.href)
      ),
    [pathname, storeId]
  );

  const breadcrumbs = useMemo(
    () =>
      buildBreadcrumbs(
        pathname || "",
        storeId,
        store?.name || "Store"
      ),
    [pathname, storeId, store?.name]
  );

  // Redirect if no access
  useEffect(() => {
    if (!store && accessibleStores.length > 0) {
      // User doesn't have access to this store, redirect to first accessible
      router.push(`/owner/stores/${accessibleStores[0].id}/dashboard`);
    }
  }, [store, accessibleStores, router]);

  if (!store) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading store...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="flex min-h-screen">
        {/* Mobile overlay */}
        {mobileNavOpen ? (
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            aria-hidden="true"
            onClick={() => setMobileNavOpen(false)}
          />
        ) : null}

        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-64 border-r bg-background transition-transform duration-200 ease-out",
            mobileNavOpen
              ? "translate-x-0 shadow-xl"
              : "-translate-x-full lg:translate-x-0"
          )}
        >
          {/* Header */}
          <div className="flex h-16 items-center justify-between border-b px-6">
            <Link
              href="/owner/stores"
              className="text-lg font-semibold tracking-tight"
            >
              FrameX Admin
            </Link>
            <Button
              size="icon"
              variant="ghost"
              className="lg:hidden"
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Store Info */}
          <div className="border-b px-4 py-3">
            <Link
              href="/owner/stores"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-2"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back to Stores</span>
            </Link>

            {/* Store Switcher - shows when multiple stores */}
            {accessibleStores.length > 1 ? (
              <StoreSwitcher
                stores={accessibleStores}
                currentStoreId={storeId}
                showCreateButton={false}
              />
            ) : (
              <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2">
                <Store className="h-4 w-4 text-primary" />
                <div className="flex-1 truncate">
                  <p className="font-medium text-sm truncate">{store.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {store.slug ? `${store.slug}.framextech.com` : "No domain"}
                  </p>
                </div>
              </div>
            )}

            {permission && (
              <div className="mt-2">
                <span className="text-xs text-muted-foreground">
                  Permission:{" "}
                  <span className="font-medium capitalize">{permission}</span>
                </span>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex h-[calc(100vh-12rem)] flex-col overflow-y-auto px-4 py-6">
            <nav className="space-y-8">
              {filteredNavGroups.map((group) => (
                <div key={group.label} className="space-y-2">
                  <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                    {group.label}
                  </h3>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(pathname || "", storeId, item.href);
                      const href = `/owner/stores/${storeId}/${item.href}`;

                      return (
                        <Link
                          key={item.href}
                          href={href}
                          className={cn(
                            "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                            active
                              ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                              : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
                          )}
                          onClick={() => setMobileNavOpen(false)}
                        >
                          <Icon
                            className={cn(
                              "h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
                              active
                                ? "text-primary-foreground"
                                : "text-muted-foreground group-hover:text-primary"
                            )}
                          />
                          <div className="flex flex-col flex-1">
                            <span className="leading-none">{item.title}</span>
                            {item.description && (
                              <span
                                className={cn(
                                  "mt-0.5 text-xs leading-none",
                                  active
                                    ? "text-primary-foreground/70"
                                    : "text-muted-foreground"
                                )}
                              >
                                {item.description}
                              </span>
                            )}
                          </div>
                          {item.badge && (
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-xs font-medium",
                                active
                                  ? "bg-primary-foreground/20 text-primary-foreground"
                                  : "bg-muted text-muted-foreground"
                              )}
                            >
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex flex-1 flex-col lg:pl-64">
          {/* Header */}
          <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
            <div className="flex h-16 items-center justify-between px-4 sm:px-6">
              <div className="flex items-center gap-3">
                <Button
                  size="icon"
                  variant="ghost"
                  className="lg:hidden"
                  onClick={() => setMobileNavOpen(true)}
                  aria-label="Open navigation"
                >
                  <Menu className="h-5 w-5" />
                </Button>

                <div className="flex flex-col">
                  <nav className="hidden items-center gap-2 text-sm text-muted-foreground md:flex">
                    {breadcrumbs.map((crumb, index) => (
                      <div key={crumb.href} className="flex items-center gap-2">
                        {index > 0 ? (
                          <span className="text-muted-foreground/70">/</span>
                        ) : null}
                        {index === breadcrumbs.length - 1 ? (
                          <span className="font-medium text-foreground">
                            {crumb.label}
                          </span>
                        ) : (
                          <Link
                            href={crumb.href}
                            className="transition-colors hover:text-foreground hover:underline"
                          >
                            {crumb.label}
                          </Link>
                        )}
                      </div>
                    ))}
                  </nav>
                  <div className="text-lg font-semibold leading-tight">
                    {activeItem?.title ?? "Dashboard"}
                  </div>
                  {activeItem?.description ? (
                    <p className="hidden text-xs text-muted-foreground sm:block">
                      {activeItem.description}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Compact store switcher for header - only on larger screens */}
                <div className="hidden lg:block">
                  <CompactStoreSwitcher
                    stores={accessibleStores}
                    currentStoreId={storeId}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  Logout
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1">
            <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

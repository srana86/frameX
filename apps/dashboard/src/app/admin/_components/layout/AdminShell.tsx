"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  Beaker,
  CreditCard,
  Database,
  History,
  LayoutDashboard,
  Layers,
  Menu,
  Rocket,
  Server,
  ShieldCheck,
  Users,
  X,
  Settings,
  Receipt,
  Banknote,
  TrendingUp,
  Lightbulb,
  LogOut,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";
import { useAuth } from "@/contexts/AuthContext";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  description?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Main",
    items: [
      {
        title: "Overview",
        href: "/admin",
        icon: LayoutDashboard,
        description: "Operational snapshot",
      },
      {
        title: "Tenants",
        href: "/admin/tenants",
        icon: Users,
        description: "Account management",
      },
    ],
  },
  {
    label: "Infrastructure",
    items: [
      {
        title: "Deployments",
        href: "/admin/deployments",
        icon: Rocket,
        description: "Runtime & domains",
      },
      {
        title: "Database",
        href: "/admin/database",
        icon: Database,
        description: "Tenant storage",
      },
      {
        title: "Simulation",
        href: "/admin/simulate",
        icon: Beaker,
        description: "Provisioning rehearsal",
      },
    ],
  },
  {
    label: "Billing & Revenue",
    items: [
      {
        title: "Subscriptions",
        href: "/admin/subscriptions",
        icon: CreditCard,
        description: "Billing lifecycle",
      },
      {
        title: "Payments",
        href: "/admin/payments",
        icon: Banknote,
        description: "Transactions",
      },
      {
        title: "Invoices",
        href: "/admin/invoices",
        icon: Receipt,
        description: "Billing documents",
      },
      {
        title: "Sales",
        href: "/admin/sales",
        icon: TrendingUp,
        description: "Revenue analytics",
      },
      {
        title: "Plans",
        href: "/admin/plans",
        icon: Layers,
        description: "Pricing & packaging",
      },
    ],
  },
  {
    label: "System & Support",
    items: [
      {
        title: "System Health",
        href: "/admin/system",
        icon: Server,
        description: "Monitor status",
      },
      {
        title: "Fraud Check",
        href: "/admin/fraud-check",
        icon: ShieldCheck,
        description: "Risk intelligence",
      },
      {
        title: "Activity Logs",
        href: "/admin/activity",
        icon: History,
        description: "Audit trail",
      },
      {
        title: "Feature Requests",
        href: "/admin/feature-requests",
        icon: Lightbulb,
        description: "Tenant feedback",
      },
      {
        title: "Settings",
        href: "/admin/settings",
        icon: Settings,
        description: "System config",
      },
    ],
  },
];

const ALL_NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

function isActive(pathname: string, target: string) {
  if (target === "/admin") {
    return pathname === "/admin";
  }
  return pathname === target || pathname.startsWith(`${target}/`);
}

interface Breadcrumb {
  href: string;
  label: string;
}

function buildBreadcrumbs(pathname: string): Breadcrumb[] {
  if (pathname === "/admin") {
    return [{ href: "/admin", label: "Overview" }];
  }

  const segments = pathname.split("/").filter(Boolean);
  const crumbs: Breadcrumb[] = [{ href: "/admin", label: "Overview" }];

  segments.forEach((segment, index) => {
    if (segment === "admin") return;
    const href = `/admin/${segments.slice(1, index + 1).join("/")}`;
    const navItem = ALL_NAV_ITEMS.find((item) => item.href === href);
    const label = navItem?.title ?? segment.replace(/-/g, " ");
    crumbs.push({
      href,
      label: label
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
    });
  });

  return crumbs.filter((crumb, index, array) => index === array.findIndex((item) => item.href === crumb.href));
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user, isLoading } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const activeItem = useMemo(() => ALL_NAV_ITEMS.find((item) => isActive(pathname, item.href)), [pathname]);
  const breadcrumbs = useMemo(() => buildBreadcrumbs(pathname), [pathname]);

  // Role-based access control: only ADMIN and SUPER_ADMIN allowed
  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    const role = user.role?.toUpperCase();
    if (role === "ADMIN" || role === "SUPER_ADMIN" || role === "OWNER") {
      setIsAuthorized(true);
    } else if (role === "TENANT") {
      // Redirect TENANT to store app's tenant panel
      window.location.href = process.env.NEXT_PUBLIC_STORE_URL || "http://localhost:3000/tenant";
    } else {
      // Other roles (CUSTOMER, STAFF) - redirect to store home
      window.location.href = process.env.NEXT_PUBLIC_STORE_URL || "http://localhost:3000";
    }
  }, [user, isLoading, router]);

  // Show loading state while checking authorization
  if (isLoading || !isAuthorized) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-muted/30'>
      <div className='flex min-h-screen'>
        {mobileNavOpen ? (
          <div
            className='fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden'
            aria-hidden='true'
            onClick={() => setMobileNavOpen(false)}
          />
        ) : null}

        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-64 border-r bg-background transition-transform duration-200 ease-out",
            mobileNavOpen ? "translate-x-0 shadow-xl" : "-translate-x-full lg:translate-x-0"
          )}
        >
          <div className='flex h-16 items-center justify-between border-b px-6'>
            <Link href='/admin' className='text-lg font-semibold tracking-tight'>
              FrameX Super Admin
            </Link>
            <Button size='icon' variant='ghost' className='lg:hidden' onClick={() => setMobileNavOpen(false)} aria-label='Close navigation'>
              <X className='h-5 w-5' />
            </Button>
          </div>

          <div className='flex h-[calc(100vh-4rem)] flex-col overflow-y-auto px-4 py-6'>
            <nav className='space-y-8'>
              {NAV_GROUPS.map((group) => (
                <div key={group.label} className='space-y-2'>
                  <h3 className='px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60'>
                    {group.label}
                  </h3>
                  <div className='space-y-1'>
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(pathname, item.href);

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                            active
                              ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                              : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
                          )}
                          onClick={() => setMobileNavOpen(false)}
                        >
                          <Icon className={cn("h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110", active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary")} />
                          <div className='flex flex-col'>
                            <span className="leading-none">{item.title}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div className="mt-8 pt-8 border-t">
              <div className="flex items-center gap-3 px-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                  {user?.email?.charAt(0).toUpperCase() || "A"}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-semibold truncate">{user?.email || "Admin User"}</span>
                  <span className="text-xs text-muted-foreground capitalize">{user?.role || "Super Admin"}</span>
                </div>
              </div>
            </div>

            <div className='mt-8 rounded-xl border-t bg-muted/30 p-4 text-sm'>
              <p className='font-medium text-primary'>Need a rehearsal?</p>
              <p className='mt-1 text-muted-foreground'>Run the simulation flow to validate onboarding before going live.</p>
              <Link href='/admin/simulate' className='mt-3 inline-flex'>
                <Button size='sm' className='w-full'>
                  Launch Simulator
                </Button>
              </Link>
            </div>
          </div>
        </aside>

        <div className='flex flex-1 flex-col lg:pl-64'>
          <header className='sticky top-0 z-30 border-b bg-background/95 backdrop-blur'>
            <div className='flex h-16 items-center justify-between px-4 sm:px-6'>
              <div className='flex items-center gap-3'>
                <Button
                  size='icon'
                  variant='ghost'
                  className='lg:hidden'
                  onClick={() => setMobileNavOpen(true)}
                  aria-label='Open navigation'
                >
                  <Menu className='h-5 w-5' />
                </Button>

                <div className='flex flex-col'>
                  <nav className='hidden items-center gap-2 text-sm text-muted-foreground md:flex'>
                    {breadcrumbs.map((crumb, index) => (
                      <div key={crumb.href} className='flex items-center gap-2'>
                        {index > 0 ? <span className='text-muted-foreground/70'>/</span> : null}
                        {index === breadcrumbs.length - 1 ? (
                          <span className='font-medium text-foreground'>{crumb.label}</span>
                        ) : (
                          <Link href={crumb.href} className='transition-colors hover:text-foreground hover:underline'>
                            {crumb.label}
                          </Link>
                        )}
                      </div>
                    ))}
                  </nav>
                  <div className='text-lg font-semibold leading-tight'>{activeItem?.title ?? "Overview"}</div>
                  {activeItem?.description ? (
                    <p className='hidden text-xs text-muted-foreground sm:block'>{activeItem.description}</p>
                  ) : null}
                </div>
              </div>

              <div className='flex items-center gap-2'>
                <Link href='/admin/simulate' className='hidden sm:inline-flex'>
                  <Button variant='outline' size='sm'>
                    Flow Simulation
                  </Button>
                </Link>
                <Link href='/admin/fraud-check'>
                  <Button size='sm'>Fraud Check</Button>
                </Link>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={logout}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </header>

          <main className='flex-1'>
            <div className='mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}

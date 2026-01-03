"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  description?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Operational snapshot at a glance",
  },
  {
    title: "Merchants",
    href: "/merchants",
    icon: Users,
    description: "Accounts, health, and growth",
  },
  {
    title: "Deployments",
    href: "/deployments",
    icon: Rocket,
    description: "Runtime status and domains",
  },
  {
    title: "Subscriptions",
    href: "/subscriptions",
    icon: CreditCard,
    description: "Billing lifecycle and revenue",
  },
  {
    title: "Payments",
    href: "/payments",
    icon: Banknote,
    description: "Transaction history & revenue",
  },
  {
    title: "Invoices",
    href: "/invoices",
    icon: Receipt,
    description: "Billing documents & statements",
  },
  {
    title: "Sales",
    href: "/sales",
    icon: TrendingUp,
    description: "Revenue tracking & analytics",
  },
  {
    title: "Plans",
    href: "/plans",
    icon: Layers,
    description: "Feature packaging & pricing",
  },
  {
    title: "Database",
    href: "/database",
    icon: Database,
    description: "Tenant storage usage",
  },
  {
    title: "Fraud Check",
    href: "/fraud-check",
    icon: ShieldCheck,
    description: "Courier risk intelligence",
  },
  {
    title: "Flow Simulation",
    href: "/simulate",
    icon: Beaker,
    description: "Provisioning rehearsal",
  },
  {
    title: "System Health",
    href: "/system",
    icon: Server,
    description: "Monitor system status",
  },
  {
    title: "Activity Logs",
    href: "/activity",
    icon: History,
    description: "Track admin actions",
  },
  {
    title: "Feature Requests",
    href: "/feature-requests",
    icon: Lightbulb,
    description: "Merchant-requested features",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    description: "Payment & system config",
  },
];

function isActive(pathname: string, target: string) {
  if (target === "/") {
    return pathname === "/";
  }
  return pathname === target || pathname.startsWith(`${target}/`);
}

interface Breadcrumb {
  href: string;
  label: string;
}

function buildBreadcrumbs(pathname: string): Breadcrumb[] {
  if (pathname === "/") {
    return [{ href: "/", label: "Overview" }];
  }

  const segments = pathname.split("/").filter(Boolean);
  const crumbs: Breadcrumb[] = [{ href: "/", label: "Overview" }];

  segments.forEach((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`;
    const navItem = NAV_ITEMS.find((item) => item.href === href);
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const activeItem = useMemo(() => NAV_ITEMS.find((item) => isActive(pathname, item.href)), [pathname]);
  const breadcrumbs = useMemo(() => buildBreadcrumbs(pathname), [pathname]);

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
            <Link href='/dashboard' className='text-lg font-semibold tracking-tight'>
              FrameX Super Admin
            </Link>
            <Button size='icon' variant='ghost' className='lg:hidden' onClick={() => setMobileNavOpen(false)} aria-label='Close navigation'>
              <X className='h-5 w-5' />
            </Button>
          </div>

          <div className='flex h-[calc(100vh-4rem)] flex-col overflow-y-auto px-3 py-4'>
            <nav className='space-y-1'>
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = isActive(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                    onClick={() => setMobileNavOpen(false)}
                  >
                    <Icon className='h-4 w-4 shrink-0' />
                    <div className='flex flex-col'>
                      <span>{item.title}</span>
                      {item.description ? (
                        <span className='text-xs font-normal text-muted-foreground group-hover:text-foreground/80'>{item.description}</span>
                      ) : null}
                    </div>
                  </Link>
                );
              })}
            </nav>

            <div className='mt-auto rounded-md border border-dashed border-primary/20 bg-primary/5 p-4 text-sm'>
              <p className='font-medium text-primary'>Need a rehearsal?</p>
              <p className='mt-1 text-muted-foreground'>Run the simulation flow to validate onboarding before going live.</p>
              <Link href='/simulate' className='mt-3 inline-flex'>
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
                <Link href='/simulate' className='hidden sm:inline-flex'>
                  <Button variant='outline' size='sm'>
                    Flow Simulation
                  </Button>
                </Link>
                <Link href='/fraud-check'>
                  <Button size='sm'>Fraud Check</Button>
                </Link>
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

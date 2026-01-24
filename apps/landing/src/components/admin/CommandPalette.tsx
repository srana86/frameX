"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  Tag,
  Gift,
  Warehouse,
  ShieldAlert,
  Truck,
  Mail,
  Globe,
  TrendingUp,
  FolderTree,
  Megaphone,
  MapPin,
  FileText,
  Coins,
} from "lucide-react";
import { usePathname } from "next/navigation";

interface CommandItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords?: string[];
  group: string;
}

const commandItems: CommandItem[] = [
  // Overview
  { title: "Dashboard", href: "/merchant", icon: LayoutDashboard, keywords: ["home", "overview"], group: "Overview" },

  // Sales
  { title: "Orders", href: "/merchant/orders", icon: ShoppingBag, keywords: ["order", "sales"], group: "Sales" },
  { title: "Customers", href: "/merchant/customers", icon: Users, keywords: ["customer", "user"], group: "Sales" },

  // Products
  { title: "Products", href: "/merchant/products", icon: Package, keywords: ["product", "item"], group: "Products" },
  { title: "Categories", href: "/merchant/products/categories", icon: FolderTree, keywords: ["category"], group: "Products" },
  { title: "Inventory", href: "/merchant/inventory", icon: Warehouse, keywords: ["stock", "inventory"], group: "Products" },

  // Finance
  { title: "Payment History", href: "/merchant/payments", icon: CreditCard, keywords: ["payment", "transaction"], group: "Finance" },
  { title: "Investments", href: "/merchant/investments", icon: TrendingUp, keywords: ["investment", "profit"], group: "Finance" },
  { title: "Currency", href: "/merchant/payments/currency", icon: Coins, keywords: ["currency", "money"], group: "Finance" },

  // Marketing
  { title: "Coupons", href: "/merchant/coupons", icon: Tag, keywords: ["coupon", "discount"], group: "Marketing" },
  { title: "Affiliates", href: "/merchant/affiliates", icon: Gift, keywords: ["affiliate", "referral"], group: "Marketing" },
  { title: "Ads & Tracking", href: "/merchant/ads-config", icon: Megaphone, keywords: ["ads", "tracking"], group: "Marketing" },

  // Analytics
  { title: "Statistics", href: "/merchant/statistics", icon: BarChart3, keywords: ["stats", "analytics"], group: "Analytics" },
  { title: "Fraud Check", href: "/merchant/fraud-check", icon: ShieldAlert, keywords: ["fraud", "risk"], group: "Analytics" },
  { title: "IP Analytics", href: "/merchant/ip-analytics", icon: MapPin, keywords: ["ip", "location"], group: "Analytics" },

  // Settings
  { title: "Brand Settings", href: "/merchant/brand", icon: Settings, keywords: ["brand", "theme"], group: "Settings" },
  { title: "Email Settings", href: "/merchant/email-settings", icon: Mail, keywords: ["email", "smtp"], group: "Settings" },
  { title: "Domain", href: "/merchant/domain", icon: Globe, keywords: ["domain", "url"], group: "Settings" },
  { title: "Delivery Support", href: "/merchant/delivery-support", icon: Truck, keywords: ["delivery", "courier"], group: "Settings" },
  { title: "Pages", href: "/merchant/pages", icon: FileText, keywords: ["page", "cms"], group: "Settings" },
];

interface CommandPaletteProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CommandPalette({ open: openProp, onOpenChange: onOpenChangeProp }: CommandPaletteProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const open = openProp ?? internalOpen;
  const setOpen = onOpenChangeProp ?? setInternalOpen;

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [setOpen, open]);

  const runCommand = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  // Group items by category
  const groupedItems = commandItems.reduce((acc, item) => {
    if (!acc[item.group]) {
      acc[item.group] = [];
    }
    acc[item.group].push(item);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  return (
    <>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder='Type a command or search...' />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {Object.entries(groupedItems).map(([group, items]) => (
            <CommandGroup key={group} heading={group}>
              {items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== "/merchant" && pathname.startsWith(item.href));
                return (
                  <CommandItem
                    key={item.href}
                    value={`${item.title} ${item.keywords?.join(" ") || ""}`}
                    onSelect={() => runCommand(item.href)}
                    className={isActive ? "bg-primary/10" : ""}
                  >
                    <Icon className='mr-2 h-4 w-4' />
                    <span>{item.title}</span>
                    {isActive && <span className='ml-auto text-xs text-muted-foreground'>Current</span>}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}

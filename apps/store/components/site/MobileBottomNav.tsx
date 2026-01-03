"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Home, Search, ShoppingBag, Heart, Grid3X3 } from "lucide-react";
import { useCart } from "@/components/providers/cart-provider";
import { cn } from "@/lib/utils";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: number;
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { count } = useCart();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Hide on certain pages
  const shouldHide =
    pathname === "/checkout" ||
    pathname.startsWith("/checkout/") ||
    pathname.startsWith("/merchant") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Smart hide on scroll (hide when scrolling down, show when scrolling up)
  useEffect(() => {
    if (shouldHide) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDiff = currentScrollY - lastScrollY;

      // Only hide if scrolled down more than 10px and not at top
      if (scrollDiff > 10 && currentScrollY > 100) {
        setIsVisible(false);
      } else if (scrollDiff < -10 || currentScrollY < 100) {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY, shouldHide]);

  if (shouldHide || !mounted) return null;

  const navItems: NavItem[] = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Grid3X3, label: "Shop", href: "/products" },
    { icon: Search, label: "Search", href: "/products?search=true" },
    { icon: Heart, label: "Wishlist", href: "/wishlist" },
    { icon: ShoppingBag, label: "Cart", href: "/cart", badge: count },
  ];

  const isActive = (href: string) => {
    // Home page exact match
    if (href === "/") return pathname === "/";

    const basePath = href.split("?")[0];
    const hasSearchParam = searchParams.has("search");

    // Check for search page specifically
    if (href.includes("search=true")) {
      return pathname.startsWith("/products") && hasSearchParam;
    }

    // For /products (Shop), only match if it's exactly /products without search query
    if (basePath === "/products") {
      return pathname === "/products" && !hasSearchParam;
    }

    // For other pages, check exact path match first, then startsWith
    if (pathname === basePath) return true;

    // For other paths, use startsWith
    return pathname.startsWith(basePath);
  };

  return (
    <>
      {/* Spacer to prevent content from being hidden behind the nav */}
      <div className='h-[72px] md:hidden' />

      {/* Bottom Navigation */}
      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 md:hidden",
          "transform transition-transform duration-300 ease-out",
          isVisible ? "translate-y-0" : "translate-y-full"
        )}
      >
        {/* Solid background with subtle border */}
        <div className='bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]'>
          {/* Navigation items */}
          <div className='flex items-stretch justify-around' style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
            {navItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex flex-1 flex-col items-center justify-center py-2 px-1",
                    "transition-colors duration-200",
                    "active:bg-gray-100 dark:active:bg-gray-800",
                    active ? "text-primary" : "text-gray-500 dark:text-gray-400"
                  )}
                >
                  {/* Icon container */}
                  <div className='relative flex items-center justify-center h-7'>
                    <Icon
                      className={cn("transition-all duration-200", active ? "w-[22px] h-[22px] stroke-[2px]" : "w-5 h-5 stroke-[1.5px]")}
                    />

                    {/* Badge for cart */}
                    {item.badge !== undefined && item.badge > 0 && (
                      <span
                        className={cn(
                          "absolute -top-0.5 -right-2.5 flex items-center justify-center",
                          "min-w-[16px] h-4 px-1 rounded-full",
                          "bg-red-500 text-white text-[10px] font-bold",
                          "shadow-sm"
                        )}
                      >
                        {item.badge > 99 ? "99+" : item.badge}
                      </span>
                    )}
                  </div>

                  {/* Label */}
                  <span className={cn("text-[10px] mt-0.5 font-medium", active ? "text-primary" : "text-gray-500 dark:text-gray-400")}>
                    {item.label}
                  </span>

                  {/* Active indicator line */}
                  {active && <span className='absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full' />}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}

export default MobileBottomNav;

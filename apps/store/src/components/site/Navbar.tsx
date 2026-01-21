"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  ShoppingCart,
  User,
  Heart,
  LogOut,
  LayoutDashboard,
  Package,
  Home,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/components/providers/cart-provider";
import { useWishlist } from "@/components/providers/wishlist-provider";
import { Logo } from "@/components/site/Logo";
import { SearchDropdown } from "@/components/site/SearchDropdown";
import { NavLinks } from "@/components/site/NavLinks";
import { apiRequest } from "@/lib/api-client";
import type { BrandConfig } from "@/lib/brand-config";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader } from "@/components/ui/sheet";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

interface PromotionalBanner {
  enabled: boolean;
  text: string;
  link?: string;
  linkText?: string;
  backgroundColor?: string;
  textColor?: string;
}

interface NavbarProps {
  brandConfig: BrandConfig;
}

import { signOut, useSession } from "@/lib/auth-client";

// ... other imports

export function Navbar({ brandConfig }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [banner, setBanner] = useState<PromotionalBanner | null>(null);

  // Use BetterAuth session hook
  const { data: sessionData } = useSession();
  const userData = sessionData?.user;

  const isAuthenticated = !!sessionData?.user;
  const userName = userData?.name || userData?.fullName || userData?.email || null;
  const userRole = (userData?.role)?.toLowerCase() || null;

  const { count } = useCart();
  const { items: wishlistItems } = useWishlist();
  const wishlistCount = wishlistItems.length;
  const pathname = usePathname();
  const router = useRouter();

  // Fetch promotional banner
  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const data = await apiRequest<any>("GET", "/promotional-banner");
        if (data?.enabled) {
          setBanner(data);
        }
      } catch (error) {
        // Silently fail - banner is optional
      }
    };
    fetchBanner();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Logged out successfully");
      router.push("/");
      router.refresh();
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setMobileMenuOpen(false);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleMobileLinkClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      {/* Promotional Banner */}
      {banner && banner.enabled && (
        <div
          className="border-b text-center text-sm py-2 px-4"
          style={{
            backgroundColor: banner.backgroundColor || "#f3f4f6",
            color: banner.textColor || "#6b7280",
          }}
        >
          <div className="mx-auto max-w-[1440px] flex items-center justify-center gap-2 flex-wrap">
            <span>{banner.text}</span>
            {banner.link && banner.linkText && (
              <Link
                href={banner.link}
                className="underline font-medium hover:opacity-80 transition-opacity"
              >
                {banner.linkText}
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <div className="mx-auto flex h-14 sm:h-16 max-w-[1440px] items-center justify-between px-3 sm:px-4 md:px-6 lg:px-8 gap-2">
        {/* Logo - Smaller on mobile */}
        <div className="shrink-0 min-w-0">
          <Logo
            brandConfig={brandConfig}
            className="scale-90 sm:scale-100 origin-left"
          />
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          {/* Desktop Search - Right Side */}
          <div className="w-48 lg:w-64">
            <SearchDropdown />
          </div>
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <User className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {userName && (
                  <>
                    <div className="px-2 py-1.5 text-sm font-semibold">
                      {userName}
                    </div>
                    <DropdownMenuSeparator />
                  </>
                )}
                {userRole === "tenant" && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/tenant" className="cursor-pointer">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/account/orders" className="cursor-pointer">
                    <Package className="mr-2 h-4 w-4" />
                    My Orders
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/account" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    My Account
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
              <Link href="/account">
                <User className="w-4 h-4" />
              </Link>
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 relative"
            asChild
          >
            <Link href="/wishlist">
              <Heart className="w-4 h-4" />
              {wishlistCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 min-w-5 rounded-full bg-primary text-white text-xs font-medium px-1.5 flex items-center justify-center">
                  {wishlistCount > 99 ? "99+" : wishlistCount}
                </Badge>
              )}
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 relative group"
            asChild
          >
            <Link href="/cart">
              <ShoppingCart
                className={`w-4 h-4 transition-transform ${count > 0 ? "group-hover:scale-110" : ""}`}
              />
              {count > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 min-w-5 rounded-full bg-primary text-white text-xs font-medium px-1.5 flex items-center justify-center animate-in zoom-in-50 duration-300 shadow-lg">
                  {count > 99 ? "99+" : count}
                </Badge>
              )}
            </Link>
          </Button>
        </div>

        {/* Mobile Actions */}
        <div className="md:hidden flex items-center gap-1.5 flex-1 min-w-0 justify-end">
          <div className="flex-1 max-w-[200px] sm:max-w-60 min-w-0">
            <SearchDropdown />
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle menu"
            onClick={() => setMobileMenuOpen(true)}
            className="h-8 w-8 sm:h-9 sm:w-9 shrink-0"
          >
            <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>
      </div>

      {/* Category Navigation Bar */}
      <NavLinks />

      {/* Mobile Sidebar */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent
          side="left"
          className="w-[85vw] sm:w-[400px] p-0 flex flex-col [&>button]:hidden"
        >
          {/* Header with Logo */}
          <SheetHeader className="px-6 py-5 border-b bg-gradient-to-br from-primary/5 via-background to-background relative">
            <div className="flex items-center justify-between mb-2">
              <Logo brandConfig={brandConfig} className="scale-100" />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
                className="h-8 w-8 rounded-full hover:bg-muted absolute top-4 right-4"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            {brandConfig.brandTagline && (
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mt-1">
                {brandConfig.brandTagline}
              </p>
            )}
          </SheetHeader>

          <div className="flex-1 overflow-y-auto">
            {/* Navigation Links */}
            <div className="px-4 py-3">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-3 h-12 text-base font-medium rounded-lg hover:bg-primary/5 hover:text-primary transition-colors"
                asChild
              >
                <Link href="/" onClick={handleMobileLinkClick}>
                  <Home className="w-5 h-5" />
                  <span>Home</span>
                </Link>
              </Button>
            </div>

            <Separator className="my-1" />

            {/* User Section */}
            {isAuthenticated ? (
              <>
                {userName && (
                  <div className="px-6 py-4 border-b bg-gradient-to-r from-primary/5 to-transparent">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate">
                          {userName}
                        </div>
                        {userRole && (
                          <div className="text-xs text-muted-foreground mt-0.5 capitalize">
                            {userRole}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="px-4 py-3 space-y-1">
                  {userRole === "tenant" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start gap-3 h-12 text-base font-medium rounded-lg hover:bg-primary/5 hover:text-primary transition-colors"
                      asChild
                    >
                      <Link href="/tenant" onClick={handleMobileLinkClick}>
                        <LayoutDashboard className="w-5 h-5" />
                        <span>Dashboard</span>
                      </Link>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-3 h-12 text-base font-medium rounded-lg hover:bg-primary/5 hover:text-primary transition-colors"
                    asChild
                  >
                    <Link
                      href="/account/orders"
                      onClick={handleMobileLinkClick}
                    >
                      <Package className="w-5 h-5" />
                      <span>My Orders</span>
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-3 h-12 text-base font-medium rounded-lg hover:bg-primary/5 hover:text-primary transition-colors"
                    asChild
                  >
                    <Link href="/account" onClick={handleMobileLinkClick}>
                      <User className="w-5 h-5" />
                      <span>My Account</span>
                    </Link>
                  </Button>
                </div>

                <Separator className="my-1" />
              </>
            ) : (
              <div className="px-4 py-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-3 h-12 text-base font-medium rounded-lg hover:bg-primary/5 hover:text-primary transition-colors"
                  asChild
                >
                  <Link href="/account" onClick={handleMobileLinkClick}>
                    <User className="w-5 h-5" />
                    <span>Account</span>
                  </Link>
                </Button>
              </div>
            )}

            {/* Quick Actions */}
            <div className="px-4 py-3 space-y-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-3 h-12 text-base font-medium rounded-lg hover:bg-primary/5 hover:text-primary transition-colors relative group"
                asChild
              >
                <Link href="/wishlist" onClick={handleMobileLinkClick}>
                  <Heart className="w-5 h-5 group-hover:fill-primary group-hover:text-primary transition-colors" />
                  <span>Wishlist</span>
                  {wishlistCount > 0 && (
                    <Badge className="ml-auto h-6 min-w-6 rounded-full bg-primary text-white text-xs font-medium px-2 flex items-center justify-center shadow-sm">
                      {wishlistCount > 99 ? "99+" : wishlistCount}
                    </Badge>
                  )}
                </Link>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-3 h-12 text-base font-medium rounded-lg hover:bg-primary/5 hover:text-primary transition-colors relative group"
                asChild
              >
                <Link href="/cart" onClick={handleMobileLinkClick}>
                  <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>Cart</span>
                  {count > 0 && (
                    <Badge className="ml-auto h-6 min-w-6 rounded-full bg-primary text-white text-xs font-medium px-2 flex items-center justify-center shadow-sm">
                      {count > 99 ? "99+" : count}
                    </Badge>
                  )}
                </Link>
              </Button>
            </div>

            {/* Logout Button */}
            {isAuthenticated && (
              <>
                <Separator className="my-1" />
                <div className="px-4 py-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-3 h-12 text-base font-medium rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                    onClick={() => {
                      handleLogout();
                      handleMobileLinkClick();
                    }}
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                  </Button>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}

export default Navbar;

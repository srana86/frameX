"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ChevronsUpDown, Check, Store, Plus, Settings, X } from "lucide-react";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface StoreItem {
  id: string;
  name: string;
  slug?: string | null;
  status: string;
}

interface StoreSwitcherProps {
  stores: StoreItem[];
  currentStoreId?: string;
  className?: string;
  showCreateButton?: boolean;
}

/**
 * Store Switcher Component
 * Allows quick navigation between stores for owners managing multiple stores
 */
export function StoreSwitcher({
  stores,
  currentStoreId,
  className,
  showCreateButton = true,
}: StoreSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Find current store
  const currentStore = stores.find((s) => s.id === currentStoreId);

  // Filter stores based on search
  const filteredStores = stores.filter((store) =>
    store.name.toLowerCase().includes(search.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get the current sub-path (e.g., /dashboard, /products)
  const getSubPath = () => {
    if (!currentStoreId || !pathname) return "/dashboard";
    const match = pathname.match(/\/owner\/stores\/[^/]+\/(.+)/);
    return match ? `/${match[1]}` : "/dashboard";
  };

  // Switch to a different store
  const switchStore = (storeId: string) => {
    const subPath = getSubPath();
    router.push(`/owner/stores/${storeId}${subPath}`);
    setOpen(false);
    setSearch("");
  };

  // Navigate to create new store
  const createNewStore = () => {
    router.push("/owner/stores/new");
    setOpen(false);
  };

  // Navigate to all stores
  const viewAllStores = () => {
    router.push("/owner/stores");
    setOpen(false);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "ACTIVE":
        return "bg-green-500";
      case "INACTIVE":
        return "bg-gray-400";
      case "SUSPENDED":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        aria-label="Select a store"
        onClick={() => setOpen(!open)}
        className="w-full justify-between"
      >
        <div className="flex items-center gap-2 truncate">
          <Store className="h-4 w-4 shrink-0" />
          <span className="truncate">
            {currentStore?.name || "Select store..."}
          </span>
          {currentStore && (
            <span
              className={cn(
                "h-2 w-2 rounded-full shrink-0",
                getStatusColor(currentStore.status)
              )}
            />
          )}
        </div>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 w-full min-w-[250px] rounded-md border bg-popover shadow-lg">
          {/* Search */}
          <div className="p-2 border-b">
            <Input
              placeholder="Search stores..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8"
              autoFocus
            />
          </div>

          {/* Store List */}
          <div className="max-h-[250px] overflow-y-auto p-1">
            {filteredStores.length === 0 ? (
              <div className="py-4 text-center text-sm text-muted-foreground">
                No stores found.
              </div>
            ) : (
              <div className="space-y-0.5">
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  Your Stores
                </div>
                {filteredStores.map((store) => (
                  <button
                    key={store.id}
                    onClick={() => switchStore(store.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent",
                      currentStoreId === store.id && "bg-accent"
                    )}
                  >
                    <Store className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="flex flex-col flex-1 min-w-0 text-left">
                      <span className="truncate font-medium">{store.name}</span>
                      {store.slug && (
                        <span className="text-xs text-muted-foreground truncate">
                          {store.slug}.framextech.com
                        </span>
                      )}
                    </div>
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full shrink-0",
                        getStatusColor(store.status)
                      )}
                    />
                    {currentStoreId === store.id && (
                      <Check className="h-4 w-4 shrink-0 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="border-t p-1">
            <button
              onClick={viewAllStores}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent"
            >
              <Settings className="h-4 w-4" />
              Manage All Stores
            </button>
            {showCreateButton && (
              <button
                onClick={createNewStore}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent"
              >
                <Plus className="h-4 w-4" />
                Create New Store
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Compact store switcher for header/navbar
 */
export function CompactStoreSwitcher({
  stores,
  currentStoreId,
  className,
}: Omit<StoreSwitcherProps, "showCreateButton">) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentStore = stores.find((s) => s.id === currentStoreId);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getSubPath = () => {
    if (!currentStoreId || !pathname) return "/dashboard";
    const match = pathname.match(/\/owner\/stores\/[^/]+\/(.+)/);
    return match ? `/${match[1]}` : "/dashboard";
  };

  const switchStore = (storeId: string) => {
    const subPath = getSubPath();
    router.push(`/owner/stores/${storeId}${subPath}`);
    setOpen(false);
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "ACTIVE":
        return "bg-green-500";
      case "INACTIVE":
        return "bg-gray-400";
      case "SUSPENDED":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  // Don't show switcher if only one store - but render after hooks to avoid hook count mismatch
  if (stores.length <= 1) {
    return null;
  }

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        role="combobox"
        aria-expanded={open}
        aria-label="Switch store"
        onClick={() => setOpen(!open)}
        className="gap-1 px-2"
      >
        <Store className="h-4 w-4" />
        <span className="hidden sm:inline max-w-[120px] truncate">
          {currentStore?.name || "Store"}
        </span>
        <ChevronsUpDown className="h-3 w-3 opacity-50" />
      </Button>

      {open && (
        <div className="absolute top-full right-0 z-50 mt-1 w-[220px] rounded-md border bg-popover shadow-lg">
          <div className="max-h-[250px] overflow-y-auto p-1">
            {stores.map((store) => (
              <button
                key={store.id}
                onClick={() => switchStore(store.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent",
                  currentStoreId === store.id && "bg-accent"
                )}
              >
                <span
                  className={cn(
                    "h-2 w-2 rounded-full shrink-0",
                    getStatusColor(store.status)
                  )}
                />
                <span className="truncate flex-1 text-left">{store.name}</span>
                {currentStoreId === store.id && (
                  <Check className="h-4 w-4 shrink-0 text-primary" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

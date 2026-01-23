"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { api } from "@/lib/api-client";

/**
 * Store/tenant information
 */
export interface Store {
  id: string;
  name: string;
  slug?: string;
  status: string;
  subscription?: {
    planName?: string;
    status: string;
  } | null;
  stats?: {
    orders: number;
    products: number;
    customers: number;
  };
  createdAt: string;
}

/**
 * Staff permission level for a store
 */
export type StaffPermission = "VIEW" | "EDIT" | "FULL";

/**
 * Store access information
 */
export interface StoreAccess {
  storeId: string;
  permission: StaffPermission | null; // null means owner (full access)
  hasAccess: boolean;
}

/**
 * Store Context Type
 */
interface StoreContextType {
  // Current store
  currentStoreId: string | null;
  currentStore: Store | null;

  // All stores user has access to
  stores: Store[];
  accessibleStores: Store[]; // Stores user can access (for staff)

  // Loading states
  loading: boolean;
  error: string | null;

  // Actions
  switchStore: (storeId: string) => void;
  refreshStores: () => Promise<void>;

  // Access control
  hasAccess: (storeId: string) => boolean;
  getPermission: (storeId: string) => StaffPermission | null;
  canEdit: (storeId: string) => boolean;
  canDelete: (storeId: string) => boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

/**
 * Store Context Provider
 * Manages store selection and access control for owners and staff
 */
export function StoreProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [stores, setStores] = useState<Store[]>([]);
  const [accessibleStores, setAccessibleStores] = useState<Store[]>([]);
  const [currentStoreId, setCurrentStoreId] = useState<string | null>(null);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storeAccessMap, setStoreAccessMap] = useState<
    Map<string, StaffPermission | null>
  >(new Map());

  /**
   * Extract store ID from URL path
   * Matches: /owner/stores/[storeId]/...
   */
  const extractStoreIdFromPath = useCallback((): string | null => {
    const match = pathname?.match(/\/owner\/stores\/([^/]+)/);
    return match ? match[1] : null;
  }, [pathname]);

  /**
   * Fetch stores and access information
   */
  const fetchStores = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch owner's stores
      const ownerStores = await api.get<Store[]>("/owner/stores");
      setStores(ownerStores);

      // Fetch staff access if user is staff
      let accessMap = new Map<string, StaffPermission | null>();
      let accessible: Store[] = [];

      try {
        const staffAccess = await api.get<
          Array<{ storeId: string; permission: StaffPermission }>
        >("/owner/staff/access");

        ownerStores.forEach((store) => {
          const access = staffAccess.find((a) => a.storeId === store.id);
          if (access) {
            accessMap.set(store.id, access.permission);
            accessible.push(store);
          } else {
            // Owner has full access (null = owner)
            accessMap.set(store.id, null);
            accessible.push(store);
          }
        });
      } catch (err) {
        // User is owner, all stores are accessible
        ownerStores.forEach((store) => {
          accessMap.set(store.id, null); // null = owner (full access)
        });
        accessible = ownerStores;
      }

      setStoreAccessMap(accessMap);
      setAccessibleStores(accessible);

      // Set current store from URL if available
      const urlStoreId = extractStoreIdFromPath();
      if (urlStoreId) {
        const store = ownerStores.find((s) => s.id === urlStoreId);
        // Use local accessible array, not stale state
        if (store && accessible.some((s) => s.id === urlStoreId)) {
          setCurrentStoreId(urlStoreId);
          setCurrentStore(store);
        }
      } else if (accessible.length > 0) {
        // Auto-select first store if none selected
        setCurrentStoreId(accessible[0].id);
        setCurrentStore(accessible[0]);
      }
    } catch (err: any) {
      console.error("Failed to fetch stores:", err);
      setError(err.message || "Failed to load stores");
    } finally {
      setLoading(false);
    }
  }, [extractStoreIdFromPath]);

  /**
   * Switch to a different store
   */
  const switchStore = useCallback(
    (storeId: string) => {
      // Verify access
      if (!hasAccess(storeId)) {
        console.error("No access to store:", storeId);
        return;
      }

      const store = stores.find((s) => s.id === storeId);
      if (!store) {
        console.error("Store not found:", storeId);
        return;
      }

      setCurrentStoreId(storeId);
      setCurrentStore(store);

      // Update URL if we're in a store-specific route
      if (pathname?.includes("/owner/stores/")) {
        const newPath = pathname.replace(
          /\/owner\/stores\/[^/]+/,
          `/owner/stores/${storeId}`
        );
        router.push(newPath);
      }
    },
    [stores, pathname, router]
  );

  /**
   * Check if user has access to a store
   */
  const hasAccess = useCallback(
    (storeId: string): boolean => {
      return storeAccessMap.has(storeId);
    },
    [storeAccessMap]
  );

  /**
   * Get permission level for a store
   * Returns null for owners (full access), or VIEW/EDIT/FULL for staff
   */
  const getPermission = useCallback(
    (storeId: string): StaffPermission | null => {
      return storeAccessMap.get(storeId) ?? null;
    },
    [storeAccessMap]
  );

  /**
   * Check if user can edit a store
   */
  const canEdit = useCallback(
    (storeId: string): boolean => {
      const permission = getPermission(storeId);
      return permission === null || permission === "EDIT" || permission === "FULL";
    },
    [getPermission]
  );

  /**
   * Check if user can delete critical items in a store
   */
  const canDelete = useCallback(
    (storeId: string): boolean => {
      const permission = getPermission(storeId);
      return permission === null || permission === "FULL";
    },
    [getPermission]
  );

  // Initial load
  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  // Update current store when URL changes
  useEffect(() => {
    const urlStoreId = extractStoreIdFromPath();
    if (urlStoreId && urlStoreId !== currentStoreId) {
      const store = stores.find((s) => s.id === urlStoreId);
      if (store && hasAccess(urlStoreId)) {
        setCurrentStoreId(urlStoreId);
        setCurrentStore(store);
      }
    }
  }, [pathname, stores, currentStoreId, extractStoreIdFromPath, hasAccess]);

  return (
    <StoreContext.Provider
      value={{
        currentStoreId,
        currentStore,
        stores,
        accessibleStores,
        loading,
        error,
        switchStore,
        refreshStores: fetchStores,
        hasAccess,
        getPermission,
        canEdit,
        canDelete,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

/**
 * Hook to use store context
 */
export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}

/**
 * Hook to get current store (convenience)
 */
export function useCurrentStore() {
  const { currentStore, currentStoreId } = useStore();
  return { store: currentStore, storeId: currentStoreId };
}

/**
 * Hook to get current store permission (convenience)
 */
export function useStorePermission() {
  const { currentStoreId, getPermission } = useStore();
  if (!currentStoreId) return null;
  return getPermission(currentStoreId);
}

"use client";

import { createContext, useContext, ReactNode } from "react";
import type { BrandConfig } from "@/lib/brand-config";

interface BrandConfigContextType {
    config: BrandConfig;
    savedConfig: BrandConfig;
    updateConfig: (path: string[], value: any) => void;
    setConfig: React.Dispatch<React.SetStateAction<BrandConfig>>;
    applyThemeColor: (hexColor: string) => void;
    currencyOpen: boolean;
    setCurrencyOpen: (open: boolean) => void;
    imageErrors: Record<string, boolean>;
    setImageErrors: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    availableCurrencies: { code: string; name: string; symbol: string }[];
    colorPresets: { name: string; value: string; oklch: string }[];
}

const BrandConfigContext = createContext<BrandConfigContextType | null>(null);

export function BrandConfigProvider({
    children,
    value,
}: {
    children: ReactNode;
    value: BrandConfigContextType;
}) {
    return (
        <BrandConfigContext.Provider value={value}>
            {children}
        </BrandConfigContext.Provider>
    );
}

export function useBrandConfig() {
    const context = useContext(BrandConfigContext);
    if (!context) {
        throw new Error("useBrandConfig must be used within BrandConfigProvider");
    }
    return context;
}

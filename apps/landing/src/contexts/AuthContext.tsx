"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSession, signOut } from "@/lib/auth-client";

interface User {
    id: string;
    email: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { data: session, isPending: isLoading } = useSession();
    const router = useRouter();

    const user: User | null = session?.user
        ? {
            id: session.user.id,
            email: session.user.email,
            role: (session.user as any).role || "ADMIN",
        }
        : null;

    const logout = async () => {
        await signOut();
        // Clear role hint cookie
        document.cookie = "framex-user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        toast.info("Logged out");
        router.push("/login");
    };

    return (
        <AuthContext.Provider value={{ user, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

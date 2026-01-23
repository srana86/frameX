import { cookies, headers } from "next/headers";
import { authClient } from "./auth-client";

/**
 * Current user type from BetterAuth session
 */
export interface CurrentUser {
    id: string;
    email: string;
    name: string;
    role: string;
    image?: string;
    emailVerified?: boolean;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
    try {
        const cookieStore = await cookies();
        const headersList = await headers();

        const { data: sessionData } = await authClient.getSession({
            fetchOptions: {
                headers: {
                    Cookie: cookieStore.toString(),
                }
            }
        });

        if (!sessionData?.user) {
            return null;
        }

        // Map BetterAuth user to CurrentUser with role
        const user = sessionData.user as any;
        return {
            id: user.id,
            email: user.email,
            name: user.name || '',
            role: user.role || 'CUSTOMER',
            image: user.image,
            emailVerified: user.emailVerified,
        };
    } catch (error) {
        console.error("Error getting current user from BetterAuth:", error);
        return null;
    }
}

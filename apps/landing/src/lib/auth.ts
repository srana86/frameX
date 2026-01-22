import { cookies, headers } from "next/headers";
import { authClient } from "./auth-client";

export async function getCurrentUser() {
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

        return sessionData.user;
    } catch (error) {
        console.error("Error getting current user from BetterAuth:", error);
        return null;
    }
}

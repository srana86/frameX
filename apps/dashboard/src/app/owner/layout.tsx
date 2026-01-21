import { OwnerShell } from "@/app/owner/_components/OwnerShell";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { ReactNode } from "react";

export default function OwnerLayout({ children }: { children: ReactNode }) {
    return (
        <SettingsProvider>
            <main>
                <OwnerShell>{children}</OwnerShell>
            </main>
        </SettingsProvider>
    );
}

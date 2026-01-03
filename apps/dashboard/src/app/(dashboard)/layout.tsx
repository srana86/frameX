import { AdminShell } from "@/app/(dashboard)/_components/layout/AdminShell";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SettingsProvider>
      <main>
        <AdminShell>{children}</AdminShell>
      </main>
    </SettingsProvider>
  );
}

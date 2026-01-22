import { AdminShell } from "@/app/admin/_components/layout/AdminShell";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <SettingsProvider>
      <main>
        <AdminShell>{children}</AdminShell>
      </main>
    </SettingsProvider>
  );
}

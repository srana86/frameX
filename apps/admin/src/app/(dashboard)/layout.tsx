import { SettingsProvider } from "@/contexts/SettingsContext";
import { AdminShell } from "@/app/_components/layout/AdminShell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SettingsProvider>
      <AdminShell>{children}</AdminShell>
    </SettingsProvider>
  );
}

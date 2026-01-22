import { ReactNode } from "react";
import { OwnerShell } from "@/app/owner/_components/OwnerShell";
import { AuthProvider } from "@/contexts/AuthContext";
import { SettingsProvider } from "@/contexts/SettingsContext";

export default function StaffLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <SettingsProvider>
        <OwnerShell>{children}</OwnerShell>
      </SettingsProvider>
    </AuthProvider>
  );
}

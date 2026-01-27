// src/app/(dashboard)/settings/layout.tsx

import { PermissionGate } from '@/components/auth/PermissionGate';

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PermissionGate
      anyPermissions={["manage_users", "manage_locations", "manage_categories", "manage_targets"]}
      redirectTo="/access-denied"
    >
      {children}
    </PermissionGate>
  );
}

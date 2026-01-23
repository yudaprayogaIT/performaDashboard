// src/app/(dashboard)/settings/users/layout.tsx

import { PermissionGate } from '@/components/auth/PermissionGate';

export default async function UsersSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PermissionGate permission="manage_users" redirectTo="/access-denied">
      {children}
    </PermissionGate>
  );
}

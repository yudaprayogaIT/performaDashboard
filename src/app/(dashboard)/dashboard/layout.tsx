// src/app/(dashboard)/dashboard/layout.tsx

import { PermissionGate } from '@/components/auth/PermissionGate';

export default function DashboardPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PermissionGate permission="view_dashboard" redirectTo="/access-denied">
      {children}
    </PermissionGate>
  );
}

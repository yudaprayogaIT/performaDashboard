// src/app/admin/layout.tsx

import { PermissionGate } from '@/components/auth/PermissionGate';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PermissionGate permission="manage_roles" redirectTo="/access-denied">
      <div className="min-h-screen bg-gradient-to-br from-[#1A153A] via-[#1c153c] to-[#2C0B52]">
        {children}
      </div>
    </PermissionGate>
  );
}

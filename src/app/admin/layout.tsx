// src/app/admin/layout.tsx

import { PermissionGate } from '@/components/auth/PermissionGate';
import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PermissionGate anyPermissions={['manage_roles', 'manage_permissions', 'manage_users']} redirectTo="/access-denied">
      <div className="min-h-screen bg-gradient-to-br from-[#1A153A] via-[#1c153c] to-[#2C0B52]">
        <Sidebar />
        <div className="lg:ml-64">
          <Header />
          <main>
            {children}
          </main>
        </div>
      </div>
    </PermissionGate>
  );
}

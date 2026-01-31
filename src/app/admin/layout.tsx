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
      <div className="min-h-screen bg-background-dark">
        <Sidebar />
        <div className="ml-64">
          <Header />
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </PermissionGate>
  );
}

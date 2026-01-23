// src/app/(dashboard)/upload/layout.tsx

import { PermissionGate } from '@/components/auth/PermissionGate';

export default async function UploadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PermissionGate
      anyPermissions={["upload_omzet", "upload_gross_margin", "upload_retur", "view_upload_history"]}
      redirectTo="/access-denied"
    >
      {children}
    </PermissionGate>
  );
}

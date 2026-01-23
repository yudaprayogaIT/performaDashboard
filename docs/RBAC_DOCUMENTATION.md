# Role-Based Access Control (RBAC) System Documentation

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Permission System](#permission-system)
5. [API Endpoints](#api-endpoints)
6. [UI Components](#ui-components)
7. [Security Features](#security-features)
8. [Usage Guide](#usage-guide)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

Sistem RBAC (Role-Based Access Control) enterprise-grade yang telah diimplementasikan untuk mengelola akses pengguna berdasarkan role dan permission yang dimiliki.

### Key Features

- ✅ Granular permission-based access control
- ✅ Role management dengan permission assignment
- ✅ User management dengan role assignment
- ✅ Dynamic menu filtering berdasarkan permissions
- ✅ Real-time notifications via Server-Sent Events (SSE)
- ✅ Audit logging untuk compliance
- ✅ In-memory caching untuk performance
- ✅ Graceful degradation untuk error handling
- ✅ Search functionality untuk menu navigation

---

## 🏗️ Architecture

### 3-Layer Security Model

```
┌─────────────────────────────────────────┐
│         1. Middleware Layer             │
│    (Route-level Authentication)         │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│      2. API/Server Actions Layer        │
│    (Permission Validation & Logic)      │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│        3. UI Component Layer            │
│   (Permission-based Rendering)          │
└─────────────────────────────────────────┘
```

### System Components

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Users      │────▶│  User Roles  │────▶│   Roles      │
└──────────────┘     └──────────────┘     └──────────────┘
                                                  │
                                                  ▼
                                           ┌──────────────┐
                                           │ Role         │
                                           │ Permissions  │
                                           └──────────────┘
                                                  │
                                                  ▼
                                           ┌──────────────┐
                                           │ Permissions  │
                                           └──────────────┘
```

---

## 🗄️ Database Schema

### Tables

#### 1. `User`
```prisma
model User {
  id            Int            @id @default(autoincrement())
  email         String         @unique
  name          String
  password      String
  isActive      Boolean        @default(true)
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  userRoles     UserRole[]
  auditLogs     AuditLog[]
  notifications Notification[]
}
```

#### 2. `Role`
```prisma
model Role {
  id          Int              @id @default(autoincrement())
  name        String           @unique
  description String?
  isSystem    Boolean          @default(false)
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
  userRoles   UserRole[]
  permissions RolePermission[]
}
```

#### 3. `Permission`
```prisma
model Permission {
  id          Int              @id @default(autoincrement())
  slug        String           @unique
  name        String
  description String?
  module      Module
  isSystem    Boolean          @default(false)
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
  roles       RolePermission[]
}
```

#### 4. `UserRole` (Junction Table)
```prisma
model UserRole {
  id        Int      @id @default(autoincrement())
  userId    Int
  roleId    Int
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  role      Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@unique([userId, roleId])
}
```

#### 5. `RolePermission` (Junction Table)
```prisma
model RolePermission {
  id           Int        @id @default(autoincrement())
  roleId       Int
  permissionId Int
  role         Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)
  createdAt    DateTime   @default(now())

  @@unique([roleId, permissionId])
}
```

#### 6. `AuditLog`
```prisma
model AuditLog {
  id        Int      @id @default(autoincrement())
  userId    Int
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  action    String
  entity    String
  entityId  Int?
  oldValue  Json?
  newValue  Json?
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
}
```

#### 7. `Notification`
```prisma
model Notification {
  id        Int              @id @default(autoincrement())
  userId    Int
  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  type      NotificationType
  title     String
  message   String
  link      String?
  isRead    Boolean          @default(false)
  readAt    DateTime?
  createdAt DateTime         @default(now())
}

enum NotificationType {
  INFO
  WARNING
  ERROR
  SUCCESS
}
```

### Modules Enum
```prisma
enum Module {
  DASHBOARD
  UPLOAD
  SETTINGS
  AUDIT
  EXPORT
}
```

---

## 🔐 Permission System

### Default System Permissions

#### Dashboard Module
- `view_dashboard` - View dashboard pages
- `view_analytics` - View analytics and reports

#### Upload Module
- `upload_omzet` - Upload omzet data
- `upload_gross_margin` - Upload gross margin data
- `upload_retur` - Upload retur data
- `delete_upload` - Delete uploaded data

#### Settings Module
- `manage_categories` - Manage product categories
- `manage_targets` - Manage sales targets
- `manage_users` - Manage user accounts

#### Audit Module
- `view_audit_log` - View audit logs
- `manage_roles` - Manage roles
- `manage_permissions` - Manage permissions

#### Export Module
- `export_data` - Export data to Excel/PDF

### Default System Roles

#### ADMINISTRATOR
- Full access to all permissions
- Can manage roles, permissions, and users
- Cannot be deleted

#### DIREKTUR
- View dashboard and analytics
- View audit logs
- Export data

#### MARKETING
- Upload omzet, gross margin, retur data
- View dashboard
- Export data

#### ACCOUNTING
- View dashboard and analytics
- View audit logs
- Export data

---

## 🌐 API Endpoints

### Authentication

#### POST `/api/auth/login`
Login user dan generate JWT token.

**Request:**
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "name": "Administrator"
  }
}
```

#### GET `/api/auth/permissions`
Get current user permissions.

**Response:**
```json
{
  "success": true,
  "permissions": [
    "view_dashboard",
    "manage_users",
    "manage_roles"
  ]
}
```

---

### Role Management

#### GET `/api/admin/roles`
Get all roles with permissions and user count.

**Response:**
```json
{
  "success": true,
  "roles": [
    {
      "id": 1,
      "name": "ADMINISTRATOR",
      "description": "Full system access",
      "isSystem": true,
      "permissions": [...],
      "userCount": 5
    }
  ]
}
```

#### POST `/api/admin/roles`
Create new role.

**Request:**
```json
{
  "name": "CUSTOM_ROLE",
  "description": "Custom role description",
  "permissionIds": [1, 2, 3]
}
```

#### PATCH `/api/admin/roles/:id`
Update role (cannot update system roles).

**Request:**
```json
{
  "name": "UPDATED_ROLE",
  "description": "Updated description",
  "permissionIds": [1, 2, 3, 4]
}
```

#### DELETE `/api/admin/roles/:id`
Delete role (cannot delete system roles or roles with users).

---

### Permission Management

#### GET `/api/admin/permissions`
Get all permissions grouped by module.

**Response:**
```json
{
  "success": true,
  "permissions": [
    {
      "module": "DASHBOARD",
      "permissions": [
        {
          "id": 1,
          "slug": "view_dashboard",
          "name": "View Dashboard",
          "description": "Access to dashboard pages",
          "isSystem": true,
          "roleCount": 4
        }
      ]
    }
  ]
}
```

#### POST `/api/admin/permissions`
Create new permission.

**Request:**
```json
{
  "slug": "custom_permission",
  "name": "Custom Permission",
  "description": "Custom permission description",
  "module": "DASHBOARD"
}
```

#### PATCH `/api/admin/permissions/:id`
Update permission (cannot update system permissions).

#### DELETE `/api/admin/permissions/:id`
Delete permission (cannot delete system permissions or permissions in use).

---

### User Management

#### GET `/api/admin/users`
Get all users with their roles.

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "id": 1,
      "email": "admin@example.com",
      "name": "Administrator",
      "isActive": true,
      "roles": [
        {
          "id": 1,
          "name": "ADMINISTRATOR",
          "description": "Full system access"
        }
      ],
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### POST `/api/admin/users`
Create new user.

**Request:**
```json
{
  "email": "newuser@example.com",
  "name": "New User",
  "password": "password123",
  "roleId": 2,
  "isActive": true
}
```

#### PATCH `/api/admin/users/:id`
Update user.

**Request:**
```json
{
  "email": "updated@example.com",
  "name": "Updated Name",
  "password": "newpassword", // optional
  "roleId": 3,
  "isActive": false
}
```

#### DELETE `/api/admin/users/:id`
Delete user (cannot delete self).

---

### Notifications

#### GET `/api/notifications`
Get user notifications with pagination.

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20)

**Response:**
```json
{
  "success": true,
  "notifications": [...],
  "unreadCount": 5,
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

#### GET `/api/notifications/stream`
Server-Sent Events endpoint for real-time notifications.

#### PATCH `/api/notifications/:id`
Mark notification as read.

#### DELETE `/api/notifications/:id`
Delete notification.

#### POST `/api/notifications`
Mark all notifications as read.

---

## 🎨 UI Components

### Permission Guards

#### `<PermissionGate>`
Server component untuk protect pages berdasarkan permissions.

**Usage:**
```tsx
import { PermissionGate } from '@/components/auth/PermissionGate';

export default function ProtectedPage() {
  return (
    <PermissionGate permission="manage_users" redirectTo="/access-denied">
      <div>Protected content</div>
    </PermissionGate>
  );
}
```

**Props:**
- `permission?: string` - Single permission slug
- `anyPermissions?: string[]` - Array of permission slugs (OR logic)
- `allPermissions?: string[]` - Array of permission slugs (AND logic)
- `redirectTo?: string` - Redirect path if no permission (default: "/access-denied")

---

### Hooks

#### `usePermissions()`
Client-side hook untuk check user permissions.

**Usage:**
```tsx
'use client';

import { usePermissions } from '@/hooks/usePermissions';

export default function MyComponent() {
  const { hasPermission, hasAnyPermission, loading, error } = usePermissions();

  if (loading) return <div>Loading...</div>;

  if (hasPermission('manage_users')) {
    return <button>Manage Users</button>;
  }

  if (hasAnyPermission(['view_dashboard', 'view_analytics'])) {
    return <div>Dashboard content</div>;
  }

  return null;
}
```

**Returns:**
- `permissions: string[]` - Array of permission slugs
- `hasPermission(slug: string): boolean` - Check single permission
- `hasAnyPermission(slugs: string[]): boolean` - Check if has any permission
- `hasAllPermissions(slugs: string[]): boolean` - Check if has all permissions
- `loading: boolean` - Loading state
- `error: string | null` - Error message

#### `useNotifications()`
Client-side hook untuk real-time notifications.

**Usage:**
```tsx
'use client';

import { useNotifications } from '@/hooks/useNotifications';

export default function NotificationBell() {
  const { notifications, unreadCount, loading, markAsRead } = useNotifications();

  return (
    <div>
      <span>Unread: {unreadCount}</span>
      {notifications.map(notif => (
        <div key={notif.id} onClick={() => markAsRead(notif.id)}>
          {notif.title}
        </div>
      ))}
    </div>
  );
}
```

---

### Pages

#### Role Management
**Path:** `/admin/roles`
**Permission:** `manage_roles`
**Features:**
- View all roles with permission count
- Create custom roles
- Edit roles and assign permissions
- Delete custom roles
- System role protection

#### Permission Management
**Path:** `/admin/permissions`
**Permission:** `manage_permissions`
**Features:**
- View permissions grouped by module
- Create custom permissions
- Edit permission details
- Delete unused permissions
- System permission protection
- Role count indicator

#### User Management
**Path:** `/admin/users`
**Permission:** `manage_users`
**Features:**
- View all users with roles
- Create new users
- Edit user details and roles
- Activate/deactivate users
- Delete users
- Statistics dashboard

---

## 🔒 Security Features

### 1. Authentication
- JWT token-based authentication
- HTTP-only cookies for token storage
- Token expiration (7 days default)
- Password hashing dengan bcrypt (10 rounds)

### 2. Authorization
- Granular permission checking
- Role-based access control
- Route-level protection via middleware
- API-level permission validation
- UI-level permission filtering

### 3. Audit Logging
All CRUD operations logged with:
- User ID
- Action type
- Entity type and ID
- Old and new values
- IP address
- User agent
- Timestamp

### 4. Input Validation
- Email format validation
- Password strength requirements
- Slug format validation
- Module validation
- SQL injection prevention
- XSS protection

### 5. Protection Mechanisms
- Cannot delete system roles/permissions
- Cannot delete roles in use
- Cannot delete permissions in use
- Cannot delete own user account
- Cannot update system entities
- CSRF protection via Next.js
- Rate limiting (to be implemented)

### 6. Error Handling
- Graceful degradation
- Fallback mechanisms
- User-friendly error messages
- Error logging
- Try-catch blocks
- Timeout mechanisms

---

## 📖 Usage Guide

### For Administrators

#### 1. Create a New Role
1. Navigate to `/admin/roles`
2. Click "Add Role"
3. Enter role name and description
4. Select permissions
5. Click "Create"

#### 2. Assign Permissions to Role
1. Navigate to `/admin/roles`
2. Click "Edit" on desired role
3. Check/uncheck permissions
4. Click "Update"

#### 3. Create a New User
1. Navigate to `/admin/users`
2. Click "Add User"
3. Enter email, name, password
4. Select role
5. Check "Active user" if needed
6. Click "Create"

#### 4. Create Custom Permission
1. Navigate to `/admin/permissions`
2. Click "Add Permission"
3. Enter name, slug, description
4. Select module
5. Click "Create"

### For Developers

#### 1. Protect a Page
```tsx
// app/protected/page.tsx
import { PermissionGate } from '@/components/auth/PermissionGate';

export default function ProtectedPage() {
  return (
    <PermissionGate permission="view_analytics">
      <YourComponent />
    </PermissionGate>
  );
}
```

#### 2. Protect an API Route
```tsx
// app/api/protected/route.ts
import { requirePermission } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const { valid, payload } = verifyToken(token);

  // Check permission
  await requirePermission(payload.userId, 'view_data');

  // Your logic here
}
```

#### 3. Add Menu Item with Permission
```tsx
// components/layout/sidebar.tsx
const navItems: NavItem[] = [
  {
    label: "Analytics",
    href: "/analytics",
    icon: "analytics",
    permission: "view_analytics", // Single permission
  },
  {
    label: "Reports",
    href: "/reports",
    icon: "description",
    anyPermissions: ["export_data", "view_analytics"], // OR logic
  },
];
```

#### 4. Conditional Rendering
```tsx
'use client';

import { usePermissions } from '@/hooks/usePermissions';

export default function MyComponent() {
  const { hasPermission } = usePermissions();

  return (
    <div>
      {hasPermission('delete_data') && (
        <button>Delete</button>
      )}
    </div>
  );
}
```

#### 5. Send Notification
```tsx
import { createNotification } from '@/lib/notifications';

await createNotification({
  userId: 1,
  title: "Upload Success",
  message: "Your data has been uploaded successfully",
  type: "SUCCESS",
  link: "/dashboard",
});
```

#### 6. Create Audit Log
```tsx
import { createAuditLog } from '@/lib/audit';

await createAuditLog({
  userId: payload.userId,
  action: 'UPDATE_ROLE',
  entity: 'Role',
  entityId: roleId,
  oldValue: oldRole,
  newValue: newRole,
  ipAddress: request.headers.get('x-forwarded-for') || undefined,
  userAgent: request.headers.get('user-agent') || undefined,
});
```

---

## 🐛 Troubleshooting

### Issue: Sidebar not showing
**Cause:** Permission API timeout or error
**Solution:** System has 3-second timeout fallback. Check:
- `/api/auth/permissions` endpoint status
- Browser console for errors
- Network tab for failed requests

### Issue: "Forbidden" error on API calls
**Cause:** User lacks required permission
**Solution:**
1. Check user's role assignments
2. Check role's permission assignments
3. Verify permission slug matches exactly
4. Clear permission cache if recently updated

### Issue: Cannot delete role/permission
**Cause:** System protection or entity in use
**Solution:**
- System roles/permissions cannot be deleted
- Remove role from all users first
- Remove permission from all roles first

### Issue: Permission cache not updating
**Cause:** Cache not cleared after changes
**Solution:**
```tsx
import { clearPermissionCache } from '@/lib/permissions';

// Clear for specific user
await clearPermissionCache(userId);

// Clear for all users
await clearPermissionCache();
```

### Issue: Notifications not appearing
**Cause:** SSE connection failed
**Solution:**
- System has graceful degradation
- Check browser console for SSE errors
- Refresh page to reconnect
- Check `/api/notifications/stream` endpoint

---

## 🔄 Migration Notes

### From Previous Version

If migrating from version without RBAC:

1. **Run Prisma Migration:**
```bash
npx prisma migrate dev
```

2. **Run Seed Script:**
```bash
npx prisma db seed
```

This will create:
- Default permissions
- Default roles
- Default admin user

3. **Update Middleware:**
The middleware now handles:
- Authentication
- Permission caching
- Role-based redirects (disabled by default)

4. **Update Components:**
All components now support permission-based rendering.

---

## 📝 Best Practices

### Security
1. Always use `requirePermission()` in API routes
2. Use `<PermissionGate>` for page protection
3. Implement both server and client-side checks
4. Log sensitive operations
5. Never expose passwords in API responses

### Performance
1. Use permission caching wisely
2. Clear cache after role/permission updates
3. Implement pagination for large datasets
4. Use SSE for real-time updates
5. Optimize database queries with `include`

### Code Organization
1. Keep permission logic in `/lib/permissions.ts`
2. Keep audit logic in `/lib/audit.ts`
3. Keep notification logic in `/lib/notifications.ts`
4. Use TypeScript interfaces for type safety
5. Document all permission slugs

### User Experience
1. Show loading states during permission checks
2. Provide fallback UI for denied access
3. Clear error messages
4. Graceful degradation on errors
5. Real-time notifications for important events

---

## 📞 Support

For issues or questions:
1. Check this documentation
2. Review error logs
3. Check browser console
4. Review audit logs
5. Contact system administrator

---

**Last Updated:** 2024-01-23
**Version:** 1.0.0
**Maintainer:** Development Team

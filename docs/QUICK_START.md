# Quick Start Guide - RBAC System

Panduan cepat untuk memulai development dengan sistem RBAC.

---

## 📋 Prerequisites

- Node.js 18+ installed
- PostgreSQL database
- Git
- Code editor (VS Code recommended)

---

## 🚀 Setup Development Environment

### 1. Clone & Install

```bash
# Clone repository
git clone <repository-url>
cd performaDashboard

# Install dependencies
npm install
```

### 2. Environment Configuration

Create `.env.local`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/performa_dashboard"

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET="your-secret-key-here"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Database Setup

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database with default data
npx prisma db seed
```

This will create:
- ✅ Default roles (ADMINISTRATOR, DIREKTUR, MARKETING, ACCOUNTING)
- ✅ Default permissions (25 permissions across 5 modules)
- ✅ Default admin user (admin@example.com / admin123)

### 4. Start Development Server

```bash
npm run dev
```

Visit: `http://localhost:3000`

### 5. Login

Use default admin credentials:
- **Email**: admin@example.com
- **Password**: admin123

---

## 🎯 Quick Tour

### Admin Pages

After login, navigate to:

1. **Dashboard** - `/dashboard`
   - Main dashboard with analytics

2. **Role Management** - `/admin/roles`
   - Create and manage roles
   - Assign permissions to roles
   - View user count per role

3. **Permission Management** - `/admin/permissions`
   - View all permissions grouped by module
   - Create custom permissions
   - See which roles use each permission

4. **User Management** - `/admin/users`
   - Create and manage users
   - Assign roles to users
   - Activate/deactivate accounts

---

## 💻 Common Development Tasks

### 1. Protect a Page

Create protected page:

```tsx
// app/analytics/page.tsx
import { PermissionGate } from '@/components/auth/PermissionGate';

export default function AnalyticsPage() {
  return (
    <PermissionGate permission="view_analytics" redirectTo="/access-denied">
      <div className="p-6">
        <h1>Analytics Dashboard</h1>
        {/* Your content */}
      </div>
    </PermissionGate>
  );
}
```

### 2. Protect an API Route

```tsx
// app/api/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  // Verify authentication
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { valid, payload } = verifyToken(token);

  if (!valid || !payload) {
    return NextResponse.json(
      { success: false, message: 'Invalid token' },
      { status: 401 }
    );
  }

  // Check permission
  try {
    await requirePermission(payload.userId, 'view_analytics');
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 403 }
    );
  }

  // Your logic here
  return NextResponse.json({ success: true, data: [] });
}
```

### 3. Add Menu Item with Permission

```tsx
// components/layout/sidebar.tsx
const navItems: NavItem[] = [
  {
    label: "Analytics",
    href: "/analytics",
    icon: "analytics",
    permission: "view_analytics", // Single permission required
  },
  {
    label: "Admin",
    href: "/admin",
    icon: "admin_panel_settings",
    anyPermissions: ["manage_roles", "manage_users"], // Any of these
    children: [
      // ... submenu items
    ],
  },
];
```

### 4. Check Permission in Component

```tsx
'use client';

import { usePermissions } from '@/hooks/usePermissions';

export default function MyComponent() {
  const { hasPermission, hasAnyPermission, loading } = usePermissions();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {hasPermission('delete_data') && (
        <button className="btn-danger">Delete</button>
      )}

      {hasAnyPermission(['export_data', 'view_analytics']) && (
        <button className="btn-primary">Export</button>
      )}
    </div>
  );
}
```

### 5. Send Notification

```tsx
import { createNotification } from '@/lib/notifications';

// Send to single user
await createNotification({
  userId: 1,
  title: "Upload Complete",
  message: "Your data has been uploaded successfully",
  type: "SUCCESS",
  link: "/dashboard",
});

// Broadcast to all DIREKTUR users
import { notifyDirekturAboutUpload } from '@/lib/notifications';

await notifyDirekturAboutUpload({
  uploaderName: "John Doe",
  uploadType: "OMZET",
  fileName: "omzet_jan_2024.xlsx",
  rowCount: 1500,
});
```

### 6. Create Audit Log

```tsx
import { createAuditLog } from '@/lib/audit';

await createAuditLog({
  userId: payload.userId,
  action: 'UPDATE_ROLE',
  entity: 'Role',
  entityId: roleId,
  oldValue: { name: 'OLD_NAME', permissions: [1, 2] },
  newValue: { name: 'NEW_NAME', permissions: [1, 2, 3] },
  ipAddress: request.headers.get('x-forwarded-for') || undefined,
  userAgent: request.headers.get('user-agent') || undefined,
});
```

---

## 🎨 UI Component Examples

### Permission-based Button

```tsx
'use client';

import { usePermissions } from '@/hooks/usePermissions';
import { Trash2 } from 'lucide-react';

export function DeleteButton({ itemId }: { itemId: number }) {
  const { hasPermission } = usePermissions();

  if (!hasPermission('delete_data')) {
    return null; // Don't show button if no permission
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure?')) return;

    const response = await fetch(`/api/data/${itemId}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      alert('Deleted successfully');
    }
  };

  return (
    <button
      onClick={handleDelete}
      className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
    >
      <Trash2 className="w-4 h-4 text-red-400" />
    </button>
  );
}
```

### Notification Bell

```tsx
'use client';

import { useNotifications } from '@/hooks/useNotifications';
import { Bell } from 'lucide-react';

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 hover:bg-white/10 rounded-lg"
      >
        <Bell className="w-5 h-5 text-white/80" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 glass-card rounded-xl shadow-lg">
          {notifications.map(notif => (
            <div
              key={notif.id}
              onClick={() => markAsRead(notif.id)}
              className="p-4 hover:bg-white/5 cursor-pointer"
            >
              <h4 className="text-white font-medium">{notif.title}</h4>
              <p className="text-white/60 text-sm">{notif.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 🗄️ Database Operations

### Create New Permission (Programmatically)

```tsx
import { prisma } from '@/lib/prisma';

const permission = await prisma.permission.create({
  data: {
    slug: 'custom_permission',
    name: 'Custom Permission',
    description: 'Description here',
    module: 'DASHBOARD',
    isSystem: false,
  },
});
```

### Assign Permission to Role

```tsx
import { prisma } from '@/lib/prisma';

await prisma.rolePermission.create({
  data: {
    roleId: 1,
    permissionId: 5,
  },
});
```

### Get User with Roles and Permissions

```tsx
import { prisma } from '@/lib/prisma';

const user = await prisma.user.findUnique({
  where: { id: 1 },
  include: {
    userRoles: {
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    },
  },
});
```

---

## 🧪 Testing

### Test Permission Check

```bash
# Login as admin
# Navigate to /admin/roles
# Should see Role Management page

# Login as non-admin
# Navigate to /admin/roles
# Should redirect to /access-denied
```

### Test API with curl

```bash
# Get permissions (requires auth)
curl -X GET http://localhost:3000/api/auth/permissions \
  -H "Cookie: auth-token=YOUR_TOKEN"

# Create role (requires manage_roles permission)
curl -X POST http://localhost:3000/api/admin/roles \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=YOUR_TOKEN" \
  -d '{
    "name": "CUSTOM_ROLE",
    "description": "Custom role description",
    "permissionIds": [1, 2, 3]
  }'
```

---

## 🔍 Debugging

### Check User Permissions

```bash
# Open browser console on any page
# Run this in console:
fetch('/api/auth/permissions')
  .then(r => r.json())
  .then(d => console.log(d.permissions));
```

### Check Permission Cache

```tsx
import { permissionCache } from '@/lib/permissions';

// In your code or console
console.log('Cache size:', permissionCache.size);
console.log('Cache entries:', Array.from(permissionCache.entries()));
```

### View Audit Logs

```bash
# Using Prisma Studio
npx prisma studio

# Navigate to AuditLog table
# View all logged actions
```

---

## 📁 Project Structure

```
performaDashboard/
├── src/
│   ├── app/
│   │   ├── (auth)/              # Login pages
│   │   ├── (dashboard)/         # Dashboard pages
│   │   ├── admin/               # Admin pages
│   │   │   ├── roles/           # Role management
│   │   │   ├── permissions/     # Permission management
│   │   │   └── users/           # User management
│   │   ├── api/
│   │   │   ├── auth/            # Auth endpoints
│   │   │   ├── admin/           # Admin endpoints
│   │   │   └── notifications/   # Notification endpoints
│   │   └── access-denied/       # Access denied page
│   ├── components/
│   │   ├── auth/                # Auth components
│   │   │   └── PermissionGate.tsx
│   │   ├── layout/              # Layout components
│   │   │   ├── header.tsx
│   │   │   └── sidebar.tsx
│   │   └── ui/                  # UI components
│   ├── hooks/
│   │   ├── usePermissions.ts
│   │   ├── useNotifications.ts
│   │   └── useAuth.ts
│   ├── lib/
│   │   ├── permissions.ts       # Permission utilities
│   │   ├── audit.ts             # Audit utilities
│   │   ├── notifications.ts     # Notification utilities
│   │   ├── auth.ts              # Auth utilities
│   │   ├── cache.ts             # Cache utilities
│   │   └── prisma.ts            # Prisma client
│   └── middleware.ts            # Route protection
├── prisma/
│   ├── schema.prisma            # Database schema
│   └── seed.ts                  # Seed data
├── docs/
│   ├── RBAC_DOCUMENTATION.md    # Full documentation
│   └── QUICK_START.md           # This file
└── CHANGELOG.md                 # Version history
```

---

## 🛠️ Development Tools

### Prisma Studio

Visual database browser:

```bash
npx prisma studio
```

### Database Reset

Reset database and re-seed:

```bash
npx prisma migrate reset
```

### Generate Prisma Client

After schema changes:

```bash
npx prisma generate
```

### Create Migration

After schema changes:

```bash
npx prisma migrate dev --name your_migration_name
```

---

## 🚨 Common Issues

### Issue: "Permission denied"
**Solution:** Check user has required permission in database

### Issue: "Sidebar not showing"
**Solution:** Wait 3 seconds for permission load, or check console for errors

### Issue: "Cannot delete role/permission"
**Solution:** Remove all associations first (users from role, permissions from role)

### Issue: "Notification not appearing"
**Solution:** Check SSE connection in Network tab, refresh page

---

## 📚 Next Steps

1. **Read Full Documentation**
   - `/docs/RBAC_DOCUMENTATION.md`

2. **Create Custom Permissions**
   - Navigate to `/admin/permissions`
   - Click "Add Permission"

3. **Create Custom Roles**
   - Navigate to `/admin/roles`
   - Click "Add Role"
   - Assign permissions

4. **Add Users**
   - Navigate to `/admin/users`
   - Click "Add User"
   - Assign role

5. **Protect Your Routes**
   - Add `<PermissionGate>` to pages
   - Add permission checks to API routes
   - Update sidebar menu items

---

## 💡 Tips & Best Practices

1. **Always check permissions at API level** - Don't rely only on UI checks
2. **Use TypeScript** - Full type safety available
3. **Clear cache after updates** - Use `clearPermissionCache()` after role/permission changes
4. **Log important actions** - Use `createAuditLog()` for compliance
5. **Test both success and failure** - Verify permission denied cases work
6. **Use meaningful permission slugs** - Follow naming convention: `action_entity`
7. **Document custom permissions** - Add clear descriptions
8. **Graceful degradation** - Handle permission check failures

---

## 🎓 Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [RBAC Best Practices](https://auth0.com/docs/manage-users/access-control/rbac)

---

## 📞 Getting Help

1. Check this guide
2. Read `/docs/RBAC_DOCUMENTATION.md`
3. Review error logs in browser console
4. Check database with Prisma Studio
5. Contact team lead

---

**Happy Coding! 🚀**

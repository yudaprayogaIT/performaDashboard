# Performa Dashboard

Enterprise-grade dashboard application with comprehensive Role-Based Access Control (RBAC) system for managing business performance metrics.

## 🎯 Overview

Performa Dashboard adalah aplikasi manajemen performa bisnis yang dilengkapi dengan sistem RBAC enterprise-grade. Aplikasi ini memungkinkan perusahaan untuk mengelola data omzet, gross margin, retur, dan analytics dengan kontrol akses yang granular berdasarkan role dan permission.

### Key Features

- ✅ **Enterprise RBAC System** - Granular permission-based access control
- ✅ **Role Management** - Create and manage custom roles with permission assignment
- ✅ **User Management** - Complete user lifecycle management with role assignment
- ✅ **Permission Management** - Define and manage custom permissions
- ✅ **Real-time Notifications** - Server-Sent Events (SSE) untuk notifikasi real-time
- ✅ **Audit Logging** - Comprehensive audit trail untuk compliance
- ✅ **Dynamic Menu** - Menu yang berubah sesuai permission user
- ✅ **Search Functionality** - Quick search untuk navigasi menu
- ✅ **Upload System** - Excel parsing untuk data omzet, gross margin, dan retur
- ✅ **Analytics Dashboard** - Visualisasi data performa bisnis
- ✅ **Export Functionality** - Export data ke Excel/PDF

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15.5.9 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT with HTTP-only cookies
- **Styling**: Tailwind CSS
- **Icons**: Lucide React + Material Symbols
- **Charts**: (To be implemented)
- **State Management**: React Hooks
- **Caching**: In-memory (Redis recommended for production)

---

## 📋 Prerequisites

- Node.js 18.x or higher
- PostgreSQL 14.x or higher
- npm or yarn

---

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone <repository-url>
cd performaDashboard
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create `.env.local`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/performa_dashboard"

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET="your-secret-key-here"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Database Setup

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
- ✅ Default permissions (25 permissions)
- ✅ Default admin user (admin@example.com / admin123)

### 5. Start Development Server

```bash
npm run dev
```

Visit: `http://localhost:3000`

### 6. Login

Default credentials:
- **Email**: admin@example.com
- **Password**: admin123

**⚠️ Important:** Change this password after first login!

---

## 📁 Project Structure

```
performaDashboard/
├── src/
│   ├── app/
│   │   ├── (auth)/              # Login & authentication pages
│   │   │   └── login/
│   │   ├── (dashboard)/         # Main dashboard pages
│   │   │   ├── dashboard/
│   │   │   ├── upload/
│   │   │   └── settings/
│   │   ├── admin/               # Admin management pages
│   │   │   ├── roles/           # Role management
│   │   │   ├── permissions/     # Permission management
│   │   │   └── users/           # User management
│   │   ├── api/                 # API routes
│   │   │   ├── auth/            # Authentication endpoints
│   │   │   ├── admin/           # Admin CRUD endpoints
│   │   │   └── notifications/   # Notification endpoints
│   │   └── access-denied/       # Access denied page
│   ├── components/
│   │   ├── auth/                # Auth components (PermissionGate)
│   │   ├── dashboard/           # Dashboard components
│   │   ├── layout/              # Layout components (Header, Sidebar)
│   │   └── ui/                  # Reusable UI components
│   ├── hooks/
│   │   ├── useAuth.ts           # Authentication hook
│   │   ├── usePermissions.ts    # Permission checking hook
│   │   └── useNotifications.ts  # Real-time notifications hook
│   ├── lib/
│   │   ├── auth.ts              # Authentication utilities
│   │   ├── permissions.ts       # Permission utilities
│   │   ├── audit.ts             # Audit logging utilities
│   │   ├── notifications.ts     # Notification utilities
│   │   ├── cache.ts             # Caching utilities
│   │   ├── excel-parser.ts      # Excel parsing utilities
│   │   └── prisma.ts            # Prisma client
│   └── middleware.ts            # Route protection middleware
├── prisma/
│   ├── schema.prisma            # Database schema
│   ├── migrations/              # Database migrations
│   └── seed.ts                  # Seed data
├── docs/
│   ├── RBAC_DOCUMENTATION.md    # Complete RBAC documentation
│   ├── API_REFERENCE.md         # API endpoints reference
│   ├── QUICK_START.md           # Quick start guide
│   ├── DEPLOYMENT_GUIDE.md      # Production deployment guide
│   └── SECURITY_BEST_PRACTICES.md # Security guidelines
├── CHANGELOG.md                 # Version history
└── README.md                    # This file
```

---

## 📚 Documentation

Comprehensive documentation available in `/docs`:

- **[RBAC Documentation](docs/RBAC_DOCUMENTATION.md)** - Complete RBAC system documentation
  - Architecture overview
  - Database schema
  - Permission system
  - API endpoints
  - UI components
  - Security features
  - Usage guide

- **[API Reference](docs/API_REFERENCE.md)** - Complete API documentation
  - All endpoints with examples
  - Request/response formats
  - Error handling
  - Authentication flow

- **[Quick Start Guide](docs/QUICK_START.md)** - Developer quick start
  - Setup instructions
  - Common tasks
  - Code examples
  - Testing guide

- **[Deployment Guide](docs/DEPLOYMENT_GUIDE.md)** - Production deployment
  - Environment setup
  - Database migration
  - PM2 / Docker / Vercel deployment
  - Nginx configuration
  - SSL setup
  - Monitoring

- **[Security Best Practices](docs/SECURITY_BEST_PRACTICES.md)** - Security guidelines
  - Authentication security
  - Authorization best practices
  - Data protection
  - Input validation
  - API security

---

## 🎨 Features Overview

### 1. Role-Based Access Control (RBAC)

Complete enterprise-grade RBAC system with:
- Granular permission-based access control
- Custom role creation with permission assignment
- Multi-role support per user
- System role protection
- Permission caching for performance

### 2. Admin Management

**Role Management** (`/admin/roles`)
- Create, edit, delete roles
- Assign permissions to roles
- View user count per role
- System role protection

**Permission Management** (`/admin/permissions`)
- View permissions grouped by module
- Create custom permissions
- Edit permission details
- View role count per permission

**User Management** (`/admin/users`)
- Create, edit, delete users
- Assign roles to users
- Activate/deactivate accounts
- View user statistics

### 3. Security Features

- JWT token-based authentication
- HTTP-only cookie storage
- Password hashing with bcrypt
- Permission checking at 3 layers (middleware, API, UI)
- Audit logging for compliance
- Real-time session validation
- CSRF protection
- XSS prevention
- SQL injection prevention

### 4. Real-time Notifications

- Server-Sent Events (SSE) for live updates
- Unread count badge
- Notification dropdown
- Mark as read functionality
- Graceful degradation on errors

### 5. Dynamic UI

- Permission-based menu filtering
- Search functionality for menus
- Loading states with skeletons
- Error handling with fallbacks
- Responsive design

---

## 🔐 Default System Roles

### ADMINISTRATOR
- Full system access
- All permissions granted
- Can manage roles, permissions, users

### DIREKTUR
- View dashboard and analytics
- View audit logs
- Export data
- Cannot manage system

### MARKETING
- Upload data (omzet, gross margin, retur)
- View dashboard
- Export data
- Cannot manage users/roles

### ACCOUNTING
- View dashboard and analytics
- View audit logs
- Export data
- Cannot upload data

---

## 🔑 Default Permissions

Permissions are organized by module:

**DASHBOARD**
- `view_dashboard` - Access dashboard pages
- `view_analytics` - View analytics and reports

**UPLOAD**
- `upload_omzet` - Upload omzet data
- `upload_gross_margin` - Upload gross margin data
- `upload_retur` - Upload retur data
- `delete_upload` - Delete uploaded data

**SETTINGS**
- `manage_categories` - Manage product categories
- `manage_targets` - Manage sales targets
- `manage_users` - Manage user accounts

**AUDIT**
- `view_audit_log` - View audit logs
- `manage_roles` - Manage roles
- `manage_permissions` - Manage permissions

**EXPORT**
- `export_data` - Export data to Excel/PDF

---

## 🔨 Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Database
npx prisma studio    # Open Prisma Studio
npx prisma generate  # Generate Prisma Client
npx prisma migrate dev           # Create migration
npx prisma migrate deploy        # Apply migrations (production)
npx prisma db seed              # Seed database

# Code Quality
npm run lint         # Run ESLint
npm run format       # Format code with Prettier (if configured)
```

### Database Commands

```bash
# View database in browser
npx prisma studio

# Create new migration
npx prisma migrate dev --name migration_name

# Reset database (⚠️ DELETES ALL DATA)
npx prisma migrate reset

# Generate Prisma Client after schema changes
npx prisma generate
```

---

## 🧪 Testing

### Manual Testing Checklist

- [ ] Login/Logout functionality
- [ ] Permission-based menu filtering
- [ ] Role CRUD operations
- [ ] Permission CRUD operations
- [ ] User CRUD operations
- [ ] Notification system
- [ ] Search functionality
- [ ] Access denied page
- [ ] Audit logging

### API Testing

Use provided examples in [API Reference](docs/API_REFERENCE.md) with:
- curl
- Postman
- Insomnia
- Browser fetch API

---

## 📦 Deployment

See [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) for detailed instructions.

### Quick Deploy Options

**Option 1: PM2**
```bash
npm run build
pm2 start ecosystem.config.js
```

**Option 2: Docker**
```bash
docker-compose up -d
```

**Option 3: Vercel**
```bash
vercel --prod
```

---

## 🔒 Security

### Production Security Checklist

- [ ] Change default admin password
- [ ] Use strong JWT_SECRET (min 32 chars)
- [ ] Enable HTTPS
- [ ] Set secure cookie flags
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Set up firewall rules
- [ ] Regular security audits
- [ ] Keep dependencies updated

See [Security Best Practices](docs/SECURITY_BEST_PRACTICES.md) for comprehensive guidelines.

---

## 🐛 Troubleshooting

### Common Issues

**Database connection failed**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
psql -U username -d database_name
```

**Permission cache not updating**
```typescript
// Clear cache manually
import { clearPermissionCache } from '@/lib/permissions';
await clearPermissionCache();
```

**Sidebar not showing**
- Wait 3 seconds for permission timeout
- Check browser console for errors
- Verify `/api/auth/permissions` endpoint

See documentation for more troubleshooting tips.

---

## 📈 Performance

### Optimization Features

- Permission caching (5-minute TTL)
- Efficient database queries with Prisma
- Server-side rendering with Next.js
- SSE for real-time updates (no polling)
- Lazy loading for components

### Production Recommendations

- Use Redis for caching
- Enable CDN for static assets
- Configure database connection pooling
- Set up load balancing
- Monitor with APM tools

---

## 🔄 Version History

See [CHANGELOG.md](CHANGELOG.md) for detailed version history.

### Latest Version: 1.0.0 (2024-01-23)

Major features:
- Complete RBAC system
- Role, Permission, User management
- Real-time notifications
- Audit logging
- Dynamic menu filtering
- Search functionality

---

## 🤝 Contributing

### Development Workflow

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Create pull request
5. Code review
6. Merge to main

### Code Style

- Follow existing code patterns
- Use TypeScript strict mode
- Add JSDoc comments
- Write meaningful commit messages
- Update documentation

---

## 📝 License

[Add your license here]

---

## 👥 Team

Development Team - ETM Project

---

## 📞 Support

For issues or questions:

1. Check documentation in `/docs`
2. Review [Troubleshooting](#troubleshooting) section
3. Check browser console for errors
4. Review audit logs in database
5. Contact system administrator

---

## 🎯 Roadmap

### Upcoming Features

- [ ] Two-factor authentication (2FA)
- [ ] Password reset via email
- [ ] User profile management
- [ ] Advanced analytics dashboard
- [ ] Bulk user operations
- [ ] Permission groups
- [ ] Email notifications
- [ ] Advanced audit log filtering
- [ ] API rate limiting
- [ ] Keyboard shortcuts
- [ ] Dark/Light mode toggle
- [ ] Mobile app

---

## 🙏 Acknowledgments

Built with:
- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)
- [TypeScript](https://www.typescriptlang.org/)

---

**Last Updated:** 2024-01-23

**Version:** 1.0.0

---

For detailed documentation, see the `/docs` folder.

Happy coding! 🚀

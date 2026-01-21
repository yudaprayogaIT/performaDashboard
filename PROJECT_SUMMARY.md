# 📊 Sales Dashboard - Project Summary & Progress Report

**Project Name**: SalesMonitor Pro Admin (Performa Dashboard)
**Purpose**: Sales performance tracking dashboard untuk LOCAL (Bogor & sekitar) dan CABANG (luar Bogor)
**Tech Stack**: Next.js 15 + TypeScript + Tailwind CSS + MySQL + Prisma 6
**Created**: January 2026
**Last Updated**: January 21, 2026

---

## 🎯 Project Overview

Dashboard untuk monitoring penjualan dengan fitur:

- **Multi-location tracking**: LOCAL (Bogor area) vs CABANG (luar Bogor)
- **Category-based analysis**: 17 product categories
- **Time-series trends**: Daily, Weekly, Monthly, Quarterly, Semester, Yearly
- **Target tracking**: Monthly/yearly targets dengan achievement percentage
- **Excel upload**: Bulk upload sales data dari Excel files
- **Role-based access**: Admin, Direktur, Manager, Uploader roles
- **Authentication**: JWT-based authentication dengan cookie storage

---

## 🛠️ Tech Stack & Dependencies

### **Frontend**

````json"next": "^15.1.0"              // Next.js 15 (App Router)
"react": "^19.0.0"             // React 19
"typescript": "^5.0.0"         // TypeScript
"tailwindcss": "^3.4.0"        // Tailwind CSS
"recharts": "^3.6.0"           // Charts library
"clsx": "^2.1.1"               // Utility for className
"tailwind-merge": "^3.4.0"     // Merge Tailwind classes
"lucide-react": "^0.562.0"     // Icons (optional)

### **Backend & Database**
```json"@prisma/client": "^6.19.2"    // Prisma ORM Client
"prisma": "^6.19.2"            // Prisma CLI
"bcryptjs": "^3.0.3"           // Password hashing
"jsonwebtoken": "^9.0.3"       // JWT token management
"@types/jsonwebtoken": "^9.x"  // TypeScript types for JWT
"ts-node": "^10.9.2"           // For running seed.ts

### **Database**: MySQL 5.7+ (via XAMPP/phpMyAdmin)
- Database name: `performa_dashboard`
- Connection: `mysql://root:@localhost:3306/performa_dashboard`

---

## 📁 Project StructureperformaDashboard/
├── prisma/
│   ├── schema.prisma              # Database schema definition
│   ├── seed.ts                    # Initial data seeding script
│   └── prisma.config.ts           # Prisma config (unused in v6)
│
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root layout
│   │   ├── page.tsx               # Landing page
│   │   ├── globals.css            # Global styles + animations
│   │   │
│   │   ├── (auth)/                # Authentication routes
│   │   │   ├── layout.tsx         # Auth layout (glassmorphism)
│   │   │   └── login/
│   │   │       └── page.tsx       # ✅ Login page (connected to API)
│   │   │
│   │   ├── (dashboard)/           # Protected dashboard routes
│   │   │   ├── layout.tsx         # Dashboard layout (Sidebar + Header)
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx       # ✅ Main dashboard with charts
│   │   │   │
│   │   │   ├── upload/
│   │   │   │   └── page.tsx       # ✅ Upload Excel data page
│   │   │   │
│   │   │   └── settings/
│   │   │       └── branches/
│   │   │           └── page.tsx   # ✅ Master Branches CRUD
│   │   │
│   │   └── api/                   # API Routes (Backend)
│   │       ├── auth/
│   │       │   ├── login/
│   │       │   │   └── route.ts   # ✅ POST - Login endpoint
│   │       │   ├── logout/
│   │       │   │   └── route.ts   # ✅ POST - Logout endpoint
│   │       │   └── me/
│   │       │       └── route.ts   # ✅ GET - Current user info
│   │       │
│   │       ├── locations/
│   │       │   ├── route.ts       # ✅ GET all, POST create
│   │       │   └── [id]/
│   │       │       └── route.ts   # ✅ GET by ID, PUT update, DELETE
│   │       │
│   │       └── categories/
│   │           └── route.ts       # ✅ GET all, POST create
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── sidebar.tsx        # ✅ Sidebar with user info & logout
│   │   │   └── header.tsx         # ✅ Top header
│   │   │
│   │   ├── ui/
│   │   │   ├── modal.tsx          # ✅ Reusable modal component
│   │   │   └── confirm-modal.tsx  # ✅ Confirmation modal component
│   │   │
│   │   ├── dashboard/
│   │   │   ├── stats-card.tsx              # ✅ Summary cards
│   │   │   ├── category-table.tsx          # ✅ Category performance table
│   │   │   ├── month-filter.tsx            # ✅ Month/Year selector
│   │   │   ├── period-selector.tsx         # ✅ Period toggle (daily/weekly/etc)
│   │   │   ├── comparison-card.tsx         # ✅ vs Yesterday/Week/Month
│   │   │   ├── trend-chart.tsx             # ✅ Line chart (Recharts)
│   │   │   └── category-trend-chart.tsx    # ✅ Bar chart (Recharts)
│   │   │
│   │   ├── upload/
│   │   │   ├── file-uploader.tsx           # ✅ Drag & drop uploader
│   │   │   └── file-preview.tsx            # ✅ File preview component
│   │   │
│   │   └── forms/
│   │       └── login-form.tsx              # ✅ Login form with loading/error states
│   │
│   ├── hooks/
│   │   └── useAuth.ts             # ✅ Authentication hook
│   │
│   ├── lib/
│   │   ├── prisma.ts              # ✅ Prisma client singleton
│   │   ├── auth.ts                # ✅ Auth helpers (JWT, password, cookies)
│   │   ├── utils.ts               # ✅ Helper functions (formatCurrency, etc)
│   │   ├── mock-data.ts           # ✅ Mock category sales data
│   │   ├── mock-data-daily.ts     # ✅ Mock time series data
│   │   └── data-aggregator.ts     # ✅ Period aggregation logic
│   │
│   ├── middleware.ts              # ✅ Route protection middleware
│   │
│   └── types/
│       ├── auth.ts                # ✅ Auth types
│       └── sales.ts               # ✅ Sales data types
│
├── .env                           # Database + JWT configuration
├── .env.local                     # Next.js environment variables
├── package.json                   # Dependencies & scripts
├── tsconfig.json                  # TypeScript config
├── tailwind.config.ts             # Tailwind config
├── next.config.ts                 # Next.js config
│
├── DATABASE_SETUP.md              # ✅ Database setup guide
├── PROJECT_SUMMARY.md             # ✅ This file (project documentation)
└── QUICK_REFERENCE.md             # ✅ Quick reference guide

---

## 🗄️ Database Schema

### **Complete Table Structure** (11 tables total)

#### **1. Users & Authentication**
```sqlusers                    # User accounts
├── id                   # INT PRIMARY KEY
├── name                 # VARCHAR(100)
├── email                # VARCHAR(100) UNIQUE
├── password             # VARCHAR(255) hashed with bcrypt
├── is_active            # BOOLEAN
├── created_at           # TIMESTAMP
├── created_by           # INT (nullable) - audit field
├── updated_at           # TIMESTAMP
├── updated_by           # INT (nullable) - audit field
├── last_login_at        # TIMESTAMP (nullable) - login tracking
└── last_login_ip        # VARCHAR(45) (nullable) - login trackingroles                    # User roles (Super Admin, Direktur, Manager, Uploader)
├── id                   # INT PRIMARY KEY
├── name                 # VARCHAR(50) UNIQUE
├── description          # VARCHAR(255)
├── is_active            # BOOLEAN
├── created_at           # TIMESTAMP
├── created_by           # INT (nullable)
├── updated_at           # TIMESTAMP
└── updated_by           # INT (nullable)permissions              # Granular permissions
├── id                   # INT PRIMARY KEY
├── name                 # VARCHAR(100) UNIQUE (e.g., 'sales.upload')
├── description          # VARCHAR(255)
├── module               # VARCHAR(50) (e.g., 'dashboard', 'sales')
├── created_at           # TIMESTAMP
├── created_by           # INT (nullable)
├── updated_at           # TIMESTAMP
└── updated_by           # INT (nullable)user_roles               # Many-to-many: users ↔ roles
├── user_id              # INT
├── role_id              # INT
├── created_at           # TIMESTAMP
└── created_by           # INT (nullable)role_permissions         # Many-to-many: roles ↔ permissions
├── role_id              # INT
├── permission_id        # INT
├── created_at           # TIMESTAMP
└── created_by           # INT (nullable)

#### **2. Master Data**
```sqllocations                # Branches (LOCAL & CABANG)
├── id                   # INT PRIMARY KEY
├── code                 # VARCHAR(20) UNIQUE (e.g., 'LOCAL-BGR', 'CABANG-JKT')
├── name                 # VARCHAR(100) (e.g., 'Bogor Pusat')
├── type                 # ENUM('LOCAL', 'CABANG')
├── address              # TEXT (optional)
├── is_active            # BOOLEAN
├── created_at           # TIMESTAMP
├── created_by           # INT (nullable)
├── updated_at           # TIMESTAMP
└── updated_by           # INT (nullable)categories               # Product categories (17 categories)
├── id                   # INT PRIMARY KEY
├── name                 # VARCHAR(100) UNIQUE (e.g., 'FURNITURE')
├── description          # VARCHAR(255)
├── sort_order           # INT
├── is_active            # BOOLEAN
├── created_at           # TIMESTAMP
├── created_by           # INT (nullable)
├── updated_at           # TIMESTAMP
└── updated_by           # INT (nullable)

#### **3. Sales Data**
```sqlsales                    # Transaction data
├── id                   # BIGINT PRIMARY KEY
├── sale_date            # DATE
├── location_id          # INT (FK to locations)
├── category_id          # INT (FK to categories)
├── item_name            # VARCHAR(255) (optional)
├── quantity             # INT
├── amount               # DECIMAL(20,2) - Sales amount
├── notes                # TEXT (optional)
├── upload_batch_id      # INT (FK to upload_batches)
├── created_at           # TIMESTAMP
├── created_by           # INT (nullable)
├── updated_at           # TIMESTAMP
└── updated_by           # INT (nullable)sales_daily_summary      # Aggregated daily data for performance
├── id                   # BIGINT PRIMARY KEY
├── summary_date         # DATE
├── location_type        # ENUM('LOCAL', 'CABANG')
├── category_id          # INT (FK to categories)
├── total_amount         # DECIMAL(20,2)
├── transaction_count    # INT
├── created_at           # TIMESTAMP
├── created_by           # INT (nullable)
├── updated_at           # TIMESTAMP
└── updated_by           # INT (nullable)

#### **4. Targets & Upload Logs**
```sqltargets                  # Monthly/Yearly sales targets
├── id                   # INT PRIMARY KEY
├── year                 # INT (e.g., 2026)
├── month                # INT (1-12, or 0 for yearly)
├── location_type        # ENUM('LOCAL', 'CABANG')
├── category_id          # INT (FK to categories, NULL for total)
├── target_amount        # DECIMAL(20,2)
├── created_at           # TIMESTAMP
├── created_by           # INT (nullable)
├── updated_at           # TIMESTAMP
└── updated_by           # INT (nullable)upload_batches           # Upload history logs
├── id                   # INT PRIMARY KEY
├── uploaded_by          # INT (FK to users)
├── filename             # VARCHAR(255)
├── file_size            # INT
├── period_month         # INT
├── period_year          # INT
├── records_count        # INT
├── status               # ENUM('PROCESSING', 'SUCCESS', 'FAILED', 'PARTIAL')
├── error_message        # TEXT
├── created_at           # TIMESTAMP
├── created_by           # INT (nullable)
├── updated_at           # TIMESTAMP
├── updated_by           # INT (nullable)
└── completed_at         # TIMESTAMP

---

## 🔐 Authentication System

### **How It Works**┌─────────────────────────────────────────────────────────────────┐
│  1. LOGIN FLOW                                                  │
├─────────────────────────────────────────────────────────────────┤
│  User submits email/password                                    │
│       │                                                         │
│       ▼                                                         │
│  POST /api/auth/login                                           │
│       │                                                         │
│       ├── Verify password (bcrypt)                              │
│       ├── Generate JWT token                                    │
│       ├── Update lastLoginAt & lastLoginIp                      │
│       └── Set HttpOnly cookie (auth_token)                      │
│       │                                                         │
│       ▼                                                         │
│  Redirect to /dashboard                                         │
└─────────────────────────────────────────────────────────────────┘┌─────────────────────────────────────────────────────────────────┐
│  2. PROTECTED ROUTES (Middleware)                               │
├─────────────────────────────────────────────────────────────────┤
│  Every request to protected route                               │
│       │                                                         │
│       ▼                                                         │
│  Middleware checks for auth_token cookie                        │
│       │                                                         │
│       ├── No token → Redirect to /login                         │
│       └── Has token → Continue to page                          │
└─────────────────────────────────────────────────────────────────┘┌─────────────────────────────────────────────────────────────────┐
│  3. GET CURRENT USER                                            │
├─────────────────────────────────────────────────────────────────┤
│  GET /api/auth/me                                               │
│       │                                                         │
│       ├── Extract token from cookie                             │
│       ├── Verify JWT signature                                  │
│       └── Return user data + roles + permissions                │
└─────────────────────────────────────────────────────────────────┘┌─────────────────────────────────────────────────────────────────┐
│  4. LOGOUT                                                      │
├─────────────────────────────────────────────────────────────────┤
│  POST /api/auth/logout                                          │
│       │                                                         │
│       └── Clear auth_token cookie (maxAge: 0)                   │
│       │                                                         │
│       ▼                                                         │
│  Redirect to /login                                             │
└─────────────────────────────────────────────────────────────────┘

### **JWT Token Structure**
```typescript{
userId: number;
email: string;
name: string;
roles: string[];
exp: number; // Expiration timestamp
}

### **Cookie Configuration**
```typescript{
httpOnly: true,        // Prevent XSS
secure: true,          // HTTPS only (production)
sameSite: "lax",       // Prevent CSRF
maxAge: 7 * 24 * 60 * 60, // 7 days
path: "/",
}

---

## 🌱 Seeded Data (Initial Data)

### **Locations (15 total)**

**LOCAL Branches (5)** - Bogor & Sekitar:
LOCAL-BGR    | Bogor Pusat      | Jl. Pajajaran, Bogor
LOCAL-CBI    | Cibinong         | Jl. Raya Cibinong, Bogor
LOCAL-CGR    | Citeureup        | Jl. Raya Citeureup, Bogor
LOCAL-DRM    | Dramaga          | Jl. Raya Dramaga, Bogor
LOCAL-GNL    | Gunung Putri     | Jl. Raya Gunung Putri, Bogor


**CABANG Branches (10)** - Luar Bogor:
CABANG-JKT   | Jakarta Pusat    | Jl. Sudirman, Jakarta
CABANG-BKS   | Bekasi           | Jl. Ahmad Yani, Bekasi
CABANG-DPK   | Depok            | Jl. Margonda Raya, Depok
CABANG-TGR   | Tangerang        | Jl. Sudirman, Tangerang
CABANG-BDG   | Bandung          | Jl. Dago, Bandung
CABANG-SMG   | Semarang         | Jl. Pemuda, Semarang
CABANG-SBY   | Surabaya         | Jl. Tunjungan, Surabaya
CABANG-YGY   | Yogyakarta       | Jl. Malioboro, Yogyakarta
CABANG-MLG   | Malang           | Jl. Ijen, Malang
CABANG-SKA  | Solo             | Jl. Slamet Riyadi, Solo


### **Categories (17 total)**
ACCESSORIES              11. NON WOVEN
BAHAN KIMIA              12. OTHER
BUSA                     13. PER COIL
HDP                      14. PITA LIST
JASA                     15. PLASTIC
KAIN POLOS SOFA          16. STAPLESS
KAIN POLOS SPRINGBED     17. FURNITURE
KAIN QUILTING
MSP
KAWAT


### **Users (3 total)**
administrator@performa.com  | ekatunggal123  | Super Admin
direktur@performa.com       | password123    | Direktur
uploader@performa.com       | password123    | Uploader


### **Roles & Permissions**Roles (4):

Super Admin    (all 12 permissions)
Direktur       (dashboard.view, dashboard.export, sales.view.*)
Manager        (dashboard.view, sales.view.local, sales.view.cabang)
Uploader       (dashboard.view, sales.upload)
Permissions (12 total):

dashboard.view, dashboard.export
sales.upload, sales.view.local, sales.view.cabang, sales.view.all, sales.delete
settings.users, settings.roles, settings.categories, settings.locations, settings.targets


---

## 🔌 API Endpoints (Backend)

### **Authentication API** - ✅ Completed

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/login` | Login & get token | No |
| POST | `/api/auth/logout` | Logout & clear cookie | Yes |
| GET | `/api/auth/me` | Get current user info | Yes |

### **Locations (Branches) API** - ✅ Completed

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/locations` | Get all locations | Yes |
| GET | `/api/locations?type=LOCAL` | Filter by type | Yes |
| POST | `/api/locations` | Create location | Yes |
| GET | `/api/locations/[id]` | Get by ID | Yes |
| PUT | `/api/locations/[id]` | Update location | Yes |
| DELETE | `/api/locations/[id]` | Delete location | Yes |

### **Categories API** - ⚠️ Partial

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/categories` | Get all categories | Yes |
| POST | `/api/categories` | Create category | Yes |

---

## 🎨 Frontend Pages & Features

### **1. Login Page** (`/login`) - ✅ Completed

**Features:**
- Email + Password form
- Loading state dengan spinner
- Error message display
- Redirect to callback URL after login
- Auto-redirect to dashboard if already logged in

### **2. Dashboard Overview** (`/dashboard`) - ✅ Completed (Mock Data)

**Features:**
- 3 Summary Cards: Total Sales, Sales Local, Sales Cabang
- 4 Quick Stats: Total Target, Total Omzet, Achievement %, Categories
- Period Selector: Daily/Weekly/Monthly/Quarterly/Semester/Yearly
- 5 Comparison Cards: vs Kemarin, vs Minggu Lalu, vs Bulan Lalu
- 2 Interactive Charts: Line Chart (Trend), Bar Chart (Categories)
- Category Performance Table
- Month/Year Filter

### **3. Upload Page** (`/upload`) - ⚠️ UI Only

**Features:**
- Drag & Drop Uploader
- File Preview
- Data Preview Table
- Progress Indicator

**Status**: Frontend selesai, backend belum

### **4. Settings > Branches** (`/settings/branches`) - ✅ Completed

**Features:**
- Full CRUD Operations
- Filter Tabs: All, LOCAL, CABANG
- Stats Cards
- Form Modal with validation
- Delete Protection

---

## 📊 Reusable Components

### **UI Components**

| Component | File | Purpose |
|-----------|------|---------|
| Modal | `ui/modal.tsx` | Base modal with backdrop, close on escape |
| ConfirmModal | `ui/confirm-modal.tsx` | Confirmation dialog (danger/warning/info) |

### **Layout Components**

| Component | File | Purpose |
|-----------|------|---------|
| Sidebar | `layout/sidebar.tsx` | Navigation + User info + Logout |
| Header | `layout/header.tsx` | Top navigation header |

### **Dashboard Components**

| Component | File | Purpose |
|-----------|------|---------|
| StatsCard | `dashboard/stats-card.tsx` | Summary cards with progress bar |
| ComparisonCard | `dashboard/comparison-card.tsx` | Comparison cards |
| CategoryTable | `dashboard/category-table.tsx` | Category performance table |
| TrendChart | `dashboard/trend-chart.tsx` | Line chart (Recharts) |
| CategoryTrendChart | `dashboard/category-trend-chart.tsx` | Bar chart |
| MonthFilter | `dashboard/month-filter.tsx` | Month/Year dropdown |
| PeriodSelector | `dashboard/period-selector.tsx` | Period toggle buttons |

### **Form Components**

| Component | File | Purpose |
|-----------|------|---------|
| LoginForm | `forms/login-form.tsx` | Login form with loading/error |
| FileUploader | `upload/file-uploader.tsx` | Drag & drop file upload |
| FilePreview | `upload/file-preview.tsx` | Uploaded file preview |

---

## 🪝 Custom Hooks

### **useAuth** (`src/hooks/useAuth.ts`)
```typescriptconst {
user,           // Current user data
isLoading,      // Loading state
isAuthenticated,// Auth status
logout,         // Logout function
refetch,        // Refetch user data
getInitials,    // Get user initials (e.g., "AU")
getPrimaryRole, // Get first role
hasPermission,  // Check permission
hasRole,        // Check role
} = useAuth();

---

## 🔧 Helper Functions

### **`src/lib/auth.ts`**
```typescripthashPassword()      // Hash password with bcrypt
verifyPassword()    // Verify password
generateToken()     // Generate JWT token
verifyToken()       // Verify JWT token
AUTH_COOKIE_NAME    // Cookie name constant
COOKIE_OPTIONS      // Cookie configuration

### **`src/lib/utils.ts`**
```typescriptcn()                    // Merge Tailwind classes
formatCurrency()        // Format to Rupiah
formatNumber()          // Format with thousand separator
calculatePercentage()   // Calculate percentage
formatPercentage()      // Format percentage

---

## 🚀 NPM Scripts
```bashnpm run dev          # Start development server (port 3000)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLintnpm run db:push      # Push Prisma schema to MySQL
npm run db:seed      # Seed initial data
npm run db:studio    # Open Prisma Studio (DB GUI)

---

## ✅ Completed Features

### **Backend:**
- ✅ Prisma ORM setup dengan MySQL
- ✅ Database schema design (11 tables with audit fields)
- ✅ Seed script dengan initial data
- ✅ JWT Authentication (login, logout, me)
- ✅ Password hashing with bcrypt
- ✅ Route protection middleware
- ✅ RESTful API untuk Locations (full CRUD)
- ✅ RESTful API untuk Categories (partial)

### **Frontend:**
- ✅ Login page dengan API integration
- ✅ Dashboard overview dengan interactive charts
- ✅ Sidebar dengan user info & logout modal
- ✅ Reusable Modal components
- ✅ useAuth hook untuk auth state management
- ✅ Settings > Branches CRUD page
- ✅ Upload page UI

---

## 🚧 TODO / Next Steps

### **High Priority:**

1. **CRUD Users** ⭐⭐⭐
   - `/api/users` endpoints
   - `/settings/users` page
   - Create, edit, delete users
   - Assign roles to users
   - Change password functionality

2. **Excel Upload Backend** ⭐⭐⭐
   - Parse Excel files (SheetJS/xlsx library)
   - Validate data
   - Bulk insert to `sales` table
   - Error handling & logging

3. **Real Sales Data Integration** ⭐⭐⭐
   - Replace mock data dengan real API calls
   - `/api/sales` endpoints
   - `/api/dashboard/summary` endpoint
   - `/api/dashboard/trends` endpoint

### **Medium Priority:**

4. **Settings Pages** ⭐⭐
   - Master Categories page (CRUD)
   - Setting Target page
   - Roles & Permissions management

5. **Report Pages** ⭐⭐
   - `/reports/local`
   - `/reports/cabang`
   - `/reports/kategori`
   - Export to Excel/PDF

### **Low Priority:**

6. **Enhancements** ⭐
   - Forgot password functionality
   - Email notifications
   - Activity logs
   - Dark/Light mode toggle

---

## 📊 Current Progress

| Area | Progress | Status |
|------|----------|--------|
| Database Schema | 100% | ✅ Complete |
| Authentication | 100% | ✅ Complete |
| Backend API | 40% | ⚠️ In Progress |
| Frontend UI | 65% | ⚠️ In Progress |
| **Overall** | **~55%** | 🚧 Active Development |

---

## 🔐 Credentials

### **Admin (Super Admin):**Email: administrator@performa.com
Password: ekatunggal123

### **Test Users:**Email: direktur@performa.com
Password: password123Email: uploader@performa.com
Password: password123

### **Database:**
```envDATABASE_URL="mysql://root:@localhost:3306/performa_dashboard"
JWT_SECRET="salesmonitor-super-secret-key-2026-ganti-ini-di-production"
JWT_EXPIRES_IN="7d"

---

**Last Updated**: January 21, 2026
**Version**: 0.2.0
**Status**: Active Development 🚧
````

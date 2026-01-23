# ⚡ Quick Reference Guide

Cheat sheet untuk development Performa Dashboard.

---

## 🚀 Quick Start Commands

```bash
# Development
npm run dev              # Start dev server → http://localhost:3000

# Database
npm run db:push          # Push schema changes to MySQL
npm run db:seed          # Seed initial data
npm run db:studio        # Open Prisma Studio GUI → http://localhost:5555
npx prisma db push --force-reset  # Reset & recreate all tables

# Build
npm run build            # Build for production
npm run start            # Start production server
```

---

## 🔗 Important URLs

```
Frontend Dev:     http://localhost:3000
Dashboard:        http://localhost:3000/dashboard
Login:            http://localhost:3000/login
Branches:         http://localhost:3000/settings/branches
Upload:           http://localhost:3000/upload

Prisma Studio:    http://localhost:5555
phpMyAdmin:       http://localhost/phpmyadmin
```

## 🎯 New Features (v0.3.3)

### **Gross Margin Tracking**

- Added gross margin to comparison cards
- Each card shows both Omzet and Gross Margin with separate comparisons
- Different margin rates: LOCAL (25-30%), CABANG (20-25%)
- Gross Margin = Omzet - HPP (Harga Pokok Penjualan)

### **Multiple Excel Templates**

- 2 separate templates: Penjualan & Gross Margin
- Download dropdown untuk pilih template yang diinginkan
- Upload page with data type selection (Penjualan or Gross Margin)
- Different preview table based on selected data type

### **Calculation Documentation**

📚 Comprehensive documentation available:

- **`CALCULATION_DOCUMENTATION.md`** - Technical documentation
  - Detailed formulas and calculations
  - Calendar-based period logic
  - Data aggregation methods
  - Flow diagrams

- **`DASHBOARD_VISUAL_GUIDE.md`** - Quick visual guide
  - Easy-to-understand examples
  - Visual flow diagrams
  - FAQ and tips
  - Formula cheat sheet

**Recommended:** Read `DASHBOARD_VISUAL_GUIDE.md` first for overview, then `CALCULATION_DOCUMENTATION.md` for technical details.

### **Presentation Mode (v0.3.2)**

- Click "Presentation Mode" button di dashboard header
- Auto-carousel dengan 7 sections, auto-slide setiap 5 detik
- Sections: Summary, Multi-Period Comparison, Trends, LOCAL 1/2, LOCAL 2/2, CABANG 1/2, CABANG 2/2
- Keyboard shortcuts: ← → (navigate), P (pause), ESC (exit)
- ESC key exits immediately - no double press needed ✅
- **Pause functionality fixed** - manual pause tidak terganggu auto-resume ✅
- Manual navigation dengan dot indicators
- Achievement sections split into 2 pages (no scrolling needed)

### **Multi-Period Growth Comparisons (Calendar-Based) (v0.3.2)**

- 6 comparison cards: Daily, Weekly, Monthly, Quarterly, Semester, Yearly
- **Calendar-based comparisons** (bukan rolling days):
  - Weekly: Senin-Minggu vs Senin-Minggu sebelumnya
  - Monthly: Tanggal 1 - akhir bulan vs bulan sebelumnya
  - Quarterly: Q1 (Jan-Mar), Q2 (Apr-Jun), Q3 (Jul-Sep), Q4 (Oct-Dec)
  - Semester: S1 (Jan-Jun), S2 (Jul-Dec)
  - Yearly: Jan-Dec vs tahun sebelumnya
- Perfect untuk analisis trend dan pengambilan keputusan

### **Excel Templates (v0.3.2)**

Generate with: `npm run generate:template`

**Template 1: Penjualan**
- URL: `/templates/template_upload_penjualan.xlsx`
- Columns: tanggal, kode_lokasi, kategori, amount, catatan
- Sheet 1: Petunjuk Pengisian
- Sheet 2: Data Penjualan (30 hari sample)
- Sheet 3: Referensi Lokasi (15 lokasi)
- Sheet 4: Referensi Kategori (17 kategori)
- Sheet 5: Template Kosong

**Template 2: Gross Margin**
- URL: `/templates/template_upload_gross_margin.xlsx`
- Columns: tanggal, kode_lokasi, kategori, omzet, hpp, gross_margin, catatan
- Sheet 1: Petunjuk Pengisian
- Sheet 2: Data Gross Margin (30 hari sample dengan margin rate berbeda)
- Sheet 3: Referensi Lokasi (15 lokasi)
- Sheet 4: Referensi Kategori (17 kategori)
- Sheet 5: Template Kosong

**Upload Page:**
- Select data type before upload (Penjualan or Gross Margin)
- Download dropdown to choose template
- Preview table adapts to selected data type

### **Category Achievement Visualization**

- Grid layout 17 kategori cards dengan circular progress
- Color coding: 🔴 Red (<50%), 🟡 Yellow (50-75%), 🟢 Green (75-100%+)
- Terpisah untuk LOCAL dan CABANG
- Summary stats: Good/Average/Low counts

---

## 🔌 API Endpoints

### Authentication

```
POST   /api/auth/login     # Login (public)
POST   /api/auth/logout    # Logout (protected)
GET    /api/auth/me        # Get current user (protected)
```

### Locations

```
GET    /api/locations              # Get all
GET    /api/locations?type=LOCAL   # Filter by type
GET    /api/locations?type=CABANG
POST   /api/locations              # Create
GET    /api/locations/[id]         # Get by ID
PUT    /api/locations/[id]         # Update
DELETE /api/locations/[id]         # Delete
```

### Categories

```
GET    /api/categories     # Get all
POST   /api/categories     # Create
```

---

## 🗄️ Database

**Database**: `performa_dashboard`
**Connection**: `mysql://root:@localhost:3306/performa_dashboard`

**Tables (11):**

- users, roles, permissions, user_roles, role_permissions
- locations, categories
- sales, sales_daily_summary
- targets, upload_batches

**All tables have audit fields:**

- `created_at`, `created_by`
- `updated_at`, `updated_by`

**Users table additional fields:**

- `last_login_at`, `last_login_ip`

---

## 📁 Key File Locations

```
Database Schema:       prisma/schema.prisma
Seed Script:           prisma/seed.ts
Environment:           .env

API Routes:            src/app/api/
Pages:                 src/app/(dashboard)/ & src/app/(auth)/
Components:            src/components/
Hooks:                 src/hooks/
Types:                 src/types/
Utils:                 src/lib/

Auth Helper:           src/lib/auth.ts
Prisma Client:         src/lib/prisma.ts
Middleware:            src/middleware.ts
```

---

## 🎨 Component Imports

```typescript
// Layout
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";

// UI
import Modal from "@/components/ui/modal";
import ConfirmModal from "@/components/ui/confirm-modal";

// Dashboard
import StatsCard from "@/components/dashboard/stats-card";
import ComparisonCard from "@/components/dashboard/comparison-card";
import CategoryTable from "@/components/dashboard/category-table";
import TrendChart from "@/components/dashboard/trend-chart";
import CategoryAchievementPie from "@/components/dashboard/category-achievement-pie";
import CategoryAchievementCard from "@/components/dashboard/category-achievement-card";
import FullscreenCarousel from "@/components/dashboard/fullscreen-carousel";

// Hooks
import { useAuth } from "@/hooks/useAuth";
import { useFullscreen } from "@/hooks/useFullscreen";

// Utils
import { cn, formatCurrency, formatPercentage } from "@/lib/utils";
import prisma from "@/lib/prisma";
import { verifyToken, generateToken, hashPassword } from "@/lib/auth";
```

---

## 🔧 Common Code Snippets

### **Using useAuth Hook**

```typescript
const { user, isLoading, logout, hasPermission, hasRole } = useAuth();

// Check permission
if (hasPermission("settings.users")) {
  // Can manage users
}

// Check role
if (hasRole("Super Admin")) {
  // Is super admin
}
```

### **Using useFullscreen Hook**

```typescript
const { isFullscreen, toggleFullscreen, exitFullscreen } = useFullscreen();

// Toggle fullscreen
const handleEnterPresentation = async () => {
  await toggleFullscreen();
  setIsPresentationMode(true);
};

// Exit fullscreen
const handleExit = async () => {
  setIsPresentationMode(false);
  await exitFullscreen();
};

// Auto-exit presentation when fullscreen exits (e.g., ESC key)
useEffect(() => {
  if (!isFullscreen && isPresentationMode) {
    setIsPresentationMode(false);
  }
}, [isFullscreen, isPresentationMode]);
```

### **Category Achievement Visualization**

```typescript
import CategoryAchievementPie from "@/components/dashboard/category-achievement-pie";

<CategoryAchievementPie
  categories={mockCategories}
  type="local" // or "cabang"
  title="LOCAL Achievement (Bogor & Sekitar)"
/>
```

### **Fullscreen Carousel (Presentation Mode)**

```typescript
import FullscreenCarousel from "@/components/dashboard/fullscreen-carousel";

const sections = [
  <div key="section1">Section 1 Content</div>,
  <div key="section2">Section 2 Content</div>,
];

<FullscreenCarousel
  sections={sections}
  isActive={isPresentationMode}
  onExit={handleExitPresentationMode}
  autoPlayInterval={5000} // 5 seconds
/>
```

### **Multi-Period Comparison Calculations (Calendar-Based)**

```typescript
import {
  calculateComparison,
  calculateCalendarComparison,
  generateDailySalesData,
} from "@/lib/mock-data-daily";

// Generate 730 days (2 years) of data
const mockDailySales = generateDailySalesData(730);

// Daily: today vs yesterday
const comparisonDaily = calculateComparison(mockDailySales, "total", 1);

// Weekly: current week (Mon-Sun) vs previous week (Mon-Sun)
const comparisonWeekly = calculateCalendarComparison(mockDailySales, "total", "weekly");

// Monthly: current month (1st-end) vs previous month (1st-end)
const comparisonMonthly = calculateCalendarComparison(mockDailySales, "total", "monthly");

// Quarterly: current quarter vs previous quarter (Q1: Jan-Mar, Q2: Apr-Jun, etc)
const comparisonQuarterly = calculateCalendarComparison(mockDailySales, "total", "quarterly");

// Semester: current semester vs previous semester (S1: Jan-Jun, S2: Jul-Dec)
const comparisonSemester = calculateCalendarComparison(mockDailySales, "total", "semester");

// Yearly: current year (Jan-Dec) vs previous year (Jan-Dec)
const comparisonYearly = calculateCalendarComparison(mockDailySales, "total", "yearly");
```

### **Protected API Route Template**

```typescript
// src/app/api/example/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken, AUTH_COOKIE_NAME } from "@/lib/auth";

export async function GET(request: NextRequest) {
  // 1. Check auth
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  const { valid, payload } = verifyToken(token);
  if (!valid || !payload) {
    return NextResponse.json(
      { success: false, message: "Invalid token" },
      { status: 401 },
    );
  }

  // 2. Your logic here
  const data = await prisma.example.findMany();

  return NextResponse.json({ success: true, data });
}
```

### **Modal Usage**

```typescript
const [showModal, setShowModal] = useState(false);

<ConfirmModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onConfirm={handleConfirm}
  title="Delete Item"
  message="Are you sure you want to delete this item?"
  confirmText="Delete"
  variant="danger"
  isLoading={isDeleting}
/>
```

### **Prisma Query with Audit Fields**

```typescript
// Create with audit
await prisma.location.create({
  data: {
    code: "LOCAL-NEW",
    name: "New Location",
    type: "LOCAL",
    createdBy: userId, // From JWT payload
  },
});

// Update with audit
await prisma.location.update({
  where: { id },
  data: {
    name: "Updated Name",
    updatedBy: userId,
  },
});
```

---

## 🔐 Authentication Flow

```
1. User visits /dashboard (protected)
        │
        ▼
2. Middleware checks cookie
        │
        ├── No cookie → Redirect to /login
        │
        ▼
3. User logs in via /api/auth/login
        │
        ▼
4. Server returns JWT in HttpOnly cookie
        │
        ▼
5. Redirect to /dashboard
        │
        ▼
6. useAuth hook fetches /api/auth/me
        │
        ▼
7. Sidebar shows user info
```

---

## 🐛 Troubleshooting

### **Port already in use**

```bash
# Next.js will auto-select next available port
# Or kill the process using the port
```

### **Cannot connect to MySQL**

```bash
# 1. Check if MySQL is running (XAMPP)
# 2. Verify .env file connection string
# 3. Check database exists
```

### **Prisma Client not generated**

```bash
npx prisma generate
```

### **Database out of sync**

```bash
npm run db:push
```

### **Reset database (CAUTION!)**

```bash
npx prisma db push --force-reset
npm run db:seed
```

### **JWT errors**

```bash
# Check .env has JWT_SECRET
# Check token format (should have 3 parts: header.payload.signature)
```

---

## 🔐 Test Credentials

```
Super Admin:
  Email: administrator@performa.com
  Password: ekatunggal123

Direktur:
  Email: direktur@performa.com
  Password: password123

Uploader:
  Email: uploader@performa.com
  Password: password123
```

---

## 🎯 Next Task Priorities

1. ⭐⭐⭐ CRUD Users (API + Page)
2. ⭐⭐⭐ Excel Upload Backend
3. ⭐⭐⭐ Real Sales Data API
4. ⭐⭐ Settings > Categories page
5. ⭐⭐ Settings > Targets page
6. ⭐ Report pages

---

## 📊 Current Progress

- Database: ✅ 100%
- Authentication: ✅ 100%
- Backend API: ⚠️ 40%
- Frontend UI: ⚠️ 75%
- Data Visualization: ⚠️ 80%
- **Overall: ~62%**

### **v0.3.2 Updates (January 22, 2026)**

- ✅ Calendar-Based Period Comparisons (Weekly: Mon-Sun, Monthly: 1st-end, etc)
- ✅ Excel Template Generator dengan sample data
- ✅ Fixed Pause functionality - manual pause works correctly
- ✅ Trend Chart dengan calendar-based aggregation
- ✅ NPM script `npm run generate:template`

### **v0.3.1 Updates (January 21, 2026)**

- ✅ Category Achievement Visualization
- ✅ Presentation Mode (Fullscreen Carousel with 7 sections)
- ✅ 6 Multi-Period Comparison Cards (Daily → Yearly)
- ✅ Split achievement sections (1/2, 2/2) - no scrolling
- ✅ Fixed ESC key - single press exits immediately
- ✅ Color-coded achievement indicators
- ✅ Auto-slide every 5 seconds
- ✅ Keyboard controls for presentations
- ✅ Mock data: 730 days (2 years)

---

**Keep Coding! 🚀**

# ⚡ Quick Reference Guide

Cheat sheet untuk development Sales Dashboard.

---

## 🚀 Quick Start Commands

```bash
# Development
npm run dev              # Start dev server → http://localhost:3001

# Database
npm run db:push          # Push schema changes to MySQL
npm run db:seed          # Seed initial data
npm run db:studio        # Open Prisma Studio GUI → http://localhost:5555

# Build
npm run build            # Build for production
npm run start            # Start production server
```

---

## 🔗 Important URLs

```
Frontend Dev:     http://localhost:3001
Dashboard:        http://localhost:3001/dashboard
Branches:         http://localhost:3001/settings/branches
Upload:           http://localhost:3001/upload
Login:            http://localhost:3001/login

Prisma Studio:    http://localhost:5555
phpMyAdmin:       http://localhost/phpmyadmin

API Endpoints:
GET    /api/locations
GET    /api/locations?type=LOCAL
GET    /api/locations?type=CABANG
POST   /api/locations
GET    /api/categories
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

**Seeded Data:**
- 15 locations (5 LOCAL + 10 CABANG)
- 17 categories
- 1 admin user (admin@salesmonitor.com / admin123)
- 4 roles (Super Admin, Direktur, Manager, Uploader)
- 12 permissions

---

## 📁 Key File Locations

```
Database Schema:       prisma/schema.prisma
Seed Script:          prisma/seed.ts
Environment:          .env

API Routes:           src/app/api/
Pages:                src/app/(dashboard)/
Components:           src/components/
Types:                src/types/
Utils:                src/lib/

Prisma Client:        src/lib/prisma.ts
Mock Data:            src/lib/mock-data.ts
                      src/lib/mock-data-daily.ts
Data Aggregator:      src/lib/data-aggregator.ts
```

---

## 🎨 Component Imports

```typescript
// Layout
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";

// Dashboard
import StatsCard from "@/components/dashboard/stats-card";
import ComparisonCard from "@/components/dashboard/comparison-card";
import CategoryTable from "@/components/dashboard/category-table";
import TrendChart from "@/components/dashboard/trend-chart";
import CategoryTrendChart from "@/components/dashboard/category-trend-chart";
import MonthFilter from "@/components/dashboard/month-filter";
import PeriodSelector from "@/components/dashboard/period-selector";

// Upload
import FileUploader from "@/components/upload/file-uploader";
import FilePreview from "@/components/upload/file-preview";

// Utils
import { cn, formatCurrency, formatPercentage } from "@/lib/utils";
import { aggregateDataByPeriod, getChartTitle } from "@/lib/data-aggregator";
import prisma from "@/lib/prisma";
```

---

## 🔧 Common Code Snippets

### **API Route Template**
```typescript
// src/app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const data = await prisma.example.findMany();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}
```

### **Fetch API Data**
```typescript
const fetchData = async () => {
  const res = await fetch('/api/locations');
  const data = await res.json();
  if (data.success) {
    setData(data.data);
  }
};
```

### **Prisma Query Examples**
```typescript
// Find all
const all = await prisma.location.findMany();

// Find with filter
const local = await prisma.location.findMany({
  where: { type: 'LOCAL' }
});

// Find by ID
const one = await prisma.location.findUnique({
  where: { id: 1 }
});

// Create
const created = await prisma.location.create({
  data: { code: 'LOCAL-TEST', name: 'Test', type: 'LOCAL' }
});

// Update
const updated = await prisma.location.update({
  where: { id: 1 },
  data: { name: 'Updated Name' }
});

// Delete
const deleted = await prisma.location.delete({
  where: { id: 1 }
});
```

---

## 🐛 Troubleshooting

### **Port 3000 in use**
```bash
# Dev server automatically uses 3001
# This is normal, not an error
```

### **Cannot connect to MySQL**
```bash
# 1. Check if MySQL is running (XAMPP/WAMP)
# 2. Verify .env file has correct connection string
# 3. Check database exists: CREATE DATABASE performa_dashboard;
```

### **Prisma Client not generated**
```bash
npx prisma generate
```

### **Database out of sync**
```bash
npm run db:push
```

### **Reset database (CAUTION: deletes all data!)**
```bash
npx prisma migrate reset
npm run db:seed
```

---

## 📝 Git Workflow (if using Git)

```bash
# Check status
git status

# Add files
git add .

# Commit
git commit -m "feat: add branches CRUD page"

# Push
git push origin main
```

**Commit Message Conventions:**
- `feat:` New feature
- `fix:` Bug fix
- `refactor:` Code refactoring
- `style:` UI/styling changes
- `docs:` Documentation
- `chore:` Maintenance tasks

---

## 🎯 Next Task Priorities

1. ⭐⭐⭐ Implement Authentication (NextAuth.js)
2. ⭐⭐⭐ Excel Upload Backend (SheetJS)
3. ⭐⭐⭐ Real Sales Data API
4. ⭐⭐ Settings > Categories page
5. ⭐⭐ Settings > Users page
6. ⭐⭐ Settings > Targets page
7. ⭐ Report pages

---

## 🔐 Admin Credentials

```
Email: admin@salesmonitor.com
Password: admin123
```

---

## 📊 Current Progress

- Database: ✅ 100%
- Backend API: ⚠️ 30%
- Frontend UI: ⚠️ 60%
- **Overall: ~45%**

---

**Keep Coding! 🚀**

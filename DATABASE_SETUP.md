# 🗄️ Database Setup Guide

Setup MySQL database untuk Sales Dashboard menggunakan Prisma ORM.

## 📋 Prerequisites

- **MySQL Server** (version 5.7 atau lebih baru)
- **Node.js** (sudah ter-install)
- **npm** (sudah ter-install)

---

## 🚀 Step-by-Step Setup

### 1. **Install MySQL** (Jika belum ada)

**Windows:**
- Download [MySQL Installer](https://dev.mysql.com/downloads/installer/)
- Install dengan opsi "Developer Default"
- Set root password (atau kosongkan jika local development)

**Atau gunakan XAMPP/WAMP** yang sudah include MySQL.

### 2. **Create Database**

Buka MySQL command line atau phpMyAdmin, lalu jalankan:

```sql
CREATE DATABASE sales_dashboard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. **Update Environment Variables**

File `.env.local` sudah dibuat. Update jika perlu:

```env
# Jika pakai password MySQL
DATABASE_URL="mysql://root:your_password@localhost:3306/sales_dashboard"

# Jika tanpa password (default XAMPP)
DATABASE_URL="mysql://root:@localhost:3306/sales_dashboard"
```

### 4. **Push Schema ke Database**

Jalankan command ini untuk create semua tables:

```bash
npm run db:push
```

Ini akan membuat semua tables sesuai schema di `prisma/schema.prisma`:
- ✅ users
- ✅ roles & permissions
- ✅ locations
- ✅ categories
- ✅ sales
- ✅ targets
- ✅ upload_batches
- ✅ dan lainnya

### 5. **Seed Initial Data**

Populate database dengan data awal:

```bash
npm run db:seed
```

Ini akan mengisi:
- **5 Locations LOCAL** (Bogor Pusat, Cibinong, Citeureup, Dramaga, Gunung Putri)
- **10 Locations CABANG** (Jakarta, Bekasi, Depok, Tangerang, Bandung, Semarang, Surabaya, Yogyakarta, Malang, Solo)
- **17 Categories** (ACCESSORIES, BAHAN KIMIA, BUSA, HDP, JASA, dll)
- **Default Admin User**
  - Email: `admin@salesmonitor.com`
  - Password: `admin123`
- **Roles & Permissions**

---

## 🎯 Verify Setup

### Check Tables Created

```bash
npm run db:studio
```

Ini akan membuka Prisma Studio di browser untuk explore database.

### Test API Endpoints

Setelah dev server running (`npm run dev`), test API:

**Get All Locations:**
```bash
curl http://localhost:3001/api/locations
```

**Get LOCAL Locations Only:**
```bash
curl http://localhost:3001/api/locations?type=LOCAL
```

**Get CABANG Locations Only:**
```bash
curl http://localhost:3001/api/locations?type=CABANG
```

**Get All Categories:**
```bash
curl http://localhost:3001/api/categories
```

---

## 📊 Database Schema Overview

### **Locations Table**
```
id, code, name, type (LOCAL/CABANG), address, isActive, createdAt
```

### **Categories Table**
```
id, name, description, sortOrder, isActive, createdAt
```

### **Sales Table**
```
id, saleDate, locationId, categoryId, itemName, quantity, amount, uploadBatchId
```

### **Users & Auth Tables**
```
users, roles, permissions, user_roles, role_permissions
```

### **Targets Table**
```
id, year, month, locationType, categoryId, targetAmount
```

---

## 🔧 Common Commands

```bash
# Push schema changes to database
npm run db:push

# Seed database with initial data
npm run db:seed

# Open Prisma Studio (database GUI)
npm run db:studio

# Generate Prisma Client (after schema changes)
npx prisma generate

# Reset database (CAUTION: Deletes all data!)
npx prisma migrate reset
```

---

## 🏢 Default Data Seeded

### LOCAL Locations (5)
1. Bogor Pusat (`LOCAL-BGR`)
2. Cibinong (`LOCAL-CBI`)
3. Citeureup (`LOCAL-CGR`)
4. Dramaga (`LOCAL-DRM`)
5. Gunung Putri (`LOCAL-GNL`)

### CABANG Locations (10)
1. Jakarta Pusat (`CABANG-JKT`)
2. Bekasi (`CABANG-BKS`)
3. Depok (`CABANG-DPK`)
4. Tangerang (`CABANG-TGR`)
5. Bandung (`CABANG-BDG`)
6. Semarang (`CABANG-SMG`)
7. Surabaya (`CABANG-SBY`)
8. Yogyakarta (`CABANG-YGY`)
9. Malang (`CABANG-MLG`)
10. Solo (`CABANG-SKA`)

### Categories (17)
1. ACCESSORIES
2. BAHAN KIMIA
3. BUSA
4. HDP
5. JASA
6. KAIN POLOS SOFA
7. KAIN POLOS SPRINGBED
8. KAIN QUILTING
9. MSP
10. KAWAT
11. NON WOVEN
12. OTHER
13. PER COIL
14. PITA LIST
15. PLASTIC
16. STAPLESS
17. FURNITURE

---

## ❓ Troubleshooting

### Error: "Can't connect to MySQL server"
- Check if MySQL server is running
- Verify connection string in `.env.local`
- Check port (default 3306)

### Error: "Database doesn't exist"
- Run `CREATE DATABASE sales_dashboard;` in MySQL
- Make sure database name matches in `.env.local`

### Error: "P2002: Unique constraint violation"
- Data sudah ada di database
- Run `npx prisma migrate reset` untuk reset (WARNING: deletes all data!)

### Prisma Client not generated
- Run `npx prisma generate`

---

## ✅ Next Steps

Setelah database setup:

1. ✅ Database & tables created
2. ✅ Initial data seeded
3. ✅ API routes ready
4. 🔜 Frontend integration with API
5. 🔜 Upload Excel functionality
6. 🔜 Authentication system

Sekarang kamu bisa lanjut ke frontend integration! 🚀

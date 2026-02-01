# Alur Data Gross Margin - Performa Dashboard

Dokumen ini menjelaskan bagaimana data Gross Margin diupload, diproses, dan ditampilkan di berbagai halaman dashboard.

---

## Daftar Isi
1. [Upload Data](#1-upload-data)
2. [Proses di Backend](#2-proses-di-backend)
3. [Penyimpanan Database](#3-penyimpanan-database)
4. [Tampilan di Dashboard](#4-tampilan-di-dashboard)
5. [Tampilan di Halaman Review Data](#5-tampilan-di-halaman-review-data)
6. [Tampilan di Halaman Gross Margin](#6-tampilan-di-halaman-gross-margin)
7. [Diagram Alur](#7-diagram-alur)

---

## 1. Upload Data

### Lokasi File
- **Frontend**: `src/app/(dashboard)/upload/page.tsx`
- **Template Excel**: `public/template_upload_gross_margin.xlsx`

### Format File yang Diterima
- Format: **Excel (.xlsx, .xls)**
- Ukuran maksimal: **10MB**
- Jumlah baris maksimal: **50.000 baris**
- Format tabel: **Pivot**

### Struktur Kolom Excel

| Kolom | Isi | Keterangan |
|-------|-----|------------|
| A | Kategori | Nama kategori produk |
| B | Tanggal | Tanggal record (DD/MM/YYYY atau YYYY-MM-DD) |
| C | CABANG - Pencapaian | Nilai margin CABANG (Rupiah) |
| D | CABANG - % | *Diabaikan (dihitung otomatis)* |
| E | LOKAL - Pencapaian | Nilai margin LOKAL (Rupiah) |
| F | LOKAL - % | *Diabaikan (dihitung otomatis)* |
| G-H | TOTAL | *Diabaikan (dihitung otomatis)* |

### Cara Upload
1. Buka halaman **Upload** di sidebar
2. Pilih tipe data: **Data Gross Margin**
3. Download template jika diperlukan
4. Pilih file Excel yang sudah diisi
5. Klik tombol **Upload**

---

## 2. Proses di Backend

### Lokasi File
- **API Endpoint**: `src/app/api/upload/gross-margin/route.ts`
- **Excel Parser**: `src/lib/excel-parser.ts` (fungsi `parseGrossMarginExcel`)

### Langkah-langkah Proses

#### Step 1: Autentikasi
- Verifikasi token user dari cookie
- Cek permission `upload_gross_margin`

#### Step 2: Parsing Excel
```
File Excel → parseGrossMarginExcel() → Array<GrossMarginRow>
```

Proses parsing:
1. Baca file Excel menggunakan library XLSX
2. Cari sheet dengan nama "Data Gross Margin", "Template Kosong", atau "Data"
3. Skip 2 baris header pertama
4. Mulai parsing dari baris ke-3

#### Step 3: Validasi Kategori
- Ambil semua kategori dari database
- Mapping nama kategori ke ID
- Validasi bahwa semua kategori di Excel ada di database
- Matching **case-insensitive**

#### Step 4: Hapus Data Lama
- Kumpulkan tanggal-tanggal unik dari data yang diupload
- Hapus data gross margin yang ada untuk tanggal-tanggal tersebut
- Strategi: **Full Replace** per tanggal

#### Step 5: Ambil Data Penjualan
- Query data omzet dari tabel `Sale` untuk tanggal yang sama
- Agregasi berdasarkan: tanggal, kategori, tipe lokasi

#### Step 6: Kalkulasi & Persiapan Data
Untuk setiap baris:
```
omzetAmount   = dari tabel Sale (hasil agregasi)
marginAmount  = dari Excel (kolom PENCAPAIAN)
hppAmount     = omzetAmount - marginAmount
marginPercent = (marginAmount / omzetAmount) × 100
```

#### Step 7: Insert ke Database
- Insert dalam batch **1.000 baris**
- Gunakan `skipDuplicates: true` untuk handle constraint violation
- Unique constraint: `[recordDate, categoryId, locationType]`

#### Step 8: Catat Upload
- Buat record di tabel `SalesUpload`
- Catat: tipe upload, status, jumlah baris, tanggal

### Response API
```json
{
  "success": true,
  "message": "Upload gross margin berhasil",
  "data": {
    "totalRows": 150,
    "deletedRows": 100,
    "insertedRows": 150,
    "month": 1,
    "year": 2026
  }
}
```

---

## 3. Penyimpanan Database

### Lokasi File
- **Schema**: `prisma/schema.prisma`

### Model GrossMargin

```prisma
model GrossMargin {
  id            BigInt       @id @default(autoincrement())
  recordDate    DateTime     @db.Date        // Tanggal record
  categoryId    Int                          // Relasi ke Category
  locationType  LocationType                 // CABANG atau LOCAL
  omzetAmount   Decimal(20,2)                // Nilai omzet/penjualan
  hppAmount     Decimal(20,2)                // Harga Pokok Penjualan
  marginAmount  Decimal(20,2)                // Gross Margin
  marginPercent Decimal(5,2)                 // Persentase margin

  // Audit fields
  createdAt     DateTime
  createdBy     Int?
  updatedAt     DateTime
  updatedBy     Int?

  // Relasi
  category      Category @relation(...)
}
```

### Tabel Database: `gross_margins`

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | BIGINT | Primary key |
| record_date | DATE | Tanggal data |
| category_id | INT | FK ke categories |
| location_type | ENUM | 'CABANG' atau 'LOCAL' |
| omzet_amount | DECIMAL(20,2) | Nilai penjualan |
| hpp_amount | DECIMAL(20,2) | Harga Pokok Penjualan |
| margin_amount | DECIMAL(20,2) | Gross Margin |
| margin_percent | DECIMAL(5,2) | Persentase GM |

### Index
- `recordDate`
- `categoryId`
- `locationType`
- `recordDate, locationType` (composite)

### Unique Constraint
```
UNIQUE(recordDate, categoryId, locationType)
```
> Hanya boleh ada 1 record per kombinasi tanggal + kategori + tipe lokasi

---

## 4. Tampilan di Dashboard

### Lokasi File
- **Page**: `src/app/(dashboard)/dashboard/page.tsx`
- **API**: `src/app/api/analytics/sales-trend/route.ts`

### Data yang Ditampilkan

Dashboard menampilkan **Comparison Cards** untuk gross margin:

| Perbandingan | Keterangan |
|--------------|------------|
| Harian | Kemarin vs 2 hari lalu |
| Mingguan | Minggu ini vs minggu lalu |
| Bulanan | Bulan ini vs bulan lalu |
| Kuartal | Kuartal ini vs kuartal lalu |
| Semester | Semester ini vs semester lalu |
| Tahunan | Tahun ini vs tahun lalu |

### Informasi pada Setiap Card
- Nilai Gross Margin (dalam Rupiah)
- Persentase perubahan
- Indikator trend (naik/turun)
- Waktu update terakhir

### Refresh Data
- Auto refresh setiap **5 menit**
- Data real-time (tanpa filter bulan)

---

## 5. Tampilan di Halaman Review Data

### Lokasi File
- **Page**: `src/app/(dashboard)/data/page.tsx`
- **API**: `src/app/api/data/route.ts`

### Filter yang Tersedia
- **Tahun**: ±2 tahun dari tahun sekarang
- **Bulan**: Januari - Desember
- **Tipe Lokasi**: ALL / LOCAL / CABANG

### Statistik Cards (4 Card)
1. **Total Records** - Jumlah baris data
2. **Total Omzet** - Total nilai penjualan
3. **Total Margin** - Total gross margin
4. **Rata-rata Margin %** - Rata-rata persentase

### Tabel Data

| Kolom | Keterangan |
|-------|------------|
| No | Nomor urut |
| Tanggal | Tanggal record |
| Kategori | Nama kategori |
| Area | CABANG atau LOCAL |
| Omzet | Nilai penjualan |
| HPP | Harga Pokok Penjualan |
| Margin | Nilai gross margin |
| % | Persentase margin (dengan warna) |

### Warna Persentase
- **Merah**: < 0% (negatif)
- **Kuning**: 0-10% (rendah)
- **Biru**: 10-20% (sedang)
- **Hijau**: >= 20% (bagus)

### Pagination
- 50 baris per halaman
- Navigasi halaman di bagian bawah

---

## 6. Tampilan di Halaman Gross Margin

### Lokasi File
- **Page**: `src/app/(dashboard)/gross-margin/page.tsx`
- **API**: `src/app/api/analytics/gross-margin/route.ts`

### Filter
- **Bulan**: 1-12
- **Tahun**: 2024-2026

### Section 1: Alert/Peringatan
- **Alert Merah**: Kategori dengan margin negatif
- **Alert Kuning**: Kategori dengan margin < 10%

### Section 2: Overview Stats (4 Card)

| Card | Keterangan |
|------|------------|
| Total Omzet | Total nilai penjualan |
| Total HPP | Total Harga Pokok Penjualan |
| Total Gross Margin | Total profit (Omzet - HPP) |
| Rata-rata GM % | Rata-rata persentase margin |

### Section 3: Perbandingan Area (2 Card)

**Card CABANG:**
- Omzet CABANG
- HPP CABANG
- Margin CABANG
- % Margin CABANG

**Card LOCAL:**
- Omzet LOCAL
- HPP LOCAL
- Margin LOCAL
- % Margin LOCAL

### Section 4: Tabel Breakdown per Kategori

| Kolom | Keterangan |
|-------|------------|
| Kategori | Nama kategori |
| Omzet | Total omzet kategori |
| HPP | Total HPP kategori |
| Gross Margin | Total margin kategori |
| GM % | Persentase margin (dengan badge warna) |

> Tabel diurutkan dari margin % tertinggi ke terendah

### Badge Warna GM %
- 🔴 **Merah**: < 0%
- 🟡 **Kuning**: 0-10%
- 🔵 **Biru**: 10-20%
- 🟢 **Hijau**: >= 20%

---

## 7. Diagram Alur

```
┌─────────────────────────────────────────────────────────────┐
│                      USER UPLOAD                             │
│                                                              │
│   Upload Page (/upload)                                      │
│   └── Pilih "Data Gross Margin"                              │
│   └── Upload file Excel                                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    API PROCESSING                            │
│                                                              │
│   POST /api/upload/gross-margin                              │
│   ├── 1. Autentikasi & cek permission                        │
│   ├── 2. Parse Excel (parseGrossMarginExcel)                 │
│   ├── 3. Validasi kategori                                   │
│   ├── 4. Hapus data lama untuk tanggal tersebut              │
│   ├── 5. Ambil data omzet dari tabel Sale                    │
│   ├── 6. Hitung HPP & Margin%                                │
│   ├── 7. Insert ke database (batch 1000)                     │
│   └── 8. Catat upload di SalesUpload                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATABASE                                │
│                                                              │
│   Tabel: gross_margins                                       │
│   ├── recordDate (tanggal)                                   │
│   ├── categoryId (kategori)                                  │
│   ├── locationType (CABANG/LOCAL)                            │
│   ├── omzetAmount (penjualan)                                │
│   ├── hppAmount (HPP)                                        │
│   ├── marginAmount (gross margin)                            │
│   └── marginPercent (persentase)                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
         ▼             ▼             ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│  DASHBOARD  │ │ GROSS MARGIN│ │ REVIEW DATA │
│   /dashboard│ │ /gross-margin│ │    /data    │
├─────────────┤ ├─────────────┤ ├─────────────┤
│ Comparison  │ │ Overview    │ │ Filter data │
│ Cards       │ │ Stats       │ │ by month/   │
│ (Harian,    │ │             │ │ year/area   │
│ Mingguan,   │ │ Perbandingan│ │             │
│ Bulanan,    │ │ CABANG vs   │ │ Stats Cards │
│ dll)        │ │ LOCAL       │ │             │
│             │ │             │ │ Tabel       │
│ Auto refresh│ │ Alerts      │ │ paginated   │
│ 5 menit     │ │ (low margin)│ │             │
│             │ │             │ │             │
│             │ │ Breakdown   │ │             │
│             │ │ per kategori│ │             │
└─────────────┘ └─────────────┘ └─────────────┘
```

---

## Catatan Penting

### Rumus Kalkulasi
```
HPP = Omzet - Gross Margin
Margin % = (Gross Margin / Omzet) × 100
```

### Handling Tanggal
- Excel serial number didukung
- Format DD/MM/YYYY dan YYYY-MM-DD didukung
- Waktu diset ke 12:00:00 untuk menghindari masalah timezone

### Strategi Update Data
- Data di-replace **per tanggal** (bukan per bulan)
- Upload tanggal yang sama akan menghapus data lama dan insert data baru
- Tidak ada data yang duplikat (dijaga oleh unique constraint)

### Permission yang Diperlukan
- `upload_gross_margin`: Untuk upload dan melihat data gross margin
- `view_all_uploads`: Untuk melihat semua data upload

---

## File Terkait

| Komponen | Path |
|----------|------|
| Upload Page | `src/app/(dashboard)/upload/page.tsx` |
| Upload API | `src/app/api/upload/gross-margin/route.ts` |
| Analytics API | `src/app/api/analytics/gross-margin/route.ts` |
| Data API | `src/app/api/data/route.ts` |
| Gross Margin Page | `src/app/(dashboard)/gross-margin/page.tsx` |
| Review Data Page | `src/app/(dashboard)/data/page.tsx` |
| Dashboard Page | `src/app/(dashboard)/dashboard/page.tsx` |
| Excel Parser | `src/lib/excel-parser.ts` |
| Database Schema | `prisma/schema.prisma` |
| Template Excel | `public/template_upload_gross_margin.xlsx` |

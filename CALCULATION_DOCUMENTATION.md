# 📊 Dokumentasi Perhitungan Dashboard Performa

**Version**: 0.3.2
**Last Updated**: 2026-01-23

---

## 📋 Daftar Isi

1. [Overview](#overview)
2. [Komponen Dashboard](#komponen-dashboard)
3. [Perhitungan Omzet](#perhitungan-omzet)
4. [Perhitungan Gross Margin](#perhitungan-gross-margin)
5. [Perhitungan Pertumbuhan (Comparison)](#perhitungan-pertumbuhan-comparison)
6. [Agregasi Data Trend](#agregasi-data-trend)
7. [Achievement by Category](#achievement-by-category)
8. [Flow Data](#flow-data)

---

## 🎯 Overview

Dashboard Performa menampilkan metrik penjualan dengan 2 segmen utama:
- **LOCAL**: Penjualan di Bogor & sekitarnya (5 lokasi)
- **CABANG**: Penjualan di luar Bogor (10 lokasi)

### Data Sources
- **Mock Data**: `src/lib/mock-data.ts` (summary tahunan)
- **Daily Data**: `src/lib/mock-data-daily.ts` (data harian untuk trend & comparison)
- **Real Data**: Upload Excel via halaman `/upload`

---

## 📊 Komponen Dashboard

### 1. Stats Cards (Ringkasan Tahunan)

#### Yang Ditampilkan:
```
┌─────────────────────────────┐
│ Total Sales 2026            │
│ Rp 122.8T / Rp 141T         │
│ ████████░░ 87.13%           │
└─────────────────────────────┘
```

#### Perhitungan Backend:
```typescript
// File: src/lib/mock-data.ts

export const mockSummary = {
  // Total = LOCAL + CABANG
  totalOmzet: 122850000000000,     // Rp 122.8T
  totalTarget: 141000000000000,     // Rp 141T
  totalPencapaian: 87.13,           // (122.8 / 141) × 100

  // LOCAL (Bogor & Sekitar)
  localOmzet: 78545000000000,       // Rp 78.5T
  localTarget: 90000000000000,       // Rp 90T
  localPencapaian: 87.27,           // (78.5 / 90) × 100

  // CABANG (Luar Bogor)
  cabangOmzet: 44305000000000,      // Rp 44.3T
  cabangTarget: 51000000000000,      // Rp 51T
  cabangPencapaian: 86.87,          // (44.3 / 51) × 100
};
```

**Formula:**
```
Pencapaian (%) = (Omzet Aktual / Target) × 100
```

---

### 2. Comparison Cards (Pertumbuhan Omzet & Gross Margin)

#### Yang Ditampilkan:
```
┌─────────────────────────────────────┐
│ Total Omzet Minggu Ini              │
│ Rp 245,500,000                      │
│ ─────────────────────────────────   │
│ +Rp 12,300,000  vs Minggu Lalu  +5.3% │
│                                     │
│ Gross Margin                        │
│ Rp 65,200,000                       │
│ ─────────────────────────────────   │
│ +Rp 3,100,000   vs Minggu Lalu  +5.0% │
└─────────────────────────────────────┘
```

#### Perhitungan Backend:

##### A. Periode Harian (vs Kemarin)
```typescript
// File: src/lib/mock-data-daily.ts

export const calculateComparison = (
  data: DailySales[],
  field: 'total' | 'totalGrossMargin',
  daysAgo: number
): ComparisonData => {
  // Ambil data hari ini (data terakhir)
  const current = data[data.length - 1][field];

  // Ambil data hari sebelumnya
  const previous = data[data.length - 1 - daysAgo][field];

  // Hitung selisih
  const difference = current - previous;

  // Hitung persentase perubahan
  const percentageChange = previous !== 0
    ? (difference / previous) × 100
    : 0;

  return {
    current,        // Nilai hari ini
    previous,       // Nilai hari kemarin
    difference,     // Selisih (current - previous)
    percentageChange // % perubahan
  };
};
```

**Formula:**
```
Difference = Current - Previous
Percentage Change = (Difference / Previous) × 100
```

**Contoh:**
```
Omzet Hari Ini    = Rp 50,000,000
Omzet Kemarin     = Rp 45,000,000
─────────────────────────────────
Difference        = Rp 5,000,000
Percentage Change = (5,000,000 / 45,000,000) × 100 = +11.11%
```

---

##### B. Periode Calendar-Based (Minggu, Bulan, Triwulan, Semester, Tahun)

#### Yang Ditampilkan:
```
MINGGU:    Senin-Minggu     vs Senin-Minggu sebelumnya
BULAN:     1 Jan - 31 Jan   vs 1 Des - 31 Des
TRIWULAN:  Q1 (Jan-Mar)     vs Q4 tahun lalu (Oct-Dec)
SEMESTER:  S1 (Jan-Jun)     vs S2 tahun lalu (Jul-Dec)
TAHUNAN:   1 Jan - 31 Des   vs 1 Jan - 31 Des tahun lalu
```

#### Perhitungan Backend:
```typescript
// File: src/lib/mock-data-daily.ts

export const calculateCalendarComparison = (
  data: DailySales[],
  field: 'total' | 'totalGrossMargin',
  periodType: CalendarPeriodType
): ComparisonData => {
  const today = new Date();

  // 1. Tentukan range periode current & previous
  let currentStart: Date, currentEnd: Date;
  let previousStart: Date, previousEnd: Date;

  switch (periodType) {
    case 'weekly':
      // Current: Senin minggu ini - Minggu minggu ini
      currentStart = getMondayOfWeek(today);
      currentEnd = new Date(currentStart);
      currentEnd.setDate(currentEnd.getDate() + 6);

      // Previous: Senin minggu lalu - Minggu minggu lalu
      previousStart = new Date(currentStart);
      previousStart.setDate(previousStart.getDate() - 7);
      previousEnd = new Date(previousStart);
      previousEnd.setDate(previousEnd.getDate() + 6);
      break;

    case 'monthly':
      // Current: 1 bulan ini - akhir bulan ini
      currentStart = getFirstDayOfMonth(today);
      currentEnd = getLastDayOfMonth(today);

      // Previous: 1 bulan lalu - akhir bulan lalu
      const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      previousStart = getFirstDayOfMonth(prevMonth);
      previousEnd = getLastDayOfMonth(prevMonth);
      break;

    case 'quarterly':
      // Current: Q1/Q2/Q3/Q4 tahun ini
      currentStart = getFirstDayOfQuarter(today);
      currentEnd = getLastDayOfQuarter(today);

      // Previous: Quarter sebelumnya
      const prevQuarter = new Date(currentStart);
      prevQuarter.setMonth(prevQuarter.getMonth() - 3);
      previousStart = getFirstDayOfQuarter(prevQuarter);
      previousEnd = getLastDayOfQuarter(prevQuarter);
      break;

    case 'semester':
      // Current: S1 (Jan-Jun) atau S2 (Jul-Dec)
      currentStart = getFirstDayOfSemester(today);
      currentEnd = getLastDayOfSemester(today);

      // Previous: Semester sebelumnya
      const prevSemester = new Date(currentStart);
      prevSemester.setMonth(prevSemester.getMonth() - 6);
      previousStart = getFirstDayOfSemester(prevSemester);
      previousEnd = getLastDayOfSemester(prevSemester);
      break;

    case 'yearly':
      // Current: 1 Jan tahun ini - 31 Des tahun ini
      currentStart = getFirstDayOfYear(today);
      currentEnd = getLastDayOfYear(today);

      // Previous: 1 Jan tahun lalu - 31 Des tahun lalu
      previousStart = new Date(today.getFullYear() - 1, 0, 1);
      previousEnd = new Date(today.getFullYear() - 1, 11, 31);
      break;
  }

  // 2. Filter data sesuai range
  const currentData = filterDataInRange(data, currentStart, currentEnd);
  const previousData = filterDataInRange(data, previousStart, previousEnd);

  // 3. Jumlahkan semua nilai dalam periode
  const current = sumField(currentData, field);
  const previous = sumField(previousData, field);

  // 4. Hitung selisih dan persentase
  const difference = current - previous;
  const percentageChange = previous !== 0
    ? (difference / previous) × 100
    : 0;

  return { current, previous, difference, percentageChange };
};
```

**Formula:**
```
Current Period Sum = ΣData(startDate to endDate)
Previous Period Sum = ΣData(prevStartDate to prevEndDate)
Difference = Current - Previous
Percentage Change = (Difference / Previous) × 100
```

**Contoh Mingguan:**
```
Tanggal Hari Ini: 23 Januari 2026 (Jumat)

Current Week:
  Start: 19 Jan 2026 (Senin)
  End:   25 Jan 2026 (Minggu)
  Data:  [50M, 48M, 52M, 49M, 51M, 0, 0] (Senin-Jumat, Weekend belum)
  Sum:   Rp 250,000,000

Previous Week:
  Start: 12 Jan 2026 (Senin)
  End:   18 Jan 2026 (Minggu)
  Data:  [45M, 47M, 46M, 48M, 44M, 0, 0]
  Sum:   Rp 230,000,000

Result:
  Difference = 250M - 230M = +Rp 20,000,000
  % Change = (20M / 230M) × 100 = +8.70%
```

---

### 3. Gross Margin Calculation

#### Yang Ditampilkan:
```
Gross Margin = Omzet - HPP (Harga Pokok Penjualan)
```

#### Data Model:
```typescript
// File: src/lib/mock-data-daily.ts

interface DailySales {
  date: string;
  local: number;              // Omzet LOCAL
  cabang: number;             // Omzet CABANG
  total: number;              // local + cabang

  // Gross Margin Data
  localGrossMargin: number;   // Margin LOCAL
  cabangGrossMargin: number;  // Margin CABANG
  totalGrossMargin: number;   // localGrossMargin + cabangGrossMargin
}
```

#### ⚠️ PENTING: Mock Data vs Real Data

**MOCK DATA (Testing Only):**
```typescript
// CARA INI HANYA UNTUK GENERATE MOCK DATA!
// JANGAN DIPAKAI UNTUK DATA PRODUCTION!

function generateDailySalesData(days: number) {
  const local = Math.round(baseLocal × growthFactor × randomFactor);
  const cabang = Math.round(baseCabang × growthFactor × randomFactor);

  // ❌ Cara terbalik: Asumsi margin rate dulu, lalu hitung HPP
  // Hanya boleh untuk mock data!
  const localMarginRate = 0.25 + Math.random() × 0.05;    // 25-30%
  const cabangMarginRate = 0.20 + Math.random() × 0.05;   // 20-25%

  const localGrossMargin = Math.round(local × localMarginRate);
  const cabangGrossMargin = Math.round(cabang × cabangMarginRate);

  return {
    date,
    local,
    cabang,
    total: local + cabang,
    localGrossMargin,
    cabangGrossMargin,
    totalGrossMargin: localGrossMargin + cabangGrossMargin
  };
}
```

**REAL DATA (Production):**
```typescript
// ✅ CARA YANG BENAR UNTUK DATA REAL

// User Upload Data dari Excel:
interface UploadedGrossMarginData {
  tanggal: string;
  kode_lokasi: string;
  kategori: string;
  omzet: number;        // ← User input (dari invoice penjualan)
  hpp: number;          // ← User input (dari cost accounting)
  gross_margin: number; // ← User input atau sistem calculate
  catatan: string;
}

// Sistem Validate & Calculate:
function processGrossMarginUpload(data: UploadedGrossMarginData) {
  // Hitung gross margin yang benar
  const calculated_margin = data.omzet - data.hpp;

  // Validasi jika user input gross_margin
  if (data.gross_margin !== calculated_margin) {
    throw new Error(
      `Gross Margin tidak sesuai! ` +
      `Harus = ${data.omzet} - ${data.hpp} = ${calculated_margin}, ` +
      `tapi input user = ${data.gross_margin}`
    );
  }

  // Hitung margin rate
  const margin_rate = (calculated_margin / data.omzet) × 100;

  return {
    ...data,
    gross_margin: calculated_margin,
    margin_rate: margin_rate
  };
}
```

**Formula yang Benar:**
```
DATA YANG DIKETAHUI (User Input):
  1. Omzet (dari catatan penjualan/invoice)
  2. HPP - Harga Pokok Penjualan (dari catatan biaya produksi/pembelian)

SISTEM HITUNG OTOMATIS:
  3. Gross Margin = Omzet - HPP
  4. Margin Rate (%) = (Gross Margin / Omzet) × 100
```

**Contoh Data Real:**
```
TRANSAKSI PENJUALAN LOCAL:
  User Input (dari sistem akuntansi):
    Tanggal:      2026-01-23
    Lokasi:       LOCAL-BGR (Bogor Pusat)
    Kategori:     BAHAN KIMIA
    Omzet:        Rp 100,000,000  ← Dari invoice penjualan
    HPP:          Rp 73,000,000   ← Dari catatan biaya produksi

  Sistem Hitung Otomatis:
    Gross Margin: 100,000,000 - 73,000,000 = Rp 27,000,000
    Margin Rate:  (27,000,000 / 100,000,000) × 100 = 27%

TRANSAKSI PENJUALAN CABANG:
  User Input:
    Tanggal:      2026-01-23
    Lokasi:       CABANG-JKT (Jakarta)
    Kategori:     FURNITURE
    Omzet:        Rp 80,000,000
    HPP:          Rp 62,400,000

  Sistem Hitung Otomatis:
    Gross Margin: 80,000,000 - 62,400,000 = Rp 17,600,000
    Margin Rate:  (17,600,000 / 80,000,000) × 100 = 22%

AGREGASI TOTAL:
  Total Omzet:        Rp 180,000,000 (100M + 80M)
  Total HPP:          Rp 135,400,000 (73M + 62.4M)
  Total Gross Margin: Rp 44,600,000 (27M + 17.6M)
  Effective Margin %: (44,600,000 / 180,000,000) × 100 = 24.78%
```

**⚡ Key Takeaways:**
- ✅ **Real Data**: HPP adalah input (dari akuntansi), sistem hitung Gross Margin
- ❌ **Mock Data**: Margin rate diasumsikan, lalu hitung HPP (cara terbalik untuk testing)
- 💡 **Margin rate akan berbeda per transaksi** tergantung:
  - Harga jual yang dinegosiasi
  - Biaya produksi/pembelian saat itu
  - Kondisi pasar
  - Strategi pricing
- 🎯 **Tidak ada "margin rate tetap"** - setiap transaksi bisa berbeda!

---

### 4. Trend Chart (Grafik Penjualan)

#### Yang Ditampilkan:
```
Grafik dengan multiple lines:
- Line Biru:   Total Omzet
- Line Hijau:  LOCAL Omzet
- Line Orange: CABANG Omzet

Sumbu X: Periode (Daily, Weekly, Monthly, Quarterly, Semester, Yearly)
Sumbu Y: Nilai Rupiah
```

#### Period Selector Options:
```
Daily      → 90 hari terakhir (data harian)
Weekly     → 26 minggu terakhir (6 bulan, per minggu)
Monthly    → 12 bulan terakhir (per bulan)
Quarterly  → 8 quarters terakhir (2 tahun, per triwulan)
Semester   → 4 semesters terakhir (2 tahun, per semester)
Yearly     → 5 tahun terakhir (per tahun)
```

#### Perhitungan Backend:

##### A. Generate Daily Data
```typescript
// File: src/lib/mock-data-daily.ts

export function generateDailySalesData(days: number): DailySales[] {
  const data: DailySales[] = [];
  const today = new Date();

  // Base values (starting point)
  const baseLocal = 30000000;   // Rp 30 juta/hari
  const baseCabang = 20000000;  // Rp 20 juta/hari

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Growth factor: simulasi pertumbuhan 0.5% per bulan
    const monthsAgo = i / 30;
    const growthFactor = 1 + (0.005 × monthsAgo);

    // Random variation: ±20% untuk variasi harian
    const randomFactor = 0.8 + Math.random() × 0.4;

    const local = Math.round(baseLocal × growthFactor × randomFactor);
    const cabang = Math.round(baseCabang × growthFactor × randomFactor);

    data.push({
      date: date.toISOString().split('T')[0],
      local,
      cabang,
      total: local + cabang,
      // ... gross margin
    });
  }

  return data;
}
```

##### B. Aggregate by Period
```typescript
// File: src/lib/data-aggregator.ts

export function aggregateDataByPeriod(
  data: DailySales[],
  period: PeriodType
): AggregatedSalesData[] {
  const aggregated = new Map<string, AggregatedSalesData>();

  data.forEach((day) => {
    const date = new Date(day.date);
    let periodKey: string;
    let periodStart: Date;

    switch (period) {
      case 'daily':
        // Tidak perlu agregasi
        periodKey = day.date;
        periodStart = date;
        break;

      case 'weekly':
        // Group by Monday (start of week)
        const monday = getMondayOfWeek(date);
        periodKey = `${monday.getFullYear()}-W${getWeekNumber(monday)}`;
        periodStart = monday;
        break;

      case 'monthly':
        // Group by first day of month
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        periodStart = new Date(date.getFullYear(), date.getMonth(), 1);
        break;

      case 'quarterly':
        // Group by quarter
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        periodKey = `${date.getFullYear()}-Q${quarter}`;
        periodStart = getFirstDayOfQuarter(date);
        break;

      case 'semester':
        // Group by semester
        const semester = date.getMonth() < 6 ? 1 : 2;
        periodKey = `${date.getFullYear()}-S${semester}`;
        periodStart = getFirstDayOfSemester(date);
        break;

      case 'yearly':
        // Group by year
        periodKey = String(date.getFullYear());
        periodStart = new Date(date.getFullYear(), 0, 1);
        break;
    }

    // Aggregate values
    if (!aggregated.has(periodKey)) {
      aggregated.set(periodKey, {
        period: periodKey,
        periodStart,
        local: 0,
        cabang: 0,
        total: 0,
      });
    }

    const current = aggregated.get(periodKey)!;
    current.local += day.local;
    current.cabang += day.cabang;
    current.total += day.total;
  });

  // Convert Map to Array and sort by periodStart
  return Array.from(aggregated.values())
    .sort((a, b) => a.periodStart.getTime() - b.periodStart.getTime());
}
```

**Formula:**
```
Weekly Aggregate = ΣDaily Data (Monday to Sunday)
Monthly Aggregate = ΣDaily Data (1st to last day of month)
Quarterly Aggregate = ΣDaily Data (Q1/Q2/Q3/Q4: 3 months)
Semester Aggregate = ΣDaily Data (S1/S2: 6 months)
Yearly Aggregate = ΣDaily Data (Jan 1 to Dec 31)
```

**Contoh Agregasi Mingguan:**
```
Raw Daily Data (Minggu 19-25 Jan):
  19 Jan (Mon): 50M
  20 Jan (Tue): 48M
  21 Jan (Wed): 52M
  22 Jan (Thu): 49M
  23 Jan (Fri): 51M
  24 Jan (Sat): 0M
  25 Jan (Sun): 0M

Aggregated Weekly Data:
  Period: "2026-W03"
  Total: 50M + 48M + 52M + 49M + 51M = 250M
```

---

### 5. Achievement by Category (Pie Chart)

#### Yang Ditampilkan:
```
Pie Chart untuk setiap kategori produk:
- % Achievement = (Omzet / Target) × 100
- Warna: Green (≥100%), Yellow (80-99%), Orange (60-79%), Red (<60%)
```

#### Perhitungan Backend:
```typescript
// File: src/lib/mock-data.ts

export interface CategoryData {
  category: string;           // Nama kategori

  localOmzet: number;        // Omzet LOCAL
  localTarget: number;        // Target LOCAL
  localPencapaian: number;   // (localOmzet / localTarget) × 100

  cabangOmzet: number;       // Omzet CABANG
  cabangTarget: number;       // Target CABANG
  cabangPencapaian: number;  // (cabangOmzet / cabangTarget) × 100

  totalOmzet: number;        // localOmzet + cabangOmzet
  totalTarget: number;        // localTarget + cabangTarget
  totalPencapaian: number;   // (totalOmzet / totalTarget) × 100
}

export const mockCategories: CategoryData[] = [
  {
    category: "FURNITURE",
    localOmzet: 45230000000000,
    localTarget: 50000000000000,
    localPencapaian: 90.46,       // (45.23 / 50) × 100
    cabangOmzet: 28150000000000,
    cabangTarget: 30000000000000,
    cabangPencapaian: 93.83,      // (28.15 / 30) × 100
    totalOmzet: 73380000000000,
    totalTarget: 80000000000000,
    totalPencapaian: 91.73,       // (73.38 / 80) × 100
  },
  // ... 16 kategori lainnya
];
```

**Formula:**
```
Pencapaian (%) = (Omzet Aktual / Target) × 100

Color Logic:
  if pencapaian >= 100  → Green  (#10b981)
  if pencapaian >= 80   → Yellow (#fbbf24)
  if pencapaian >= 60   → Orange (#fb923c)
  if pencapaian < 60    → Red    (#ef4444)
```

**Contoh:**
```
FURNITURE Category:
  LOCAL:
    Omzet:  Rp 45.23T
    Target: Rp 50T
    %:      90.46% → Yellow

  CABANG:
    Omzet:  Rp 28.15T
    Target: Rp 30T
    %:      93.83% → Yellow

  TOTAL:
    Omzet:  Rp 73.38T
    Target: Rp 80T
    %:      91.73% → Yellow
```

---

## 🔄 Flow Data

### 1. Data Upload Flow

```
┌─────────────────┐
│ User Upload     │
│ Excel File      │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│ Parse Excel                 │
│ - Validate format           │
│ - Check kode_lokasi         │
│ - Check kategori            │
│ - Validate dates            │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Process Data Type           │
│                             │
│ IF type = "penjualan":      │
│   - Insert to Sales table   │
│   - Fields: tanggal,        │
│     kode_lokasi, kategori,  │
│     amount                  │
│                             │
│ IF type = "gross_margin":   │
│   - Insert to Margin table  │
│   - Fields: tanggal,        │
│     kode_lokasi, kategori,  │
│     omzet, hpp,             │
│     gross_margin            │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Aggregate Data              │
│ - Group by date             │
│ - Group by location type    │
│   (LOCAL vs CABANG)         │
│ - Group by category         │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Calculate Metrics           │
│ - Daily totals              │
│ - Weekly/Monthly/etc sums   │
│ - Comparisons               │
│ - Achievement %             │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Update Dashboard            │
│ - Refresh all cards         │
│ - Update trend charts       │
│ - Update pie charts         │
└─────────────────────────────┘
```

### 2. Dashboard Rendering Flow

```
┌─────────────────────────────┐
│ Page Load                   │
│ /dashboard                  │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Generate Mock Data          │
│ - generateDailySalesData()  │
│ - 730 days (2 years)        │
└────────┬────────────────────┘
         │
         ├─────────────────────────────────┐
         │                                 │
         ▼                                 ▼
┌─────────────────────┐    ┌──────────────────────────┐
│ Calculate           │    │ Aggregate by Period      │
│ Comparisons         │    │ - Daily / Weekly / etc   │
│                     │    └──────────┬───────────────┘
│ - Daily             │               │
│ - Weekly            │               ▼
│ - Monthly           │    ┌──────────────────────────┐
│ - Quarterly         │    │ Generate Trend Chart     │
│ - Semester          │    │ Data Points              │
│ - Yearly            │    └──────────────────────────┘
│                     │
│ For each:           │
│ - Omzet             │
│ - Gross Margin      │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────────────┐
│ Render Components           │
│ - StatsCard (3x)            │
│ - ComparisonCard (6x)       │
│ - TrendChart (1x)           │
│ - CategoryAchievementPie    │
│   (2x: LOCAL + CABANG)      │
└─────────────────────────────┘
```

### 3. Real-time Calculation Flow (on Period Change)

```
User clicks "Weekly" on Period Selector
         │
         ▼
┌─────────────────────────────┐
│ setState(selectedPeriod)    │
│ → triggers useMemo          │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ getDataRangeForPeriod()     │
│ Weekly → 182 days (26 wks)  │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ generateDailySalesData(182) │
│ → rawDailySales             │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ aggregateDataByPeriod()     │
│ - Group by Monday           │
│ - Sum 7 days per week       │
│ → 26 data points            │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ TrendChart re-renders       │
│ with 26 weekly data points  │
└─────────────────────────────┘
```

---

## 📐 Helper Functions

### Date Helpers

```typescript
// Get Monday of the week
function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Get first day of month
function getFirstDayOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

// Get last day of month
function getLastDayOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

// Get first day of quarter
function getFirstDayOfQuarter(date: Date): Date {
  const quarter = Math.floor(date.getMonth() / 3);
  return new Date(date.getFullYear(), quarter × 3, 1);
}

// Get quarter number (1-4)
function getQuarter(date: Date): number {
  return Math.floor(date.getMonth() / 3) + 1;
}

// Get semester number (1-2)
function getSemester(date: Date): number {
  return date.getMonth() < 6 ? 1 : 2;
}
```

### Aggregation Helpers

```typescript
// Filter data within date range
function filterDataInRange(
  data: DailySales[],
  startDate: Date,
  endDate: Date
): DailySales[] {
  const start = startDate.toISOString().split('T')[0];
  const end = endDate.toISOString().split('T')[0];
  return data.filter(d => d.date >= start && d.date <= end);
}

// Sum field values
function sumField(
  data: DailySales[],
  field: keyof DailySales
): number {
  return data.reduce((sum, day) => sum + day[field], 0);
}
```

---

## 📊 Data Ranges by Period

| Period Type | Data Range | Display Points | Calculation |
|------------|-----------|----------------|-------------|
| **Daily** | 90 days | 90 points | Raw daily data |
| **Weekly** | 182 days (26 weeks) | 26 points | Sum Mon-Sun per week |
| **Monthly** | 365 days (12 months) | 12 points | Sum 1st-end per month |
| **Quarterly** | 730 days (8 quarters) | 8 points | Sum 3 months per quarter |
| **Semester** | 730 days (4 semesters) | 4 points | Sum 6 months per semester |
| **Yearly** | 1825 days (5 years) | 5 points | Sum Jan-Dec per year |

---

## 🎨 Color Coding

### Achievement Colors
```typescript
function getAchievementColor(percentage: number): string {
  if (percentage >= 100) return '#10b981'; // Green
  if (percentage >= 80)  return '#fbbf24'; // Yellow
  if (percentage >= 60)  return '#fb923c'; // Orange
  return '#ef4444';                        // Red
}
```

### Location Colors
```typescript
const LOCATION_COLORS = {
  LOCAL: {
    primary: '#10b981',    // Emerald
    light: '#34d399',
    dark: '#059669'
  },
  CABANG: {
    primary: '#3b82f6',    // Blue
    light: '#60a5fa',
    dark: '#2563eb'
  },
  TOTAL: {
    primary: '#a855f7',    // Purple
    light: '#c084fc',
    dark: '#9333ea'
  }
};
```

### Comparison Colors
```typescript
function getComparisonColor(difference: number): string {
  if (difference > 0)  return '#10b981'; // Green (positive growth)
  if (difference === 0) return '#64748b'; // Gray (neutral)
  return '#ef4444';                       // Red (negative growth)
}
```

---

## 🔢 Number Formatting

### Currency Formatter
```typescript
export function formatCurrency(value: number): string {
  if (value >= 1_000_000_000_000) {
    // Triliun
    return `Rp ${(value / 1_000_000_000_000).toFixed(1)}T`;
  }
  if (value >= 1_000_000_000) {
    // Miliar
    return `Rp ${(value / 1_000_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000_000) {
    // Juta
    return `Rp ${(value / 1_000_000).toFixed(1)}Jt`;
  }
  // Format standard with thousand separators
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
```

**Examples:**
```
1,500,000           → Rp 1.5Jt
50,000,000          → Rp 50Jt
2,350,000,000       → Rp 2.4M (Miliar)
78,545,000,000,000  → Rp 78.5T (Triliun)
```

### Percentage Formatter
```typescript
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}
```

**Examples:**
```
87.13456  → 87.1%   (1 decimal)
-5.234    → -5.2%   (1 decimal)
103.789   → 103.8%  (1 decimal)
```

---

## 📝 Summary Table

| Metric | Formula | Example |
|--------|---------|---------|
| **Total Omzet** | LOCAL + CABANG | 78.5T + 44.3T = 122.8T |
| **Achievement %** | (Omzet / Target) × 100 | (122.8T / 141T) × 100 = 87.13% |
| **Gross Margin** | Omzet × Margin Rate | 100M × 27% = 27M |
| **HPP** | Omzet - Gross Margin | 100M - 27M = 73M |
| **Difference** | Current - Previous | 250M - 230M = +20M |
| **% Change** | (Difference / Previous) × 100 | (20M / 230M) × 100 = +8.7% |
| **Weekly Sum** | ΣMonday to Sunday | 50M + 48M + ... = 250M |
| **Monthly Sum** | Σ1st to last day | Daily sums for month |

---

## 🔐 Data Validation Rules

### Upload Template Rules

#### Penjualan:
- `tanggal`: YYYY-MM-DD format, not future date
- `kode_lokasi`: Must exist in referensi lokasi
- `kategori`: Must exist in referensi kategori
- `amount`: Positive number, no decimals

#### Gross Margin:
- `tanggal`: YYYY-MM-DD format, not future date
- `kode_lokasi`: Must exist in referensi lokasi
- `kategori`: Must exist in referensi kategori
- `omzet`: Positive number, no decimals
- `hpp`: Positive number, no decimals, must be < omzet
- `gross_margin`: Must equal omzet - hpp

---

## 📚 References

### Key Files:
- **Mock Data**: `src/lib/mock-data.ts`, `src/lib/mock-data-daily.ts`
- **Calculations**: `src/lib/data-aggregator.ts`
- **Components**: `src/components/dashboard/`
- **Dashboard**: `src/app/(dashboard)/dashboard/page.tsx`
- **Upload**: `src/app/(dashboard)/upload/page.tsx`
- **Templates**: `scripts/generate-excel-template.ts`

### External Dependencies:
- **Recharts**: For rendering trend & pie charts
- **XLSX**: For Excel template generation & parsing
- **date-fns**: (Optional) For advanced date manipulation

---

**Last Updated**: 2026-01-23
**Version**: 0.3.2
**Maintained By**: Development Team

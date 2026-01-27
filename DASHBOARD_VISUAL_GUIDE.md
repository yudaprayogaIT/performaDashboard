# 📊 Dashboard Visual Guide - Quick Reference

**Panduan cepat memahami apa yang ditampilkan di dashboard dan perhitungannya**

---

## 🎯 1. STATS CARD - Ringkasan Tahunan

### Yang Anda Lihat:
```
╔═══════════════════════════════════╗
║ Total Sales 2026                  ║
║                                   ║
║ Rp 122.8T / Rp 141T              ║
║ ████████░░ 87.13%                ║
╚═══════════════════════════════════╝
```

### Yang Terjadi di Backend:
```javascript
// File: src/lib/mock-data.ts

totalOmzet = 122,850,000,000,000  // Rp 122.8 Triliun
totalTarget = 141,000,000,000,000  // Rp 141 Triliun

// Rumus Achievement:
totalPencapaian = (totalOmzet / totalTarget) × 100
                = (122.8T / 141T) × 100
                = 87.13%
```

**📌 Catatan:**
- Data diambil dari ringkasan tahunan
- Total = LOCAL + CABANG
- Warna progress bar: Hijau jika ≥80%, Kuning jika <80%

---

## 📈 2. COMPARISON CARD - Pertumbuhan Omzet & Gross Margin

### Yang Anda Lihat:
```
╔════════════════════════════════════════════╗
║ Total Omzet Minggu Ini                     ║
║                                            ║
║ Rp 245,500,000                            ║
║ ─────────────────────────────────────────  ║
║ 🔼 +Rp 12,300,000  vs Minggu Lalu  +5.3%  ║
║                                            ║
║ Gross Margin                               ║
║ Rp 65,200,000                             ║
║ ─────────────────────────────────────────  ║
║ 🔼 +Rp 3,100,000   vs Minggu Lalu  +5.0%  ║
╚════════════════════════════════════════════╝
```

### Yang Terjadi di Backend:

#### A. Perhitungan Periode Mingguan:
```javascript
// File: src/lib/mock-data-daily.ts

// 1. Tentukan range minggu ini (Senin-Minggu)
Today = 23 Januari 2026 (Jumat)

Current Week:
  Start: 19 Jan 2026 (Senin)
  End:   25 Jan 2026 (Minggu)

Previous Week:
  Start: 12 Jan 2026 (Senin)
  End:   18 Jan 2026 (Minggu)

// 2. Jumlahkan semua penjualan dalam periode
currentWeekOmzet = sum(data dari 19-25 Jan) = Rp 245,500,000
previousWeekOmzet = sum(data dari 12-18 Jan) = Rp 233,200,000

// 3. Hitung selisih dan persentase
difference = 245,500,000 - 233,200,000 = +Rp 12,300,000
percentageChange = (12,300,000 / 233,200,000) × 100 = +5.3%
```

#### B. Perhitungan Gross Margin:
```javascript
// Gross Margin dihitung sama dengan Omzet
currentWeekMargin = sum(gross margin dari 19-25 Jan) = Rp 65,200,000
previousWeekMargin = sum(gross margin dari 12-18 Jan) = Rp 62,100,000

marginDifference = 65,200,000 - 62,100,000 = +Rp 3,100,000
marginPercentageChange = (3,100,000 / 62,100,000) × 100 = +5.0%
```

**📌 Catatan:**
- ✅ Warna hijau = pertumbuhan positif (+)
- ⚠️ Warna abu = tidak ada perubahan (0)
- ❌ Warna merah = penurunan negatif (-)

---

## 📅 3. PERIODE COMPARISON - Cara Perhitungan

### HARIAN (vs Kemarin)
```
Hari Ini:  23 Jan 2026 → Rp 50,000,000
Kemarin:   22 Jan 2026 → Rp 45,000,000
────────────────────────────────────────
Selisih:                 +Rp 5,000,000
%:                       +11.1%
```

### MINGGUAN (vs Minggu Lalu)
```
Minggu Ini (19-25 Jan):
  Senin:  50M
  Selasa: 48M
  Rabu:   52M
  Kamis:  49M
  Jumat:  51M
  Sabtu:  0M (belum)
  Minggu: 0M (belum)
  ─────────────
  Total:  250M

Minggu Lalu (12-18 Jan):
  Total:  230M

Selisih: +20M (+8.7%)
```

### BULANAN (vs Bulan Lalu)
```
Bulan Ini (1-31 Jan 2026):
  Total hari 1-23: 1,150M

Bulan Lalu (1-31 Des 2025):
  Total:          1,050M

Selisih: +100M (+9.5%)
```

### TRIWULAN (vs Triwulan Lalu)
```
Q1 2026 (Jan-Mar):
  Total:  3,200M

Q4 2025 (Oct-Dec):
  Total:  3,000M

Selisih: +200M (+6.7%)
```

### SEMESTER (vs Semester Lalu)
```
S1 2026 (Jan-Jun):
  Total:  6,500M

S2 2025 (Jul-Dec):
  Total:  6,000M

Selisih: +500M (+8.3%)
```

### TAHUNAN (vs Tahun Lalu)
```
2026 (Jan-Des):
  Total:  12,800M

2025 (Jan-Des):
  Total:  12,000M

Selisih: +800M (+6.7%)
```

**📌 Catatan Penting:**
- Semua periode menggunakan **Calendar-Based**:
  - Mingguan: Senin ketemu Senin
  - Bulanan: Tanggal 1 ketemu tanggal 1
  - Triwulan: Q1 ketemu Q1
  - Semester: S1 ketemu S1
  - Tahunan: 2026 ketemu 2025

---

## 💰 4. GROSS MARGIN - Perhitungan Detail

### Yang Anda Lihat:
```
Gross Margin = Omzet - HPP
```

### Yang Terjadi di Backend:

#### Konsep Dasar:
```
Omzet = Total penjualan (revenue) ← USER INPUT
HPP = Harga Pokok Penjualan (cost of goods) ← USER INPUT
Gross Margin = Keuntungan kotor (Omzet - HPP) ← DIHITUNG SISTEM
Margin Rate (%) = (Gross Margin / Omzet) × 100 ← DIHITUNG SISTEM
```

#### Flow Data Real (Upload):
```
1. User Input (yang diketahui dari akuntansi):
   - Omzet:  Rp 100,000,000  ← Dari catatan penjualan
   - HPP:    Rp 73,000,000   ← Dari catatan biaya produksi/pembelian

2. Sistem Hitung Otomatis:
   - Gross Margin = 100,000,000 - 73,000,000 = Rp 27,000,000
   - Margin Rate  = (27,000,000 / 100,000,000) × 100 = 27%
```

#### Contoh Perhitungan Lengkap:
```javascript
// TRANSAKSI 1: PENJUALAN LOCAL HARI INI

User Upload Data:
  Tanggal:  2026-01-23
  Lokasi:   LOCAL-BGR (Bogor Pusat)
  Kategori: BAHAN KIMIA
  Omzet:    Rp 100,000,000  ← Dari invoice penjualan
  HPP:      Rp 73,000,000   ← Dari cost accounting

Sistem Hitung & Validasi:
  Gross Margin = 100,000,000 - 73,000,000 = Rp 27,000,000 ✅
  Margin Rate  = (27,000,000 / 100,000,000) × 100 = 27% ✅

// TRANSAKSI 2: PENJUALAN CABANG HARI INI

User Upload Data:
  Tanggal:  2026-01-23
  Lokasi:   CABANG-JKT (Jakarta)
  Kategori: FURNITURE
  Omzet:    Rp 80,000,000
  HPP:      Rp 62,400,000

Sistem Hitung & Validasi:
  Gross Margin = 80,000,000 - 62,400,000 = Rp 17,600,000 ✅
  Margin Rate  = (17,600,000 / 80,000,000) × 100 = 22% ✅

// AGREGASI TOTAL HARI INI

TOTAL:
  Omzet:        Rp 180,000,000 (100M + 80M)
  HPP:          Rp 135,400,000 (73M + 62.4M)
  Gross Margin: Rp 44,600,000 (27M + 17.6M)

  Effective Margin Rate:
    = (44,600,000 / 180,000,000) × 100
    = 24.78%
```

#### Validasi Sistem:
```javascript
// Saat user upload, sistem validasi:

if (gross_margin !== omzet - hpp) {
  ERROR: "Gross Margin tidak sesuai!"
  ERROR: "Harus = Omzet - HPP"
  ERROR: "Expected: Rp 27,000,000"
  ERROR: "Got: Rp 25,000,000"
}

// Atau sistem bisa auto-calculate:
const calculated_margin = omzet - hpp;
if (user_input_margin !== calculated_margin) {
  console.warn("Gross Margin di-recalculate otomatis");
  gross_margin = calculated_margin; // Override dengan perhitungan yang benar
}
```

**📌 Catatan Penting:**
- ⚠️ **Mock Data vs Real Data**:
  - Mock data (testing): Margin rate diasumsikan, lalu hitung HPP (cara terbalik)
  - Real data (production): HPP dari catatan akuntansi, sistem hitung margin
- ✅ **User harus input**: Omzet dan HPP (dari sistem akuntansi/catatan biaya)
- ✅ **Sistem yang hitung**: Gross Margin dan Margin Rate
- 💡 Margin rate akan bervariasi per transaksi tergantung kondisi pasar, nego harga, dll

---

## 📊 5. TREND CHART - Grafik Penjualan

### Yang Anda Lihat:
```
📈 Grafik Line Chart dengan 3 garis:
   🔵 Biru:   Total Omzet
   🟢 Hijau:  LOCAL Omzet
   🟠 Orange: CABANG Omzet

Sumbu X: Periode (Hari/Minggu/Bulan/dll)
Sumbu Y: Nilai Rupiah
```

### Period Selector - Data Range:

| Pilihan | Data Range | Jumlah Titik | Cara Agregasi |
|---------|-----------|--------------|---------------|
| **Daily** | 90 hari | 90 titik | Tampil langsung (tidak diagregasi) |
| **Weekly** | 182 hari (26 minggu) | 26 titik | Jumlahkan 7 hari (Sen-Min) |
| **Monthly** | 365 hari (12 bulan) | 12 titik | Jumlahkan per bulan (1-akhir) |
| **Quarterly** | 730 hari (8 quarters) | 8 titik | Jumlahkan per triwulan (3 bulan) |
| **Semester** | 730 hari (4 semesters) | 4 titik | Jumlahkan per semester (6 bulan) |
| **Yearly** | 1825 hari (5 tahun) | 5 titik | Jumlahkan per tahun (Jan-Des) |

### Yang Terjadi di Backend:

#### Contoh Agregasi Mingguan:
```javascript
// File: src/lib/data-aggregator.ts

// 1. Ambil 182 hari data harian
Raw Daily Data (182 hari):
  2025-07-14: 45M
  2025-07-15: 48M
  ... (182 hari)
  2026-01-23: 51M

// 2. Group by minggu (Senin = start of week)
Minggu 1 (14-20 Jul 2025):
  Sen: 45M, Sel: 48M, Rab: 47M, ...
  Sum: 320M

Minggu 2 (21-27 Jul 2025):
  Sen: 46M, Sel: 49M, Rab: 48M, ...
  Sum: 330M

... (26 minggu) ...

Minggu 26 (19-25 Jan 2026):
  Sen: 50M, Sel: 48M, Rab: 52M, ...
  Sum: 250M

// 3. Hasilkan 26 data points untuk chart
Result: [320M, 330M, 335M, ..., 250M]
```

**📌 Catatan:**
- Semakin besar periode, semakin sedikit titik data (lebih smooth)
- Daily: Detail tinggi, Weekly: Menengah, Yearly: Overview besar

---

## 🥧 6. PIE CHART - Achievement by Category

### Yang Anda Lihat:
```
🍰 Pie Chart per Kategori Produk

Contoh:
  FURNITURE:    91.7% (Yellow)
  HDP:          95.2% (Yellow)
  BUSA:         102.3% (Green)
  KAWAT:        55.8% (Red)
  ...
```

### Yang Terjadi di Backend:

```javascript
// File: src/lib/mock-data.ts

FURNITURE Category:
  Omzet:  Rp 73,380,000,000,000
  Target: Rp 80,000,000,000,000

  Achievement = (73.38T / 80T) × 100 = 91.73%

  Color Logic:
    91.73% → Yellow (80-99%)
```

### Color Rules:
```
✅ Green  (≥100%): Target tercapai atau terlampaui
⚠️ Yellow (80-99%): Mendekati target
🟠 Orange (60-79%): Perlu perhatian
❌ Red    (<60%):   Jauh dari target
```

**📌 Catatan:**
- Pie chart menampilkan proporsi achievement setiap kategori
- Ada 2 pie chart: LOCAL dan CABANG (bisa beda-beda achievementnya)

---

## 🔄 FLOW DATA - Dari Upload sampai Tampil

### 1. Upload Excel File
```
User Upload → Parse Excel → Validate Data
                                ↓
                        ┌───────────────────┐
                        │  Type Selection   │
                        └────────┬──────────┘
                                 │
                    ┌────────────┴────────────┐
                    ↓                         ↓
            ┌───────────────┐        ┌───────────────┐
            │  Penjualan    │        │ Gross Margin  │
            │               │        │               │
            │ - tanggal     │        │ - tanggal     │
            │ - lokasi      │        │ - lokasi      │
            │ - kategori    │        │ - kategori    │
            │ - amount      │        │ - omzet       │
            │               │        │ - hpp         │
            │               │        │ - gross_margin│
            └───────┬───────┘        └───────┬───────┘
                    │                        │
                    └────────────┬───────────┘
                                 ↓
                        Insert to Database
```

### 2. Dashboard Refresh
```
Page Load → Generate Mock Data (730 hari)
                    ↓
        ┌───────────┴───────────┐
        ↓                       ↓
  Calculate              Aggregate
  Comparisons            by Period
        ↓                       ↓
    ┌───────────────────────────┐
    │    Render Components      │
    │  - StatsCard (3x)        │
    │  - ComparisonCard (6x)   │
    │  - TrendChart (1x)       │
    │  - PieChart (2x)         │
    └───────────────────────────┘
```

### 3. Period Change (User Action)
```
User clicks "Weekly"
        ↓
  setState(selectedPeriod = "weekly")
        ↓
  useMemo triggers
        ↓
  Generate 182 days data
        ↓
  Aggregate by week (sum 7 days)
        ↓
  26 data points
        ↓
  TrendChart re-renders
```

---

## 📐 RUMUS CEPAT - Cheat Sheet

| Metrik | Rumus | Contoh |
|--------|-------|--------|
| **Total Omzet** | LOCAL + CABANG | 78.5T + 44.3T = 122.8T |
| **Achievement** | (Omzet / Target) × 100 | (122.8 / 141) × 100 = 87.1% |
| **Gross Margin** | Omzet × Margin Rate | 100M × 27% = 27M |
| **HPP** | Omzet - Gross Margin | 100M - 27M = 73M |
| **Selisih** | Current - Previous | 250M - 230M = +20M |
| **% Perubahan** | (Selisih / Previous) × 100 | (20M/230M) × 100 = +8.7% |
| **Weekly Sum** | ΣSenin-Minggu | 50+48+52+49+51 = 250M |
| **Monthly Sum** | ΣTanggal 1-akhir | Sum all days |
| **Margin Rate** | (Margin / Omzet) × 100 | (27M/100M) × 100 = 27% |

---

## 🎨 VISUAL INDICATOR - Apa Artinya?

### Progress Bar Colors:
```
████████░░ 87% → Hijau Muda  (80-100%): Bagus!
███████░░░ 75% → Kuning      (60-79%):  Perlu Usaha
█████░░░░░ 55% → Merah       (<60%):    Perlu Perhatian Serius
```

### Comparison Arrow:
```
🔼 +12.3M (+5.3%) → Hijau: Naik (Bagus!)
➖  0M    (0%)    → Abu:   Stabil
🔽 -8.5M  (-4.2%) → Merah: Turun (Perlu Perhatian)
```

### Location Badge:
```
[LOCAL-BGR]  → Hijau/Emerald: Lokasi LOCAL (Bogor)
[CABANG-JKT] → Biru: Lokasi CABANG (Luar Bogor)
```

---

## 💡 TIPS MEMBACA DASHBOARD

### 1. Cek Stats Card Dulu
- Lihat achievement % → Apakah target tercapai?
- Bandingkan LOCAL vs CABANG → Mana yang lebih tinggi?

### 2. Lihat Comparison Cards
- Fokus pada trend (naik/turun)
- Cek semua periode (Harian, Mingguan, Bulanan, dll)
- Bandingkan Omzet vs Gross Margin

### 3. Analisa Trend Chart
- Pilih periode yang sesuai (Weekly untuk analisa mingguan)
- Cari pola: Apakah ada penurunan/kenaikan konsisten?
- Bandingkan LOCAL vs CABANG

### 4. Cek Category Achievement
- Kategori mana yang merah? (Perlu perhatian)
- Kategori mana yang hijau? (Best performer)
- Focus on improvement untuk kategori kuning/merah

---

## 🔍 FAQ - Pertanyaan Umum

### Q: Kenapa Gross Margin berbeda antara LOCAL dan CABANG?
**A:** LOCAL memiliki margin rate lebih tinggi (25-30%) karena:
- Biaya distribusi lebih rendah (dekat gudang)
- Biaya operasional lebih efisien
- Kontrol lebih baik

CABANG margin rate lebih rendah (20-25%) karena:
- Biaya distribusi lebih tinggi
- Biaya operasional cabang lebih besar

### Q: Kenapa data minggu ini bisa berubah?
**A:** Data mingguan dihitung dari Senin-Minggu. Jika hari ini Rabu, data Kamis-Minggu masih 0. Data akan terus bertambah setiap hari hingga Minggu.

### Q: Apa bedanya "Daily" vs "Weekly" di Period Selector?
**A:**
- **Daily**: Menampilkan data harian (90 titik = 90 hari)
- **Weekly**: Menampilkan data mingguan (26 titik = 26 minggu), setiap titik adalah SUM dari 7 hari

### Q: Bagaimana cara upload data real?
**A:**
1. Buka halaman `/upload`
2. Pilih jenis data (Penjualan atau Gross Margin)
3. Download template yang sesuai
4. Isi template dengan data real
5. Upload file Excel

---

## 📚 File Referensi

| File | Fungsi |
|------|--------|
| `src/lib/mock-data.ts` | Data ringkasan tahunan & kategori |
| `src/lib/mock-data-daily.ts` | Generate data harian & perhitungan comparison |
| `src/lib/data-aggregator.ts` | Agregasi data (Daily→Weekly→Monthly→dll) |
| `src/components/dashboard/comparison-card.tsx` | Tampilan comparison card |
| `src/components/dashboard/trend-chart.tsx` | Tampilan grafik trend |
| `src/app/(dashboard)/dashboard/page.tsx` | Main dashboard page |
| `CALCULATION_DOCUMENTATION.md` | Dokumentasi teknis lengkap |

---

**🎯 Kesimpulan:**
Dashboard ini menampilkan metrik penjualan real-time dengan perhitungan otomatis untuk achievement, pertumbuhan, dan gross margin. Semua data dapat diupload via Excel dan langsung terlihat di dashboard.

**Last Updated**: 2026-01-23
**Version**: 0.3.2

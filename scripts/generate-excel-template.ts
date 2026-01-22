/**
 * Script untuk generate Excel template upload data penjualan dan gross margin
 * Jalankan dengan: npm run generate:template
 */

import * as XLSX from "xlsx";
import * as path from "path";
import * as fs from "fs";

// =============================================
// DATA REFERENSI
// =============================================

// Daftar Lokasi (sesuai dengan seed data)
const locations = [
  // LOCAL (Bogor & Sekitar)
  {
    code: "LOCAL-BGR",
    name: "Bogor Pusat",
    type: "LOCAL",
    address: "Jl. Pajajaran, Bogor",
  },
  {
    code: "LOCAL-CBI",
    name: "Cibinong",
    type: "LOCAL",
    address: "Jl. Raya Cibinong, Bogor",
  },
  {
    code: "LOCAL-CGR",
    name: "Citeureup",
    type: "LOCAL",
    address: "Jl. Raya Citeureup, Bogor",
  },
  {
    code: "LOCAL-DRM",
    name: "Dramaga",
    type: "LOCAL",
    address: "Jl. Raya Dramaga, Bogor",
  },
  {
    code: "LOCAL-GNL",
    name: "Gunung Putri",
    type: "LOCAL",
    address: "Jl. Raya Gunung Putri, Bogor",
  },
  // CABANG (Luar Bogor)
  {
    code: "CABANG-JKT",
    name: "Jakarta Pusat",
    type: "CABANG",
    address: "Jl. Sudirman, Jakarta",
  },
  {
    code: "CABANG-BKS",
    name: "Bekasi",
    type: "CABANG",
    address: "Jl. Ahmad Yani, Bekasi",
  },
  {
    code: "CABANG-DPK",
    name: "Depok",
    type: "CABANG",
    address: "Jl. Margonda Raya, Depok",
  },
  {
    code: "CABANG-TGR",
    name: "Tangerang",
    type: "CABANG",
    address: "Jl. Sudirman, Tangerang",
  },
  {
    code: "CABANG-BDG",
    name: "Bandung",
    type: "CABANG",
    address: "Jl. Dago, Bandung",
  },
  {
    code: "CABANG-SMG",
    name: "Semarang",
    type: "CABANG",
    address: "Jl. Pemuda, Semarang",
  },
  {
    code: "CABANG-SBY",
    name: "Surabaya",
    type: "CABANG",
    address: "Jl. Tunjungan, Surabaya",
  },
  {
    code: "CABANG-YGY",
    name: "Yogyakarta",
    type: "CABANG",
    address: "Jl. Malioboro, Yogyakarta",
  },
  {
    code: "CABANG-MLG",
    name: "Malang",
    type: "CABANG",
    address: "Jl. Ijen, Malang",
  },
  {
    code: "CABANG-SKA",
    name: "Solo",
    type: "CABANG",
    address: "Jl. Slamet Riyadi, Solo",
  },
];

// Daftar Kategori (17 kategori)
const categories = [
  { name: "ACCESSORIES", description: "Aksesoris furniture" },
  { name: "BAHAN KIMIA", description: "Bahan kimia produksi" },
  { name: "BUSA", description: "Busa springbed/sofa" },
  { name: "HDP", description: "High Density Polyethylene" },
  { name: "JASA", description: "Jasa produksi" },
  { name: "KAIN POLOS SOFA", description: "Kain polos untuk sofa" },
  { name: "KAIN POLOS SPRINGBED", description: "Kain polos untuk springbed" },
  { name: "KAIN QUILTING", description: "Kain quilting" },
  { name: "MSP", description: "Multi Spring Pocket" },
  { name: "KAWAT", description: "Kawat springbed" },
  { name: "NON WOVEN", description: "Kain non-woven" },
  { name: "OTHER", description: "Lainnya" },
  { name: "PER COIL", description: "Per coil springbed" },
  { name: "PITA LIST", description: "Pita list dekorasi" },
  { name: "PLASTIC", description: "Plastik kemasan" },
  { name: "STAPLESS", description: "Staples industri" },
  { name: "FURNITURE", description: "Produk furniture jadi" },
];

// =============================================
// GENERATE SAMPLE DATA - PENJUALAN
// =============================================

function generateSampleSalesData(days: number = 30): Array<{
  tanggal: string;
  kode_lokasi: string;
  kategori: string;
  amount: number;
  catatan: string;
}> {
  const sampleData: Array<{
    tanggal: string;
    kode_lokasi: string;
    kategori: string;
    amount: number;
    catatan: string;
  }> = [];

  const today = new Date();

  // Generate data for the last N days
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD format

    // Generate 5-15 transactions per day
    const transactionsPerDay = Math.floor(Math.random() * 11) + 5;

    for (let j = 0; j < transactionsPerDay; j++) {
      const location = locations[Math.floor(Math.random() * locations.length)];
      const category =
        categories[Math.floor(Math.random() * categories.length)];

      // Random amount based on category
      let baseAmount = 1000000; // 1 juta default
      if (category.name === "FURNITURE") baseAmount = 50000000;
      else if (category.name === "HDP") baseAmount = 25000000;
      else if (category.name === "MSP" || category.name === "PER COIL")
        baseAmount = 15000000;
      else if (category.name === "BUSA" || category.name === "KAIN POLOS SOFA")
        baseAmount = 5000000;
      else if (category.name === "ACCESSORIES" || category.name === "PITA LIST")
        baseAmount = 500000;

      const amount = Math.floor(baseAmount * (0.5 + Math.random()));

      sampleData.push({
        tanggal: dateStr,
        kode_lokasi: location.code,
        kategori: category.name,
        amount: amount,
        catatan: "",
      });
    }
  }

  // Sort by date descending
  sampleData.sort((a, b) => b.tanggal.localeCompare(a.tanggal));

  return sampleData;
}

// =============================================
// GENERATE SAMPLE DATA - GROSS MARGIN
// =============================================

function generateSampleGrossMarginData(days: number = 30): Array<{
  tanggal: string;
  kode_lokasi: string;
  kategori: string;
  omzet: number;
  hpp: number;
  gross_margin: number;
  catatan: string;
}> {
  const sampleData: Array<{
    tanggal: string;
    kode_lokasi: string;
    kategori: string;
    omzet: number;
    hpp: number;
    gross_margin: number;
    catatan: string;
  }> = [];

  const today = new Date();

  // Generate data for the last N days
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD format

    // Generate 5-15 transactions per day
    const transactionsPerDay = Math.floor(Math.random() * 11) + 5;

    for (let j = 0; j < transactionsPerDay; j++) {
      const location = locations[Math.floor(Math.random() * locations.length)];
      const category =
        categories[Math.floor(Math.random() * categories.length)];

      // Random omzet based on category
      let baseOmzet = 1000000; // 1 juta default
      if (category.name === "FURNITURE") baseOmzet = 50000000;
      else if (category.name === "HDP") baseOmzet = 25000000;
      else if (category.name === "MSP" || category.name === "PER COIL")
        baseOmzet = 15000000;
      else if (category.name === "BUSA" || category.name === "KAIN POLOS SOFA")
        baseOmzet = 5000000;
      else if (category.name === "ACCESSORIES" || category.name === "PITA LIST")
        baseOmzet = 500000;

      const omzet = Math.floor(baseOmzet * (0.5 + Math.random()));

      // Margin rate varies by location type (LOCAL: 25-30%, CABANG: 20-25%)
      const isLocal = location.type === "LOCAL";
      const marginRate = isLocal
        ? 0.25 + Math.random() * 0.05 // 25-30%
        : 0.2 + Math.random() * 0.05; // 20-25%

      const gross_margin = Math.round(omzet * marginRate);
      const hpp = omzet - gross_margin;

      sampleData.push({
        tanggal: dateStr,
        kode_lokasi: location.code,
        kategori: category.name,
        omzet: omzet,
        hpp: hpp,
        gross_margin: gross_margin,
        catatan: "",
      });
    }
  }

  // Sort by date descending
  sampleData.sort((a, b) => b.tanggal.localeCompare(a.tanggal));

  return sampleData;
}

// =============================================
// CREATE EXCEL WORKBOOK - PENJUALAN
// =============================================

function createSalesTemplate() {
  const workbook = XLSX.utils.book_new();

  // =============================================
  // Sheet 1: Petunjuk Pengisian
  // =============================================
  const instructionData = [
    ["PETUNJUK PENGISIAN DATA PENJUALAN"],
    [""],
    [
      "Template ini digunakan untuk upload data penjualan ke sistem Performa Dashboard.",
    ],
    [""],
    ["KOLOM YANG WAJIB DIISI:"],
    ["1. tanggal - Format: YYYY-MM-DD (contoh: 2026-01-21)"],
    ["2. kode_lokasi - Pilih dari sheet 'Referensi Lokasi'"],
    ["3. kategori - Pilih dari sheet 'Referensi Kategori'"],
    ["4. amount - Nilai penjualan dalam Rupiah (angka tanpa titik/koma)"],
    [""],
    ["KOLOM OPSIONAL:"],
    ["5. catatan - Catatan tambahan"],
    [""],
    ["PENTING:"],
    ["- Pastikan kode_lokasi sesuai dengan daftar di sheet 'Referensi Lokasi'"],
    ["- Pastikan kategori sesuai dengan daftar di sheet 'Referensi Kategori'"],
    ["- Jangan ubah nama kolom di baris pertama"],
    ["- Hapus baris contoh sebelum upload data asli"],
    [""],
    ["CONTOH DATA:"],
    ["Lihat sheet 'Data Penjualan' untuk contoh data yang benar."],
  ];

  const wsInstructions = XLSX.utils.aoa_to_sheet(instructionData);
  wsInstructions["!cols"] = [{ wch: 80 }];
  XLSX.utils.book_append_sheet(workbook, wsInstructions, "Petunjuk");

  // =============================================
  // Sheet 2: Data Penjualan (Template + Sample)
  // =============================================
  const sampleSales = generateSampleSalesData(30);

  const salesHeaders = [
    "tanggal",
    "kode_lokasi",
    "kategori",
    "amount",
    "catatan",
  ];

  const salesData = [
    salesHeaders,
    ...sampleSales.map((row) => [
      row.tanggal,
      row.kode_lokasi,
      row.kategori,
      row.amount,
      row.catatan,
    ]),
  ];

  const wsSales = XLSX.utils.aoa_to_sheet(salesData);
  wsSales["!cols"] = [
    { wch: 12 }, // tanggal
    { wch: 15 }, // kode_lokasi
    { wch: 25 }, // kategori
    { wch: 15 }, // amount
    { wch: 30 }, // catatan
  ];
  XLSX.utils.book_append_sheet(workbook, wsSales, "Data Penjualan");

  // =============================================
  // Sheet 3: Referensi Lokasi
  // =============================================
  const locationHeaders = ["kode_lokasi", "nama_lokasi", "tipe", "alamat"];
  const locationData = [
    locationHeaders,
    ...locations.map((loc) => [loc.code, loc.name, loc.type, loc.address]),
  ];

  const wsLocations = XLSX.utils.aoa_to_sheet(locationData);
  wsLocations["!cols"] = [
    { wch: 15 }, // kode_lokasi
    { wch: 20 }, // nama_lokasi
    { wch: 10 }, // tipe
    { wch: 35 }, // alamat
  ];
  XLSX.utils.book_append_sheet(workbook, wsLocations, "Referensi Lokasi");

  // =============================================
  // Sheet 4: Referensi Kategori
  // =============================================
  const categoryHeaders = ["kategori", "deskripsi"];
  const categoryData = [
    categoryHeaders,
    ...categories.map((cat) => [cat.name, cat.description]),
  ];

  const wsCategories = XLSX.utils.aoa_to_sheet(categoryData);
  wsCategories["!cols"] = [
    { wch: 25 }, // kategori
    { wch: 35 }, // deskripsi
  ];
  XLSX.utils.book_append_sheet(workbook, wsCategories, "Referensi Kategori");

  // =============================================
  // Sheet 5: Template Kosong
  // =============================================
  const emptyTemplate = [
    salesHeaders,
    ["", "", "", "", ""],
    ["", "", "", "", ""],
    ["", "", "", "", ""],
    ["", "", "", "", ""],
    ["", "", "", "", ""],
  ];

  const wsTemplate = XLSX.utils.aoa_to_sheet(emptyTemplate);
  wsTemplate["!cols"] = [
    { wch: 12 }, // tanggal
    { wch: 15 }, // kode_lokasi
    { wch: 25 }, // kategori
    { wch: 15 }, // amount
    { wch: 30 }, // catatan
  ];
  XLSX.utils.book_append_sheet(workbook, wsTemplate, "Template Kosong");

  return workbook;
}

// =============================================
// CREATE EXCEL WORKBOOK - GROSS MARGIN
// =============================================

function createGrossMarginTemplate() {
  const workbook = XLSX.utils.book_new();

  // =============================================
  // Sheet 1: Petunjuk Pengisian
  // =============================================
  const instructionData = [
    ["PETUNJUK PENGISIAN DATA GROSS MARGIN"],
    [""],
    [
      "Template ini digunakan untuk upload data gross margin ke sistem Performa Dashboard.",
    ],
    [""],
    ["DEFINISI:"],
    ["- Omzet: Total nilai penjualan (revenue)"],
    ["- HPP (Harga Pokok Penjualan): Biaya langsung untuk produksi/pembelian barang"],
    ["- Gross Margin: Selisih antara Omzet dan HPP (Omzet - HPP)"],
    [""],
    ["KOLOM YANG WAJIB DIISI:"],
    ["1. tanggal - Format: YYYY-MM-DD (contoh: 2026-01-21)"],
    ["2. kode_lokasi - Pilih dari sheet 'Referensi Lokasi'"],
    ["3. kategori - Pilih dari sheet 'Referensi Kategori'"],
    ["4. omzet - Nilai penjualan dalam Rupiah (angka tanpa titik/koma)"],
    ["5. hpp - Harga Pokok Penjualan dalam Rupiah (angka tanpa titik/koma)"],
    ["6. gross_margin - Hasil: omzet - hpp (dalam Rupiah)"],
    [""],
    ["KOLOM OPSIONAL:"],
    ["7. catatan - Catatan tambahan"],
    [""],
    ["PENTING:"],
    ["- Pastikan kode_lokasi sesuai dengan daftar di sheet 'Referensi Lokasi'"],
    ["- Pastikan kategori sesuai dengan daftar di sheet 'Referensi Kategori'"],
    ["- Gross Margin = Omzet - HPP (pastikan perhitungan benar)"],
    ["- Jangan ubah nama kolom di baris pertama"],
    ["- Hapus baris contoh sebelum upload data asli"],
    [""],
    ["CONTOH DATA:"],
    ["Lihat sheet 'Data Gross Margin' untuk contoh data yang benar."],
  ];

  const wsInstructions = XLSX.utils.aoa_to_sheet(instructionData);
  wsInstructions["!cols"] = [{ wch: 80 }];
  XLSX.utils.book_append_sheet(workbook, wsInstructions, "Petunjuk");

  // =============================================
  // Sheet 2: Data Gross Margin (Template + Sample)
  // =============================================
  const sampleData = generateSampleGrossMarginData(30);

  const headers = [
    "tanggal",
    "kode_lokasi",
    "kategori",
    "omzet",
    "hpp",
    "gross_margin",
    "catatan",
  ];

  const sheetData = [
    headers,
    ...sampleData.map((row) => [
      row.tanggal,
      row.kode_lokasi,
      row.kategori,
      row.omzet,
      row.hpp,
      row.gross_margin,
      row.catatan,
    ]),
  ];

  const wsData = XLSX.utils.aoa_to_sheet(sheetData);
  wsData["!cols"] = [
    { wch: 12 }, // tanggal
    { wch: 15 }, // kode_lokasi
    { wch: 25 }, // kategori
    { wch: 15 }, // omzet
    { wch: 15 }, // hpp
    { wch: 15 }, // gross_margin
    { wch: 30 }, // catatan
  ];
  XLSX.utils.book_append_sheet(workbook, wsData, "Data Gross Margin");

  // =============================================
  // Sheet 3: Referensi Lokasi
  // =============================================
  const locationHeaders = ["kode_lokasi", "nama_lokasi", "tipe", "alamat"];
  const locationData = [
    locationHeaders,
    ...locations.map((loc) => [loc.code, loc.name, loc.type, loc.address]),
  ];

  const wsLocations = XLSX.utils.aoa_to_sheet(locationData);
  wsLocations["!cols"] = [
    { wch: 15 }, // kode_lokasi
    { wch: 20 }, // nama_lokasi
    { wch: 10 }, // tipe
    { wch: 35 }, // alamat
  ];
  XLSX.utils.book_append_sheet(workbook, wsLocations, "Referensi Lokasi");

  // =============================================
  // Sheet 4: Referensi Kategori
  // =============================================
  const categoryHeaders = ["kategori", "deskripsi"];
  const categoryData = [
    categoryHeaders,
    ...categories.map((cat) => [cat.name, cat.description]),
  ];

  const wsCategories = XLSX.utils.aoa_to_sheet(categoryData);
  wsCategories["!cols"] = [
    { wch: 25 }, // kategori
    { wch: 35 }, // deskripsi
  ];
  XLSX.utils.book_append_sheet(workbook, wsCategories, "Referensi Kategori");

  // =============================================
  // Sheet 5: Template Kosong
  // =============================================
  const emptyTemplate = [
    headers,
    ["", "", "", "", "", "", ""],
    ["", "", "", "", "", "", ""],
    ["", "", "", "", "", "", ""],
    ["", "", "", "", "", "", ""],
    ["", "", "", "", "", "", ""],
  ];

  const wsTemplate = XLSX.utils.aoa_to_sheet(emptyTemplate);
  wsTemplate["!cols"] = [
    { wch: 12 }, // tanggal
    { wch: 15 }, // kode_lokasi
    { wch: 25 }, // kategori
    { wch: 15 }, // omzet
    { wch: 15 }, // hpp
    { wch: 15 }, // gross_margin
    { wch: 30 }, // catatan
  ];
  XLSX.utils.book_append_sheet(workbook, wsTemplate, "Template Kosong");

  return workbook;
}

// =============================================
// MAIN EXECUTION
// =============================================

function main() {
  console.log("🚀 Generating Excel templates...\n");

  // Output directory
  const outputDir = path.join(process.cwd(), "public", "templates");

  // Create directory if not exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`📁 Created directory: ${outputDir}`);
  }

  // Generate timestamp for dated filenames
  const timestamp = new Date().toISOString().split("T")[0];

  // =============================================
  // Generate Sales Template
  // =============================================
  const salesWorkbook = createSalesTemplate();
  const salesFilename = `template_upload_penjualan_${timestamp}.xlsx`;
  const salesFilepath = path.join(outputDir, salesFilename);
  const salesStableFilename = "template_upload_penjualan.xlsx";
  const salesStableFilepath = path.join(outputDir, salesStableFilename);

  XLSX.writeFile(salesWorkbook, salesFilepath);
  XLSX.writeFile(salesWorkbook, salesStableFilepath);

  console.log("✅ Template Penjualan generated!");
  console.log(`   - ${salesFilepath}`);
  console.log(`   - ${salesStableFilepath}`);

  // =============================================
  // Generate Gross Margin Template
  // =============================================
  const marginWorkbook = createGrossMarginTemplate();
  const marginFilename = `template_upload_gross_margin_${timestamp}.xlsx`;
  const marginFilepath = path.join(outputDir, marginFilename);
  const marginStableFilename = "template_upload_gross_margin.xlsx";
  const marginStableFilepath = path.join(outputDir, marginStableFilename);

  XLSX.writeFile(marginWorkbook, marginFilepath);
  XLSX.writeFile(marginWorkbook, marginStableFilepath);

  console.log("\n✅ Template Gross Margin generated!");
  console.log(`   - ${marginFilepath}`);
  console.log(`   - ${marginStableFilepath}`);

  // =============================================
  // Summary
  // =============================================
  console.log("\n" + "=".repeat(60));
  console.log("📊 TEMPLATE SUMMARY");
  console.log("=".repeat(60));

  console.log("\n📥 Template Penjualan:");
  console.log(`   URL: /templates/${salesStableFilename}`);
  console.log(`   Contents:`);
  console.log(`   - Sheet 1: Petunjuk - Instruksi pengisian`);
  console.log(`   - Sheet 2: Data Penjualan - 30 hari sample data`);
  console.log(`   - Sheet 3: Referensi Lokasi - 15 lokasi`);
  console.log(`   - Sheet 4: Referensi Kategori - 17 kategori`);
  console.log(`   - Sheet 5: Template Kosong - Template siap pakai`);

  console.log("\n📥 Template Gross Margin:");
  console.log(`   URL: /templates/${marginStableFilename}`);
  console.log(`   Contents:`);
  console.log(`   - Sheet 1: Petunjuk - Instruksi pengisian`);
  console.log(`   - Sheet 2: Data Gross Margin - 30 hari sample data`);
  console.log(`   - Sheet 3: Referensi Lokasi - 15 lokasi`);
  console.log(`   - Sheet 4: Referensi Kategori - 17 kategori`);
  console.log(`   - Sheet 5: Template Kosong - Template siap pakai`);
}

main();

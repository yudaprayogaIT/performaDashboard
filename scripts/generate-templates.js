// scripts/generate-templates.js
// Generate all Excel templates (Penjualan, Gross Margin, Retur) using ExcelJS
// Templates are generated dynamically from database
// Run: node scripts/generate-templates.js

const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const TEMPLATES_DIR = path.join(__dirname, '..', 'public', 'templates');

// Ensure output directory exists
if (!fs.existsSync(TEMPLATES_DIR)) {
  fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
}

// ==================================
// SHARED STYLES
// ==================================
const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E79' } };
const headerFont = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
const subHeaderFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD6E4F0' } };
const subHeaderFont = { bold: true, color: { argb: 'FF1F4E79' }, size: 10 };
const thinBorder = {
  top: { style: 'thin', color: { argb: 'FFB0B0B0' } },
  bottom: { style: 'thin', color: { argb: 'FFB0B0B0' } },
  left: { style: 'thin', color: { argb: 'FFB0B0B0' } },
  right: { style: 'thin', color: { argb: 'FFB0B0B0' } },
};

// ==================================
// HELPER: Add styled header row
// ==================================
function addHeaderRow(ws, rowNum, headers, colWidths) {
  colWidths.forEach((w, i) => { ws.getColumn(i + 1).width = w; });
  const row = ws.getRow(rowNum);
  row.height = 22;
  headers.forEach((h, i) => {
    const cell = row.getCell(i + 1);
    cell.value = h;
    cell.font = headerFont;
    cell.fill = headerFill;
    cell.border = thinBorder;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });
}

// ==================================
// HELPER: Add petunjuk sheet
// ==================================
function addPetunjukSheet(wb, lines) {
  const ws = wb.addWorksheet('Petunjuk');
  ws.getColumn(1).width = 75;
  lines.forEach((text, i) => {
    const row = ws.getRow(i + 1);
    row.getCell(1).value = text;
    if (i === 0) {
      row.getCell(1).font = { bold: true, size: 14, color: { argb: 'FF1F4E79' } };
    } else if (text.startsWith('KETERANGAN') || text.startsWith('CATATAN') || text.startsWith('PENTING')) {
      row.getCell(1).font = { bold: true, size: 11 };
    }
  });
}

// ==================================
// HELPER: Add referensi kategori sheet
// ==================================
function addCategoryRefSheet(wb, categories, extraCols) {
  const ws = wb.addWorksheet('Referensi');
  const headers = ['KATEGORI', 'KETERANGAN', ...(extraCols || [])];
  const colWidths = [25, 35, ...(extraCols || []).map(() => 14)];
  addHeaderRow(ws, 1, headers, colWidths);

  categories.forEach((cat, i) => {
    const row = ws.getRow(i + 2);
    row.getCell(1).value = cat.name;
    row.getCell(1).border = thinBorder;
    row.getCell(2).value = cat.description || '';
    row.getCell(2).border = thinBorder;
  });

  return ws;
}

// =====================================================
// TEMPLATE 1: PENJUALAN
// =====================================================
async function generatePenjualanTemplate(categories, locations) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Performa Dashboard';

  // Sheet 1: Petunjuk
  addPetunjukSheet(wb, [
    'PETUNJUK PENGISIAN DATA PENJUALAN',
    '',
    '1. Gunakan sheet "Template Kosong" untuk mengisi data',
    '2. Jangan mengubah header kolom (baris pertama)',
    '3. Format tanggal: YYYY-MM-DD (contoh: 2026-01-21)',
    '4. Kode lokasi harus sesuai dengan daftar di sheet "Referensi Lokasi"',
    '5. Kategori harus sesuai dengan daftar di sheet "Referensi"',
    '6. Amount dalam angka (tanpa Rp, titik, atau koma)',
    '7. Upload file ini di menu Upload Data > Data Penjualan',
    '',
    'KETERANGAN KOLOM:',
    '- tanggal: Tanggal transaksi (YYYY-MM-DD)',
    '- kode_lokasi: Kode lokasi (lihat sheet Referensi Lokasi)',
    '- kategori: Nama kategori produk (lihat sheet Referensi)',
    '- amount: Nilai penjualan dalam Rupiah',
    '- catatan: Catatan tambahan (opsional)',
  ]);

  // Sheet 2: Template Kosong
  const wsTemplate = wb.addWorksheet('Template Kosong');
  const headers = ['tanggal', 'kode_lokasi', 'kategori', 'amount', 'catatan'];
  const colWidths = [14, 16, 25, 16, 30];
  addHeaderRow(wsTemplate, 1, headers, colWidths);

  // Add 50 empty rows with borders
  for (let r = 2; r <= 51; r++) {
    const row = wsTemplate.getRow(r);
    for (let c = 1; c <= 5; c++) {
      row.getCell(c).border = thinBorder;
    }
  }

  // Sheet 3: Contoh Data
  const wsContoh = wb.addWorksheet('Contoh Data');
  addHeaderRow(wsContoh, 1, headers, colWidths);

  // Generate sample data using actual categories and locations
  const sampleCategories = categories.slice(0, 5);
  const sampleLocations = locations.slice(0, Math.min(5, locations.length));
  const sampleData = [];

  let dateOffset = 0;
  for (let i = 0; i < Math.min(10, sampleCategories.length * 2); i++) {
    const cat = sampleCategories[i % sampleCategories.length];
    const loc = sampleLocations[i % sampleLocations.length];
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() - dateOffset);
    const dateStr = baseDate.toISOString().split('T')[0];
    const amount = Math.floor(Math.random() * 40000000) + 5000000;
    sampleData.push([dateStr, loc.code, cat.name, amount, i === 1 ? 'Order besar' : '']);
    if (i % 2 === 1) dateOffset++;
  }

  sampleData.forEach((data, ri) => {
    const row = wsContoh.getRow(ri + 2);
    data.forEach((val, ci) => {
      const cell = row.getCell(ci + 1);
      cell.value = val;
      cell.border = thinBorder;
      if (ci === 3) cell.numFmt = '#,##0';
    });
  });

  // Sheet 4: Referensi Lokasi
  const wsLokasi = wb.addWorksheet('Referensi Lokasi');
  addHeaderRow(wsLokasi, 1, ['KODE', 'NAMA', 'TIPE'], [16, 20, 10]);

  locations.forEach((loc, i) => {
    const row = wsLokasi.getRow(i + 2);
    [loc.code, loc.name, loc.type].forEach((val, ci) => {
      const cell = row.getCell(ci + 1);
      cell.value = val;
      cell.border = thinBorder;
    });
  });

  // Sheet 5: Referensi Kategori
  addCategoryRefSheet(wb, categories);

  const filePath = path.join(TEMPLATES_DIR, 'template_upload_penjualan.xlsx');
  await wb.xlsx.writeFile(filePath);
  console.log(`Template Penjualan: ${filePath}`);
}

// =====================================================
// TEMPLATE 2: GROSS MARGIN (pivot format)
// =====================================================
async function generateGrossMarginTemplate(categories) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Performa Dashboard';

  // Sheet 1: Petunjuk
  addPetunjukSheet(wb, [
    'PETUNJUK PENGISIAN DATA GROSS MARGIN',
    '',
    '1. Gunakan sheet "Template Kosong" untuk mengisi data',
    '2. Jangan mengubah header (baris 1 dan 2)',
    '3. Format tanggal: DD/MM/YYYY (contoh: 12/01/2026)',
    '4. Satu baris = satu kategori, dengan data CABANG dan LOKAL',
    '5. Kategori harus sesuai dengan daftar di sheet "Referensi"',
    '6. PENCAPAIAN = Omzet/Revenue (angka tanpa format)',
    '7. % = Gross Margin Percentage',
    '8. Kolom TOTAL tidak perlu diisi (dihitung otomatis oleh sistem)',
    '9. Upload file ini di menu Upload Data > Data Gross Margin',
    '',
    'KETERANGAN KOLOM:',
    '- GROSS MARGIN: Nama kategori produk',
    '- Tanggal: Tanggal data (DD/MM/YYYY)',
    '- CABANG PENCAPAIAN: Omzet/Revenue untuk area CABANG',
    '- CABANG %: Gross Margin % untuk area CABANG',
    '- LOKAL PENCAPAIAN: Omzet/Revenue untuk area LOCAL',
    '- LOKAL %: Gross Margin % untuk area LOCAL',
    '',
    'CATATAN:',
    '- HPP dihitung otomatis: HPP = Omzet - (Omzet * Margin% / 100)',
    '- Jika tidak ada data untuk CABANG atau LOKAL, isi dengan 0 atau kosongkan',
    '- Baris TOTAL tidak perlu diisi',
  ]);

  // Helper: create pivot format sheet
  function createGrossMarginSheet(ws, dataRows) {
    const colWidths = [22, 12, 18, 8, 18, 8, 18, 8];
    colWidths.forEach((w, i) => { ws.getColumn(i + 1).width = w; });

    // Header Row 1
    const row1 = ws.getRow(1);
    row1.height = 22;
    const h1Values = ['GROSS MARGIN', 'Tanggal', 'CABANG', '', 'LOKAL', '', 'TOTAL', ''];
    h1Values.forEach((val, i) => {
      const cell = row1.getCell(i + 1);
      cell.value = val;
      cell.font = headerFont;
      cell.fill = headerFill;
      cell.border = thinBorder;
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    ws.mergeCells('C1:D1');
    ws.mergeCells('E1:F1');
    ws.mergeCells('G1:H1');

    // Header Row 2
    const row2 = ws.getRow(2);
    row2.height = 20;
    const h2Values = ['', '', 'PENCAPAIAN', '%', 'PENCAPAIAN', '%', 'PENCAPAIAN', '%'];
    h2Values.forEach((val, i) => {
      const cell = row2.getCell(i + 1);
      cell.value = val;
      cell.font = subHeaderFont;
      cell.fill = subHeaderFill;
      cell.border = thinBorder;
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Data rows
    dataRows.forEach((data, ri) => {
      const row = ws.getRow(ri + 3);
      data.forEach((val, ci) => {
        const cell = row.getCell(ci + 1);
        cell.value = val;
        cell.border = thinBorder;
        if (ci === 2 || ci === 4 || ci === 6) {
          cell.numFmt = '#,##0.00';
          cell.alignment = { horizontal: 'right' };
        }
        if (ci === 3 || ci === 5 || ci === 7) {
          cell.numFmt = '0.00';
          cell.alignment = { horizontal: 'right' };
        }
        if (ci === 0) cell.font = { bold: true };
      });
    });
  }

  // Sheet 2: Template Kosong
  const wsTemplate = wb.addWorksheet('Template Kosong');
  const emptyRows = categories.map(cat => [cat.name, '', null, null, null, null, null, null]);
  createGrossMarginSheet(wsTemplate, emptyRows);

  // Sheet 3: Contoh Data - Generate sample data dynamically
  const wsContoh = wb.addWorksheet('Contoh Data');
  const today = new Date();
  const dateStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

  const sampleData = categories.map(cat => {
    const cabangPencapaian = Math.floor(Math.random() * 200000000) + 10000000;
    const cabangPercent = Math.round((Math.random() * 20 + 5) * 100) / 100;
    const lokalPencapaian = Math.floor(Math.random() * 150000000) + 5000000;
    const lokalPercent = Math.round((Math.random() * 25 + 10) * 100) / 100;
    const totalPencapaian = cabangPencapaian + lokalPencapaian;
    const totalPercent = Math.round(((cabangPencapaian * cabangPercent + lokalPencapaian * lokalPercent) / totalPencapaian) * 100) / 100;
    return [cat.name, dateStr, cabangPencapaian, cabangPercent, lokalPencapaian, lokalPercent, totalPencapaian, totalPercent];
  });
  createGrossMarginSheet(wsContoh, sampleData);

  // Sheet 4: Referensi
  addCategoryRefSheet(wb, categories);

  const filePath = path.join(TEMPLATES_DIR, 'template_upload_gross_margin.xlsx');
  await wb.xlsx.writeFile(filePath);
  console.log(`Template Gross Margin: ${filePath}`);
}

// =====================================================
// TEMPLATE 3: RETUR
// =====================================================
async function generateReturTemplate(categories) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Performa Dashboard';

  // Sheet 1: Petunjuk
  addPetunjukSheet(wb, [
    'PETUNJUK PENGISIAN DATA RETUR',
    '',
    '1. Gunakan sheet "Template Kosong" untuk mengisi data',
    '2. Jangan mengubah header kolom (baris pertama)',
    '3. Format tanggal: YYYY-MM-DD (contoh: 2026-01-15)',
    '4. Tipe Lokasi harus diisi: LOCAL atau CABANG',
    '5. Kategori harus sesuai dengan daftar di sheet "Referensi"',
    '6. Nilai Jual dan Nilai Beli dalam angka (tanpa Rp, titik, atau koma)',
    '7. Upload file ini di menu Upload Data > Data Retur',
    '',
    'KETERANGAN KOLOM:',
    '- no_faktur: Nomor faktur retur (contoh: RJ-2026-01-0001)',
    '- tanggal_posting: Tanggal posting retur (YYYY-MM-DD)',
    '- nilai_jual: Nilai jual barang yang diretur (Selling Amount)',
    '- nilai_beli: Nilai beli/HPP barang yang diretur (Buying Amount)',
    '- kategori: Nama kategori produk (lihat sheet Referensi)',
    '- tipe_lokasi: LOCAL atau CABANG',
  ]);

  const headers = ['no_faktur', 'tanggal_posting', 'nilai_jual', 'nilai_beli', 'kategori', 'tipe_lokasi'];
  const colWidths = [20, 16, 16, 16, 22, 14];

  // Sheet 2: Template Kosong
  const wsTemplate = wb.addWorksheet('Template Kosong');
  addHeaderRow(wsTemplate, 1, headers, colWidths);
  for (let r = 2; r <= 51; r++) {
    const row = wsTemplate.getRow(r);
    for (let c = 1; c <= 6; c++) {
      row.getCell(c).border = thinBorder;
    }
  }

  // Sheet 3: Contoh Data
  const wsContoh = wb.addWorksheet('Contoh Data');
  addHeaderRow(wsContoh, 1, headers, colWidths);

  // Generate sample data dynamically
  const sampleCategories = categories.slice(0, 5);
  const today = new Date();
  const sampleData = sampleCategories.map((cat, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (i * 3 + 1));
    const dateStr = date.toISOString().split('T')[0];
    const nilaiJual = Math.floor(Math.random() * 3000000) + 500000;
    const nilaiBeli = Math.floor(nilaiJual * (0.6 + Math.random() * 0.2));
    const locationType = i % 2 === 0 ? 'CABANG' : 'LOCAL';
    const invoiceNum = String(i + 1).padStart(4, '0');
    return [`RJ-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${invoiceNum}`, dateStr, nilaiJual, nilaiBeli, cat.name, locationType];
  });

  sampleData.forEach((data, ri) => {
    const row = wsContoh.getRow(ri + 2);
    data.forEach((val, ci) => {
      const cell = row.getCell(ci + 1);
      cell.value = val;
      cell.border = thinBorder;
      if (ci === 2 || ci === 3) cell.numFmt = '#,##0';
    });
  });

  // Sheet 4: Referensi
  const wsRef = addCategoryRefSheet(wb, categories);
  // Add tipe_lokasi info
  wsRef.getColumn(3).width = 14;
  wsRef.getRow(1).getCell(3).value = 'TIPE LOKASI';
  wsRef.getRow(1).getCell(3).font = headerFont;
  wsRef.getRow(1).getCell(3).fill = headerFill;
  wsRef.getRow(1).getCell(3).border = thinBorder;
  wsRef.getRow(2).getCell(3).value = 'LOCAL';
  wsRef.getRow(2).getCell(3).border = thinBorder;
  wsRef.getRow(3).getCell(3).value = 'CABANG';
  wsRef.getRow(3).getCell(3).border = thinBorder;

  const filePath = path.join(TEMPLATES_DIR, 'template_upload_retur.xlsx');
  await wb.xlsx.writeFile(filePath);
  console.log(`Template Retur: ${filePath}`);
}

// ==================================
// MAIN
// ==================================
async function main() {
  console.log('Generating Excel templates from database...\n');

  try {
    // Fetch categories from database
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    if (categories.length === 0) {
      console.error('Error: No categories found in database. Please seed the database first.');
      process.exit(1);
    }

    console.log(`Found ${categories.length} categories in database`);

    // Fetch locations from database
    const locations = await prisma.location.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    });

    console.log(`Found ${locations.length} locations in database`);

    // Generate templates
    await generatePenjualanTemplate(categories, locations);
    await generateGrossMarginTemplate(categories);
    await generateReturTemplate(categories);

    console.log('\nSemua template berhasil dibuat dari database!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

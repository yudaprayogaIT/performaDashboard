// scripts/generate-templates.js
// Generate all Excel templates (Penjualan, Gross Margin, Retur) using ExcelJS
// Run: node scripts/generate-templates.js

const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

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
// REFERENCE DATA
// ==================================
const categories = [
  { name: 'ACCESSORIES', description: 'Aksesoris furniture dan springbed' },
  { name: 'ACCESSORIES KAKI', description: 'Aksesoris kaki furniture' },
  { name: 'BAHAN KIMIA', description: 'Bahan kimia untuk produksi' },
  { name: 'BUSA', description: 'Busa untuk sofa dan springbed' },
  { name: 'FURNITURE', description: 'Furniture lengkap' },
  { name: 'HDP', description: 'High Density Polyurethane' },
  { name: 'JASA', description: 'Jasa instalasi dan service' },
  { name: 'KAIN POLOS SOFA', description: 'Kain polos untuk sofa' },
  { name: 'KAIN POLOS SPRINGBED', description: 'Kain polos untuk springbed' },
  { name: 'KAIN QUILTING', description: 'Kain quilting untuk kasur' },
  { name: 'KAWAT', description: 'Kawat untuk springbed' },
  { name: 'MSP', description: 'Material Support Product' },
  { name: 'NON WOVEN', description: 'Material non woven' },
  { name: 'OTHER', description: 'Produk lainnya' },
  { name: 'PER COIL', description: 'Per coil untuk springbed' },
  { name: 'PITA LIST', description: 'Pita dan list dekorasi' },
  { name: 'PLASTIC', description: 'Material plastik' },
  { name: 'STAPLESS', description: 'Stapless dan material pengikat' },
];

const locations = [
  { code: 'LOCAL-BGR', name: 'Bogor Pusat', type: 'LOCAL' },
  { code: 'LOCAL-CBI', name: 'Cibinong', type: 'LOCAL' },
  { code: 'LOCAL-CGR', name: 'Citeureup', type: 'LOCAL' },
  { code: 'LOCAL-DRM', name: 'Dramaga', type: 'LOCAL' },
  { code: 'LOCAL-GNL', name: 'Gunung Putri', type: 'LOCAL' },
  { code: 'CABANG-JKT', name: 'Jakarta Pusat', type: 'CABANG' },
  { code: 'CABANG-BKS', name: 'Bekasi', type: 'CABANG' },
  { code: 'CABANG-DPK', name: 'Depok', type: 'CABANG' },
  { code: 'CABANG-TGR', name: 'Tangerang', type: 'CABANG' },
  { code: 'CABANG-BDG', name: 'Bandung', type: 'CABANG' },
  { code: 'CABANG-SMG', name: 'Semarang', type: 'CABANG' },
  { code: 'CABANG-SBY', name: 'Surabaya', type: 'CABANG' },
  { code: 'CABANG-YGY', name: 'Yogyakarta', type: 'CABANG' },
  { code: 'CABANG-MLG', name: 'Malang', type: 'CABANG' },
  { code: 'CABANG-SKA', name: 'Solo', type: 'CABANG' },
];

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
function addCategoryRefSheet(wb, extraCols) {
  const ws = wb.addWorksheet('Referensi');
  const headers = ['KATEGORI', 'KETERANGAN', ...(extraCols || [])];
  const colWidths = [25, 35, ...(extraCols || []).map(() => 14)];
  addHeaderRow(ws, 1, headers, colWidths);

  categories.forEach((cat, i) => {
    const row = ws.getRow(i + 2);
    row.getCell(1).value = cat.name;
    row.getCell(1).border = thinBorder;
    row.getCell(2).value = cat.description;
    row.getCell(2).border = thinBorder;
  });

  return ws;
}

// =====================================================
// TEMPLATE 1: PENJUALAN
// =====================================================
async function generatePenjualanTemplate() {
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

  const sampleData = [
    ['2026-01-21', 'LOCAL-BGR', 'BAHAN KIMIA', 25000000, ''],
    ['2026-01-21', 'CABANG-JKT', 'FURNITURE', 45000000, 'Order besar'],
    ['2026-01-21', 'LOCAL-CBI', 'HDP', 18500000, ''],
    ['2026-01-20', 'CABANG-BDG', 'KAIN POLOS SOFA', 12750000, ''],
    ['2026-01-20', 'LOCAL-BGR', 'PLASTIC', 8300000, ''],
    ['2026-01-20', 'CABANG-DPK', 'PER COIL', 15200000, ''],
    ['2026-01-19', 'LOCAL-DRM', 'BUSA', 6400000, ''],
    ['2026-01-19', 'CABANG-TGR', 'KAWAT', 9800000, ''],
    ['2026-01-19', 'LOCAL-GNL', 'NON WOVEN', 4250000, ''],
    ['2026-01-18', 'CABANG-SMG', 'STAPLESS', 7100000, ''],
  ];

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
  addCategoryRefSheet(wb);

  const filePath = path.join(TEMPLATES_DIR, 'template_upload_penjualan.xlsx');
  await wb.xlsx.writeFile(filePath);
  console.log(`Template Penjualan: ${filePath}`);
}

// =====================================================
// TEMPLATE 2: GROSS MARGIN (pivot format)
// =====================================================
async function generateGrossMarginTemplate() {
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

  // Sheet 3: Contoh Data
  const wsContoh = wb.addWorksheet('Contoh Data');
  const sampleData = [
    ['ACCESSORIES',          '12/01/2026', 34852393.03,  8.29,  28176356.14, 19.05, 63028749.17, 11.09],
    ['ACCESSORIES KAKI',     '12/01/2026', 33616859.89,  9.42,  38917388.29, 19.07, 72534248.18, 12.93],
    ['BAHAN KIMIA',          '12/01/2026', 39719270.82,  1.32,  91412371.08,  9.55, 131131641.90, 3.30],
    ['BUSA',                 '12/01/2026', 2932649.60,   4.15,  17617654.14, 26.92, 20550303.74, 15.10],
    ['FURNITURE',            '12/01/2026', 275869532.14, 7.31,  19919650.76, 16.87, 295789182.90, 7.60],
    ['HDP',                  '12/01/2026', 148947328.81, 8.19,  142728944.36, 18.08, 291676273.17, 11.18],
    ['JASA',                 '12/01/2026', 0,            0,     14029516.63, 32.81, 14029516.63, 32.81],
    ['KAIN POLOS SOFA',      '12/01/2026', 210376926.72, 7.24,  84232111.38, 11.90, 294609038.10, 8.15],
    ['KAIN POLOS SPRINGBED', '12/01/2026', 26616490.00,  4.43,  103996762.53, 13.84, 130613252.53, 9.66],
    ['KAIN QUILTING',        '12/01/2026', 6343203.38,   22.13, 39044984.33, 24.68, 45388187.71, 24.29],
    ['KAWAT',                '12/01/2026', 55509170.73,  4.17,  30501452.78, 13.34, 86010623.51, 5.51],
    ['MSP',                  '12/01/2026', 35942000.00,  4.68,  0,           0,     35942000.00, 4.68],
    ['NON WOVEN',            '12/01/2026', 23198133.55,  7.67,  80743632.16, 21.52, 103941765.71, 15.34],
    ['OTHER',                '12/01/2026', 7973321.18,   8.98,  5541901.60,  14.82, 13515222.78, 10.71],
    ['PER COIL',             '12/01/2026', 57423349.86,  6.00,  48869304.36, 16.55, 106292654.22, 8.49],
    ['PITA LIST',            '12/01/2026', 16694467.36,  9.77,  49997312.21, 20.25, 66691779.57, 15.96],
    ['PLASTIC',              '12/01/2026', 84355896.39,  7.49,  118214654.46, 19.84, 202570550.85, 11.77],
    ['STAPLESS',             '12/01/2026', 52860301.00,  11.75, 40267296.00, 21.27, 93127597.00, 14.57],
  ];
  createGrossMarginSheet(wsContoh, sampleData);

  // Sheet 4: Referensi
  addCategoryRefSheet(wb);

  const filePath = path.join(TEMPLATES_DIR, 'template_upload_gross_margin.xlsx');
  await wb.xlsx.writeFile(filePath);
  console.log(`Template Gross Margin: ${filePath}`);
}

// =====================================================
// TEMPLATE 3: RETUR
// =====================================================
async function generateReturTemplate() {
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

  const sampleData = [
    ['RJ-2026-01-0001', '2026-01-05', 1540725, 1441477, 'HDP', 'CABANG'],
    ['RJ-2026-01-0002', '2026-01-08', 870000, 603098, 'PLASTIC', 'LOCAL'],
    ['RJ-2026-01-0003', '2026-01-10', 2350000, 1875000, 'BUSA', 'LOCAL'],
    ['RJ-2026-01-0004', '2026-01-12', 4200000, 3150000, 'FURNITURE', 'CABANG'],
    ['RJ-2026-01-0005', '2026-01-15', 650000, 487500, 'KAIN QUILTING', 'LOCAL'],
  ];

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
  const wsRef = addCategoryRefSheet(wb);
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
  console.log('Generating Excel templates...\n');
  await generatePenjualanTemplate();
  await generateGrossMarginTemplate();
  await generateReturTemplate();
  console.log('\nSemua template berhasil dibuat!');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

// src/lib/excel-parser.ts
// Excel parser untuk berbagai tipe upload

import * as XLSX from 'xlsx';
import { UploadType } from '@prisma/client';

/**
 * Parsed row untuk OMZET upload
 */
export interface OmzetRow {
  tanggal: Date;
  kode_lokasi: string;
  kategori: string;
  amount: number;
  catatan?: string;
}

/**
 * Parsed row untuk GROSS_MARGIN upload
 * PENCAPAIAN = omzetAmount (gross revenue)
 * % = marginPercent (margin percentage)
 */
export interface GrossMarginRow {
  recordDate: Date;
  categoryName: string;
  locationType: 'LOCAL' | 'CABANG';
  omzetAmount: number;
  marginPercent: number;
}

/**
 * Parsed row untuk RETUR upload
 */
export interface ReturRow {
  salesInvoice: string;
  postingDate: Date;
  categoryName: string;
  locationType: 'LOCAL' | 'CABANG';
  sellingAmount: number;
  buyingAmount: number;
}

/**
 * Result dari parsing Excel
 */
export interface ParseResult<T> {
  success: boolean;
  data?: T[];
  rowCount?: number;
  errors?: string[];
}

/**
 * Parse tanggal dari berbagai format
 */
function parseDate(value: any): Date | null {
  if (!value) return null;

  // Jika sudah Date object
  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'string') {
    // Handle DD/MM/YYYY format
    const ddmmyyyy = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (ddmmyyyy) {
      const [, day, month, year] = ddmmyyyy;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime())) {
        return date;
      }
    }

    // Handle YYYY-MM-DD format
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  // Jika Excel serial number
  if (typeof value === 'number') {
    // Excel stores dates as number of days since 1900-01-01
    const excelEpoch = new Date(1900, 0, 1);
    const date = new Date(excelEpoch.getTime() + (value - 2) * 86400000);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  return null;
}

/**
 * Parse number dari string atau number
 */
function parseNumber(value: any): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    // Remove any formatting (comma, dots except decimal)
    const cleaned = value.replace(/[^\d.-]/g, '');
    const parsed = parseFloat(cleaned);
    if (!isNaN(parsed)) {
      return parsed;
    }
  }

  return null;
}

/**
 * Validate required columns exist
 */
function validateColumns(row: any, requiredColumns: string[]): string[] {
  const errors: string[] = [];
  const rowKeys = Object.keys(row).map((k) => k.toLowerCase());

  for (const col of requiredColumns) {
    if (!rowKeys.includes(col.toLowerCase())) {
      errors.push(`Kolom '${col}' tidak ditemukan`);
    }
  }

  return errors;
}

/**
 * Parse OMZET Excel file
 */
export async function parseOmzetExcel(
  file: File
): Promise<ParseResult<OmzetRow>> {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });

    // Try to find the data sheet
    let sheetName = workbook.SheetNames[0];

    // Prefer sheets with these names
    const preferredNames = ['Data Penjualan', 'Template Kosong', 'Data'];
    for (const name of preferredNames) {
      if (workbook.SheetNames.includes(name)) {
        sheetName = name;
        break;
      }
    }

    const worksheet = workbook.Sheets[sheetName];
    const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, {
      raw: false,
      defval: '',
    });

    if (jsonData.length === 0) {
      return {
        success: false,
        errors: ['File Excel kosong atau tidak ada data'],
      };
    }

    // Validate required columns
    const requiredColumns = ['tanggal', 'kode_lokasi', 'kategori', 'amount'];
    const columnErrors = validateColumns(jsonData[0], requiredColumns);

    if (columnErrors.length > 0) {
      return {
        success: false,
        errors: columnErrors,
      };
    }

    // Parse rows
    const parsedData: OmzetRow[] = [];
    const errors: string[] = [];

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      const rowNumber = i + 2; // +2 because of header and 0-index

      try {
        // Parse date
        const tanggal = parseDate(row.tanggal || row.Tanggal);
        if (!tanggal) {
          errors.push(
            `Baris ${rowNumber}: Tanggal tidak valid "${row.tanggal}"`
          );
          continue;
        }

        // Parse amount
        const amount = parseNumber(row.amount || row.Amount);
        if (amount === null || amount <= 0) {
          errors.push(`Baris ${rowNumber}: Amount harus berisi angka positif`);
          continue;
        }

        // Get required string fields
        const kode_lokasi = (row.kode_lokasi || row.Kode_Lokasi || '').trim();
        const kategori = (row.kategori || row.Kategori || '').trim();

        if (!kode_lokasi) {
          errors.push(`Baris ${rowNumber}: Kode lokasi tidak boleh kosong`);
          continue;
        }

        if (!kategori) {
          errors.push(`Baris ${rowNumber}: Kategori tidak boleh kosong`);
          continue;
        }

        // Optional catatan
        const catatan = (row.catatan || row.Catatan || '').trim();

        parsedData.push({
          tanggal,
          kode_lokasi,
          kategori,
          amount,
          catatan: catatan || undefined,
        });
      } catch (error) {
        errors.push(
          `Baris ${rowNumber}: Error parsing - ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // If more than 50% rows failed, consider it a failure
    if (errors.length > jsonData.length / 2) {
      return {
        success: false,
        errors: [
          `Terlalu banyak error (${errors.length} dari ${jsonData.length} baris)`,
          ...errors.slice(0, 10), // Show first 10 errors
        ],
      };
    }

    // If no valid data
    if (parsedData.length === 0) {
      return {
        success: false,
        errors: errors.length > 0 ? errors : ['Tidak ada data valid yang dapat diparse'],
      };
    }

    return {
      success: true,
      data: parsedData,
      rowCount: parsedData.length,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    return {
      success: false,
      errors: [
        `Error membaca file Excel: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ],
    };
  }
}

/**
 * Parse GROSS_MARGIN Excel file (Pivot Format)
 *
 * Expected format:
 * Row 1 (header): GROSS MARGIN | Tanggal | CABANG |        | LOKAL  |        | TOTAL  |
 * Row 2 (sub):                 |         | PENCAPAIAN | % | PENCAPAIAN | % | PENCAPAIAN | %
 * Row 3+: Data rows where each row = one category with CABANG and LOKAL data
 *
 * Column indices:
 * 0 = Category name
 * 1 = Tanggal (DD/MM/YYYY)
 * 2 = CABANG PENCAPAIAN (omzet)
 * 3 = CABANG % (margin percentage)
 * 4 = LOKAL PENCAPAIAN (omzet)
 * 5 = LOKAL % (margin percentage)
 * 6 = TOTAL PENCAPAIAN (ignored - calculated)
 * 7 = TOTAL % (ignored - calculated)
 *
 * Each data row produces up to 2 GrossMarginRow records (CABANG + LOCAL).
 * HPP is calculated: hpp = omzet - (omzet * marginPercent / 100)
 */
export async function parseGrossMarginExcel(
  file: File
): Promise<ParseResult<GrossMarginRow>> {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });

    // Try to find the data sheet
    let sheetName = workbook.SheetNames[0];

    // Prefer sheets with these names
    const preferredNames = ['Data Gross Margin', 'Template Kosong', 'Data'];
    for (const name of preferredNames) {
      if (workbook.SheetNames.includes(name)) {
        sheetName = name;
        break;
      }
    }

    const worksheet = workbook.Sheets[sheetName];

    // Use array-of-arrays format for positional parsing (pivot table has merged headers)
    const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      raw: true,
      defval: null,
    });

    if (rawData.length < 3) {
      return {
        success: false,
        errors: ['File Excel harus memiliki minimal 2 baris header dan 1 baris data'],
      };
    }

    // Skip first 2 header rows, parse data rows
    const dataRows = rawData.slice(2);
    const parsedData: GrossMarginRow[] = [];
    const errors: string[] = [];

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNumber = i + 3; // +3 because 2 header rows + 1-indexed

      try {
        // Column 0: Category name
        const categoryName = (row[0] != null ? String(row[0]) : '').trim().toUpperCase();

        // Skip empty rows or TOTAL row
        if (!categoryName || categoryName === 'TOTAL') {
          continue;
        }

        // Column 1: Date
        const recordDate = parseDate(row[1]);
        if (!recordDate) {
          errors.push(`Baris ${rowNumber}: Tanggal tidak valid "${row[1]}"`);
          continue;
        }

        // Column 2-3: CABANG data
        const cabangOmzet = parseNumber(row[2]);
        const cabangMarginPct = parseMarginPercent(row[3]);

        // Column 4-5: LOKAL data
        const lokalOmzet = parseNumber(row[4]);
        const lokalMarginPct = parseMarginPercent(row[5]);

        // Create CABANG record if omzet > 0
        if (cabangOmzet !== null && cabangOmzet > 0) {
          parsedData.push({
            recordDate,
            categoryName,
            locationType: 'CABANG',
            omzetAmount: cabangOmzet,
            marginPercent: cabangMarginPct ?? 0,
          });
        }

        // Create LOCAL record if omzet > 0
        if (lokalOmzet !== null && lokalOmzet > 0) {
          parsedData.push({
            recordDate,
            categoryName,
            locationType: 'LOCAL',
            omzetAmount: lokalOmzet,
            marginPercent: lokalMarginPct ?? 0,
          });
        }

        // If both are 0 or null, skip with warning
        if ((cabangOmzet === null || cabangOmzet === 0) &&
            (lokalOmzet === null || lokalOmzet === 0)) {
          errors.push(`Baris ${rowNumber}: Kategori "${categoryName}" tidak memiliki data omzet`);
        }
      } catch (error) {
        errors.push(
          `Baris ${rowNumber}: Error parsing - ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // If no valid data
    if (parsedData.length === 0) {
      return {
        success: false,
        errors: errors.length > 0 ? errors : ['Tidak ada data valid yang dapat diparse'],
      };
    }

    return {
      success: true,
      data: parsedData,
      rowCount: parsedData.length,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    return {
      success: false,
      errors: [
        `Error membaca file Excel: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ],
    };
  }
}

/**
 * Parse margin percentage value, handling edge cases like #DIV/0!, empty, or non-numeric
 */
function parseMarginPercent(value: any): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  // Handle Excel error values like #DIV/0!
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.startsWith('#') || trimmed === '-' || trimmed === '') {
      return 0;
    }
  }

  return parseNumber(value);
}

/**
 * Parse RETUR Excel file
 * Expected columns: No Faktur, Tanggal Posting, Nilai Jual, Nilai Beli, Kategori, Tipe Lokasi
 */
export async function parseReturExcel(
  file: File
): Promise<ParseResult<ReturRow>> {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });

    // Try to find the data sheet
    let sheetName = workbook.SheetNames[0];

    // Prefer sheets with these names
    const preferredNames = ['Data Retur', 'Template Kosong', 'Data'];
    for (const name of preferredNames) {
      if (workbook.SheetNames.includes(name)) {
        sheetName = name;
        break;
      }
    }

    const worksheet = workbook.Sheets[sheetName];
    const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, {
      raw: false,
      defval: '',
    });

    if (jsonData.length === 0) {
      return {
        success: false,
        errors: ['File Excel kosong atau tidak ada data'],
      };
    }

    // Validate required columns
    const requiredColumns = [
      'no_faktur',
      'tanggal_posting',
      'nilai_jual',
      'nilai_beli',
      'kategori',
      'tipe_lokasi',
    ];
    const columnErrors = validateColumns(jsonData[0], requiredColumns);

    if (columnErrors.length > 0) {
      return {
        success: false,
        errors: columnErrors,
      };
    }

    // Parse rows
    const parsedData: ReturRow[] = [];
    const errors: string[] = [];

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      const rowNumber = i + 2; // +2 because of header and 0-index

      try {
        // Get sales invoice
        const salesInvoice = (row.no_faktur || row['No Faktur'] || row.No_Faktur || '').trim();
        if (!salesInvoice) {
          errors.push(`Baris ${rowNumber}: No Faktur tidak boleh kosong`);
          continue;
        }

        // Parse date
        const postingDate = parseDate(row.tanggal_posting || row['Tanggal Posting'] || row.Tanggal_Posting);
        if (!postingDate) {
          errors.push(
            `Baris ${rowNumber}: Tanggal Posting tidak valid`
          );
          continue;
        }

        // Parse numbers
        const sellingAmount = parseNumber(row.nilai_jual || row['Nilai Jual'] || row.Nilai_Jual);
        const buyingAmount = parseNumber(row.nilai_beli || row['Nilai Beli'] || row.Nilai_Beli);

        if (sellingAmount === null || sellingAmount < 0) {
          errors.push(`Baris ${rowNumber}: Nilai Jual harus berisi angka non-negatif`);
          continue;
        }

        if (buyingAmount === null || buyingAmount < 0) {
          errors.push(`Baris ${rowNumber}: Nilai Beli harus berisi angka non-negatif`);
          continue;
        }

        // Get category name
        const categoryName = (row.kategori || row.Kategori || '').trim().toUpperCase();
        if (!categoryName) {
          errors.push(`Baris ${rowNumber}: Kategori tidak boleh kosong`);
          continue;
        }

        // Get location type
        const locationTypeRaw = (row.tipe_lokasi || row['Tipe Lokasi'] || row.Tipe_Lokasi || '').trim().toUpperCase();
        if (locationTypeRaw !== 'LOCAL' && locationTypeRaw !== 'CABANG') {
          errors.push(`Baris ${rowNumber}: Tipe Lokasi harus 'LOCAL' atau 'CABANG', bukan '${locationTypeRaw}'`);
          continue;
        }

        const locationType = locationTypeRaw as 'LOCAL' | 'CABANG';

        parsedData.push({
          salesInvoice,
          postingDate,
          categoryName,
          locationType,
          sellingAmount,
          buyingAmount,
        });
      } catch (error) {
        errors.push(
          `Baris ${rowNumber}: Error parsing - ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // If more than 50% rows failed, consider it a failure
    if (errors.length > jsonData.length / 2) {
      return {
        success: false,
        errors: [
          `Terlalu banyak error (${errors.length} dari ${jsonData.length} baris)`,
          ...errors.slice(0, 10), // Show first 10 errors
        ],
      };
    }

    // If no valid data
    if (parsedData.length === 0) {
      return {
        success: false,
        errors: errors.length > 0 ? errors : ['Tidak ada data valid yang dapat diparse'],
      };
    }

    return {
      success: true,
      data: parsedData,
      rowCount: parsedData.length,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    return {
      success: false,
      errors: [
        `Error membaca file Excel: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ],
    };
  }
}

/**
 * Main parser function that routes to specific parser based on upload type
 */
export async function parseExcelByType(
  file: File,
  uploadType: UploadType
): Promise<ParseResult<OmzetRow | GrossMarginRow | ReturRow>> {
  switch (uploadType) {
    case 'OMZET':
      return parseOmzetExcel(file);
    case 'GROSS_MARGIN':
      return parseGrossMarginExcel(file);
    case 'RETUR':
      return parseReturExcel(file);
    default:
      return {
        success: false,
        errors: [`Tipe upload tidak dikenali: ${uploadType}`],
      };
  }
}

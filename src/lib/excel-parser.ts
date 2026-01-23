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
 */
export interface GrossMarginRow {
  tanggal: Date;
  kode_lokasi: string;
  kategori: string;
  omzet: number;
  hpp: number;
  gross_margin: number;
  catatan?: string;
}

/**
 * Parsed row untuk RETUR upload
 */
export interface ReturRow {
  tanggal: Date;
  kode_lokasi: string;
  kategori: string;
  amount: number;
  catatan?: string;
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

  // Jika string YYYY-MM-DD
  if (typeof value === 'string') {
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
 * Parse GROSS_MARGIN Excel file
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
      'tanggal',
      'kode_lokasi',
      'kategori',
      'omzet',
      'hpp',
      'gross_margin',
    ];
    const columnErrors = validateColumns(jsonData[0], requiredColumns);

    if (columnErrors.length > 0) {
      return {
        success: false,
        errors: columnErrors,
      };
    }

    // Parse rows
    const parsedData: GrossMarginRow[] = [];
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

        // Parse numbers
        const omzet = parseNumber(row.omzet || row.Omzet);
        const hpp = parseNumber(row.hpp || row.HPP);
        const gross_margin = parseNumber(row.gross_margin || row.Gross_Margin);

        if (omzet === null || omzet <= 0) {
          errors.push(`Baris ${rowNumber}: Omzet harus berisi angka positif`);
          continue;
        }

        if (hpp === null || hpp < 0) {
          errors.push(`Baris ${rowNumber}: HPP harus berisi angka non-negatif`);
          continue;
        }

        if (gross_margin === null) {
          errors.push(`Baris ${rowNumber}: Gross Margin harus diisi`);
          continue;
        }

        // Validate: gross_margin should equal omzet - hpp (with small tolerance)
        const calculated = omzet - hpp;
        const tolerance = 1; // 1 Rupiah tolerance
        if (Math.abs(calculated - gross_margin) > tolerance) {
          errors.push(
            `Baris ${rowNumber}: Gross Margin tidak sesuai (seharusnya ${calculated}, tertulis ${gross_margin})`
          );
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
          omzet,
          hpp,
          gross_margin,
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
 * Parse RETUR Excel file (same structure as OMZET)
 */
export async function parseReturExcel(
  file: File
): Promise<ParseResult<ReturRow>> {
  // Retur has same structure as Omzet
  const result = await parseOmzetExcel(file);

  // Type cast since structure is the same
  return result as ParseResult<ReturRow>;
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

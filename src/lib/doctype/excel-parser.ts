// src/lib/doctype/excel-parser.ts
// Generic Excel parser for dynamic DocTypes

import * as XLSX from "xlsx";
import prisma from "@/lib/prisma";
import { DocTypeWithRelations } from "./types";

/**
 * Result dari parsing Excel
 */
export interface ParseResult {
  success: boolean;
  data?: Record<string, any>[];
  rowCount?: number;
  errors?: string[];
}

/**
 * Parse tanggal dari berbagai format
 */
function parseDate(value: any): Date | null {
  if (!value) return null;

  // Jika sudah Date object, set time to noon to avoid timezone issues
  if (value instanceof Date) {
    const date = new Date(value);
    date.setHours(12, 0, 0, 0);
    return date;
  }

  if (typeof value === "string") {
    // Handle DD/MM/YYYY format
    const ddmmyyyy = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (ddmmyyyy) {
      const [, day, month, year] = ddmmyyyy;
      const date = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        12,
        0,
        0,
        0
      );
      if (!isNaN(date.getTime())) {
        return date;
      }
    }

    // Handle YYYY-MM-DD format
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) {
      parsed.setHours(12, 0, 0, 0);
      return parsed;
    }
  }

  // Jika Excel serial number
  if (typeof value === "number") {
    const excelEpochUTC = Date.UTC(1900, 0, 1);
    const utcMillis = excelEpochUTC + (value - 2) * 86400000;
    const utcDate = new Date(utcMillis);

    const date = new Date(
      utcDate.getUTCFullYear(),
      utcDate.getUTCMonth(),
      utcDate.getUTCDate(),
      12,
      0,
      0,
      0
    );

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
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    // Remove any formatting (comma, dots except decimal)
    const cleaned = value.replace(/[^\d.-]/g, "");
    const parsed = parseFloat(cleaned);
    if (!isNaN(parsed)) {
      return parsed;
    }
  }

  return null;
}

/**
 * Parse boolean dari berbagai format
 */
function parseBoolean(value: any): boolean | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  if (typeof value === "string") {
    const lower = value.toLowerCase().trim();
    if (lower === "true" || lower === "yes" || lower === "ya" || lower === "1") {
      return true;
    }
    if (lower === "false" || lower === "no" || lower === "tidak" || lower === "0") {
      return false;
    }
  }

  return null;
}

/**
 * Resolve reference field (lookup foreign key)
 * Supports lookup by code, name, or id
 */
async function resolveReference(
  value: any,
  referenceTable: string,
  referenceField: string
): Promise<number | null> {
  if (!value) return null;

  const stringValue = String(value).trim();
  if (!stringValue) return null;

  // If it's already a number, assume it's the ID
  const numValue = parseInt(stringValue, 10);
  if (!isNaN(numValue) && String(numValue) === stringValue) {
    return numValue;
  }

  // Lookup by code or name in the reference table
  try {
    let result: any = null;

    switch (referenceTable.toLowerCase()) {
      case "locations":
        result = await prisma.location.findFirst({
          where: {
            OR: [
              { code: { equals: stringValue } },
              { code: { equals: stringValue.toUpperCase() } },
              { name: { equals: stringValue } },
            ],
          },
          select: { id: true },
        });
        break;

      case "categories":
        result = await prisma.category.findFirst({
          where: {
            OR: [
              { name: { equals: stringValue } },
              { name: { equals: stringValue.toUpperCase() } },
            ],
          },
          select: { id: true },
        });
        break;

      case "users":
        result = await prisma.user.findFirst({
          where: {
            OR: [
              { name: { equals: stringValue } },
              { email: { equals: stringValue } },
            ],
          },
          select: { id: true },
        });
        break;

      case "roles":
        result = await prisma.role.findFirst({
          where: {
            name: { equals: stringValue },
          },
          select: { id: true },
        });
        break;

      default:
        // For unknown tables, try to execute raw query
        // This is a fallback - ideally all reference tables should be handled above
        console.warn(`Unknown reference table: ${referenceTable}`);
        return null;
    }

    return result?.id || null;
  } catch (error) {
    console.error(`Error resolving reference for ${referenceTable}:`, error);
    return null;
  }
}

/**
 * Get column header name from field config
 * Tries excelColumn first, then name
 */
function getColumnHeader(
  field: DocTypeWithRelations["fields"][0]
): string[] {
  const headers: string[] = [];

  if (field.excelColumn) {
    headers.push(field.excelColumn);
    headers.push(field.excelColumn.toLowerCase());
    headers.push(field.excelColumn.toUpperCase());
  }

  headers.push(field.name);
  headers.push(field.name.toLowerCase());
  headers.push(field.name.toUpperCase());

  // Also try fieldName variations
  headers.push(field.fieldName);
  headers.push(field.fieldName.toLowerCase());
  headers.push(field.fieldName.replace(/_/g, " "));

  return headers;
}

/**
 * Find value from row using multiple possible column names
 */
function findColumnValue(row: Record<string, any>, columnNames: string[]): any {
  for (const name of columnNames) {
    if (row[name] !== undefined) {
      return row[name];
    }
  }
  return undefined;
}

/**
 * Parse Excel file based on DocType configuration
 */
export async function parseExcelByDocType(
  file: File,
  docType: DocTypeWithRelations
): Promise<ParseResult> {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });

    // Try to find the data sheet
    let sheetName = workbook.SheetNames[0];

    // Prefer sheets with relevant names
    const preferredNames = [
      `Data ${docType.name}`,
      "Template Kosong",
      "Data",
      docType.name,
    ];
    for (const name of preferredNames) {
      if (workbook.SheetNames.includes(name)) {
        sheetName = name;
        break;
      }
    }

    const worksheet = workbook.Sheets[sheetName];
    const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, {
      raw: false,
      defval: "",
    });

    if (jsonData.length === 0) {
      return {
        success: false,
        errors: ["File Excel kosong atau tidak ada data"],
      };
    }

    // Get fields that should be in form/upload
    const uploadFields = docType.fields.filter((f) => f.showInForm !== false);

    // Parse rows
    const parsedData: Record<string, any>[] = [];
    const errors: string[] = [];

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      const rowNumber = i + 2; // +2 because of header and 0-index

      try {
        const record: Record<string, any> = {};
        let rowValid = true;

        for (const field of uploadFields) {
          const columnNames = getColumnHeader(field);
          const rawValue = findColumnValue(row, columnNames);

          let value: any = null;

          // Parse based on field type
          switch (field.fieldType) {
            case "DATE":
            case "DATETIME":
              value = parseDate(rawValue);
              if (field.isRequired && !value) {
                errors.push(
                  `Baris ${rowNumber}: ${field.name} tidak valid atau kosong`
                );
                rowValid = false;
              }
              break;

            case "NUMBER":
            case "CURRENCY":
              value = parseNumber(rawValue);
              if (field.isRequired && value === null) {
                errors.push(
                  `Baris ${rowNumber}: ${field.name} harus berupa angka`
                );
                rowValid = false;
              }
              // Check min/max
              if (value !== null) {
                if (field.minValue !== null && value < field.minValue) {
                  errors.push(
                    `Baris ${rowNumber}: ${field.name} minimal ${field.minValue}`
                  );
                  rowValid = false;
                }
                if (field.maxValue !== null && value > field.maxValue) {
                  errors.push(
                    `Baris ${rowNumber}: ${field.name} maksimal ${field.maxValue}`
                  );
                  rowValid = false;
                }
              }
              break;

            case "BOOLEAN":
              value = parseBoolean(rawValue);
              if (field.isRequired && value === null) {
                errors.push(
                  `Baris ${rowNumber}: ${field.name} harus berupa boolean`
                );
                rowValid = false;
              }
              break;

            case "SELECT":
              if (rawValue) {
                const strValue = String(rawValue).trim().toUpperCase();
                // Check if value is in options
                if (field.options) {
                  const upperOptions = field.options.map((o) => o.toUpperCase());
                  if (upperOptions.includes(strValue)) {
                    // Return the original option case
                    const index = upperOptions.indexOf(strValue);
                    value = field.options[index];
                  } else {
                    errors.push(
                      `Baris ${rowNumber}: ${field.name} harus salah satu dari: ${field.options.join(", ")}`
                    );
                    rowValid = false;
                  }
                } else {
                  value = strValue;
                }
              } else if (field.isRequired) {
                errors.push(
                  `Baris ${rowNumber}: ${field.name} tidak boleh kosong`
                );
                rowValid = false;
              }
              break;

            case "REFERENCE":
              if (rawValue && field.referenceTable && field.referenceField) {
                value = await resolveReference(
                  rawValue,
                  field.referenceTable,
                  field.referenceField
                );
                if (field.isRequired && !value) {
                  errors.push(
                    `Baris ${rowNumber}: ${field.name} "${rawValue}" tidak ditemukan di ${field.referenceTable}`
                  );
                  rowValid = false;
                }
              } else if (field.isRequired) {
                errors.push(
                  `Baris ${rowNumber}: ${field.name} tidak boleh kosong`
                );
                rowValid = false;
              }
              break;

            case "TEXT":
            default:
              if (rawValue !== undefined && rawValue !== null && rawValue !== "") {
                value = String(rawValue).trim();
              }
              if (field.isRequired && !value) {
                errors.push(
                  `Baris ${rowNumber}: ${field.name} tidak boleh kosong`
                );
                rowValid = false;
              }
              break;
          }

          // Set default value if value is null and default exists
          if (value === null && field.defaultValue) {
            value = field.defaultValue;
          }

          record[field.fieldName] = value;
        }

        if (rowValid) {
          parsedData.push(record);
        }

        // Stop after 50 errors to avoid flooding
        if (errors.length >= 50) {
          errors.push("... dan error lainnya (terlalu banyak untuk ditampilkan)");
          break;
        }
      } catch (error) {
        errors.push(
          `Baris ${rowNumber}: Error parsing - ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    // If more than 50% rows failed, consider it a failure
    if (errors.length > jsonData.length / 2) {
      return {
        success: false,
        errors: [
          `Terlalu banyak error (${errors.length} dari ${jsonData.length} baris)`,
          ...errors.slice(0, 10),
        ],
      };
    }

    // If no valid data
    if (parsedData.length === 0) {
      return {
        success: false,
        errors:
          errors.length > 0
            ? errors
            : ["Tidak ada data valid yang dapat diparse"],
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
        `Error membaca file Excel: ${error instanceof Error ? error.message : "Unknown error"}`,
      ],
    };
  }
}

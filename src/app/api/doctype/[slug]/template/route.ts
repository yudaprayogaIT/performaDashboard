// src/app/api/doctype/[slug]/template/route.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { getDocTypeBySlug, canUploadNow } from "@/lib/doctype/validator";
import * as XLSX from "xlsx";

/**
 * GET /api/doctype/[slug]/template
 *
 * Download Excel template for a DocType
 * Template includes column headers based on DocType fields
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Verify authentication
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const result = verifyToken(token);
    if (!result.valid || !result.payload) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    const userId = result.payload.userId;

    // Get DocType
    const docType = await getDocTypeBySlug(slug);
    if (!docType) {
      return NextResponse.json(
        { success: false, message: `DocType '${slug}' tidak ditemukan` },
        { status: 404 }
      );
    }

    // Check upload permission (if user can upload, they can download template)
    const validation = await canUploadNow(userId, slug);
    if (!validation.allowed) {
      return NextResponse.json(
        { success: false, message: "Anda tidak memiliki izin untuk DocType ini" },
        { status: 403 }
      );
    }

    // Get fields that should be in form/upload
    const uploadFields = docType.fields.filter((f) => f.showInForm !== false);

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Build headers from field configuration
    const headers = uploadFields.map((field) => field.excelColumn || field.name);

    // Build sample row with field descriptions and examples
    const sampleRow: Record<string, string> = {};
    const descriptionRow: Record<string, string> = {};

    for (const field of uploadFields) {
      const header = field.excelColumn || field.name;

      // Add description
      let description = field.isRequired ? "(Wajib) " : "(Opsional) ";
      switch (field.fieldType) {
        case "DATE":
          description += "Format: DD/MM/YYYY atau YYYY-MM-DD";
          sampleRow[header] = "01/01/2025";
          break;
        case "DATETIME":
          description += "Format: DD/MM/YYYY HH:mm";
          sampleRow[header] = "01/01/2025 09:00";
          break;
        case "NUMBER":
          description += "Angka";
          if (field.minValue !== null) description += `, min: ${field.minValue}`;
          if (field.maxValue !== null) description += `, max: ${field.maxValue}`;
          sampleRow[header] = "100";
          break;
        case "CURRENCY":
          description += "Angka (tanpa format Rp)";
          if (field.minValue !== null) description += `, min: ${field.minValue}`;
          if (field.maxValue !== null) description += `, max: ${field.maxValue}`;
          sampleRow[header] = "1000000";
          break;
        case "BOOLEAN":
          description += "true/false atau 1/0";
          sampleRow[header] = "true";
          break;
        case "SELECT":
          if (field.options && field.options.length > 0) {
            description += `Pilih: ${field.options.join(" / ")}`;
            sampleRow[header] = field.options[0];
          } else {
            description += "Pilih salah satu";
            sampleRow[header] = "";
          }
          break;
        case "REFERENCE":
          if (field.referenceTable === "locations") {
            description += "Kode lokasi (contoh: LOCAL-BGR)";
            sampleRow[header] = "LOCAL-BGR";
          } else if (field.referenceTable === "categories") {
            description += "Nama kategori (contoh: FURNITURE)";
            sampleRow[header] = "FURNITURE";
          } else {
            description += `ID atau kode dari ${field.referenceTable}`;
            sampleRow[header] = "1";
          }
          break;
        case "TEXT":
        default:
          description += "Teks";
          sampleRow[header] = "Contoh teks";
          break;
      }

      descriptionRow[header] = description;
    }

    // Create data with header, description row, and sample row
    const data = [
      sampleRow, // Sample data row
    ];

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });

    // Set column widths
    const colWidths = headers.map((h) => ({ wch: Math.max(h.length, 15) }));
    worksheet["!cols"] = colWidths;

    // Add description as second sheet
    const descSheet = XLSX.utils.json_to_sheet([descriptionRow], {
      header: headers,
    });
    descSheet["!cols"] = colWidths;

    // Add sheets to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template Kosong");
    XLSX.utils.book_append_sheet(workbook, descSheet, "Keterangan Kolom");

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // Return as downloadable file
    const filename = `template_upload_${docType.slug}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Template download error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Server error",
      },
      { status: 500 }
    );
  }
}

// src/app/api/upload/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import { canUploadToday } from '@/lib/upload-limits';
import { parseExcelByType } from '@/lib/excel-parser';
import { notifyDirekturAboutUpload } from '@/lib/notifications';
import { auditUpload } from '@/lib/audit';
import { getIpFromRequest, getUserAgentFromRequest } from '@/lib/audit';
import { prisma } from '@/lib/prisma';
import { UploadType } from '@prisma/client';

interface UploadResponse {
  success: boolean;
  message: string;
  uploadId?: number;
  rowCount?: number;
  errors?: string[];
}

/**
 * POST /api/upload
 * Upload sales data (omzet, gross margin, atau retur)
 *
 * Body: FormData with:
 * - file: Excel file
 * - uploadType: 'OMZET' | 'GROSS_MARGIN' | 'RETUR'
 * - uploadDate: Date string (YYYY-MM-DD)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json<UploadResponse>(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { valid, payload } = verifyToken(token);

    if (!valid || !payload) {
      return NextResponse.json<UploadResponse>(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const uploadTypeStr = formData.get('uploadType') as string | null;
    const uploadDateStr = formData.get('uploadDate') as string | null;

    // Validate inputs
    if (!file) {
      return NextResponse.json<UploadResponse>(
        { success: false, message: 'File tidak ditemukan' },
        { status: 400 }
      );
    }

    if (!uploadTypeStr || !['OMZET', 'GROSS_MARGIN', 'RETUR'].includes(uploadTypeStr)) {
      return NextResponse.json<UploadResponse>(
        { success: false, message: 'Tipe upload tidak valid' },
        { status: 400 }
      );
    }

    const uploadType = uploadTypeStr as UploadType;

    if (!uploadDateStr) {
      return NextResponse.json<UploadResponse>(
        { success: false, message: 'Tanggal upload harus diisi' },
        { status: 400 }
      );
    }

    const uploadDate = new Date(uploadDateStr);
    if (isNaN(uploadDate.getTime())) {
      return NextResponse.json<UploadResponse>(
        { success: false, message: 'Format tanggal tidak valid' },
        { status: 400 }
      );
    }

    // Check file size (max 25MB)
    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json<UploadResponse>(
        { success: false, message: 'Ukuran file maksimal 25MB' },
        { status: 400 }
      );
    }

    // Check file type
    if (
      !file.name.endsWith('.xlsx') &&
      !file.name.endsWith('.xls') &&
      !file.name.endsWith('.csv')
    ) {
      return NextResponse.json<UploadResponse>(
        { success: false, message: 'File harus berformat Excel (.xlsx, .xls, .csv)' },
        { status: 400 }
      );
    }

    // Check permission based on upload type
    try {
      const permissionMap = {
        OMZET: 'upload_omzet',
        GROSS_MARGIN: 'upload_gross_margin',
        RETUR: 'upload_retur',
      };

      await requirePermission(payload.userId, permissionMap[uploadType]);
    } catch (error) {
      return NextResponse.json<UploadResponse>(
        {
          success: false,
          message: `Anda tidak memiliki izin untuk upload ${uploadType}`,
        },
        { status: 403 }
      );
    }

    // Check daily upload limit
    const canUpload = await canUploadToday(payload.userId, uploadType, uploadDate);

    if (!canUpload) {
      return NextResponse.json<UploadResponse>(
        {
          success: false,
          message: `Anda sudah mengupload ${uploadType} untuk tanggal ini. Maksimal 1 upload per hari per tipe data.`,
        },
        { status: 400 }
      );
    }

    // Parse Excel file
    const parseResult = await parseExcelByType(file, uploadType);

    if (!parseResult.success || !parseResult.data) {
      return NextResponse.json<UploadResponse>(
        {
          success: false,
          message: 'Gagal memparse file Excel',
          errors: parseResult.errors,
        },
        { status: 400 }
      );
    }

    // Create SalesUpload record
    const salesUpload = await prisma.salesUpload.create({
      data: {
        userId: payload.userId,
        uploadType,
        fileName: file.name,
        fileSize: file.size,
        rowCount: parseResult.rowCount || 0,
        status: 'PENDING',
        uploadDate,
      },
    });

    try {
      // Process and save data based on upload type
      if (uploadType === 'OMZET') {
        // Save to SalesData table
        const salesDataRecords = parseResult.data.map((row: any) => ({
          locationCode: row.kode_lokasi,
          category: row.kategori,
          date: row.tanggal,
          amount: row.amount,
          notes: row.catatan,
          createdBy: payload.userId,
        }));

        // Batch insert with validation
        const validLocations = await prisma.location.findMany({
          select: { code: true },
        });
        const validLocationCodes = new Set(validLocations.map((l) => l.code));

        const validCategories = await prisma.category.findMany({
          select: { name: true },
        });
        const validCategoryNames = new Set(validCategories.map((c) => c.name));

        // Filter valid records
        const validRecords = salesDataRecords.filter((record) => {
          return (
            validLocationCodes.has(record.locationCode) &&
            validCategoryNames.has(record.category)
          );
        });

        if (validRecords.length === 0) {
          throw new Error('Tidak ada data valid dengan lokasi dan kategori yang sesuai');
        }

        await prisma.salesData.createMany({
          data: validRecords,
          skipDuplicates: true,
        });

        // Update upload status
        await prisma.salesUpload.update({
          where: { id: salesUpload.id },
          data: {
            status: 'SUCCESS',
            processedAt: new Date(),
          },
        });
      } else if (uploadType === 'GROSS_MARGIN') {
        // For now, we'll save gross margin data to a similar structure
        // You may need to create a separate table for gross margin
        // For this implementation, I'll save it to SalesData with notes indicating it's gross margin
        const salesDataRecords = parseResult.data.map((row: any) => ({
          locationCode: row.kode_lokasi,
          category: row.kategori,
          date: row.tanggal,
          amount: row.gross_margin, // Store gross margin as amount
          notes: `Omzet: ${row.omzet}, HPP: ${row.hpp}${row.catatan ? ', ' + row.catatan : ''}`,
          createdBy: payload.userId,
        }));

        // Validate and insert (same as OMZET)
        const validLocations = await prisma.location.findMany({
          select: { code: true },
        });
        const validLocationCodes = new Set(validLocations.map((l) => l.code));

        const validCategories = await prisma.category.findMany({
          select: { name: true },
        });
        const validCategoryNames = new Set(validCategories.map((c) => c.name));

        const validRecords = salesDataRecords.filter((record) => {
          return (
            validLocationCodes.has(record.locationCode) &&
            validCategoryNames.has(record.category)
          );
        });

        if (validRecords.length === 0) {
          throw new Error('Tidak ada data valid dengan lokasi dan kategori yang sesuai');
        }

        await prisma.salesData.createMany({
          data: validRecords,
          skipDuplicates: true,
        });

        await prisma.salesUpload.update({
          where: { id: salesUpload.id },
          data: {
            status: 'SUCCESS',
            processedAt: new Date(),
          },
        });
      } else if (uploadType === 'RETUR') {
        // Save retur data (similar to OMZET but with negative amount or flag)
        const salesDataRecords = parseResult.data.map((row: any) => ({
          locationCode: row.kode_lokasi,
          category: row.kategori,
          date: row.tanggal,
          amount: -Math.abs(row.amount), // Negative for returns
          notes: `RETUR${row.catatan ? ': ' + row.catatan : ''}`,
          createdBy: payload.userId,
        }));

        const validLocations = await prisma.location.findMany({
          select: { code: true },
        });
        const validLocationCodes = new Set(validLocations.map((l) => l.code));

        const validCategories = await prisma.category.findMany({
          select: { name: true },
        });
        const validCategoryNames = new Set(validCategories.map((c) => c.name));

        const validRecords = salesDataRecords.filter((record) => {
          return (
            validLocationCodes.has(record.locationCode) &&
            validCategoryNames.has(record.category)
          );
        });

        if (validRecords.length === 0) {
          throw new Error('Tidak ada data valid dengan lokasi dan kategori yang sesuai');
        }

        await prisma.salesData.createMany({
          data: validRecords,
          skipDuplicates: true,
        });

        await prisma.salesUpload.update({
          where: { id: salesUpload.id },
          data: {
            status: 'SUCCESS',
            processedAt: new Date(),
          },
        });
      }

      // Notify DIREKTUR users
      await notifyDirekturAboutUpload({
        uploaderName: payload.name,
        uploadType,
        fileName: file.name,
        rowCount: parseResult.rowCount || 0,
      });

      // Audit log
      const ipAddress = getIpFromRequest(request.headers);
      const userAgent = getUserAgentFromRequest(request.headers);

      await auditUpload(
        uploadType === 'OMZET'
          ? 'UPLOAD_OMZET'
          : uploadType === 'GROSS_MARGIN'
            ? 'UPLOAD_GROSS_MARGIN'
            : 'UPLOAD_RETUR',
        payload.userId,
        salesUpload.id,
        {
          fileName: file.name,
          rowCount: parseResult.rowCount || 0,
          uploadDate,
        },
        ipAddress,
        userAgent
      );

      return NextResponse.json<UploadResponse>({
        success: true,
        message: `Upload ${uploadType} berhasil! ${parseResult.rowCount} data telah diproses.`,
        uploadId: salesUpload.id,
        rowCount: parseResult.rowCount,
        errors: parseResult.errors,
      });
    } catch (error) {
      // Update upload status to FAILED
      await prisma.salesUpload.update({
        where: { id: salesUpload.id },
        data: {
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          processedAt: new Date(),
        },
      });

      throw error;
    }
  } catch (error) {
    console.error('Upload error:', error);

    return NextResponse.json<UploadResponse>(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

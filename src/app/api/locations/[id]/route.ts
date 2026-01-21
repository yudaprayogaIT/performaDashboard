import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { LocationType } from '@prisma/client';

// GET /api/locations/[id] - Get location by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid location ID' },
        { status: 400 }
      );
    }

    const location = await prisma.location.findUnique({
      where: { id },
    });

    if (!location) {
      return NextResponse.json(
        { success: false, error: 'Location not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: location,
    });
  } catch (error) {
    console.error('Error fetching location:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch location' },
      { status: 500 }
    );
  }
}

// PUT /api/locations/[id] - Update location
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid location ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { code, name, type, address, isActive } = body;

    // Check if location exists
    const existingLocation = await prisma.location.findUnique({
      where: { id },
    });

    if (!existingLocation) {
      return NextResponse.json(
        { success: false, error: 'Location not found' },
        { status: 404 }
      );
    }

    // Validate type if provided
    if (type && !['LOCAL', 'CABANG'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Type must be LOCAL or CABANG' },
        { status: 400 }
      );
    }

    const location = await prisma.location.update({
      where: { id },
      data: {
        ...(code && { code }),
        ...(name && { name }),
        ...(type && { type: type as LocationType }),
        ...(address !== undefined && { address }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({
      success: true,
      data: location,
    });
  } catch (error: any) {
    console.error('Error updating location:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Location code already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update location' },
      { status: 500 }
    );
  }
}

// DELETE /api/locations/[id] - Delete location
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid location ID' },
        { status: 400 }
      );
    }

    // Check if location has associated sales
    const salesCount = await prisma.sale.count({
      where: { locationId: id },
    });

    if (salesCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete location with existing sales data. Please delete sales data first or deactivate the location.',
        },
        { status: 409 }
      );
    }

    await prisma.location.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Location deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting location:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Location not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to delete location' },
      { status: 500 }
    );
  }
}

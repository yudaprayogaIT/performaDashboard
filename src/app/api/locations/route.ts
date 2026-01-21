import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { LocationType } from '@prisma/client';

// GET /api/locations - Get all locations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as LocationType | null;

    const locations = await prisma.location.findMany({
      where: type ? { type } : {},
      orderBy: [
        { type: 'asc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json({
      success: true,
      data: locations,
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch locations',
      },
      { status: 500 }
    );
  }
}

// POST /api/locations - Create new location
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, name, type, address } = body;

    // Validation
    if (!code || !name || !type) {
      return NextResponse.json(
        {
          success: false,
          error: 'Code, name, and type are required',
        },
        { status: 400 }
      );
    }

    if (!['LOCAL', 'CABANG'].includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Type must be LOCAL or CABANG',
        },
        { status: 400 }
      );
    }

    const location = await prisma.location.create({
      data: {
        code,
        name,
        type: type as LocationType,
        address: address || null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: location,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating location:', error);

    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        {
          success: false,
          error: 'Location code already exists',
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create location',
      },
      { status: 500 }
    );
  }
}

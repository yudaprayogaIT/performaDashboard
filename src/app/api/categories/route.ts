import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/categories - Get all categories
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch categories',
      },
      { status: 500 }
    );
  }
}

// POST /api/categories - Create new category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, sortOrder } = body;

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: 'Name is required',
        },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name,
        description: description || null,
        sortOrder: sortOrder || 0,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: category,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating category:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        {
          success: false,
          error: 'Category name already exists',
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create category',
      },
      { status: 500 }
    );
  }
}

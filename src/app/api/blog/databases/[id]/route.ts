import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/blog/databases/[id] - Get a single database with items
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const database = await prisma.blogDatabase.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!database) {
      return NextResponse.json({ error: 'Database not found' }, { status: 404 });
    }

    return NextResponse.json(database);
  } catch (error) {
    console.error('Failed to fetch database:', error);
    return NextResponse.json({ error: 'Failed to fetch database' }, { status: 500 });
  }
}

// PUT /api/blog/databases/[id] - Update a database
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { title, description, columns, isPublic, category } = body;

    const existing = await prisma.blogDatabase.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Database not found' }, { status: 404 });
    }

    const database = await prisma.blogDatabase.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(columns !== undefined && { columns }),
        ...(isPublic !== undefined && { isPublic }),
        ...(category !== undefined && { category }),
      },
    });

    revalidatePath(`/blog/db/${existing.slug}`);
    revalidatePath('/blog');

    return NextResponse.json(database);
  } catch (error) {
    console.error('Failed to update database:', error);
    return NextResponse.json({ error: 'Failed to update database' }, { status: 500 });
  }
}

// DELETE /api/blog/databases/[id] - Delete a database
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const existing = await prisma.blogDatabase.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Database not found' }, { status: 404 });
    }

    await prisma.blogDatabase.delete({
      where: { id },
    });

    revalidatePath('/blog');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete database:', error);
    return NextResponse.json({ error: 'Failed to delete database' }, { status: 500 });
  }
}

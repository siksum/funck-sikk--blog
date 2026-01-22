import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string; itemId: string }>;
}

// GET /api/blog/databases/[id]/items/[itemId] - Get a single item
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id, itemId } = await context.params;

    const item = await prisma.blogDatabaseItem.findFirst({
      where: {
        id: itemId,
        databaseId: id,
      },
      include: {
        database: true,
      },
    });

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Failed to fetch item:', error);
    return NextResponse.json({ error: 'Failed to fetch item' }, { status: 500 });
  }
}

// PUT /api/blog/databases/[id]/items/[itemId] - Update an item
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id, itemId } = await context.params;
    const body = await request.json();
    const { data, content, order } = body;

    const existing = await prisma.blogDatabaseItem.findFirst({
      where: {
        id: itemId,
        databaseId: id,
      },
      include: {
        database: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const item = await prisma.blogDatabaseItem.update({
      where: { id: itemId },
      data: {
        ...(data !== undefined && { data }),
        ...(content !== undefined && { content }),
        ...(order !== undefined && { order }),
      },
    });

    revalidatePath(`/blog/db/${existing.database.slug}`);
    revalidatePath(`/blog/db/${existing.database.slug}/${itemId}`);

    return NextResponse.json(item);
  } catch (error) {
    console.error('Failed to update item:', error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

// DELETE /api/blog/databases/[id]/items/[itemId] - Delete an item
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id, itemId } = await context.params;

    const existing = await prisma.blogDatabaseItem.findFirst({
      where: {
        id: itemId,
        databaseId: id,
      },
      include: {
        database: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    await prisma.blogDatabaseItem.delete({
      where: { id: itemId },
    });

    revalidatePath(`/blog/db/${existing.database.slug}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete item:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}

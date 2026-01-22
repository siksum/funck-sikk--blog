import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/blog/databases/[id]/items - List all items in a database
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const database = await prisma.blogDatabase.findUnique({
      where: { id },
    });

    if (!database) {
      return NextResponse.json({ error: 'Database not found' }, { status: 404 });
    }

    const items = await prisma.blogDatabaseItem.findMany({
      where: { databaseId: id },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error('Failed to fetch items:', error);
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}

// POST /api/blog/databases/[id]/items - Create a new item
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { data, content } = body;

    const database = await prisma.blogDatabase.findUnique({
      where: { id },
    });

    if (!database) {
      return NextResponse.json({ error: 'Database not found' }, { status: 404 });
    }

    // Get the max order value
    const maxOrderItem = await prisma.blogDatabaseItem.findFirst({
      where: { databaseId: id },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const newOrder = (maxOrderItem?.order ?? -1) + 1;

    const item = await prisma.blogDatabaseItem.create({
      data: {
        databaseId: id,
        data: data || {},
        content: content || '',
        order: newOrder,
      },
    });

    revalidatePath(`/blog/db/${database.slug}`);

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Failed to create item:', error);
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

// GET all categories
export async function GET() {
  const session = await auth();
  const isDev = process.env.NODE_ENV === 'development';

  if (!isDev && !session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const categories = await prisma.category.findMany({
    include: {
      children: {
        orderBy: { order: 'asc' },
      },
    },
    where: {
      parentId: null,
    },
    orderBy: { order: 'asc' },
  });

  return NextResponse.json(categories);
}

// POST create category
export async function POST(request: NextRequest) {
  const session = await auth();
  const isDev = process.env.NODE_ENV === 'development';

  if (!isDev && !session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { name, parentId } = body;

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  // Generate slug from name
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, '-')
    .replace(/^-|-$/g, '');

  // Check if slug already exists
  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: 'Category with this name already exists' }, { status: 400 });
  }

  // Get max order for the parent level
  const maxOrder = await prisma.category.aggregate({
    where: { parentId: parentId || null },
    _max: { order: true },
  });

  const category = await prisma.category.create({
    data: {
      name,
      slug,
      parentId: parentId || null,
      order: (maxOrder._max.order || 0) + 1,
    },
    include: {
      children: true,
    },
  });

  return NextResponse.json(category);
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

// GET all sections with their categories
export async function GET() {
  const session = await auth();
  const isDev = process.env.NODE_ENV === 'development';

  if (!isDev && !session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sections = await prisma.section.findMany({
    include: {
      categories: {
        where: { parentId: null },
        include: {
          children: {
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { order: 'asc' },
  });

  return NextResponse.json(sections);
}

// POST create section
export async function POST(request: NextRequest) {
  const session = await auth();
  const isDev = process.env.NODE_ENV === 'development';

  if (!isDev && !session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { title, description } = body;

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  // Get max order
  const maxOrder = await prisma.section.aggregate({
    _max: { order: true },
  });

  const section = await prisma.section.create({
    data: {
      title,
      description: description || null,
      order: (maxOrder._max.order || 0) + 1,
    },
    include: {
      categories: true,
    },
  });

  return NextResponse.json(section);
}

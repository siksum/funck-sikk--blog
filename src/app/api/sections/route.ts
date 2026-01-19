import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET all sections with their root categories (public API for blog page)
export async function GET() {
  const sections = await prisma.section.findMany({
    include: {
      categories: {
        where: { parentId: null },
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { order: 'asc' },
  });

  return NextResponse.json(sections);
}

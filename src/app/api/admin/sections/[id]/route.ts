import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

// PUT update section
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const isDev = process.env.NODE_ENV === 'development';

  if (!isDev && !session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { title, description, order } = body;

  // Check if section exists
  const existing = await prisma.section.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Section not found' }, { status: 404 });
  }

  const section = await prisma.section.update({
    where: { id },
    data: {
      ...(title && { title }),
      ...(description !== undefined && { description: description || null }),
      ...(order !== undefined && { order }),
    },
    include: {
      categories: true,
    },
  });

  return NextResponse.json(section);
}

// DELETE section
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const isDev = process.env.NODE_ENV === 'development';

  if (!isDev && !session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  // Check if section exists
  const existing = await prisma.section.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Section not found' }, { status: 404 });
  }

  // Unlink categories from this section (set sectionId to null)
  await prisma.category.updateMany({
    where: { sectionId: id },
    data: { sectionId: null },
  });

  await prisma.section.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

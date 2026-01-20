import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

// PUT update sikk category
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
  const { name, parentId, order, sectionId } = body;

  // Check if category exists
  const existing = await prisma.sikkCategory.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 });
  }

  // Generate new slug if name changed
  let slug = existing.slug;
  if (name && name !== existing.name) {
    slug = name
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]+/g, '-')
      .replace(/^-|-$/g, '');

    // Check if new slug already exists (excluding current category)
    const slugExists = await prisma.sikkCategory.findFirst({
      where: { slug, id: { not: id } },
    });
    if (slugExists) {
      return NextResponse.json({ error: 'Category with this name already exists' }, { status: 400 });
    }
  }

  const category = await prisma.sikkCategory.update({
    where: { id },
    data: {
      ...(name && { name, slug }),
      ...(parentId !== undefined && { parentId: parentId || null }),
      ...(sectionId !== undefined && { sectionId: sectionId || null }),
      ...(order !== undefined && { order }),
    },
    include: {
      children: true,
      section: true,
    },
  });

  return NextResponse.json(category);
}

// DELETE sikk category
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

  // Check if category exists
  const existing = await prisma.sikkCategory.findUnique({
    where: { id },
    include: { children: true },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 });
  }

  // Delete children first if it's a parent category
  if (existing.children.length > 0) {
    await prisma.sikkCategory.deleteMany({
      where: { parentId: id },
    });
  }

  await prisma.sikkCategory.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

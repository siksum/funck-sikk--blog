import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Default columns for new databases
const defaultColumns = [
  { id: 'date', name: '날짜', type: 'date' },
  { id: 'title', name: '이름', type: 'title' },
  { id: 'files', name: '파일과 미디어', type: 'files' },
  { id: 'url', name: 'URL', type: 'url' },
  { id: 'category', name: '카테고리', type: 'select', options: [] },
];

// GET /api/sikk/databases - List all databases
export async function GET() {
  try {
    const databases = await prisma.sikkDatabase.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });

    return NextResponse.json(databases);
  } catch (error) {
    console.error('Failed to fetch databases:', error);
    return NextResponse.json({ error: 'Failed to fetch databases' }, { status: 500 });
  }
}

// POST /api/sikk/databases - Create a new database
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, slug, columns, isPublic, category } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Generate slug from title if not provided
    const dbSlug = slug || title
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    // Check if slug already exists
    const existing = await prisma.sikkDatabase.findUnique({
      where: { slug: dbSlug },
    });

    if (existing) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
    }

    const database = await prisma.sikkDatabase.create({
      data: {
        title,
        description: description || null,
        slug: dbSlug,
        category: category || null,
        columns: columns || defaultColumns,
        isPublic: isPublic !== false,
      },
    });

    return NextResponse.json(database, { status: 201 });
  } catch (error) {
    console.error('Failed to create database:', error);
    return NextResponse.json({ error: 'Failed to create database' }, { status: 500 });
  }
}

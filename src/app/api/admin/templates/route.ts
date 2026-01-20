import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET: 모든 템플릿 조회
export async function GET() {
  try {
    const templates = await prisma.postTemplate.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json(templates);
  } catch (error) {
    console.error('Failed to fetch templates:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

// POST: 새 템플릿 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, category, tags, content } = body;

    if (!name) {
      return NextResponse.json({ error: 'Template name is required' }, { status: 400 });
    }

    const template = await prisma.postTemplate.create({
      data: {
        name,
        description: description || null,
        category: category || null,
        tags: tags || [],
        content: content || '',
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error('Failed to create template:', error);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}

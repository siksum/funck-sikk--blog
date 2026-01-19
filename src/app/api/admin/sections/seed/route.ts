import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

// POST seed default sections
export async function POST() {
  const session = await auth();
  const isDev = process.env.NODE_ENV === 'development';

  if (!isDev && !session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const defaultSections = [
    {
      title: 'Web2 Security',
      description: '전통적인 웹 보안 및 시스템 해킹',
      order: 1,
    },
    {
      title: 'Web3 Security',
      description: '블록체인 및 스마트 컨트랙트 보안',
      order: 2,
    },
    {
      title: 'TIL',
      description: 'Today I Learned - 오늘 배운 것들',
      order: 3,
    },
  ];

  const created: string[] = [];
  const skipped: string[] = [];

  for (const section of defaultSections) {
    const existing = await prisma.section.findFirst({
      where: { title: section.title },
    });

    if (!existing) {
      await prisma.section.create({
        data: section,
      });
      created.push(section.title);
    } else {
      skipped.push(section.title);
    }
  }

  return NextResponse.json({
    message: 'Seeding completed',
    created,
    skipped,
  });
}

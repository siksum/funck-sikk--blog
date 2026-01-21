import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

// POST seed default sikk sections
export async function POST() {
  const session = await auth();
  const isDev = process.env.NODE_ENV === 'development';

  if (!isDev && !session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const defaultSections = [
    {
      title: 'CTF',
      description: 'Capture The Flag writeups and solutions',
      order: 1,
    },
    {
      title: 'Wargames',
      description: 'Wargame challenges and walkthroughs',
      order: 2,
    },
    {
      title: 'Research',
      description: 'Security research and analysis',
      order: 3,
    },
  ];

  const created: string[] = [];
  const skipped: string[] = [];

  for (const section of defaultSections) {
    const existing = await prisma.sikkSection.findFirst({
      where: { title: section.title },
    });

    if (!existing) {
      await prisma.sikkSection.create({
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

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { path, slug } = await request.json();

    // Server-side filter: Skip admin paths
    if (path?.startsWith('/admin')) {
      return NextResponse.json({ success: true, skipped: true });
    }

    const userAgent = request.headers.get('user-agent') || '';
    const referer = request.headers.get('referer') || '';

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    await prisma.pageView.create({
      data: {
        path,
        slug,
        userAgent,
        referer,
        date: today,
      },
    });

    await prisma.dailyVisit.upsert({
      where: { date: today },
      update: { count: { increment: 1 } },
      create: { date: today, count: 1 },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

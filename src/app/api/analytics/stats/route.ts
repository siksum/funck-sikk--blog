import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function GET() {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [todayCount, last30Days, topPosts, totalViews] = await Promise.all([
    prisma.dailyVisit.findUnique({ where: { date: today } }),
    prisma.dailyVisit.findMany({
      where: { date: { gte: thirtyDaysAgo } },
      orderBy: { date: 'asc' },
    }),
    prisma.pageView.groupBy({
      by: ['slug'],
      where: { slug: { not: null }, date: { gte: thirtyDaysAgo } },
      _count: { slug: true },
      orderBy: { _count: { slug: 'desc' } },
      take: 10,
    }),
    prisma.pageView.count(),
  ]);

  return NextResponse.json({
    today: todayCount?.count || 0,
    last30Days,
    topPosts: topPosts.map((p) => ({ slug: p.slug, count: p._count.slug })),
    totalViews,
  });
}

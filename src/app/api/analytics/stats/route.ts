import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const range = searchParams.get('range') || '30days';
  const startDate = searchParams.get('start');
  const endDate = searchParams.get('end');

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  let fromDate: Date;
  let toDate: Date = new Date(today);
  toDate.setDate(toDate.getDate() + 1);

  // Calculate date range
  if (startDate && endDate) {
    fromDate = new Date(startDate);
    toDate = new Date(endDate);
    toDate.setDate(toDate.getDate() + 1);
  } else {
    switch (range) {
      case '7days':
        fromDate = new Date(today);
        fromDate.setDate(fromDate.getDate() - 7);
        break;
      case '30days':
        fromDate = new Date(today);
        fromDate.setDate(fromDate.getDate() - 30);
        break;
      case '90days':
        fromDate = new Date(today);
        fromDate.setDate(fromDate.getDate() - 90);
        break;
      case '1year':
        fromDate = new Date(today);
        fromDate.setFullYear(fromDate.getFullYear() - 1);
        break;
      default:
        fromDate = new Date(today);
        fromDate.setDate(fromDate.getDate() - 30);
    }
  }

  const [todayCount, dailyData, weeklyData, monthlyData, topPosts, totalViews, yesterdayCount] = await Promise.all([
    prisma.dailyVisit.findUnique({ where: { date: today } }),
    prisma.dailyVisit.findMany({
      where: { date: { gte: fromDate, lt: toDate } },
      orderBy: { date: 'asc' },
    }),
    // Weekly aggregation
    prisma.$queryRaw`
      SELECT
        DATE_TRUNC('week', date) as week_start,
        SUM(count) as total
      FROM "DailyVisit"
      WHERE date >= ${fromDate} AND date < ${toDate}
      GROUP BY DATE_TRUNC('week', date)
      ORDER BY week_start ASC
    ` as Promise<Array<{ week_start: Date; total: bigint }>>,
    // Monthly aggregation
    prisma.$queryRaw`
      SELECT
        DATE_TRUNC('month', date) as month_start,
        SUM(count) as total
      FROM "DailyVisit"
      WHERE date >= ${fromDate} AND date < ${toDate}
      GROUP BY DATE_TRUNC('month', date)
      ORDER BY month_start ASC
    ` as Promise<Array<{ month_start: Date; total: bigint }>>,
    prisma.pageView.groupBy({
      by: ['slug'],
      where: { slug: { not: null }, date: { gte: fromDate, lt: toDate } },
      _count: { slug: true },
      orderBy: { _count: { slug: 'desc' } },
      take: 10,
    }),
    prisma.pageView.count(),
    prisma.dailyVisit.findUnique({
      where: {
        date: new Date(new Date(today).setDate(today.getDate() - 1)),
      },
    }),
  ]);

  // Calculate this week's total
  const startOfWeek = new Date(today);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const thisWeekData = dailyData.filter(d => new Date(d.date) >= startOfWeek);
  const thisWeekTotal = thisWeekData.reduce((sum, d) => sum + d.count, 0);

  // Calculate this month's total
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const thisMonthData = dailyData.filter(d => new Date(d.date) >= startOfMonth);
  const thisMonthTotal = thisMonthData.reduce((sum, d) => sum + d.count, 0);

  return NextResponse.json({
    today: todayCount?.count || 0,
    yesterday: yesterdayCount?.count || 0,
    thisWeek: thisWeekTotal,
    thisMonth: thisMonthTotal,
    totalViews,
    daily: dailyData.map(d => ({ date: d.date, count: d.count })),
    weekly: weeklyData.map(w => ({ date: w.week_start, count: Number(w.total) })),
    monthly: monthlyData.map(m => ({ date: m.month_start, count: Number(m.total) })),
    topPosts: topPosts.map((p) => ({ slug: p.slug, count: p._count.slug })),
  });
}

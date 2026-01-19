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

  const [todayCount, dailyData, weeklyData, monthlyData, topPosts, totalVisitorsResult, yesterdayCount, recentVisitors, refererStats, topPages] = await Promise.all([
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
    // Total unique visitors (sum of DailyVisit counts)
    prisma.dailyVisit.aggregate({ _sum: { count: true } }),
    prisma.dailyVisit.findUnique({
      where: {
        date: new Date(new Date(today).setDate(today.getDate() - 1)),
      },
    }),
    // Recent visitors (last 50)
    prisma.pageView.findMany({
      where: { date: { gte: fromDate, lt: toDate } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        path: true,
        slug: true,
        userAgent: true,
        referer: true,
        createdAt: true,
      },
    }),
    // Referer breakdown
    prisma.pageView.groupBy({
      by: ['referer'],
      where: { date: { gte: fromDate, lt: toDate } },
      _count: { referer: true },
      orderBy: { _count: { referer: 'desc' } },
      take: 10,
    }),
    // Top pages (all paths, not just blog)
    prisma.pageView.groupBy({
      by: ['path'],
      where: { date: { gte: fromDate, lt: toDate } },
      _count: { path: true },
      orderBy: { _count: { path: 'desc' } },
      take: 10,
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

  // Parse user agent to get browser/device info
  const parseUserAgent = (ua: string | null) => {
    if (!ua) return { browser: 'Unknown', device: 'Unknown' };

    let browser = 'Other';
    let device = 'Desktop';

    if (ua.includes('Mobile')) device = 'Mobile';
    else if (ua.includes('Tablet')) device = 'Tablet';

    if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Edg')) browser = 'Edge';
    else if (ua.includes('MSIE') || ua.includes('Trident')) browser = 'IE';

    return { browser, device };
  };

  // Parse referer to get domain
  const parseReferer = (ref: string | null) => {
    if (!ref) return 'Direct';
    try {
      const url = new URL(ref);
      if (url.hostname.includes('google')) return 'Google';
      if (url.hostname.includes('naver')) return 'Naver';
      if (url.hostname.includes('daum')) return 'Daum';
      if (url.hostname.includes('github')) return 'GitHub';
      if (url.hostname.includes('twitter') || url.hostname.includes('x.com')) return 'Twitter/X';
      if (url.hostname.includes('facebook')) return 'Facebook';
      if (url.hostname.includes('linkedin')) return 'LinkedIn';
      return url.hostname;
    } catch {
      return 'Direct';
    }
  };

  return NextResponse.json({
    today: todayCount?.count || 0,
    yesterday: yesterdayCount?.count || 0,
    thisWeek: thisWeekTotal,
    thisMonth: thisMonthTotal,
    totalViews: totalVisitorsResult._sum.count || 0,
    daily: dailyData.map(d => ({ date: d.date, count: d.count })),
    weekly: weeklyData.map(w => ({ date: w.week_start, count: Number(w.total) })),
    monthly: monthlyData.map(m => ({ date: m.month_start, count: Number(m.total) })),
    topPosts: topPosts.map((p) => ({ slug: p.slug, count: p._count.slug })),
    recentVisitors: recentVisitors.map(v => ({
      path: v.path,
      slug: v.slug,
      referer: parseReferer(v.referer),
      rawReferer: v.referer,
      ...parseUserAgent(v.userAgent),
      createdAt: v.createdAt,
    })),
    referers: refererStats.map(r => ({
      source: parseReferer(r.referer),
      count: r._count.referer,
    })),
    topPages: topPages.map(p => ({
      path: p.path,
      count: p._count.path,
    })),
  });
}

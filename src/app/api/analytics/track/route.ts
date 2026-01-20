import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { createHash } from 'crypto';

// Admin emails that should not be tracked
const ADMIN_EMAILS = [
  process.env.ADMIN_EMAIL,
  'sikk@sikk.kr',
].filter(Boolean);

// Generate a visitor hash from IP and User Agent
function generateVisitorHash(ip: string, userAgent: string): string {
  const data = `${ip}:${userAgent}`;
  return createHash('sha256').update(data).digest('hex').substring(0, 32);
}

// Get client IP from request headers
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  return 'unknown';
}

// Check if user agent is a bot/crawler
function isBot(userAgent: string): boolean {
  // Empty or very short user agent is suspicious
  if (!userAgent || userAgent.length < 20) {
    return true;
  }

  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /crawling/i,
    /googlebot/i,
    /bingbot/i,
    /yandex/i,
    /baidu/i,
    /duckduckbot/i,
    /slurp/i,
    /facebookexternalhit/i,
    /linkedinbot/i,
    /twitterbot/i,
    /whatsapp/i,
    /telegram/i,
    /discord/i,
    /slack/i,
    /preview/i,
    /headless/i,
    /phantom/i,
    /selenium/i,
    /puppeteer/i,
    /playwright/i,
    /curl/i,
    /wget/i,
    /python-requests/i,
    /axios/i,
    /node-fetch/i,
    /go-http-client/i,
    /java\//i,
    /apache-httpclient/i,
    /okhttp/i,
    /postman/i,
    /insomnia/i,
    /libwww/i,
    /httpunit/i,
    /nutch/i,
    /phpcrawl/i,
    /msnbot/i,
    /adidxbot/i,
    /blekkobot/i,
    /teoma/i,
    /gigabot/i,
    /dotbot/i,
    /ahrefsbot/i,
    /semrushbot/i,
    /mj12bot/i,
    /rogerbot/i,
    /exabot/i,
    /scrapy/i,
    /feedfetcher/i,
    /monitoring/i,
    /uptime/i,
    /pingdom/i,
    /statuspage/i,
    /dataprovider/i,
    /censys/i,
    /nmap/i,
    /masscan/i,
    /zgrab/i,
  ];

  return botPatterns.some(pattern => pattern.test(userAgent));
}

export async function POST(request: NextRequest) {
  try {
    // Server-side filter: Skip any logged-in user (admin check)
    const session = await auth();

    // Skip if user is admin by isAdmin flag
    if (session?.user?.isAdmin) {
      return NextResponse.json({ success: true, skipped: 'admin_user' });
    }

    // Skip if user email is in admin list
    if (session?.user?.email && ADMIN_EMAILS.includes(session.user.email)) {
      return NextResponse.json({ success: true, skipped: 'admin_email' });
    }

    const { path, slug } = await request.json();

    // Server-side filter: Skip admin paths
    if (path?.startsWith('/admin')) {
      return NextResponse.json({ success: true, skipped: 'admin_path' });
    }

    const userAgent = request.headers.get('user-agent') || '';

    // Server-side filter: Skip bots and crawlers
    if (isBot(userAgent)) {
      return NextResponse.json({ success: true, skipped: 'bot' });
    }
    const referer = request.headers.get('referer') || '';
    const clientIP = getClientIP(request);
    const visitorHash = generateVisitorHash(clientIP, userAgent);

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Check if this visitor has already viewed this page today
    const existingView = await prisma.pageView.findFirst({
      where: {
        visitorHash,
        path,
        date: today,
      },
    });

    if (existingView) {
      // Duplicate visit - skip counting
      return NextResponse.json({ success: true, unique: false, skipped: 'duplicate' });
    }

    // Create new page view
    await prisma.pageView.create({
      data: {
        path,
        slug,
        visitorHash,
        userAgent,
        referer,
        date: today,
      },
    });

    // Increment daily visit count for new unique visitors
    await prisma.dailyVisit.upsert({
      where: { date: today },
      update: { count: { increment: 1 } },
      create: { date: today, count: 1 },
    });

    return NextResponse.json({ success: true, unique: true });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

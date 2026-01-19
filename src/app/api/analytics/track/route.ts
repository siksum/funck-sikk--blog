import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { createHash } from 'crypto';

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

export async function POST(request: NextRequest) {
  try {
    // Server-side filter: Skip admin users
    const session = await auth();
    if (session?.user?.isAdmin) {
      return NextResponse.json({ success: true, skipped: 'admin_user' });
    }

    const { path, slug } = await request.json();

    // Server-side filter: Skip admin paths
    if (path?.startsWith('/admin')) {
      return NextResponse.json({ success: true, skipped: 'admin_path' });
    }

    const userAgent = request.headers.get('user-agent') || '';
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

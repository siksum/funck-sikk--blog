import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendPushToSubscriptions } from '@/lib/notifications';

export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sends this as Authorization header)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

  // Find events:
  // - With reminder enabled
  // - Starting within next 30 minutes (with 5 min buffer for events we might have just missed)
  // - Not all-day events (they don't have specific times)
  // - Reminder not already sent
  const upcomingEvents = await prisma.calendarEvent.findMany({
    where: {
      reminder: true,
      isAllDay: false,
      reminderSentAt: null,
      date: {
        gte: fiveMinutesAgo,
        lte: thirtyMinutesFromNow,
      },
    },
    include: {
      user: {
        include: {
          pushSubscriptions: true,
        },
      },
    },
  });

  const results = { sent: 0, errors: [] as string[] };
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  for (const event of upcomingEvents) {
    if (!event.user?.pushSubscriptions?.length) continue;

    const minutesUntil = Math.round((event.date.getTime() - now.getTime()) / 60000);
    const timeText = minutesUntil <= 0 ? '곧 시작됩니다' : `${minutesUntil}분 후 시작`;

    const payload = {
      title: `일정 알림: ${event.title}`,
      body: `${timeText}${event.location ? ` - ${event.location}` : ''}`,
      icon: '/icons/icon-192x192.png',
      url: `${baseUrl}/my-world`,
    };

    try {
      const result = await sendPushToSubscriptions(event.user.pushSubscriptions, payload);
      results.sent += result.sent;

      // Mark reminder as sent
      await prisma.calendarEvent.update({
        where: { id: event.id },
        data: { reminderSentAt: now },
      });
    } catch (error) {
      results.errors.push(`Event ${event.id}: ${error}`);
    }
  }

  return NextResponse.json({
    success: true,
    eventsProcessed: upcomingEvents.length,
    ...results,
  });
}

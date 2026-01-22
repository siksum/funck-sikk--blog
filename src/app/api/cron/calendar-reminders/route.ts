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

  const results = { sent: 0, errors: [] as string[] };
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  // 1. Timed events (not all-day): remind 30 minutes before
  const timedEvents = await prisma.calendarEvent.findMany({
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

  for (const event of timedEvents) {
    if (!event.user?.pushSubscriptions?.length) continue;

    const minutesUntil = Math.round((event.date.getTime() - now.getTime()) / 60000);
    const timeText = minutesUntil <= 0 ? '곧 시작됩니다' : `${minutesUntil}분 후 시작`;

    const payload = {
      title: `⏰ ${event.title}`,
      body: `${timeText}${event.location ? ` - ${event.location}` : ''}`,
      icon: '/icons/icon-192x192.png',
      url: `${baseUrl}/my-world`,
    };

    try {
      const result = await sendPushToSubscriptions(event.user.pushSubscriptions, payload);
      results.sent += result.sent;

      await prisma.calendarEvent.update({
        where: { id: event.id },
        data: { reminderSentAt: now },
      });
    } catch (error) {
      results.errors.push(`Timed event ${event.id}: ${error}`);
    }
  }

  // 2. All-day events: remind at 8 AM on the day of the event
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  // Check if current time is between 8:00 AM and 8:10 AM (10 min window for cron)
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const isReminderTime = currentHour === 8 && currentMinute < 10;

  if (isReminderTime) {
    const allDayEvents = await prisma.calendarEvent.findMany({
      where: {
        reminder: true,
        isAllDay: true,
        reminderSentAt: null,
        date: {
          gte: todayStart,
          lte: todayEnd,
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

    for (const event of allDayEvents) {
      if (!event.user?.pushSubscriptions?.length) continue;

      const payload = {
        title: `📅 오늘 일정: ${event.title}`,
        body: event.location ? `장소: ${event.location}` : '오늘 예정된 일정입니다',
        icon: '/icons/icon-192x192.png',
        url: `${baseUrl}/my-world`,
      };

      try {
        const result = await sendPushToSubscriptions(event.user.pushSubscriptions, payload);
        results.sent += result.sent;

        await prisma.calendarEvent.update({
          where: { id: event.id },
          data: { reminderSentAt: now },
        });
      } catch (error) {
        results.errors.push(`All-day event ${event.id}: ${error}`);
      }
    }
  }

  return NextResponse.json({
    success: true,
    timedEventsProcessed: timedEvents.length,
    ...results,
  });
}

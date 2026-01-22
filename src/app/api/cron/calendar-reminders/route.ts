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

  // Get all admin users' push subscriptions (handles multiple OAuth accounts)
  const adminUsers = await prisma.user.findMany({
    where: { isAdmin: true },
    include: { pushSubscriptions: true },
  });
  const adminSubscriptions = adminUsers.flatMap((u) => u.pushSubscriptions);

  // Also get subscriptions with null userId (fallback for unlinked subscriptions)
  const nullUserSubscriptions = await prisma.pushSubscription.findMany({
    where: { userId: null },
  });

  // Combine and deduplicate by endpoint
  const allSubscriptionsMap = new Map<string, typeof adminSubscriptions[0]>();
  [...adminSubscriptions, ...nullUserSubscriptions].forEach((sub) => {
    allSubscriptionsMap.set(sub.endpoint, sub);
  });
  const allAdminSubscriptions = Array.from(allSubscriptionsMap.values());

  if (allAdminSubscriptions.length === 0) {
    return NextResponse.json({
      success: true,
      message: 'No push subscriptions found',
      ...results,
    });
  }

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
  });

  for (const event of timedEvents) {
    const minutesUntil = Math.round((event.date.getTime() - now.getTime()) / 60000);
    const timeText = minutesUntil <= 0 ? '곧 시작됩니다' : `${minutesUntil}분 후 시작`;

    const payload = {
      title: `⏰ ${event.title}`,
      body: `${timeText}${event.location ? ` - ${event.location}` : ''}`,
      icon: '/icons/icon-192x192.png',
      url: `${baseUrl}/my-world`,
    };

    try {
      const result = await sendPushToSubscriptions(allAdminSubscriptions, payload);
      results.sent += result.sent;

      await prisma.calendarEvent.update({
        where: { id: event.id },
        data: { reminderSentAt: now },
      });
    } catch (error) {
      results.errors.push(`Timed event ${event.id}: ${error}`);
    }
  }

  // 2. All-day events: remind at 10 AM on the day of the event
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  // Check if current time is between 10:00 AM and 10:10 AM (10 min window for cron)
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const isReminderTime = currentHour === 10 && currentMinute < 10;

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
    });

    for (const event of allDayEvents) {
      const payload = {
        title: `📅 오늘 일정: ${event.title}`,
        body: event.location ? `장소: ${event.location}` : '오늘 예정된 일정입니다',
        icon: '/icons/icon-192x192.png',
        url: `${baseUrl}/my-world`,
      };

      try {
        const result = await sendPushToSubscriptions(allAdminSubscriptions, payload);
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

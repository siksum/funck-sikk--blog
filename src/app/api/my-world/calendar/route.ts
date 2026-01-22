import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getAdminUserId } from '@/lib/get-admin-user-id';

const isProduction = process.env.NODE_ENV === 'production';

// GET: List calendar events
export async function GET(request: NextRequest) {
  const session = await auth();

  if (isProduction && !session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year');
  const month = searchParams.get('month');

  try {
    const userId = await getAdminUserId(session?.user?.id, session?.user?.email);
    let where: any = { userId };

    if (year && month) {
      // Use UTC dates to avoid timezone issues
      const y = parseInt(year);
      const m = parseInt(month);
      const monthStart = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0));
      // Get last day of month by going to day 0 of next month
      const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
      const monthEnd = new Date(Date.UTC(y, m - 1, lastDay, 23, 59, 59, 999));
      // Fetch events that:
      // 1. Start within the month, OR
      // 2. End within the month (for multi-day events), OR
      // 3. Span the entire month (start before, end after)
      where = {
        AND: [
          { userId },
          {
            OR: [
              // Event starts within the month
              {
                date: {
                  gte: monthStart,
                  lte: monthEnd,
                },
              },
              // Event ends within the month (multi-day events starting before)
              {
                endDate: {
                  gte: monthStart,
                  lte: monthEnd,
                },
              },
              // Event spans the entire month
              {
                AND: [
                  { date: { lt: monthStart } },
                  { endDate: { gt: monthEnd } },
                ],
              },
            ],
          },
        ],
      };
    }

    const events = await prisma.calendarEvent.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error('Failed to fetch calendar events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

// POST: Create a new calendar event
export async function POST(request: NextRequest) {
  const session = await auth();

  if (isProduction && !session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, description, date, endDate, type, color, isAllDay, reminder, location, url } = body;

    if (!title || !date) {
      return NextResponse.json({ error: 'Title and date are required' }, { status: 400 });
    }

    const userId = await getAdminUserId(session?.user?.id, session?.user?.email);

    const event = await prisma.calendarEvent.create({
      data: {
        userId,
        title,
        description,
        date: new Date(date),
        endDate: endDate ? new Date(endDate) : null,
        type,
        color,
        location,
        url,
        isAllDay: isAllDay ?? true,
        reminder: reminder ?? true,
      },
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error('Failed to create calendar event:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}

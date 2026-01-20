import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

const isProduction = process.env.NODE_ENV === 'production';

// GET: List all trips
export async function GET(request: NextRequest) {
  const session = await auth();

  if (isProduction && !session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userId = session?.user?.id || 'dev-user';

    const trips = await prisma.trip.findMany({
      where: { userId },
      include: {
        days: {
          orderBy: { dayNumber: 'asc' },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    return NextResponse.json(trips);
  } catch (error) {
    console.error('Failed to fetch trips:', error);
    return NextResponse.json({ error: 'Failed to fetch trips' }, { status: 500 });
  }
}

// POST: Create a new trip
export async function POST(request: NextRequest) {
  const session = await auth();

  if (isProduction && !session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, startDate, endDate, budget } = body;

    if (!name || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Name, startDate, and endDate are required' },
        { status: 400 }
      );
    }

    const userId = session?.user?.id || 'dev-user';
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Calculate number of days
    const dayCount = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Create trip with days
    const trip = await prisma.trip.create({
      data: {
        userId,
        name,
        description,
        startDate: start,
        endDate: end,
        budget,
        days: {
          create: Array.from({ length: dayCount }, (_, i) => ({
            dayNumber: i + 1,
            date: new Date(start.getTime() + i * 24 * 60 * 60 * 1000),
          })),
        },
      },
      include: {
        days: {
          orderBy: { dayNumber: 'asc' },
        },
      },
    });

    return NextResponse.json(trip);
  } catch (error) {
    console.error('Failed to create trip:', error);
    return NextResponse.json({ error: 'Failed to create trip' }, { status: 500 });
  }
}
